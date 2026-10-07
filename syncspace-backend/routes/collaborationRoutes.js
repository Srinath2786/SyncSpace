const express = require("express");
const { getPresence } = require("../controllers/collaborationController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/presence", protect, getPresence);

module.exports = router;
