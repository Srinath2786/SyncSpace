const { registerUser, loginUser } = require("../services/authService");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);

    return sendSuccess(res, 201, {
      message: "User registered successfully",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    return sendSuccess(res, 200, {
      message: "Login successful",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
};