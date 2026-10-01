import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import app from "../src/app.js";
import pool from "../src/config/database.js";

let server;
let baseUrl;
const email = "password.change@example.test";
const username = "password_change_test";
const oldPassword = "old safe password";
const newPassword = "new safe password";

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

async function login(password) {
  return request("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
}

function cookieFrom(response) {
  const header = response.headers.get("set-cookie");
  assert.ok(header);
  return header.split(";", 1)[0];
}

async function csrf(cookie) {
  const response = await request("/api/auth/csrf", { headers: { Cookie: cookie } });
  return (await response.json()).data.csrfToken;
}

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const registration = await request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Password Change", username, email, password: oldPassword, confirmPassword: oldPassword, role: "renter" }),
  });
  assert.equal(registration.status, 201);
});

after(async () => {
  await pool.execute("DELETE s FROM sessions AS s INNER JOIN users AS u ON u.id = s.user_id WHERE u.email = ?", [email]);
  await pool.execute("DELETE p FROM user_preferences AS p INNER JOIN users AS u ON u.id = p.user_id WHERE u.email = ?", [email]);
  await pool.execute("DELETE FROM users WHERE email = ?", [email]);
  await pool.end();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("password change requires authentication and validates its input", async () => {
  assert.equal((await request("/api/auth/password", { method: "PATCH" })).status, 401);
  const activeCookie = cookieFrom(await login(oldPassword));
  const csrfToken = await csrf(activeCookie);
  const invalidCases = [
    { currentPassword: "wrong password", newPassword, confirmNewPassword: newPassword, status: 401 },
    { currentPassword: oldPassword, newPassword: "short", confirmNewPassword: "short", status: 400 },
    { currentPassword: oldPassword, newPassword: "x".repeat(257), confirmNewPassword: "x".repeat(257), status: 400 },
    { currentPassword: oldPassword, newPassword, confirmNewPassword: "different password", status: 400 },
    { currentPassword: oldPassword, newPassword: oldPassword, confirmNewPassword: oldPassword, status: 400 },
  ];
  for (const body of invalidCases) {
    const response = await request("/api/auth/password", { method: "PATCH", headers: { "Content-Type": "application/json", Cookie: activeCookie, "X-CSRF-Token": csrfToken }, body: JSON.stringify(body) });
    assert.equal(response.status, body.status);
  }
});

test("password change preserves the current session and revokes other active sessions", async () => {
  const firstCookie = cookieFrom(await login(oldPassword));
  const secondCookie = cookieFrom(await login(oldPassword));
  const changed = await request("/api/auth/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: firstCookie, "X-CSRF-Token": await csrf(firstCookie) },
    body: JSON.stringify({ currentPassword: oldPassword, newPassword, confirmNewPassword: newPassword }),
  });
  const changedBody = await changed.json();
  assert.equal(changed.status, 200);
  assert.equal(changedBody.success, true);
  assert.equal((await request("/api/auth/me", { headers: { Cookie: firstCookie } })).status, 200);
  assert.equal((await request("/api/auth/me", { headers: { Cookie: secondCookie } })).status, 401);

  assert.equal((await login(oldPassword)).status, 401);
  assert.equal((await login(newPassword)).status, 200);
  const [sessions] = await pool.execute(
    `SELECT s.id, s.revoked_at AS revokedAt FROM sessions AS s
     INNER JOIN users AS u ON u.id = s.user_id WHERE u.email = ? ORDER BY s.id`,
    [email],
  );
  assert.ok(sessions.some((session) => session.revokedAt !== null));
  assert.ok(sessions.some((session) => session.revokedAt === null));
});
