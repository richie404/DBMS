import assert from "node:assert/strict";
import test from "node:test";
import app from "../src/app.js";
import pool from "../src/config/database.js";

test("profile follows the database user through registration, login, restoration, editing, logout, and all roles", async () => {
  const server = app.listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://localhost:${server.address().port}/api/auth`;
  const ids = [];
  const password = "Profile verification password 2026";
  let previousCookie;
  const request = async (path, {cookie,body,method="GET",csrf}={}) => {
    const response = await fetch(base+path,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(body?{"Content-Type":"application/json"}:{}),...(csrf?{"X-CSRF-Token":csrf}:{})},body:body?JSON.stringify(body):undefined});
    return {response,payload:await response.json()};
  };
  const safe = user => {
    assert.deepEqual(Object.keys(user).sort(), ["id","name","username","email","phone","role","status","avatarUrl"].sort());
  };
  try {
    for (const role of ["renter","owner","admin"]) {
      const suffix = `${Date.now()}_${role}`;
      const input = {name:`Distinct ${role} Profile`,username:`profile_${suffix}`,email:`profile_${suffix}@example.test`,password,confirmPassword:password,role:role==="admin"?"owner":role};
      const registered = await request("/register",{method:"POST",body:input});
      assert.equal(registered.response.status,201);
      const id = registered.payload.data.user.id; ids.push(id);
      if (role === "admin") await pool.execute("UPDATE users SET role = 'admin' WHERE id = ?",[id]);
      const [[stored]] = await pool.execute("SELECT name,email,username FROM users WHERE id = ?",[id]);
      assert.deepEqual(stored,{name:input.name,email:input.email,username:input.username});
      const logged = await request("/login",{method:"POST",body:{email:input.email,password}});
      assert.equal(logged.response.status,200);safe(logged.payload.data.user);
      assert.equal(logged.payload.data.user.name,input.name);assert.equal(logged.payload.data.user.role,role);
      const cookie=logged.response.headers.get("set-cookie").split(";")[0];
      if(previousCookie) assert.equal((await request("/me",{cookie:previousCookie})).response.status,401);
      const restored=await request("/me",{cookie});safe(restored.payload.data.user);
      assert.deepEqual(restored.payload.data.user,logged.payload.data.user);
      const token=(await request("/csrf",{cookie})).payload.data.csrfToken;
      assert.equal((await request("/profile",{method:"PATCH",cookie,body:stored})).response.status,403);
      const changed={...stored,name:`Updated ${role} Profile`,phone:"+8801700000000"};
      const updated=await request("/profile",{method:"PATCH",cookie,csrf:token,body:{...changed,role:"admin"}});
      assert.equal(updated.response.status,200);safe(updated.payload.data.user);
      assert.equal(updated.payload.data.user.role,role);
      const refreshed=await request("/me",{cookie});
      assert.equal(refreshed.payload.data.user.name,changed.name);assert.equal(refreshed.payload.data.user.phone,changed.phone);
      const [[saved]]=await pool.execute("SELECT name,email,username,phone FROM users WHERE id = ?",[id]);assert.deepEqual(saved,changed);
      assert.equal((await request("/profile",{method:"PATCH",cookie,csrf:token,body:{...changed,name:""}})).response.status,400);
      assert.equal((await request("/logout",{method:"POST",cookie,csrf:token})).response.status,200);
      assert.equal((await request("/me",{cookie})).response.status,401);previousCookie=cookie;
    }
  } finally {
    for(const id of ids) {
      await pool.execute("DELETE FROM sessions WHERE user_id = ?",[id]);
      await pool.execute("DELETE FROM user_preferences WHERE user_id = ?",[id]);
      await pool.execute("DELETE FROM activity_logs WHERE actor_id IN (SELECT id FROM users WHERE id = ?)", [id]);
await pool.execute("DELETE FROM users WHERE id = ?",[id]);
    }
    await pool.end();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  }
});
