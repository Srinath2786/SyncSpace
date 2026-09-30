const { sendError } = require("../utils/apiResponse");

const validateWorkspaceBody = (req, res, next) => {
  const { name, description } = req.body;
  const errors = [];

  if (!name || !String(name).trim()) {
    errors.push("Workspace name is required");
  }

  if (description && String(description).trim().length > 500) {
    errors.push("Workspace description cannot exceed 500 characters");
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation failed", errors);
  }

  next();
};

module.exports = {
  validateWorkspaceBody,
};
