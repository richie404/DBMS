import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import app from "../src/app.js";
import pool from "../src/config/database.js";

let server;
let baseUrl;
const email = "csrf.test@example.test";
const password = "safe test password";

async function request(path, options = {}) { return fetch(`${baseUrl}${path}`, options); }
function cookieFrom(response) { const cookie = response.headers.get("set-cookie"); assert.ok(cookie); return cookie.split(";", 1)[0]; }
async function login() { return request("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); }
async function csrf(cookie) { const response = await request("/api/auth/csrf", { headers: { Cookie: cookie } }); return { response, body: await response.json() }; }

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const registration = await request("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "CSRF Test", username: "csrf_test", email, password, confirmPassword: password, role: "renter" }) });
  assert.equal(registration.status, 201);
});

after(async () => {
  await pool.execute("DELETE s FROM sessions AS s INNER JOIN users AS u ON u.id=s.user_id WHERE u.email=?", [email]);
  await pool.execute("DELETE p FROM user_preferences AS p INNER JOIN users AS u ON u.id=p.user_id WHERE u.email=?", [email]);
  await pool.execute("DELETE FROM users WHERE email=?", [email]);
  await pool.end();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("CSRF retrieval is authenticated and session-bound mutations reject missing and invalid headers", async () => {
  assert.equal((await request("/api/auth/csrf")).status, 401);
  const sessionA = cookieFrom(await login());
  const sessionB = cookieFrom(await login());
  const { response, body } = await csrf(sessionA);
  assert.equal(response.status, 200);
  assert.match(body.data.csrfToken, /^[a-f0-9]{64}$/);
  assert.equal("sessionId" in body.data, false);
  assert.equal((await request("/api/auth/password", { method: "PATCH", headers: { "Content-Type": "application/json", Cookie: sessionA }, body: JSON.stringify({ currentPassword: password, newPassword: "another safe password", confirmNewPassword: "another safe password" }) })).status, 403);
  assert.equal((await request("/api/auth/password", { method: "PATCH", headers: { "Content-Type": "application/json", Cookie: sessionA, "X-CSRF-Token": "invalid" }, body: JSON.stringify({ currentPassword: password, newPassword: "another safe password", confirmNewPassword: "another safe password" }) })).status, 403);
  assert.equal((await request("/api/auth/password", { method: "PATCH", headers: { "Content-Type": "application/json", Cookie: sessionB, "X-CSRF-Token": body.data.csrfToken }, body: JSON.stringify({ currentPassword: password, newPassword: "another safe password", confirmNewPassword: "another safe password" }) })).status, 403);
  assert.equal((await request("/api/auth/me", { headers: { Cookie: sessionA } })).status, 200);
});

test("valid CSRF authorizes logout and rejected logout leaves the session active", async () => {
  const rejectedCookie = cookieFrom(await login());
  assert.equal((await request("/api/auth/logout", { method: "POST", headers: { Cookie: rejectedCookie } })).status, 403);
  assert.equal((await request("/api/auth/me", { headers: { Cookie: rejectedCookie } })).status, 200);
  const cookie = cookieFrom(await login());
  const { body } = await csrf(cookie);
  const logout = await request("/api/auth/logout", { method: "POST", headers: { Cookie: cookie, "X-CSRF-Token": body.data.csrfToken } });
  assert.equal(logout.status, 200);
  assert.equal((await request("/api/auth/me", { headers: { Cookie: cookie } })).status, 401);
  assert.equal((await request("/api/auth/password", { method: "PATCH", headers: { "Content-Type": "application/json", Cookie: cookie, "X-CSRF-Token": body.data.csrfToken }, body: JSON.stringify({ currentPassword: password, newPassword: "another safe password", confirmNewPassword: "another safe password" }) })).status, 401);
});
