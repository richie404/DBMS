import env from "./env.js";

const sessionDurationMilliseconds = env.sessionDurationHours * 60 * 60 * 1000;

export const sessionCookieOptions = Object.freeze({
  httpOnly: true,
  sameSite: "lax",
  secure: env.nodeEnv === "production",
  path: "/",
  maxAge: sessionDurationMilliseconds,
});

export const clearSessionCookieOptions = Object.freeze({
  httpOnly: true,
  sameSite: "lax",
  secure: env.nodeEnv === "production",
  path: "/",
});

export const sessionConfig = Object.freeze({
  cookieName: env.sessionCookieName,
  durationHours: env.sessionDurationHours,
  durationMilliseconds: sessionDurationMilliseconds,
});
