const Room = require("../models/Room");
const Workspace = require("../models/Workspace");

const requireRoomAccess = async (req, res, next) => {
  try {
    const roomId = req.params.roomId;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room ID is required",
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const workspace = await Workspace.findById(room.workspace);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const userId = req.user._id.toString();

    const isWorkspaceMember = workspace.members.some(
      (memberId) => memberId.toString() === userId
    );

    if (!isWorkspaceMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this workspace",
      });
    }

    const isRoomMember = room.members.some(
      (memberId) => memberId.toString() === userId
    );

    if (!isRoomMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this room",
      });
    }

    req.room = room;
    req.workspace = workspace;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireRoomAccess;