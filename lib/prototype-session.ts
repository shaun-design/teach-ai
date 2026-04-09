/** Re-exports for App Router / Node routes; implementation lives at repo root for Edge middleware. */
export {
  PROTOTYPE_SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  createSessionToken,
  verifySessionToken,
  requirePrototypeEnv,
  timingSafeEqualStr,
  sessionCookieOptions,
  clearSessionCookieOptions,
} from '../prototype-session-core';
