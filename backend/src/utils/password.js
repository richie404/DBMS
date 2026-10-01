import argon2 from "argon2";

const argon2Options = Object.freeze({
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
});

function requireString(value, name) {
  if (typeof value !== "string") throw new TypeError(`${name} must be a string.`);
}

export async function hashPassword(password) {
  requireString(password, "Password");
  return argon2.hash(password, argon2Options);
}

export async function verifyPassword(passwordHash, password) {
  requireString(passwordHash, "Password hash");
  requireString(password, "Password");
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}
