/**
 * Simple in-memory rate limiter for login attempts.
 * Prevents brute-force credential stuffing without needing an external Redis instance.
 */

interface RateLimitRecord {
  attempts: number;
  blockedUntil: number | null;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // If currently blocked
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  // If previous block expired, reset record
  if (record.blockedUntil && record.blockedUntil <= now) {
    rateLimitMap.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.attempts);
  return { allowed: remaining > 0, remainingAttempts: remaining };
}

export function recordFailedAttempt(identifier: string): {
  blocked: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(identifier) || { attempts: 0, blockedUntil: null };

  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    rateLimitMap.set(identifier, record);
    return {
      blocked: true,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil(BLOCK_DURATION_MS / 1000),
    };
  }

  rateLimitMap.set(identifier, record);
  return {
    blocked: false,
    remainingAttempts: MAX_ATTEMPTS - record.attempts,
  };
}

export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier);
}
