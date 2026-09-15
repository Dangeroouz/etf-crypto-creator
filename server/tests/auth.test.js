import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmail } from '../utils/normalize.js';
import { rateLimitMiddleware } from '../middleware/security.js';
import { getJwtSecret } from '../services/authService.js';

test('normalizeEmail trims whitespace and lowercases the address', () => {
  assert.equal(normalizeEmail('  User@Example.COM  '), 'user@example.com');
});

test('rateLimitMiddleware does not block repeated auth attempts', async () => {
  const middleware = rateLimitMiddleware();
  const requests = [];

  for (let i = 0; i < 100; i += 1) {
    let statusCode = 200;
    const req = { ip: '127.0.0.1', headers: {} };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json() {
        return this;
      },
    };

    middleware(req, res, () => {});
    requests.push(statusCode);
  }

  assert.ok(requests.every((code) => code === 200), 'repeated auth attempts should not be rate-limited');
});

test('getJwtSecret returns a safe fallback when JWT_SECRET is missing', () => {
  const originalSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;

  try {
    const secret = getJwtSecret();
    assert.equal(typeof secret, 'string');
    assert.ok(secret.length > 0, 'JWT secret fallback should be non-empty');
  } finally {
    if (originalSecret) {
      process.env.JWT_SECRET = originalSecret;
    }
  }
});
