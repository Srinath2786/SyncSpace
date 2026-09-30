const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  const payload = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV !== "production") {
    payload.stack = err.stack;
  }

  return res.status(statusCode).json(payload);
};

module.exports = errorMiddleware;
