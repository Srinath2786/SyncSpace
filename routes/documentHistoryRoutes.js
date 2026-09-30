const express = require("express");
const protect = require("../middleware/authMiddleware");
const requireRoomAccess = require("../middleware/roomAccessMiddleware");
const {
  getHistory,
  getHistoryById,
} = require("../services/documentHistoryService");

const router = express.Router();

/**
 * @swagger
 * /api/documents/history/{roomId}:
 *   get:
 *     summary: Get document history for a room
 *     tags: [Document History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Room ID
 *     responses:
 *       200:
 *         description: Document history retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User does not have room access
 *       404:
 *         description: Room not found
 */
router.get("/:roomId", protect, requireRoomAccess, async (req, res, next) => {
  try {
    const history = await getHistory(req.params.roomId);

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/documents/history/snapshot/{historyId}:
 *   get:
 *     summary: Get a specific document history snapshot
 *     tags: [Document History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: historyId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB History Snapshot ID
 *     responses:
 *       200:
 *         description: History snapshot retrieved successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: History snapshot not found
 */
router.get(
  "/snapshot/:historyId",
  protect,
  async (req, res, next) => {
    try {
      const snapshot = await getHistoryById(req.params.historyId);

      if (!snapshot) {
        return res.status(404).json({
          success: false,
          message: "History snapshot not found",
        });
      }

      res.json({
        success: true,
        snapshot,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;