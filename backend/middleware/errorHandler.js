// Global error handler — catches any error passed via next(err)
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

// 404 handler for unmatched routes
const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};

module.exports = { errorHandler, notFound };
