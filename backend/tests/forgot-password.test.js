import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import app from "../src/app.js";
import pool from "../src/config/database.js";
import env from "../src/config/env.js";
import { requestPasswordReset } from "../src/services/auth.service.js";
import { hashSecureToken } from "../src/utils/secure-token.js";

let server;
let baseUrl;
const accounts = [
  { suffix: "active", email: "reset.active@example.test", username: "reset_active", status: "active", deleted: false },
  { suffix: "deleted", email: "reset.deleted@example.test", username: "reset_deleted", status: "active", deleted: true },
  { suffix: "suspended", email: "reset.suspended@example.test", username: "reset_suspended", status: "suspended", deleted: false },
  { suffix: "banned", email: "reset.banned@example.test", username: "reset_banned", status: "banned", deleted: false },
];
const password = "safe test password";

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

async function forgot(email) {
  return request("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
}

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  for (const account of accounts) {
    const response = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `Reset ${account.suffix}`, username: account.username, email: account.email, password, confirmPassword: password, role: "renter" }),
    });
    assert.equal(response.status, 201);
    if (account.deleted) await pool.execute("UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE email = ?", [account.email]);
    if (account.status !== "active") await pool.execute("UPDATE users SET status = ? WHERE email = ?", [account.status, account.email]);
  }
});

after(async () => {
  const emails = accounts.map((account) => account.email);
  await pool.execute(`DELETE t FROM password_reset_tokens AS t INNER JOIN users AS u ON u.id = t.user_id WHERE u.email IN (${emails.map(() => "?").join(", ")})`, emails);
  await pool.execute(`DELETE p FROM user_preferences AS p INNER JOIN users AS u ON u.id = p.user_id WHERE u.email IN (${emails.map(() => "?").join(", ")})`, emails);
  await pool.execute(`DELETE FROM activity_logs WHERE actor_id IN (SELECT id FROM users WHERE email IN (${emails.map(() => "?").join(", ")}))`, emails);
await pool.execute(`DELETE FROM users WHERE email IN (${emails.map(() => "?").join(", ")})`, emails);
  await pool.end();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("forgot password returns one generic response without exposing account state", async () => {
  const responses = [];
  for (const email of [accounts[0].email, "unknown@example.test", accounts[1].email, accounts[2].email, accounts[3].email]) {
    const response = await forgot(email);
    responses.push({ status: response.status, body: await response.json() });
  }
  for (const response of responses) assert.equal(response.status, 200);
  for (const response of responses) assert.deepEqual(response.body, responses[0].body);
  assert.equal((await forgot("invalid-email")).status, 400);

  const [counts] = await pool.execute(
    `SELECT u.email, COUNT(t.id) AS total FROM users AS u
     LEFT JOIN password_reset_tokens AS t ON t.user_id = u.id
     WHERE u.email IN (${accounts.map(() => "?").join(", ")}) GROUP BY u.email`,
    accounts.map((account) => account.email),
  );
  const tokenCounts = Object.fromEntries(counts.map((row) => [row.email, row.total]));
  assert.equal(tokenCounts[accounts[0].email], 1);
  assert.equal(tokenCounts[accounts[1].email], 0);
  assert.equal(tokenCounts[accounts[2].email], 0);
  assert.equal(tokenCounts[accounts[3].email], 0);
});

test("service test captures raw tokens only through injected delivery and invalidates prior tokens", async () => {
  const delivered = [];
  const capture = async (user, rawToken) => delivered.push({ user, rawToken });
  await requestPasswordReset(accounts[0].email, capture);
  const first = delivered.at(-1).rawToken;
  await requestPasswordReset(accounts[0].email, capture);
  const second = delivered.at(-1).rawToken;
  assert.notEqual(first, second);

  const [tokens] = await pool.execute(
    `SELECT t.token_hash AS tokenHash, t.expires_at AS expiresAt, t.used_at AS usedAt, t.created_at AS createdAt
     FROM password_reset_tokens AS t INNER JOIN users AS u ON u.id = t.user_id
     WHERE u.email = ? ORDER BY t.id`,
    [accounts[0].email],
  );
  const firstRecord = tokens.find((token) => token.tokenHash === hashSecureToken(first));
  const secondRecord = tokens.find((token) => token.tokenHash === hashSecureToken(second));
  assert.ok(firstRecord);
  assert.ok(secondRecord);
  assert.notEqual(firstRecord.tokenHash, first);
  assert.notEqual(secondRecord.tokenHash, second);
  assert.ok(firstRecord.usedAt);
  assert.equal(secondRecord.usedAt, null);
  assert.ok(secondRecord.expiresAt > secondRecord.createdAt);
  const expectedMilliseconds = env.passwordResetTokenTtlMinutes * 60 * 1000;
  assert.ok(Math.abs((secondRecord.expiresAt - secondRecord.createdAt) - expectedMilliseconds) < 5_000);
  const [sessions] = await pool.execute(
    "SELECT COUNT(*) AS total FROM sessions AS s INNER JOIN users AS u ON u.id = s.user_id WHERE u.email = ?",
    [accounts[0].email],
  );
  assert.equal(sessions[0].total, 0);
});
