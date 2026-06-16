const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err);

  if (err.name === 'ZodError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  if (err.code === '23505') {
    const field = err.constraint?.includes('email') ? 'email' : 'field';
    return res.status(409).json({
      message: `Duplicate ${field}. This ${field} is already in use.`,
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      message: 'Referenced record not found.',
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
