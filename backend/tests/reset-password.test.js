import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import app from "../src/app.js";
import pool from "../src/config/database.js";
import { requestPasswordReset } from "../src/services/auth.service.js";
import { hashSecureToken } from "../src/utils/secure-token.js";

let server;
let baseUrl;
const email = "reset.consume@example.test";
const username = "reset_consume";
const oldPassword = "old safe password";
const newPassword = "new safe password";

async function request(path, options = {}) { return fetch(`${baseUrl}${path}`, options); }
async function login(password) { return request("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); }
function cookieFrom(response) { const cookie = response.headers.get("set-cookie"); assert.ok(cookie); return cookie.split(";", 1)[0]; }
async function createResetToken() { const delivered = []; await requestPasswordReset(email, async (user, token) => delivered.push(token)); return delivered[0]; }
async function reset(body) { return request("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); }

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const response = await request("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Reset Consume", username, email, password: oldPassword, confirmPassword: oldPassword, role: "renter" }) });
  assert.equal(response.status, 201);
});

after(async () => {
  await pool.execute("DELETE s FROM sessions AS s INNER JOIN users AS u ON u.id=s.user_id WHERE u.email=?", [email]);
  await pool.execute("DELETE t FROM password_reset_tokens AS t INNER JOIN users AS u ON u.id=t.user_id WHERE u.email=?", [email]);
  await pool.execute("DELETE p FROM user_preferences AS p INNER JOIN users AS u ON u.id=p.user_id WHERE u.email=?", [email]);
  await pool.execute("DELETE FROM activity_logs WHERE actor_id IN (SELECT id FROM users WHERE email=?)", [email]);
await pool.execute("DELETE FROM users WHERE email=?", [email]);
  await pool.end();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("invalid submissions leave reset tokens usable and invalid tokens are rejected", async () => {
  const token = await createResetToken();
  assert.equal((await reset({ token: "unknown-token-value", newPassword, confirmNewPassword: newPassword })).status, 400);
  assert.equal((await reset({ token, newPassword: "short", confirmNewPassword: "short" })).status, 400);
  assert.equal((await reset({ token, newPassword, confirmNewPassword: "different password" })).status, 400);
  assert.equal((await reset({ token, newPassword: oldPassword, confirmNewPassword: oldPassword })).status, 400);
  const [tokens] = await pool.execute("SELECT used_at AS usedAt FROM password_reset_tokens WHERE token_hash=?", [hashSecureToken(token)]);
  assert.equal(tokens[0].usedAt, null);
});

test("valid reset consumes token, invalidates other tokens, and revokes every session", async () => {
  const firstToken = await createResetToken();
  const secondToken = await createResetToken();
  const sessionA = cookieFrom(await login(oldPassword));
  const sessionB = cookieFrom(await login(oldPassword));
  const before = await pool.execute("SELECT COUNT(*) AS total FROM sessions AS s INNER JOIN users AS u ON u.id=s.user_id WHERE u.email=?", [email]);
  const response = await reset({ token: secondToken, newPassword, confirmNewPassword: newPassword });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal((await request("/api/auth/me", { headers: { Cookie: sessionA } })).status, 401);
  assert.equal((await request("/api/auth/me", { headers: { Cookie: sessionB } })).status, 401);
  assert.equal((await login(oldPassword)).status, 401);
  assert.equal((await login(newPassword)).status, 200);
  const [tokens] = await pool.execute("SELECT token_hash AS tokenHash, used_at AS usedAt FROM password_reset_tokens AS t INNER JOIN users AS u ON u.id=t.user_id WHERE u.email=?", [email]);
  assert.ok(tokens.find((entry) => entry.tokenHash === hashSecureToken(firstToken)).usedAt);
  assert.ok(tokens.find((entry) => entry.tokenHash === hashSecureToken(secondToken)).usedAt);
  assert.equal((await reset({ token: secondToken, newPassword: "another password", confirmNewPassword: "another password" })).status, 400);
  const after = await pool.execute("SELECT COUNT(*) AS total FROM sessions AS s INNER JOIN users AS u ON u.id=s.user_id WHERE u.email=?", [email]);
  assert.equal(after[0][0].total, before[0][0].total + 1);
});

test("expired and later-ineligible user tokens are rejected", async () => {
  const expiredToken = await createResetToken();
  await pool.execute("UPDATE password_reset_tokens SET expires_at=DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 MINUTE) WHERE token_hash=?", [hashSecureToken(expiredToken)]);
  assert.equal((await reset({ token: expiredToken, newPassword: "another password", confirmNewPassword: "another password" })).status, 400);
  const activeToken = await createResetToken();
  await pool.execute("UPDATE users SET status='suspended' WHERE email=?", [email]);
  assert.equal((await reset({ token: activeToken, newPassword: "another password", confirmNewPassword: "another password" })).status, 400);
  await pool.execute("UPDATE users SET status='active', deleted_at=CURRENT_TIMESTAMP WHERE email=?", [email]);
  assert.equal((await reset({ token: activeToken, newPassword: "another password", confirmNewPassword: "another password" })).status, 400);
});
