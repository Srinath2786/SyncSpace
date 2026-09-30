const express = require("express");

const {
  createRoom,
  getWorkspaceRooms,
  getRoomDetails,
  updateRoom,
  deleteRoom,
  getRoomMembers,
} = require("../controllers/roomController");

const protect = require("../middleware/authMiddleware");
const requireRoomAccess = require("../middleware/roomAccessMiddleware");
const {
  validateRoomCreate,
  validateRoomUpdate,
} = require("../validators/roomValidator");

const router = express.Router();

// Create a room
router.post(
  "/",
  protect,
  validateRoomCreate,
  createRoom
);

// Get all rooms in a workspace
router.get(
  "/workspace/:workspaceId",
  protect,
  getWorkspaceRooms
);

// Room details - room member only
router.get(
  "/:roomId",
  protect,
  requireRoomAccess,
  getRoomDetails
);

// Update room - room member only
router.put(
  "/:roomId",
  protect,
  requireRoomAccess,
  validateRoomUpdate,
  updateRoom
);

// Delete room
router.delete(
  "/:roomId",
  protect,
  requireRoomAccess,
  deleteRoom
);

// Room members - room member only
router.get(
  "/:roomId/members",
  protect,
  requireRoomAccess,
  getRoomMembers
);

module.exports = router;