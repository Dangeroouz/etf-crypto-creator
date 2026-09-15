export function rateLimitMiddleware() {
  return (_req, _res, next) => {
    next();
  };
}

export const securityMiddleware = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.removeHeader('x-powered-by');
  next();
};

export const authLimiter = rateLimitMiddleware();

export const generalLimiter = rateLimitMiddleware();
