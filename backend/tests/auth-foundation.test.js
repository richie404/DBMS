import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "../src/utils/password.js";
import { generateSessionToken, hashSessionToken } from "../src/utils/session-token.js";
import requireRole from "../src/middleware/require-role.js";

test("Argon2id hashes passwords and verifies the correct password", async () => {
  const password = "test password only";
  const hash = await hashPassword(password);
  assert.notEqual(hash, password);
  assert.match(hash, /^\$argon2id\$/);
  assert.equal(await verifyPassword(hash, password), true);
});

test("Argon2id rejects an incorrect password", async () => {
  const hash = await hashPassword("correct password");
  assert.equal(await verifyPassword(hash, "incorrect password"), false);
});

test("session tokens are unique, high-entropy values", () => {
  const first = generateSessionToken();
  const second = generateSessionToken();
  assert.notEqual(first, second);
  assert.ok(first.length >= 43);
});

test("session token hashing is deterministic and does not retain the raw token", () => {
  const token = generateSessionToken();
  const hash = hashSessionToken(token);
  assert.equal(hash, hashSessionToken(token));
  assert.notEqual(hash, hashSessionToken(generateSessionToken()));
  assert.notEqual(hash, token);
  assert.match(hash, /^[a-f0-9]{64}$/);
});

function responseSpy() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("role middleware permits allowed roles and rejects other roles", () => {
  const middleware = requireRole("owner", "admin");
  const allowedResponse = responseSpy();
  let continued = false;
  middleware({ user: { role: "owner" } }, allowedResponse, () => { continued = true; });
  assert.equal(continued, true);

  const rejectedResponse = responseSpy();
  middleware({ user: { role: "renter" } }, rejectedResponse, () => {});
  assert.equal(rejectedResponse.statusCode, 403);
  assert.equal(rejectedResponse.body.success, false);
});
