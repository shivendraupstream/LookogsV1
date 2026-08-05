import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.SESSION_SECRET;

if (!SECRET) {
  throw new Error("SESSION_SECRET must be set in the environment");
}

const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours

function sign(payload: string): string {
  return createHmac("sha256", SECRET!).update(payload).digest("base64url");
}

/**
 * Creates a signed, expiring session token. Contains no sensitive data —
 * just an expiry timestamp, signed so it can't be forged or tampered with
 * without knowing SESSION_SECRET.
 */
export function createSessionToken(): string {
  const payload = JSON.stringify({ exp: Date.now() + TOKEN_LIFETIME_MS });
  const payloadEncoded = Buffer.from(payload).toString("base64url");
  const signature = sign(payloadEncoded);
  return `${payloadEncoded}.${signature}`;
}

/**
 * Verifies a session token's signature and expiry.
 * Returns true only if the token is authentic AND not expired.
 */
export function verifySessionToken(token: string): boolean {
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) return false;

  const expectedSignature = sign(payloadEncoded);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadEncoded, "base64url").toString("utf-8"));
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}