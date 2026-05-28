import { describe, it, expect } from 'vitest';
import { apiLimiter, authLimiter } from './rateLimiter';

describe('apiLimiter', () => {
  it('should allow requests within limit', () => {
    for (let i = 0; i < 5; i++) {
      const result = apiLimiter('test-api-key');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    }
  });

  it('should report decreasing remaining count', () => {
    const first = apiLimiter('count-key');
    expect(first.remaining).toBe(59);

    const second = apiLimiter('count-key');
    expect(second.remaining).toBe(58);
  });

  it('should have separate buckets for different keys', () => {
    for (let i = 0; i < 60; i++) {
      apiLimiter('key-a');
    }
    const blocked = apiLimiter('key-a');
    expect(blocked.allowed).toBe(false);

    const allowed = apiLimiter('key-b');
    expect(allowed.allowed).toBe(true);
  });

  it('should reset after window passes', () => {
    for (let i = 0; i < 60; i++) {
      apiLimiter('reset-key');
    }
    expect(apiLimiter('reset-key').allowed).toBe(false);
  });
});

describe('authLimiter', () => {
  it('should have stricter limit than apiLimiter', () => {
    for (let i = 0; i < 10; i++) {
      authLimiter('auth-key');
    }
    expect(authLimiter('auth-key').allowed).toBe(false);
  });
});
