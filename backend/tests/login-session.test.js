import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import app from "../src/app.js";
import pool from "../src/config/database.js";
import { hashPassword } from "../src/utils/password.js";
import { generateSessionToken, hashSessionToken } from "../src/utils/session-token.js";

let server;
let baseUrl;
const createdEmails = [];
const password = "safe test password";

function account(suffix, role = "renter") {
  return {
    name: `Login Test ${suffix}`,
    username: `login_test_${suffix}`,
    email: `login.${suffix}@example.test`,
    password,
    confirmPassword: password,
    role,
  };
}

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

async function register(body) {
  const response = await request("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (response.status === 201) createdEmails.push(body.email);
  return response;
}

async function login(email, suppliedPassword = password) {
  return request("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: suppliedPassword }) });
}

function cookieFrom(response) {
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie);
  return { header: setCookie.split(";", 1)[0], setCookie };
}

async function csrf(cookie) {
  const response = await request("/api/auth/csrf", { headers: { Cookie: cookie } });
  return (await response.json()).data.csrfToken;
}

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (createdEmails.length) {
    await pool.execute(`DELETE s FROM sessions AS s INNER JOIN users AS u ON u.id=s.user_id WHERE u.email IN (${createdEmails.map(() => "?").join(", ")})`, createdEmails);
    await pool.execute(`DELETE p FROM user_preferences AS p INNER JOIN users AS u ON u.id=p.user_id WHERE u.email IN (${createdEmails.map(() => "?").join(", ")})`, createdEmails);
    await pool.execute(`DELETE FROM activity_logs WHERE actor_id IN (SELECT id FROM users WHERE email IN (${createdEmails.map(() => "?").join(", ")}))`, createdEmails);
await pool.execute(`DELETE FROM users WHERE email IN (${createdEmails.map(() => "?").join(", ")})`, createdEmails);
  }
  await pool.end();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("renter and owner can log in; the cookie carries no JSON session secret", async () => {
  const renter = account("renter");
  const owner = account("owner", "owner");
  assert.equal((await register(renter)).status, 201);
  assert.equal((await register(owner)).status, 201);

  for (const user of [renter, owner]) {
    const response = await login(user.email);
    const result = await response.json();
    const { header: cookie, setCookie } = cookieFrom(response);
    assert.equal(response.status, 200);
    assert.equal(result.data.user.role, user.role);
    assert.equal("passwordHash" in result.data.user, false);
    assert.equal("rawToken" in result.data, false);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    assert.match(setCookie, /Path=\//i);
    const rawToken = cookie.slice(cookie.indexOf("=") + 1);
    const [sessions] = await pool.execute(
      `SELECT s.token_hash AS tokenHash, s.expires_at AS expiresAt, s.revoked_at AS revokedAt
       FROM sessions AS s INNER JOIN users AS u ON u.id = s.user_id
       WHERE u.email = ? ORDER BY s.id DESC LIMIT 1`,
      [user.email],
    );
    assert.notEqual(sessions[0].tokenHash, rawToken);
    assert.ok(sessions[0].expiresAt);
    assert.equal(sessions[0].revokedAt, null);
  }
});

test("credential failures are generic and inactive accounts cannot log in", async () => {
  const renter = account("inactive");
  assert.equal((await register(renter)).status, 201);
  const unknown = await login("unknown@example.test");
  const wrongPassword = await login(renter.email, "wrong password");
  const unknownBody = await unknown.json();
  const wrongPasswordBody = await wrongPassword.json();
  assert.equal(unknown.status, 401);
  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownBody.message, wrongPasswordBody.message);

  await pool.execute("UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE email = ?", [renter.email]);
  assert.equal((await login(renter.email)).status, 401);
  await pool.execute("UPDATE users SET deleted_at = NULL, status = 'suspended' WHERE email = ?", [renter.email]);
  assert.equal((await login(renter.email)).status, 403);
  await pool.execute("UPDATE users SET status = 'banned' WHERE email = ?", [renter.email]);
  assert.equal((await login(renter.email)).status, 403);
});

test("an internally provisioned admin can authenticate", async () => {
  const email = "login.admin@example.test";
  createdEmails.push(email);
  const passwordHash = await hashPassword(password);
  const [result] = await pool.execute(
    "INSERT INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, 'admin')",
    ["Login Admin", "login_test_admin", email, passwordHash],
  );
  await pool.execute("INSERT INTO user_preferences (user_id) VALUES (?)", [result.insertId]);
  const response = await login(email);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.user.role, "admin");
});

test("me and logout authenticate, revoke the session, and clear its cookie", async () => {
  const renter = account("flow");
  assert.equal((await register(renter)).status, 201);
  const loginResponse = await login(renter.email);
  const { header: cookie } = cookieFrom(loginResponse);
  const me = await request("/api/auth/me", { headers: { Cookie: cookie } });
  const meBody = await me.json();
  assert.equal(me.status, 200);
  assert.equal(meBody.data.user.email, renter.email);
  assert.equal("passwordHash" in meBody.data.user, false);
  assert.equal("tokenHash" in meBody.data.user, false);
  assert.equal((await request("/api/auth/me")).status, 401);

  const logout = await request("/api/auth/logout", { method: "POST", headers: { Cookie: cookie, "X-CSRF-Token": await csrf(cookie) } });
  const logoutBody = await logout.json();
  assert.equal(logout.status, 200);
  assert.equal(logoutBody.success, true);
  assert.match(logout.headers.get("set-cookie"), /Expires=Thu, 01 Jan 1970/i);
  assert.equal((await request("/api/auth/me", { headers: { Cookie: cookie } })).status, 401);
});

test("expired session records are rejected and raw tokens are not persisted", async () => {
  const renter = account("expired");
  assert.equal((await register(renter)).status, 201);
  const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [renter.email]);
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  await pool.execute(
    "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 MINUTE))",
    [users[0].id, tokenHash],
  );
  const response = await request("/api/auth/me", { headers: { Cookie: `rentnest_session=${rawToken}` } });
  assert.equal(response.status, 401);
  const [sessions] = await pool.execute("SELECT token_hash AS tokenHash, expires_at AS expiresAt, revoked_at AS revokedAt FROM sessions WHERE user_id = ?", [users[0].id]);
  assert.notEqual(sessions[0].tokenHash, rawToken);
  assert.ok(sessions[0].expiresAt);
  assert.equal(sessions[0].revokedAt, null);
});
