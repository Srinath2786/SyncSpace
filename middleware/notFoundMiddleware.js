const { sendError } = require("../utils/apiResponse");

const notFoundMiddleware = (req, res) => {
  sendError(res, 404, `Route ${req.originalUrl} not found`);
};

module.exports = notFoundMiddleware;
