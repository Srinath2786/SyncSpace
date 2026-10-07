const { sendError } = require("../utils/apiResponse");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (email) => emailRegex.test(String(email).trim());

const validatePassword = (password) => {
  return typeof password === "string" && password.trim().length >= 6;
};

const validateAuthRequest = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (req.path.includes("register") && (!name || !String(name).trim())) {
    errors.push("Name is required");
  }

  if (!email || !validateEmail(email)) {
    errors.push("Valid email is required");
  }

  if (!password || !validatePassword(password)) {
    errors.push("Password must be at least 6 characters");
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation failed", errors);
  }

  next();
};

module.exports = {
  validateEmail,
  validatePassword,
  validateAuthRequest,
};
