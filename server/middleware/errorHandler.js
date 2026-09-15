export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.name === 'MongoServerSelectionError' || err?.name === 'MongooseServerSelectionError' || err?.name === 'MongoNetworkError') {
    return res.status(503).json({ error: 'Database unavailable' });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  console.error('Unhandled error:', message);
  res.status(statusCode).json({ error: message });
}
