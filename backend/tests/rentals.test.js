import assert from "node:assert/strict";
import test, {before, after} from "node:test";
import {randomUUID} from "node:crypto";
import app from "../src/app.js";
import pool from "../src/config/database.js";
import {createUser, createDefaultUserPreferences} from "../src/models/user.model.js";
import {hashPassword} from "../src/utils/password.js";

const prefix = `rental_check_${Date.now()}_${randomUUID().slice(0,8)}`;
const password = randomUUID();
const users = {}, propertyIds = [], amenityIds = [];
let server, base, startDate, endDate;

async function request(path, user, method = "GET", body, csrf = true) {
  const headers = {"Content-Type": "application/json"};
  if (user) {headers.Cookie = user.cookie; if (csrf && method !== "GET") headers["X-CSRF-Token"] = user.csrf;}
  const response = await fetch(base + path, {method, headers, body: body === undefined ? undefined : JSON.stringify(body)});
  return {status: response.status, body: await response.json(), headers: response.headers};
}
async function property(status = "approved", owner = users.owner, extra = {}) {
  const created = await request("/owner/properties", owner, "POST", {type:"apartment", title:prefix, location:"Dhaka test district", monthlyRent:30000, depositAmount:5000, bedrooms:2, bathrooms:1, moderationStatus:status === "draft" ? "draft" : "pending", ...extra});
  assert.equal(created.status,201,JSON.stringify(created.body));
  const p = created.body.data.property; propertyIds.push(p.id);
  if (status === "approved") assert.equal((await request(`/admin/properties/${p.id}/moderation`,users.admin,"PATCH",{status:"approved"})).status,200);
  return p.id;
}
async function booking(propertyId, renter = users.renter, extra = {}) {
  const created = await request("/bookings",renter,"POST",{propertyId,startDate,endDate,...extra});
  assert.equal(created.status,201,JSON.stringify(created.body)); return created.body.data.booking;
}

before(async()=>{
  server = app.listen(0,"127.0.0.1"); await new Promise(resolve=>server.once("listening",resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
  const [[clock]]=await pool.query("SELECT DATE_FORMAT(DATE_ADD(CURRENT_DATE, INTERVAL 60 DAY), '%Y-%m-%d') AS start, DATE_FORMAT(DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY), '%Y-%m-%d') AS end");
  startDate=clock.start;endDate=clock.end;
  for (const [key,role] of [["renter","renter"],["otherRenter","renter"],["owner","owner"],["otherOwner","owner"],["admin","admin"]]) {
    const user = await createUser(pool,{name:prefix+key,username:(prefix+key).slice(0,50),email:`${prefix}.${key}@example.test`,role,passwordHash:await hashPassword(password)});
    users[key] = user; await createDefaultUserPreferences(pool,user.id);
    const login = await request("/auth/login",null,"POST",{email:user.email,password});
    assert.equal(login.status,200);user.cookie=login.headers.get("set-cookie").split(";")[0];
    user.csrf=(await request("/auth/csrf",user)).body.data.csrfToken;
  }
});
after(async()=>{
  try {
    for (const propertyId of propertyIds) {
      await pool.execute("DELETE FROM notifications WHERE property_id=?",[propertyId]);
      await pool.execute("DELETE l FROM activity_logs l JOIN bookings b ON l.target_type='booking' AND l.target_id=b.id WHERE b.property_id=?",[propertyId]);
      await pool.execute("DELETE FROM activity_logs WHERE target_type='property' AND target_id=?",[propertyId]);
      await pool.execute("DELETE e FROM booking_events e JOIN bookings b ON b.id=e.booking_id WHERE b.property_id=?",[propertyId]);
      await pool.execute("DELETE FROM bookings WHERE property_id=?",[propertyId]);
      for (const table of ["favorites","property_images","property_amenities"]) await pool.execute(`DELETE FROM ${table} WHERE property_id=?`,[propertyId]);
      await pool.execute("DELETE FROM properties WHERE id=?",[propertyId]);
    }
    for(const amenityId of amenityIds)await pool.execute("DELETE FROM amenities WHERE id=?",[amenityId]);
    for (const user of Object.values(users)) {
      await pool.execute("DELETE FROM sessions WHERE user_id=?",[user.id]);
      await pool.execute("DELETE FROM user_preferences WHERE user_id=?",[user.id]);
      await pool.execute("DELETE FROM users WHERE id=? AND email=?",[user.id,user.email]);
    }
  } finally {await pool.end(); if(server)await new Promise(resolve=>server.close(resolve));}
});

test("public properties expose approved available records, media and amenities, without private owner information",async()=>{
  const [amenity]=await pool.execute("INSERT INTO amenities (code,display_name) VALUES (?,?)",[prefix,"Test parking"]);amenityIds.push(amenity.insertId);
  const approved=await property("approved",users.owner,{images:["https://example.test/property.jpg"],amenityIds:[amenity.insertId]});
  const draft=await property("draft"), pending=await property("pending"), unavailable=await property("approved",users.owner,{available:false});
  const response=await request(`/properties?search=${prefix}&type=apartment&minPrice=20000&maxPrice=40000&bedrooms=2&limit=1`);
  assert.equal(response.status,200);assert.equal(response.body.data.pagination.total,1);
  const p=response.body.data.items[0];assert.equal(p.id,approved);assert.equal(p.images.length,1);assert.equal(p.amenities[0].name,"Test parking");
  assert.equal("email" in p.owner,false);assert.equal("phone" in p.owner,false);
  for (const hidden of [draft,pending,unavailable])assert.equal((await request(`/properties/${hidden}`)).status,404);
  assert.equal((await request(`/properties/${approved}`)).status,200);
});
test("owner CRUD is scoped, approval is admin-only, edits require review, and archive is a soft deletion",async()=>{
  const p=await property();
  assert.equal((await request(`/owner/properties/${p}`,users.otherOwner)).status,404);
  assert.equal((await request(`/owner/properties/${p}`,users.otherOwner,"PATCH",{title:"stolen"})).status,404);
  assert.equal((await request(`/owner/properties/${p}`,users.otherOwner,"DELETE")).status,404);
  assert.equal((await request(`/owner/properties/${p}`,users.owner,"PATCH",{moderationStatus:"approved"})).status,400);
  const edited=await request(`/owner/properties/${p}`,users.owner,"PATCH",{monthlyRent:35000});assert.equal(edited.status,200);assert.equal(edited.body.data.property.moderationStatus,"pending");
  assert.equal((await request(`/properties/${p}`)).status,404);
  assert.equal((await request(`/admin/properties/${p}/moderation`,users.owner,"PATCH",{status:"approved"})).status,403);
  assert.equal((await request(`/owner/properties/${p}`,users.owner,"DELETE")).status,200);
  const [[row]]=await pool.execute("SELECT deleted_at FROM properties WHERE id=?",[p]);assert.ok(row.deleted_at);
});
test("favorites persist per renter, are idempotent, and cannot be mutated without CSRF",async()=>{
  const p=await property();
  assert.equal((await request(`/favorites/${p}`,users.renter,"POST",{},false)).status,403);
  assert.equal((await request(`/favorites/${p}`,users.renter,"POST")).status,200);
  assert.equal((await request(`/favorites/${p}`,users.renter,"POST")).status,200);
  assert.deepEqual((await request("/favorites",users.renter)).body.data.items.map(x=>x.id),[p]);
  assert.equal((await request("/favorites",users.otherRenter)).body.data.items.length,0);
  assert.equal((await request(`/favorites/${p}`,users.otherRenter,"DELETE")).status,200);
  assert.equal((await request("/favorites",users.renter)).body.data.items.length,1);
  assert.equal((await request(`/favorites/${p}`,users.renter,"DELETE")).status,200);
});
test("bookings snapshot server prices, enforce participant visibility, and record approval/cancellation events",async()=>{
  const p=await property(),b=await booking(p);
  assert.equal(b.totalAmount,35000);assert.equal(b.monthlyRent,30000);assert.equal(b.events[0].previousStatus,null);
  assert.equal((await request(`/bookings/${b.id}`,users.otherRenter)).status,404);
  assert.equal((await request(`/owner/bookings/${b.id}`,users.otherOwner)).status,404);
  assert.equal((await request(`/owner/bookings/${b.id}/approve`,users.otherOwner,"POST")).status,404);
  assert.equal((await request(`/owner/bookings/${b.id}/approve`,users.owner,"POST")).status,200);
  assert.equal((await request(`/owner/bookings/${b.id}/reject`,users.owner,"POST")).status,409);
  const cancel=await request(`/bookings/${b.id}/cancel`,users.renter,"POST",{reason:"Test cancellation"});
  assert.equal(cancel.status,200);assert.deepEqual(cancel.body.data.booking.events.map(x=>x.status),["pending","approved","cancelled"]);
  assert.equal((await request(`/bookings/${b.id}/cancel`,users.renter,"POST")).status,409);
  assert.equal((await request(`/admin/bookings/${b.id}`,users.admin)).status,200);
});
test("unavailable, pending, own-property, impossible dates, and forged snapshots are rejected",async()=>{
  const p=await property(),pending=await property("pending"),unavailable=await property("approved",users.owner,{available:false});
  for(const propertyId of [pending,unavailable])assert.equal((await request("/bookings",users.renter,"POST",{propertyId,startDate,endDate})).status,409);
  for(const input of [{startDate:endDate,endDate:startDate},{startDate:"2020-01-01",endDate:"2020-02-01"},{startDate:"2030-02-30",endDate:"2030-03-30"},{monthlyRent:1}])assert.equal((await request("/bookings",users.renter,"POST",{propertyId:p,startDate,endDate,...input})).status,400);
  const owned=await property();await pool.execute("UPDATE properties SET owner_id=? WHERE id=?",[users.renter.id,owned]);
  assert.equal((await request("/bookings",users.renter,"POST",{propertyId:owned,startDate,endDate})).status,400);
});
test("concurrent overlapping approvals allow one winner and failed transitions create no event",async()=>{
  const p=await property(),a=await booking(p),b=await booking(p,users.otherRenter);
  const results=await Promise.all([a,b].map(item=>request(`/owner/bookings/${item.id}/approve`,users.owner,"POST")));
  assert.deepEqual(results.map(x=>x.status).sort(),[200,409]);
  const [rows]=await pool.execute("SELECT new_status FROM booking_events WHERE booking_id IN (?,?) AND new_status='approved'",[a.id,b.id]);assert.equal(rows.length,1);
  assert.equal((await request("/bookings",users.renter,"POST",{propertyId:p,startDate,endDate})).status,409);
  assert.equal((await request(`/owner/properties/${p}`,users.owner,"DELETE")).status,409);
});
test("wrong-role, anonymous, missing IDs, invalid filters, and unknown amenities fail safely",async()=>{
  for(const path of ["/favorites","/bookings","/owner/properties","/owner/bookings","/admin/properties","/admin/bookings"])assert.equal((await request(path)).status,401);
  for(const path of ["/owner/properties","/owner/bookings","/admin/properties","/admin/bookings"])assert.equal((await request(path,users.renter)).status,403);
  for(const path of ["/favorites","/bookings","/admin/bookings"])assert.equal((await request(path,users.owner)).status,403);
  assert.equal((await request("/properties/4294967295")).status,404);
  assert.equal((await request("/bookings/4294967295",users.renter)).status,404);
  assert.equal((await request("/owner/bookings/4294967295",users.owner)).status,404);
  for(const query of ["limit=0","page=-1","minPrice=400&maxPrice=1","type=malicious","bedrooms=abc"])assert.equal((await request(`/properties?${query}`)).status,400);
  assert.equal((await request("/owner/properties",users.owner,"POST",{type:"flat",amenityIds:[4294967295]})).status,400);
});
