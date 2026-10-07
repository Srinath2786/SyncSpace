const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "syncspace_super_secret_change_this", {
    expiresIn: "7d",
  });
};

module.exports = generateToken;
