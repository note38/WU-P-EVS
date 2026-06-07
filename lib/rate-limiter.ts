interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitInfo>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const info = rateLimits.get(key);

  if (!info) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (now > info.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (info.count >= limit) {
    return false;
  }

  info.count += 1;
  return true;
}

export function getRemainingAttempts(key: string, limit: number): number {
  const info = rateLimits.get(key);
  if (!info) {
    return limit;
  }
  
  if (Date.now() > info.resetTime) {
    return limit;
  }

  return Math.max(0, limit - info.count);
}

export function resetRateLimit(key: string): void {
  rateLimits.delete(key);
}
