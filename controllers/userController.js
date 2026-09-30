const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const getCurrentUser = async (req, res) => {
  return sendSuccess(res, 200, {
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
    },
  });
};

const updateCurrentUser = async (req, res) => {
  const { name, avatar } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return sendError(res, 404, "User not found");
  }

  if (name !== undefined) user.name = String(name).trim();
  if (avatar !== undefined) user.avatar = String(avatar).trim();

  await user.save();

  return sendSuccess(res, 200, {
    message: "Profile updated successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
  });
};

module.exports = {
  getCurrentUser,
  updateCurrentUser,
};
