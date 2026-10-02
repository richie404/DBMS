import assert from 'node:assert/strict';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import app from '../src/app.js';
import pool from '../src/config/database.js';
import env from '../src/config/env.js';
const tables=['properties','property_images','amenities','property_amenities','favorites','booking_events','conversations','messages','notifications','payments','activity_logs','platform_settings'];
let server;
try {
  assert(['development','test'].includes(env.nodeEnv) && ['localhost','127.0.0.1','::1'].includes(env.database.host),'Verification requires local development/test.');
  const counts={};
  for(const table of tables) {const [[row]]=await pool.query(`SELECT COUNT(*) AS count FROM ${table}`);counts[table]=row.count;}
  const [users]=await pool.query('SELECT role, COUNT(*) AS count FROM users GROUP BY role');
  const [bookings]=await pool.query('SELECT status, COUNT(*) AS count FROM bookings GROUP BY status');
  const checks={
    conversation_ownership:'SELECT COUNT(*) AS count FROM conversations c JOIN properties p ON p.id=c.property_id JOIN users r ON r.id=c.renter_id JOIN users o ON o.id=c.owner_id WHERE c.owner_id<>p.owner_id OR r.role<>"renter" OR o.role<>"owner"',
    message_participants:'SELECT COUNT(*) AS count FROM messages m JOIN conversations c ON c.id=m.conversation_id WHERE m.sender_id NOT IN(c.renter_id,c.owner_id)',
    booking_roles_dates:'SELECT COUNT(*) AS count FROM bookings b JOIN users r ON r.id=b.renter_id JOIN properties p ON p.id=b.property_id JOIN users o ON o.id=p.owner_id WHERE b.end_date<=b.start_date OR r.role<>"renter" OR o.role<>"owner" OR (b.decision_by IS NOT NULL AND b.decision_by<>p.owner_id)',
    payment_links:'SELECT COUNT(*) AS count FROM payments x JOIN bookings b ON b.id=x.booking_id JOIN properties p ON p.id=b.property_id WHERE x.reference_code LIKE "RN-DEMO-PAY-%" AND (b.status<>"confirmed" OR x.payer_id<>b.renter_id OR x.payee_id<>p.owner_id OR x.amount<>b.total_amount)',
    overlapping_approved_bookings:'SELECT COUNT(*) AS count FROM bookings a JOIN bookings b ON a.property_id=b.property_id AND a.id<b.id AND a.start_date<b.end_date AND a.end_date>b.start_date WHERE a.status IN("approved","confirmed") AND b.status IN("approved","confirmed") AND a.deleted_at IS NULL AND b.deleted_at IS NULL',
    demo_password_format:'SELECT COUNT(*) AS count FROM users WHERE username LIKE "demo_%" AND email LIKE "%@rentnest.test" AND password_hash NOT LIKE "$argon2id$v=19$m=19456,p=1,t=2$%"',
    favorite_roles:'SELECT COUNT(*) AS count FROM favorites f JOIN users u ON u.id=f.user_id WHERE u.role<>"renter"',
    booking_event_final_status:'SELECT COUNT(*) AS count FROM bookings b JOIN booking_events e ON e.id=(SELECT MAX(id) FROM booking_events WHERE booking_id=b.id) WHERE b.booking_code LIKE "RN-DEMO-%" AND b.status<>e.new_status',
  };
  const consistency={};
  for(const [name,sql] of Object.entries(checks)) {const [[row]]=await pool.query(sql);consistency[name]=row.count;assert.equal(row.count,0,name);}
  // Verify all declared foreign keys, including tables with nullable references.
  const [keys]=await pool.query(`SELECT TABLE_NAME AS t,COLUMN_NAME AS c,REFERENCED_TABLE_NAME AS rt,REFERENCED_COLUMN_NAME AS rc FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL`);
  for(const key of keys) {const [[row]]=await pool.query(`SELECT COUNT(*) AS count FROM \`${key.t}\` a LEFT JOIN \`${key.rt}\` b ON a.\`${key.c}\`=b.\`${key.rc}\` WHERE a.\`${key.c}\` IS NOT NULL AND b.\`${key.rc}\` IS NULL`);assert.equal(row.count,0,`Foreign key ${key.t}.${key.c}`);}
  server=app.listen(0,'127.0.0.1'); await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  const logins=[];
  for(const role of ['renter','owner','admin']) {
    const email=`${role}1@rentnest.test`;
    const response=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'12345678'})});
    const body=await response.json();assert.equal(response.status,200,email);assert.equal(body.data.user.role,role);
    const cookie=response.headers.get('set-cookie').split(';')[0];
    const me=await fetch(`${base}/api/auth/me`,{headers:{Cookie:cookie}});assert.equal(me.status,200);assert.equal((await me.json()).data.user.email,email);
    const csrf=await fetch(`${base}/api/auth/csrf`,{headers:{Cookie:cookie}});const token=(await csrf.json()).data.csrfToken;
    const logout=await fetch(`${base}/api/auth/logout`,{method:'POST',headers:{Cookie:cookie,'X-CSRF-Token':token}});assert.equal(logout.status,200);
    logins.push({email,role,login:'passed',authenticatedSession:'passed',logout:'passed'});
  }
  const report={database:env.database.database,verifiedAt:new Date().toISOString(),counts,usersByRole:users,bookingsByStatus:bookings,consistency,foreignKeysChecked:keys.length,logins};
  await writeFile(new URL('./SEED_VERIFICATION.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
} catch(error) {console.error(`Verification failed: ${error.message}`);process.exitCode=1;}
finally {if(server) await new Promise(resolve=>server.close(resolve));await pool.end();}

