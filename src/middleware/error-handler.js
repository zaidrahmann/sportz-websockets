export class AppError extends Error {
  constructor(message, status = 500, details = undefined) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Express 5 error-handling middleware (4 params required)
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) console.error(err);

  const body = { error: status < 500 ? err.message : 'Internal Server Error' };

  if (err.details) {
    body.details = err.details;
  } else if (isDev && status >= 500) {
    body.details = err.message;
    body.stack = err.stack;
  }

  res.status(status).json(body);
}
