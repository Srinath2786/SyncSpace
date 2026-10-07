const { sendError } = require("../utils/apiResponse");

const validateDocumentBody = (req, res, next) => {
  const { content, language } = req.body;
  const errors = [];

  if (content !== undefined && typeof content !== "string") {
    errors.push("Document content must be a string");
  }

  if (language !== undefined && (!language || String(language).trim().length > 50)) {
    errors.push("Document language is invalid");
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation failed", errors);
  }

  next();
};

module.exports = {
  validateDocumentBody,
};
