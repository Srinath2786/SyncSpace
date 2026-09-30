const sendSuccess = (res, statusCode = 200, payload = {}) => {
  const { message = "Success", ...data } = payload;

  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

const sendError = (res, statusCode = 500, message = "Something went wrong", details = null) => {
  const response = {
    success: false,
    message,
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  sendSuccess,
  sendError,
  asyncHandler,
};
