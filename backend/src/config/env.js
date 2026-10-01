import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)), quiet: true });

const nodeEnv = process.env.NODE_ENV ?? "development";
const rawPort = process.env.PORT ?? "5000";
const port = Number(rawPort);
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
const rawSessionDurationHours = process.env.SESSION_DURATION_HOURS ?? "24";
const sessionDurationHours = Number(rawSessionDurationHours);
const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "rentnest_session";
const rawPasswordResetTokenTtlMinutes = process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? "60";
const passwordResetTokenTtlMinutes = Number(rawPasswordResetTokenTtlMinutes);
const csrfSecret = process.env.CSRF_SECRET;

if (!["development", "test", "production"].includes(nodeEnv)) {
  throw new Error("NODE_ENV must be development, test, or production.");
}

if (!/^\d+$/.test(rawPort) || !Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

if (!/^(?:\d+|\d+\.\d+)$/.test(rawSessionDurationHours)
  || !Number.isFinite(sessionDurationHours)
  || sessionDurationHours <= 0) {
  throw new Error("SESSION_DURATION_HOURS must be a positive numeric value.");
}

if (!/^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(sessionCookieName)) {
  throw new Error("SESSION_COOKIE_NAME must be a valid cookie name.");
}

if (!/^\d+$/.test(rawPasswordResetTokenTtlMinutes)
  || !Number.isInteger(passwordResetTokenTtlMinutes)
  || passwordResetTokenTtlMinutes <= 0) {
  throw new Error("PASSWORD_RESET_TOKEN_TTL_MINUTES must be a positive integer.");
}

if (typeof csrfSecret !== "string" || csrfSecret.length < 32) {
  throw new Error("CSRF_SECRET must be at least 32 characters.");
}

let frontendOrigin;
try {
  frontendOrigin = new URL(frontendUrl);
} catch {
  throw new Error("FRONTEND_URL must be a valid HTTP or HTTPS origin.");
}

if (!["http:", "https:"].includes(frontendOrigin.protocol) || frontendUrl !== frontendOrigin.origin) {
  throw new Error("FRONTEND_URL must contain only an HTTP or HTTPS origin, without a path.");
}

const dbPortValue = process.env.DB_PORT;
const dbPort = Number(dbPortValue);
if (!/^\d+$/.test(dbPortValue ?? "") || !Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535) {
  throw new Error("DB_PORT must be an integer between 1 and 65535.");
}

for (const name of ["DB_HOST", "DB_USER", "DB_NAME"]) {
  if (!process.env[name]?.trim()) throw new Error(`${name} is required.`);
}
if (process.env.DB_PASSWORD === undefined) {
  throw new Error("DB_PASSWORD must be configured; an empty value is allowed for local development.");
}

const database = Object.freeze({
  host: process.env.DB_HOST.trim(),
  port: dbPort,
  user: process.env.DB_USER.trim(),
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME.trim(),
});

export default Object.freeze({
  nodeEnv,
  port,
  frontendUrl,
  database,
  sessionDurationHours,
  sessionCookieName,
  passwordResetTokenTtlMinutes,
  csrfSecret,
});
