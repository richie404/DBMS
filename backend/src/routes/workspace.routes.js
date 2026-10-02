import { Router } from 'express';
import pool from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import requireRole from '../middleware/require-role.js';
import requireCsrf from '../middleware/csrf.js';
import { assert } from '../utils/api-error.js';
import { id, text, date } from '../validators/rental.validator.js';

const router = Router();
const route = fn => async (req,res,next) => {try {res.json({success:true,data:await fn(req)});} catch(e){next(e);}};
const rows = async (sql,values=[]) => (await pool.execute(sql,values))[0];
async function transaction(fn) {const db=await pool.getConnection();try{await db.beginTransaction();const result=await fn(db);await db.commit();return result;}catch(e){await db.rollback();throw e;}finally{db.release();}}
const audit = (db,req,action,type,target,description) => db.execute('INSERT INTO activity_logs (actor_id,action,target_type,target_id,description) VALUES (?,?,?,?,?)',[req.user.id,action,type,target,description]);
const notify = (db,user,category,title,body,refs={}) => db.execute('INSERT INTO notifications (user_id,category,title,body,property_id,booking_id,conversation_id) VALUES (?,?,?,?,?,?,?)',[user,category,title,body,refs.propertyId??null,refs.bookingId??null,refs.conversationId??null]);
const personColumns='u.id,u.name,u.username,u.email,u.phone,u.role,u.status,u.avatar_url AS avatarUrl,u.created_at AS createdAt';
const preferenceColumns=['booking_notifications','message_notifications','favorite_notifications','marketing_notifications','security_alert_notifications','moderation_queue_notifications','payment_incident_notifications','system_health_notifications','scheduled_report_notifications'];
router.use(requireAuth);
router.get('/account',route(async req => {
  const [user]=await rows(`SELECT ${personColumns},(SELECT COUNT(*) FROM properties WHERE owner_id=u.id AND deleted_at IS NULL) AS propertyCount FROM users u WHERE u.id=?`,[req.user.id]);
  const [preferences]=await rows('SELECT * FROM user_preferences WHERE user_id=?',[req.user.id]);
  return {user,preferences};
}));
router.patch('/account',requireCsrf,route(async req=>{
  const body=req.body;assert(body&&Object.keys(body).every(k=>['name','username','email','phone','avatarUrl'].includes(k)),400,'Invalid profile fields');
  const fields={};
  if(body.name!==undefined)fields.name=text(body.name,'name',150);
  if(body.username!==undefined){fields.username=text(body.username,'username',50);assert(/^[a-zA-Z0-9_]+$/.test(fields.username),400,'Invalid username');}
  if(body.email!==undefined){fields.email=text(body.email,'email',254).toLowerCase();assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email),400,'Invalid email');}
  if(body.phone!==undefined)fields.phone=text(body.phone,'phone',32,true);
  if(body.avatarUrl!==undefined){fields.avatar_url=text(body.avatarUrl,'avatar URL',2048,true);assert(!fields.avatar_url||/^https?:\/\//.test(fields.avatar_url),400,'Avatar must be an HTTP(S) URL');}
  assert(Object.keys(fields).length,400,'No profile changes supplied');
  try{await transaction(async db=>{await db.execute(`UPDATE users SET ${Object.keys(fields).map(k=>`${k}=?`).join(',')} WHERE id=?`,[...Object.values(fields),req.user.id]);await audit(db,req,'profile.updated','user',req.user.id,'Account profile updated');});}catch(e){if(e.code==='ER_DUP_ENTRY'){assert(false,409,'Email or username already exists');}throw e;}
  const [user]=await rows(`SELECT ${personColumns} FROM users u WHERE id=?`,[req.user.id]);return{user};
}));
router.patch('/account/preferences',requireCsrf,route(async req=>{
  assert(req.body&&Object.keys(req.body).length&&Object.keys(req.body).every(k=>preferenceColumns.includes(k)),400,'Invalid preferences');
  assert(Object.values(req.body).every(v=>typeof v==='boolean'),400,'Preferences must be boolean');
  await pool.execute(`UPDATE user_preferences SET ${Object.keys(req.body).map(k=>`${k}=?`).join(',')} WHERE user_id=?`,[...Object.values(req.body),req.user.id]);
  return{preferences:(await rows('SELECT * FROM user_preferences WHERE user_id=?',[req.user.id]))[0]};
}));
router.get('/account/sessions',route(async req=>({items:(await rows('SELECT id,device_description AS device,created_at AS createdAt,last_used_at AS lastUsedAt,expires_at AS expiresAt FROM sessions WHERE user_id=? AND revoked_at IS NULL AND expires_at>CURRENT_TIMESTAMP ORDER BY created_at DESC',[req.user.id])).map(s=>({...s,current:s.id===req.auth.sessionId}))})));
router.delete('/account/sessions/:id',requireCsrf,route(async req=>{const session=id(req.params.id);assert(session!==req.auth.sessionId,400,'Use logout for the current session');const [r]=await pool.execute('UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND revoked_at IS NULL',[session,req.user.id]);assert(r.affectedRows,404,'Session not found');return{};}));
router.post('/account/sessions/revoke-others',requireCsrf,route(async req=>{await pool.execute('UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND id<>? AND revoked_at IS NULL',[req.user.id,req.auth.sessionId]);return{};}));
router.get('/notifications',route(async req=>({items:await rows('SELECT id,category,title,body AS message,property_id AS propertyId,booking_id AS bookingId,conversation_id AS conversationId,read_at AS readAt,created_at AS createdAt FROM notifications WHERE user_id=? ORDER BY created_at DESC,id DESC',[req.user.id])})));
router.patch('/notifications/read-all',requireCsrf,route(async req=>{await pool.execute('UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL',[req.user.id]);return{};}));
router.patch('/notifications/:id/read',requireCsrf,route(async req=>{const notification=id(req.params.id);const found=await rows('SELECT id FROM notifications WHERE id=? AND user_id=?',[notification,req.user.id]);assert(found.length,404,'Notification not found');await pool.execute('UPDATE notifications SET read_at=COALESCE(read_at,CURRENT_TIMESTAMP) WHERE id=? AND user_id=?',[notification,req.user.id]);return{};}));
router.get('/workspace/summary',route(async req=>{
  const user=req.user.id;
  const [[n]]=await pool.execute('SELECT COUNT(*) AS unread FROM notifications WHERE user_id=? AND read_at IS NULL',[user]);
  const [[m]]=await pool.execute('SELECT COUNT(*) AS unread FROM messages m JOIN conversations c ON c.id=m.conversation_id WHERE (c.renter_id=? OR c.owner_id=?) AND m.sender_id<>? AND m.read_at IS NULL',[user,user,user]);
  const [[pending]]=await pool.execute(req.user.role==='admin'?"SELECT COUNT(*) AS n FROM properties WHERE moderation_status='pending' AND deleted_at IS NULL":req.user.role==='owner'?"SELECT COUNT(*) AS n FROM bookings b JOIN properties p ON p.id=b.property_id WHERE p.owner_id=? AND b.status='pending' AND b.deleted_at IS NULL":"SELECT COUNT(*) AS n FROM bookings WHERE renter_id=? AND status='pending' AND deleted_at IS NULL",req.user.role==='admin'?[]:[user]);
  return{unreadNotifications:n.unread,unreadMessages:m.unread,pending:pending.n};
}));
async function conversation(req,db=pool,lock=false) {
  const [found]=await db.execute(`SELECT c.*,p.title,p.location,p.monthly_rent,p.currency FROM conversations c JOIN properties p ON p.id=c.property_id WHERE c.id=? AND (c.renter_id=? OR c.owner_id=?)${lock?' FOR UPDATE':''}`,[id(req.params.id),req.user.id,req.user.id]);
  assert(found.length,404,'Conversation not found');return found[0];
}
router.get('/conversations',requireRole('renter','owner'),route(async req=>({items:await rows(`SELECT c.id,c.property_id AS propertyId,c.disabled_at AS disabledAt,c.disabled_reason AS disabledReason,c.updated_at AS updatedAt,p.title,p.location,p.monthly_rent AS monthlyRent,p.currency,
 (SELECT image_path FROM property_images WHERE property_id=p.id ORDER BY is_primary DESC,sort_order,id LIMIT 1) AS image,
 u.id AS participantId,u.name AS participantName,u.role AS participantRole,
 (SELECT message_text FROM messages WHERE conversation_id=c.id ORDER BY sent_at DESC,id DESC LIMIT 1) AS preview,
 (SELECT COUNT(*) FROM messages WHERE conversation_id=c.id AND sender_id<>? AND read_at IS NULL) AS unread
 FROM conversations c JOIN properties p ON p.id=c.property_id JOIN users u ON u.id=IF(c.renter_id=?,c.owner_id,c.renter_id) WHERE c.renter_id=? OR c.owner_id=? ORDER BY c.updated_at DESC,c.id DESC`,[req.user.id,req.user.id,req.user.id,req.user.id])})));
router.post('/conversations',requireRole('renter'),requireCsrf,route(req=>transaction(async db=>{
  const propertyId=id(req.body?.propertyId);const [found]=await db.execute("SELECT p.owner_id FROM properties p JOIN users u ON u.id=p.owner_id WHERE p.id=? AND p.deleted_at IS NULL AND p.moderation_status='approved' AND u.status='active' AND u.deleted_at IS NULL FOR UPDATE",[propertyId]);assert(found.length,404,'Property not found');
  const owner=found[0].owner_id;assert(owner!==req.user.id,400,'Cannot contact yourself');
  await db.execute('INSERT INTO conversations (property_id,renter_id,owner_id) VALUES (?,?,?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',[propertyId,req.user.id,owner]);
  const [[c]]=await db.execute('SELECT id FROM conversations WHERE property_id=? AND renter_id=? AND owner_id=?',[propertyId,req.user.id,owner]);return{id:c.id};
})));
router.get('/conversations/:id/messages',requireRole('renter','owner'),route(async req=>{await conversation(req);return{items:await rows('SELECT id,sender_id AS senderId,message_text AS text,sent_at AS sentAt,delivered_at AS deliveredAt,read_at AS readAt FROM messages WHERE conversation_id=? ORDER BY sent_at,id',[id(req.params.id)])};}));
router.patch('/conversations/:id/read',requireRole('renter','owner'),requireCsrf,route(req=>transaction(async db=>{const c=await conversation(req,db,true);await db.execute('UPDATE messages SET delivered_at=COALESCE(delivered_at,CURRENT_TIMESTAMP),read_at=COALESCE(read_at,CURRENT_TIMESTAMP) WHERE conversation_id=? AND sender_id<>? AND read_at IS NULL',[c.id,req.user.id]);return{};})));
router.post('/conversations/:id/messages',requireRole('renter','owner'),requireCsrf,route(req=>transaction(async db=>{
  const c=await conversation(req,db,true);assert(!c.disabled_at,403,'Messaging is disabled for this conversation');
  const recipient=c.renter_id===req.user.id?c.owner_id:c.renter_id;
  const [participants]=await db.execute("SELECT id FROM users WHERE id IN (?,?) AND status='active' AND deleted_at IS NULL",[req.user.id,recipient]);assert(participants.length===2,403,'Conversation participant unavailable');
  const message=text(req.body?.text,'message',5000);const [r]=await db.execute('INSERT INTO messages (conversation_id,sender_id,message_text) VALUES (?,?,?)',[c.id,req.user.id,message]);
  await db.execute('UPDATE conversations SET updated_at=CURRENT_TIMESTAMP WHERE id=?',[c.id]);
  await notify(db,recipient,'message','New message',message.slice(0,250),{propertyId:c.property_id,conversationId:c.id});
  return{message:{id:r.insertId,senderId:req.user.id,text:message,sentAt:new Date().toISOString(),readAt:null,deliveredAt:null}};
})));
const paymentSql=`SELECT x.id,x.reference_code AS reference,x.booking_id AS bookingId,x.record_type AS recordType,x.amount,x.currency,x.status,x.transaction_at AS transactionAt,x.created_at AS createdAt,x.notes,p.id AS propertyId,p.title,p.location,
 (SELECT image_path FROM property_images WHERE property_id=p.id ORDER BY is_primary DESC,sort_order,id LIMIT 1) AS image,
 payer.name AS payerName,payer.role AS payerRole,payee.name AS payeeName FROM payments x LEFT JOIN bookings b ON b.id=x.booking_id LEFT JOIN properties p ON p.id=b.property_id LEFT JOIN users payer ON payer.id=x.payer_id LEFT JOIN users payee ON payee.id=x.payee_id`;
router.get('/owner/payments',requireRole('owner'),route(async req=>({items:await rows(`${paymentSql} WHERE p.owner_id=? AND x.payee_id=? ORDER BY COALESCE(x.transaction_at,x.created_at) DESC,x.id DESC`,[req.user.id,req.user.id])})));
router.get('/admin/payments',requireRole('admin'),route(async()=>({items:await rows(`${paymentSql} ORDER BY COALESCE(x.transaction_at,x.created_at) DESC,x.id DESC`)})));
router.get('/admin/users',requireRole('admin'),route(async()=>({items:await rows(`SELECT ${personColumns},(SELECT COUNT(*) FROM properties WHERE owner_id=u.id AND deleted_at IS NULL) AS properties,(SELECT COUNT(*) FROM bookings WHERE renter_id=u.id AND deleted_at IS NULL) AS bookings,(SELECT COUNT(*) FROM messages WHERE sender_id=u.id) AS messages FROM users u WHERE deleted_at IS NULL ORDER BY created_at DESC,id DESC`)})));
router.patch('/admin/users/:id/status',requireRole('admin'),requireCsrf,route(req=>transaction(async db=>{
  const target=id(req.params.id),status=req.body?.status;assert(['active','suspended','banned'].includes(status),400,'Invalid status');assert(target!==req.user.id,400,'Cannot restrict your own account');
  const [found]=await db.execute('SELECT role,status FROM users WHERE id=? AND deleted_at IS NULL FOR UPDATE',[target]);assert(found.length,404,'User not found');assert(found[0].role!=='admin',403,'Administrator access cannot be restricted here');
  await db.execute('UPDATE users SET status=? WHERE id=?',[status,target]);if(status!=='active')await db.execute('UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND revoked_at IS NULL',[target]);
  await audit(db,req,'user.'+status,'user',target,typeof req.body.reason==='string'?req.body.reason.slice(0,1000):`Account status changed to ${status}`);return{};
})));
router.get('/admin/activity',requireRole('admin'),route(async()=>({items:await rows('SELECT l.id,l.action,l.target_type AS targetType,l.target_id AS targetId,l.outcome,l.description,l.source_ip AS sourceIp,l.created_at AS createdAt,u.name AS actorName,u.role AS actorRole FROM activity_logs l LEFT JOIN users u ON u.id=l.actor_id ORDER BY l.created_at DESC,l.id DESC')})));
router.get('/admin/overview',requireRole('admin'),route(async()=>{
  const started=Date.now();const [[counts]]=await pool.query(`SELECT (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS users,(SELECT COUNT(*) FROM properties WHERE deleted_at IS NULL) AS listings,(SELECT COUNT(*) FROM properties WHERE moderation_status='pending' AND deleted_at IS NULL) AS pendingListings,(SELECT COUNT(*) FROM bookings WHERE status IN ('approved','confirmed') AND deleted_at IS NULL) AS activeBookings,(SELECT COUNT(*) FROM activity_logs WHERE created_at>=CURRENT_DATE) AS activityToday,(SELECT COUNT(DISTINCT user_id) FROM sessions WHERE revoked_at IS NULL AND expires_at>CURRENT_TIMESTAMP) AS signedInUsers`);
  const items=await rows('SELECT l.id,l.action,l.description,l.outcome,l.created_at AS createdAt,u.name AS actorName FROM activity_logs l LEFT JOIN users u ON u.id=l.actor_id ORDER BY l.created_at DESC,l.id DESC LIMIT 6');
  const hourly=await rows('SELECT HOUR(created_at) AS hour,COUNT(*) AS count FROM activity_logs WHERE created_at>=CURRENT_DATE GROUP BY HOUR(created_at)');
  return{counts,items,hourly,database:'connected',databaseResponseMs:Date.now()-started};
}));
router.get('/admin/analytics',requireRole('admin'),route(async req=>{
  const range=req.query.range??'This Month';assert(['Today','This Week','This Month','This Year'].includes(range),400,'Invalid range');
  const [[clock]]=await pool.query('SELECT DATE_FORMAT(CURRENT_DATE,"%Y-%m-%d") AS today,YEAR(CURRENT_DATE) AS year,MONTH(CURRENT_DATE) AS month,DAYOFWEEK(CURRENT_DATE) AS weekday');
  let start=clock.today;if(range==='This Week')start=new Date(Date.parse(clock.today+'T00:00:00Z')-((clock.weekday+5)%7)*86400000).toISOString().slice(0,10);if(range==='This Month')start=`${clock.year}-${String(clock.month).padStart(2,'0')}-01`;if(range==='This Year')start=`${clock.year}-01-01`;
  const series={};for(const [key,table,column,extra] of [['users','users','created_at',' AND deleted_at IS NULL'],['listings','properties','created_at',' AND deleted_at IS NULL'],['bookings','bookings','created_at',' AND deleted_at IS NULL'],['revenue','payments','COALESCE(transaction_at,created_at)'," AND status='completed' AND record_type='charge' AND currency='BDT'"]])series[key]=await rows(`SELECT DATE_FORMAT(${column},'%Y-%m-%d') AS day,${key==='revenue'?'SUM(amount)':'COUNT(*)'} AS value FROM ${table} WHERE ${column}>=? AND ${column}<DATE_ADD(CURRENT_DATE,INTERVAL 1 DAY)${extra} GROUP BY day ORDER BY day`,[start]);
  const [[total]]=await pool.query('SELECT COUNT(*) AS n FROM users WHERE deleted_at IS NULL');return{series,totalUsers:total.n,start,end:clock.today};
}));
router.get('/admin/settings',requireRole('admin'),route(async()=>({settings:(await rows('SELECT platform_name AS platformName,support_email AS supportEmail,currency,timezone,review_target_hours AS reviewTargetHours,session_timeout_minutes AS sessionTimeoutMinutes,maintenance_mode AS maintenanceMode FROM platform_settings WHERE id=1'))[0]??null})));
router.patch('/admin/settings',requireRole('admin'),requireCsrf,route(req=>transaction(async db=>{
  const map={platformName:'platform_name',supportEmail:'support_email',currency:'currency',timezone:'timezone',reviewTargetHours:'review_target_hours',sessionTimeoutMinutes:'session_timeout_minutes',maintenanceMode:'maintenance_mode'};
  assert(req.body&&Object.keys(req.body).length&&Object.keys(req.body).every(k=>Object.hasOwn(map,k)),400,'Invalid settings');const fields={};
  for(const [key,value] of Object.entries(req.body)) {
    if(key==='maintenanceMode'){assert(typeof value==='boolean',400,'Invalid maintenance setting');fields[map[key]]=value;}
    else if(['reviewTargetHours','sessionTimeoutMinutes'].includes(key)){assert(Number.isInteger(value)&&value>0&&value<=65535,400,'Invalid duration');fields[map[key]]=value;}
    else{fields[map[key]]=text(value,key,key==='supportEmail'?254:100);if(key==='currency')assert(/^[A-Z]{3}$/.test(value),400,'Invalid currency');if(key==='timezone'){try{new Intl.DateTimeFormat('en',{timeZone:value});}catch{assert(false,400,'Invalid timezone');}}}
  }
  const [r]=await db.execute(`UPDATE platform_settings SET ${Object.keys(fields).map(k=>`${k}=?`).join(',')},updated_by=? WHERE id=1`,[...Object.values(fields),req.user.id]);assert(r.affectedRows,404,'Platform settings have not been initialized');await audit(db,req,'platform.settings.updated','settings',1,'Platform configuration updated');return{};
})));
export default router;
