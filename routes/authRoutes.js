const express = require("express");
const { register, login } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");
const { validateAuthRequest } = require("../validators/authValidator");

const router = express.Router();

router.post("/register", validateAuthRequest, register);
router.post("/login", validateAuthRequest, login);

router.get("/me", protect, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
    },
  });
});

module.exports = router;