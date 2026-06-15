const errorHandler = (err, req, res, next) => {
  console.error(err);

  // PostgreSQL unique violation
  if (err.code === '23505') {
    const field = err.detail?.match(/\((.+?)\)/)?.[1] || 'field';
    return res.status(409).json({ message: `${field} already exists` });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ message: 'Referenced record not found' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
};

module.exports = { errorHandler };
