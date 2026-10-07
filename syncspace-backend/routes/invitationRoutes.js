const express = require("express");
const protect = require("../middleware/authMiddleware");
const Invitation = require("../models/Invitation");
const {
  createInvitation,
  acceptInvitation,
} = require("../services/invitationService");

const router = express.Router();

// List my pending invitations (used by the Invitations page)
router.get("/", protect, async (req, res, next) => {
  try {
    const invitations = await Invitation.find({ invitedUser: req.user._id, status: "pending" })
      .populate("workspace", "name")
      .populate("room", "name")
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, invitations });
  } catch (error) {
    next(error);
  }
});


/**
 * @swagger
 * /api/invitations:
 *   post:
 *     summary: Create a workspace or room invitation
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workspaceId
 *               - email
 *             properties:
 *               workspaceId:
 *                 type: string
 *                 example: 6ab501ed26e76502a6bb752d
 *               roomId:
 *                 type: string
 *                 example: 6ab5034f2cf84d0c7bd48b56
 *               email:
 *                 type: string
 *                 format: email
 *                 example: testuser2@syncspace.com
 *     responses:
 *       201:
 *         description: Invitation created successfully
 *       400:
 *         description: Required fields missing
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not a workspace member
 *       404:
 *         description: User or workspace not found
 */
router.post("/", protect, async (req, res, next) => {
  try {
    const { workspaceId, roomId, email } = req.body;

    if (!workspaceId || !email) {
      return res.status(400).json({
        success: false,
        message: "workspaceId and email are required",
      });
    }

    const invitation = await createInvitation({
      workspaceId,
      roomId,
      invitedBy: req.user._id,
      email,
    });

    res.status(201).json({
      success: true,
      invitation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/invitations/{invitationId}/accept:
 *   post:
 *     summary: Accept an invitation
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Invitation ID
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *       400:
 *         description: Invitation is no longer pending
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User cannot accept this invitation
 *       404:
 *         description: Invitation not found
 */
router.post(
  "/:invitationId/accept",
  protect,
  async (req, res, next) => {
    try {
      const invitation = await acceptInvitation(
        req.params.invitationId,
        req.user._id
      );

      res.json({
        success: true,
        message: "Invitation accepted",
        invitation,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;