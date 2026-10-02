import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import pool from '../src/config/database.js';

test('owner workspace: isolation, CRUD/moderation, counts, competing approvals, messages and preservation',async()=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}/api`;const users=[],properties=[];
 const request=async(path,a,body,method='GET')=>{const res=await fetch(base+path,{method,headers:{...(a?{Cookie:a.cookie,'X-CSRF-Token':a.csrf}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:res.status,...await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]}};
 const account=async(n,role)=>{const suffix=Date.now()+n,email=`ownerpass_${suffix}@example.test`,password='Owner pass verification 2026';const reg=await request('/auth/register',null,{name:'Owner pass '+n,username:'op_'+suffix,email,password,confirmPassword:password,role},'POST');assert.equal(reg.status,201);users.push(reg.data.user.id);const login=await request('/auth/login',null,{email,password},'POST');const a={id:reg.data.user.id,cookie:login.cookie};a.csrf=(await request('/auth/csrf',a)).data.csrfToken;return a};
 try{
 const a=await account('a','owner'),b=await account('b','owner'),r=await account('r','renter'),s=await account('s','renter'),admin=await account('admin','renter');await pool.execute("UPDATE users SET role='admin' WHERE id=?",[admin.id]);
 assert.equal((await request('/owner/summary')).status,401);assert.equal((await request('/owner/summary',r)).status,403);
 const body={title:'Owner pass listing',description:'Real verification description',location:'Dhaka',type:'apartment',monthlyRent:12000,depositAmount:3000,sizeSqft:850,bedrooms:2,bathrooms:1,furnished:true,bachelorAllowed:true,familyAllowed:true,available:true,moderationStatus:'pending',images:['https://example.test/first.jpg','https://example.test/second.jpg']};
 const created=await request('/owner/properties',a,body,'POST');assert.equal(created.status,200);const id=created.data.property.id;properties.push(id);assert.equal(created.data.property.owner.id,a.id);assert.equal(created.data.property.moderationStatus,'pending');
 const other=await request('/owner/properties',b,{...body,title:'Other owner'},'POST');assert.equal(other.status,200);properties.push(other.data.property.id);
 assert.equal((await request(`/owner/properties/${id}`,b)).status,404);assert.equal((await request(`/owner/properties/${id}`,r)).status,403);assert.equal((await request(`/owner/properties/${id}`,a,{owner_id:b.id},'PATCH')).status,400);assert.equal((await request('/owner/properties',a,{...body,monthlyRent:0},'POST')).status,400);
 assert.deepEqual((await request('/owner/properties',a)).data.properties.map(p=>p.id),[id]);assert.equal((await request(`/properties/${id}`)).status,404);
 const saved=await request(`/owner/properties/${id}`,a,{images:body.images.slice().reverse(),title:'Edited listing'},'PATCH');assert.equal(saved.status,200);assert.equal((await request(`/owner/properties/${id}`,a)).data.property.images[0].url,body.images[1]);
 for(const propertyId of properties)assert.equal((await request(`/admin/properties/${propertyId}/moderation`,admin,{status:'approved'},'PATCH')).status,200);
 assert.equal((await request(`/admin/properties/${id}/moderation`,a,{status:'approved'},'PATCH')).status,403);
 assert.equal((await request(`/properties/${id}`)).data.property.owner.id,a.id);
 const chat=await request('/conversations',r,{propertyId:id},'POST');const conversation=chat.data.conversationId;assert.ok(conversation);
 assert.equal((await request(`/conversations/${conversation}/messages`,b)).status,404);
 const sent=await request(`/conversations/${conversation}/messages`,r,{text:'Owner pass incoming'},'POST');assert.equal(sent.status,200);assert.equal((await request('/owner/summary',a)).data.counts.unreadMessages,1);assert.equal((await request('/owner/summary',b)).data.counts.unreadMessages,0);
 const messages=await request(`/conversations/${conversation}/messages`,a);assert.equal(messages.data.messages[0].text,'Owner pass incoming');await request(`/conversations/${conversation}/read`,a,{messageIds:[sent.data.message.id]},'PATCH');assert.equal((await request('/owner/summary',a)).data.counts.unreadMessages,0);
 await request(`/conversations/${conversation}/messages`,a,{text:'Owner reply persisted'},'POST');assert.ok((await request(`/conversations/${conversation}/messages`,r)).data.messages.some(m=>m.text==='Owner reply persisted'));
 const book=async(a,start='2094-01-31')=>{const q=await request(`/bookings/quote?propertyId=${id}&startDate=${start}&months=2`,a);assert.equal(q.status,200);return request('/bookings',a,{propertyId:id,...q.data.quote,quotedOwnerId:q.data.quote.owner.id,quotedMonthlyRent:q.data.quote.monthlyRent,quotedDeposit:q.data.quote.depositAmount},'POST')};
 const one=await book(r),two=await book(s);
 assert.equal((await request(`/bookings/${one.data.booking.id}/conversation`,b,{},'POST')).status,404);
 assert.equal((await request(`/bookings/${one.data.booking.id}/conversation`,a,{},'POST')).data.conversationId,conversation);
 const ownerChat=(await request(`/bookings/${two.data.booking.id}/conversation`,a,{renter_id:r.id,owner_id:b.id},'POST')).data.conversationId;
 assert.equal((await request(`/conversations/${ownerChat}/messages`,s)).status,200);
 assert.equal((await request(`/conversations/${ownerChat}/messages`,r)).status,404);assert.equal(one.status,200);assert.equal(two.status,200);
 await pool.execute("INSERT INTO payments (booking_id,payer_id,payee_id,record_type,amount,currency,status,transaction_at) VALUES (?,?,?,'payout',2500,'BDT','completed',NOW())",[one.data.booking.id,r.id,a.id]);
 assert.equal((await request('/owner/payments',a)).data.items.length,1);assert.equal((await request('/owner/payments',b)).data.items.length,0);assert.equal(Number((await request('/owner/summary',a)).data.payments[0].amount),2500);assert.equal((await request('/owner/summary',a)).data.counts.pendingRequests,2);assert.equal((await request('/bookings?filter=pending',a)).data.total,2);assert.equal((await request('/bookings',b)).data.total,0);
 const approve=(id)=>request(`/bookings/${id}/decision`,a,{status:'approved'},'PATCH');const decisions=await Promise.all([approve(one.data.booking.id),approve(two.data.booking.id)]);assert.deepEqual(decisions.map(x=>x.status).sort(),[200,409]);const winner=decisions[0].status===200?one:two,loser=decisions[0].status===200?two:one;
 assert.equal((await request('/owner/summary',a)).data.counts.activeBookings,1);assert.equal((await request('/bookings?filter=active',a)).data.total,1);assert.equal((await request(`/bookings?filter=booking:${winner.data.booking.id}`,a)).data.total,1);assert.equal((await request(`/bookings?filter=booking:${winner.data.booking.id}`,b)).data.total,0);
 assert.equal((await request(`/owner/properties/${id}`,a,{availableFrom:'2094-02-01'},'PATCH')).status,409);
 assert.equal((await request(`/owner/properties/${id}`,a,{available:false},'PATCH')).status,200);assert.equal((await request('/owner/summary',a)).data.counts.availableProperties,0);assert.equal((await request(`/owner/properties/${id}/availability`,a)).data.availability.reserved.length,1);assert.equal((await request(`/conversations/${conversation}/messages`,a)).status,200);assert.equal((await request(`/owner/properties/${id}`,a,null,'DELETE')).status,409);
 const rejection=await request(`/bookings/${loser.data.booking.id}/decision`,a,{status:'rejected',reason:'Competing reservation'},'PATCH');assert.equal(rejection.status,200);const losingRenter=loser===one?r:s;assert.ok((await request('/bookings',losingRenter)).data.bookings.some(x=>x.id===loser.data.booking.id&&x.decisionReason==='Competing reservation'));assert.ok((await request('/notifications',losingRenter)).data.notifications.some(x=>x.bookingId===loser.data.booking.id));
 const updated=await request(`/owner/properties/${id}`,a,{title:'Requires reapproval'},'PATCH');assert.equal(updated.status,200);assert.equal(updated.data.property.moderationStatus,'pending');assert.equal((await request(`/owner/properties/${id}`,a)).data.property.owner.id,a.id);
 assert.equal((await request('/owner/preferences',a,{message_notifications:false},'PATCH')).status,200);assert.equal((await request('/owner/preferences',a)).data.preferences.message_notifications,0);
 assert.equal((await request(`/owner/properties/${properties[1]}`,b,null,'DELETE')).status,200);const [[archived]]=await pool.execute('SELECT deleted_at FROM properties WHERE id=?',[properties[1]]);assert.ok(archived.deleted_at);
 }finally{
 for(const id of users){await pool.execute('DELETE FROM notifications WHERE user_id=?',[id]);await pool.execute('DELETE FROM activity_logs WHERE actor_id=?',[id]);}
 for(const id of properties){await pool.execute('DELETE x FROM payments x JOIN bookings b ON b.id=x.booking_id WHERE b.property_id=?',[id]);await pool.execute('DELETE e FROM booking_events e JOIN bookings b ON b.id=e.booking_id WHERE b.property_id=?',[id]);await pool.execute('DELETE FROM bookings WHERE property_id=?',[id]);await pool.execute('DELETE m FROM messages m JOIN conversations c ON c.id=m.conversation_id WHERE c.property_id=?',[id]);await pool.execute('DELETE FROM conversations WHERE property_id=?',[id]);await pool.execute('DELETE FROM property_amenities WHERE property_id=?',[id]);await pool.execute('DELETE FROM property_images WHERE property_id=?',[id]);await pool.execute('DELETE FROM properties WHERE id=?',[id]);}
 for(const id of users){await pool.execute('DELETE FROM sessions WHERE user_id=?',[id]);await pool.execute('DELETE FROM user_preferences WHERE user_id=?',[id]);await pool.execute('DELETE FROM activity_logs WHERE actor_id IN (SELECT id FROM users WHERE id=?)', [id]);
await pool.execute('DELETE FROM users WHERE id=?',[id]);}
 await pool.end();server.closeAllConnections();await new Promise(r=>server.close(r));
 }
});
