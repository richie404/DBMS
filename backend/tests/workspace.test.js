import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import app from '../src/app.js';
import pool from '../src/config/database.js';
import {hashPassword} from '../src/utils/password.js';
import {createUser,createDefaultUserPreferences} from '../src/models/user.model.js';
const prefix='integration_'+Date.now()+'_'+randomUUID().slice(0,6),password=randomUUID();
const users={};let server,base,propertyId,conversationId,notificationId,bookingId;
async function request(path,user,method='GET',body,csrf=true){const headers={'Content-Type':'application/json'};if(user){headers.Cookie=user.cookie;if(csrf&&method!=='GET')headers['X-CSRF-Token']=user.csrf;}const response=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});return{status:response.status,body:await response.json(),headers:response.headers};}
before(async()=>{
 server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}/api`;
 for(const [key,role] of [['renter','renter'],['otherRenter','renter'],['owner','owner'],['otherOwner','owner'],['admin','admin']]){
  const user=await createUser(pool,{name:prefix+key,username:(prefix+key).slice(0,50),email:`${prefix}.${key}@example.test`,role,passwordHash:await hashPassword(password)});users[key]=user;await createDefaultUserPreferences(pool,user.id);
  const login=await request('/auth/login',null,'POST',{email:user.email,password});assert.equal(login.status,200);user.cookie=login.headers.get('set-cookie').split(';')[0];user.csrf=(await request('/auth/csrf',user)).body.data.csrfToken;
 }
 const [p]=await pool.execute("INSERT INTO properties (owner_id,title,location,property_type,monthly_rent,moderation_status) VALUES (?,?,?,'apartment',30000,'approved')",[users.owner.id,prefix,'Dhaka test']);propertyId=p.insertId;
 const [b]=await pool.execute("INSERT INTO bookings (booking_code,property_id,renter_id,start_date,end_date,monthly_rent_snapshot,deposit_snapshot,total_amount,status) VALUES (?,?,?,DATE_ADD(CURRENT_DATE,INTERVAL 100 DAY),DATE_ADD(CURRENT_DATE,INTERVAL 130 DAY),30000,0,30000,'confirmed')",[prefix,propertyId,users.renter.id]);bookingId=b.insertId;
 await pool.execute("INSERT INTO payments (reference_code,booking_id,payer_id,payee_id,record_type,amount,status) VALUES (?,?,?,?,'charge',30000,'completed')",[prefix,bookingId,users.renter.id,users.owner.id]);
 const [n]=await pool.execute("INSERT INTO notifications (user_id,category,title,body,property_id) VALUES (?,'listing',?,'Test notification',?)",[users.owner.id,prefix,propertyId]);notificationId=n.insertId;
});
after(async()=>{
 try{
  const ids=Object.values(users).map(u=>u.id);if(!ids.length)return;const placeholders=ids.map(()=>'?').join(',');
  await pool.execute(`DELETE FROM notifications WHERE user_id IN (${placeholders})`,ids);
  await pool.execute('DELETE m FROM messages m JOIN conversations c ON c.id=m.conversation_id WHERE c.property_id=?',[propertyId]);
  await pool.execute('DELETE FROM conversations WHERE property_id=?',[propertyId]);
  await pool.execute('DELETE FROM payments WHERE booking_id=?',[bookingId]);
  await pool.execute('DELETE FROM booking_events WHERE booking_id=?',[bookingId]);await pool.execute('DELETE FROM bookings WHERE property_id=?',[propertyId]);
  for(const table of ['favorites','property_images','property_amenities'])await pool.execute(`DELETE FROM ${table} WHERE property_id=?`,[propertyId]);
  await pool.execute('DELETE FROM properties WHERE id=?',[propertyId]);
  for(const table of ['activity_logs','sessions','password_reset_tokens','user_preferences'])await pool.execute(`DELETE FROM ${table} WHERE ${table==='activity_logs'?'actor_id':'user_id'} IN (${placeholders})`,ids);
  await pool.execute(`DELETE FROM activity_logs WHERE actor_id IN (SELECT id FROM users WHERE id IN (${placeholders}))`, ids);
await pool.execute(`DELETE FROM users WHERE id IN (${placeholders})`,ids);
 }finally{await pool.end();if(server)await new Promise(r=>server.close(r));}
});
test('new workspace endpoints reject anonymous and wrong-role access',async()=>{
 for(const path of ['/notifications','/account','/conversations','/workspace/summary','/admin/users'])assert.equal((await request(path)).status,401,path);
 for(const path of ['/admin/users','/admin/payments','/admin/activity','/admin/overview','/admin/analytics','/admin/settings'])assert.equal((await request(path,users.renter)).status,403,path);
 assert.equal((await request('/owner/payments',users.renter)).status,403);assert.equal((await request('/conversations',users.admin)).status,403);
});
test('conversations are idempotent and messages persist with real read receipts and notifications',async()=>{
 const first=await request('/conversations',users.renter,'POST',{propertyId});assert.equal(first.status,200);conversationId=first.body.data.id;
 assert.equal((await request('/conversations',users.renter,'POST',{propertyId})).body.data.id,conversationId);
 assert.equal((await request(`/conversations/${conversationId}/messages`,users.otherRenter)).status,404);
 assert.equal((await request(`/conversations/${conversationId}/messages`,users.otherOwner,'POST',{text:'intrusion'})).status,404);
 assert.equal((await request(`/conversations/${conversationId}/messages`,users.renter,'POST',{text:'missing csrf'},false)).status,403);
 assert.equal((await request(`/conversations/${conversationId}/messages`,users.renter,'POST',{text:'Are viewings available?'})).status,200);
 const persisted=await request(`/conversations/${conversationId}/messages`,users.owner);assert.equal(persisted.body.data.items.length,1);assert.equal(persisted.body.data.items[0].readAt,null);
 assert.equal((await request('/workspace/summary',users.owner)).body.data.unreadMessages,1);
 assert.equal((await request(`/conversations/${conversationId}/read`,users.owner,'PATCH')).status,200);
 const refreshed=await request(`/conversations/${conversationId}/messages`,users.renter);assert.ok(refreshed.body.data.items[0].readAt);
 assert.equal((await request('/workspace/summary',users.owner)).body.data.unreadMessages,0);
 const conversations=await request('/conversations',users.owner);assert.equal(conversations.body.data.items[0].propertyId,propertyId);assert.equal(conversations.body.data.items[0].participantName,users.renter.name);
 assert.equal((await request('/conversations',users.otherOwner)).body.data.items.length,0);
 const [[dbMessage]]=await pool.execute('SELECT message_text FROM messages WHERE conversation_id=?',[conversationId]);assert.equal(dbMessage.message_text,'Are viewings available?');
});
test('notification read state persists and cannot be changed by another user',async()=>{
 assert.equal((await request(`/notifications/${notificationId}/read`,users.renter,'PATCH')).status,404);
 assert.equal((await request(`/notifications/${notificationId}/read`,users.owner,'PATCH',undefined,false)).status,403);
 assert.equal((await request(`/notifications/${notificationId}/read`,users.owner,'PATCH')).status,200);
 assert.ok((await request('/notifications',users.owner)).body.data.items.find(n=>n.id===notificationId).readAt);
 assert.equal((await request('/notifications/read-all',users.owner,'PATCH')).status,200);
 assert.equal((await request('/workspace/summary',users.owner)).body.data.unreadNotifications,0);
});
test('profiles and preferences persist without changing role or exposing credentials',async()=>{
 assert.equal((await request('/account',users.renter)).body.data.user.id,users.renter.id);
 assert.equal((await request('/account',users.renter,'PATCH',{role:'admin'})).status,400);
 const updated=await request('/account',users.renter,'PATCH',{name:prefix+' Updated',phone:'01712345678'});assert.equal(updated.status,200);
 assert.equal((await request('/auth/me',users.renter)).body.data.user.name,prefix+' Updated');
 const profile=(await request('/account',users.renter)).body.data.user;assert.equal(profile.phone,'01712345678');assert.equal('password_hash' in profile,false);
 assert.equal((await request('/account/preferences',users.renter,'PATCH',{marketing_notifications:true})).status,200);
 assert.equal((await request('/account',users.renter)).body.data.preferences.marketing_notifications,1);
 assert.equal((await request('/account/preferences',users.renter,'PATCH',{marketing_notifications:'true'})).status,400);
});
test('session revocation is scoped and persists',async()=>{
 const login=await request('/auth/login',null,'POST',{email:users.renter.email,password});const otherCookie=login.headers.get('set-cookie').split(';')[0];
 const sessions=(await request('/account/sessions',users.renter)).body.data.items;const other=sessions.find(s=>!s.current);assert.ok(other);assert.equal('token_hash' in other,false);
 assert.equal((await request(`/account/sessions/${other.id}`,users.owner,'DELETE')).status,404);
 assert.equal((await request(`/account/sessions/${other.id}`,users.renter,'DELETE')).status,200);
 assert.equal((await request('/auth/me',{cookie:otherCookie})).status,401);
 assert.equal((await request('/account/sessions',users.renter)).body.data.items.length,1);
});
test('owner payments are isolated and admin records/aggregates come from database',async()=>{
 const owner=(await request('/owner/payments',users.owner)).body.data.items;assert.equal(owner.length,1);assert.equal(Number(owner[0].amount),30000);assert.equal(owner[0].propertyId,propertyId);
 assert.equal((await request('/owner/payments',users.otherOwner)).body.data.items.length,0);
 assert.ok((await request('/admin/payments',users.admin)).body.data.items.some(p=>p.reference===prefix));
 const managed=(await request('/admin/users',users.admin)).body.data.items.find(u=>u.id===users.renter.id);assert.equal(managed.bookings,1);assert.equal(managed.messages,1);assert.equal('password_hash' in managed,false);
 const overview=await request('/admin/overview',users.admin);const [[count]]=await pool.query('SELECT COUNT(*) AS n FROM users WHERE deleted_at IS NULL');assert.equal(overview.body.data.counts.users,count.n);
 for(const range of ['Today','This Week','This Month','This Year'])assert.equal((await request('/admin/analytics?range='+encodeURIComponent(range),users.admin)).status,200);
 assert.equal((await request('/admin/analytics?range=invalid',users.admin)).status,400);
});
test('user status changes persist, revoke sessions, and generate activity logs',async()=>{
 assert.equal((await request(`/admin/users/${users.admin.id}/status`,users.admin,'PATCH',{status:'banned'})).status,400);
 assert.equal((await request(`/admin/users/${users.otherRenter.id}/status`,users.admin,'PATCH',{status:'suspended'})).status,200);
 const managed=(await request('/admin/users',users.admin)).body.data.items.find(u=>u.id===users.otherRenter.id);assert.equal(managed.status,'suspended');
 assert.equal((await request('/auth/me',users.otherRenter)).status,401);
 assert.equal((await request(`/admin/users/${users.otherRenter.id}/status`,users.admin,'PATCH',{status:'active'})).status,200);
 const logs=(await request('/admin/activity',users.admin)).body.data.items;assert.ok(logs.some(l=>l.targetId===users.otherRenter.id&&l.action==='user.suspended'));
});
test('platform settings persist and reject malformed writes',async()=>{
 const original=(await request('/admin/settings',users.admin)).body.data.settings;assert.ok(original);
 try{assert.equal((await request('/admin/settings',users.admin,'PATCH',{reviewTargetHours:36})).status,200);assert.equal((await request('/admin/settings',users.admin)).body.data.settings.reviewTargetHours,36);assert.equal((await request('/admin/settings',users.admin,'PATCH',{reviewTargetHours:0})).status,400);assert.equal((await request('/admin/settings',users.admin,'PATCH',{unknown:true})).status,400);}
 finally{await request('/admin/settings',users.admin,'PATCH',{reviewTargetHours:original.reviewTargetHours});await pool.execute('UPDATE platform_settings SET updated_by=NULL WHERE updated_by=?',[users.admin.id]);}
});
