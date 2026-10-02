import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import app from "../src/app.js";
import pool from "../src/config/database.js";
import { verifyPassword } from "../src/utils/password.js";

let server;
let baseUrl;
const createdEmails = [];

function payload(suffix, role = "renter") {
  return {
    name: `Test User ${suffix}`,
    username: `test_user_${suffix}`,
    email: `test.${suffix}@example.test`,
    password: "safe test password",
    confirmPassword: "safe test password",
    role,
  };
}

async function register(body) {
  return fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (createdEmails.length) {
    await pool.execute(
      `DELETE p FROM user_preferences AS p
       INNER JOIN users AS u ON u.id = p.user_id
       WHERE u.email IN (${createdEmails.map(() => "?").join(", ")})`,
      createdEmails,
    );
    await pool.execute(`DELETE FROM activity_logs WHERE actor_id IN (SELECT id FROM users WHERE email IN (${createdEmails.map(() => "?").join(", ")}))`, createdEmails);
await pool.execute(`DELETE FROM users WHERE email IN (${createdEmails.map(() => "?").join(", ")})`, createdEmails);
  }
  await pool.end();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("valid renter registration creates a user and default preferences without a session", async () => {
  const body = payload("renter", "renter");
  const response = await register(body);
  const result = await response.json();
  createdEmails.push(body.email);
  assert.equal(response.status, 201);
  assert.equal(result.success, true);
  assert.equal(result.data.user.role, "renter");
  assert.equal("password" in result.data.user, false);
  assert.equal("passwordHash" in result.data.user, false);
  assert.equal(response.headers.get("set-cookie"), null);

  const [rows] = await pool.execute(
    `SELECT u.password_hash AS passwordHash, p.user_id AS preferenceUserId,
      (SELECT COUNT(*) FROM sessions WHERE user_id = u.id) AS sessionCount
     FROM users AS u LEFT JOIN user_preferences AS p ON p.user_id = u.id WHERE u.email = ?`,
    [body.email],
  );
  assert.ok(rows[0].preferenceUserId);
  assert.notEqual(rows[0].passwordHash, body.password);
  assert.equal(await verifyPassword(rows[0].passwordHash, body.password), true);
  assert.equal(rows[0].sessionCount, 0);
});

test("valid owner registration returns 201", async () => {
  const body = payload("owner", "owner");
  const response = await register(body);
  const result = await response.json();
  createdEmails.push(body.email);
  assert.equal(response.status, 201);
  assert.equal(result.data.user.role, "owner");
});

test("registration validation rejects admin, invalid email, missing fields, and weak passwords", async () => {
  const admin = await register({ ...payload("admin"), role: "admin" });
  assert.equal(admin.status, 400);
  assert.ok((await admin.json()).errors.role);

  const invalidEmail = await register({ ...payload("email"), email: "not-an-email" });
  assert.equal(invalidEmail.status, 400);
  assert.ok((await invalidEmail.json()).errors.email);

  const missingName = await register({ ...payload("missing"), name: "" });
  assert.equal(missingName.status, 400);
  assert.ok((await missingName.json()).errors.name);

  const weak = await register({ ...payload("weak"), password: "short", confirmPassword: "short" });
  assert.equal(weak.status, 400);
  assert.ok((await weak.json()).errors.password);
});

test("duplicate email and username return 409", async () => {
  const duplicateEmail = await register({ ...payload("email-duplicate"), username: "another_test_user_renter", email: "test.renter@example.test" });
  assert.equal(duplicateEmail.status, 409);
  assert.ok((await duplicateEmail.json()).errors.email);

  const duplicateUsername = await register({ ...payload("username-duplicate"), username: "test_user_renter", email: "another.email@example.test" });
  assert.equal(duplicateUsername.status, 409);
  assert.ok((await duplicateUsername.json()).errors.username);
});
