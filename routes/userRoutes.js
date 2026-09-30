const express = require("express");
const { getCurrentUser, updateCurrentUser } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, getCurrentUser);
router.put("/me", protect, updateCurrentUser);

module.exports = router;
