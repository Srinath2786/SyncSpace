const { sendError } = require("../utils/apiResponse");

const validateRoomCreate = (req, res, next) => {
  const { name, workspaceId, language } = req.body;
  const errors = [];

  if (!name || !String(name).trim()) {
    errors.push("Room name is required");
  }

  if (!workspaceId || !String(workspaceId).trim()) {
    errors.push("Workspace ID is required");
  }

  if (language && String(language).trim().length > 50) {
    errors.push("Language is too long");
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation failed", errors);
  }

  next();
};

const validateRoomUpdate = (req, res, next) => {
  const { name, language } = req.body;

  if (name === undefined && language === undefined) {
    return sendError(res, 400, "Validation failed", [
      "At least one field is required",
    ]);
  }

  if (name !== undefined && !String(name).trim()) {
    return sendError(res, 400, "Validation failed", [
      "Room name cannot be empty",
    ]);
  }

  if (language !== undefined && String(language).trim().length > 50) {
    return sendError(res, 400, "Validation failed", [
      "Language is too long",
    ]);
  }

  next();
};

module.exports = {
  validateRoomBody: validateRoomCreate,
  validateRoomCreate,
  validateRoomUpdate,
};
