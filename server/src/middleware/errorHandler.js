export function errorHandler(err, req, res, next) {
  console.error('Unhandled server error:', err);

  const status = err.statusCode || err.status || 500;
  const message = err.expose || process.env.NODE_ENV !== 'production' 
    ? err.message 
    : 'An unexpected internal server error occurred.';

  res.status(status).json({
    error: err.name || 'InternalServerError',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}
