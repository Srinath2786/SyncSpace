const express = require("express");

const {
  getDocument,
  updateDocument,
} = require("../controllers/documentController");

const protect = require("../middleware/authMiddleware");
const requireRoomAccess = require("../middleware/roomAccessMiddleware");
const { validateDocumentBody } = require("../validators/documentValidator");

const router = express.Router();

// Get document - room member only
router.get(
  "/:roomId",
  protect,
  requireRoomAccess,
  getDocument
);

// Update document - room member only
router.put(
  "/:roomId",
  protect,
  requireRoomAccess,
  validateDocumentBody,
  updateDocument
);

module.exports = router;