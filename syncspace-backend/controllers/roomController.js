const Room = require("../models/Room");
const Workspace = require("../models/Workspace");
const {
  getRoomById,
  getRoomMembers: getRoomMembersById,
  updateRoom: updateRoomService,
  deleteRoom: deleteRoomService,
} = require("../services/roomService");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const createRoom = async (req, res, next) => {
  try {
    const { name, workspaceId, language } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return sendError(res, 404, "Workspace not found");
    }

    const isMember = workspace.members.some((memberId) => memberId.toString() === req.user._id.toString());
    if (!isMember) {
      return sendError(res, 403, "You are not a member of this workspace");
    }

    const room = await Room.create({
      name,
      workspace: workspaceId,
      createdBy: req.user._id,
      members: [req.user._id],
      language: language || "javascript",
    });

    return sendSuccess(res, 201, {
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    return next(error);
  }
};

const getWorkspaceRooms = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return sendError(res, 404, "Workspace not found");
    }

    const isMember = workspace.members.some((memberId) => memberId.toString() === req.user._id.toString());
    if (!isMember) {
      return sendError(res, 403, "You are not a member of this workspace");
    }

    const rooms = await Room.find({ workspace: workspaceId }).sort({ createdAt: -1 });
    return sendSuccess(res, 200, { rooms });
  } catch (error) {
    return next(error);
  }
};

const getRoomDetails = async (req, res, next) => {
  try {
    const room = await getRoomById(req.params.roomId);
    if (!room) {
      return sendError(res, 404, "Room not found");
    }

    const workspace = await Workspace.findById(room.workspace);
    if (!workspace) {
      return sendError(res, 404, "Workspace not found");
    }

    const isMember = workspace.members.some((memberId) => memberId.toString() === req.user._id.toString());
    if (!isMember) {
      return sendError(res, 403, "You are not a member of this workspace");
    }

    return sendSuccess(res, 200, { room });
  } catch (error) {
    return next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const room = await updateRoomService({
      roomId: req.params.roomId,
      userId: req.user._id,
      updates: req.body,
    });

    return sendSuccess(res, 200, {
      message: "Room updated successfully",
      room,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    await deleteRoomService({
      roomId: req.params.roomId,
      userId: req.user._id,
    });

    return sendSuccess(res, 200, {
      message: "Room deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

const getRoomMembers = async (req, res, next) => {
  try {
    const members = await getRoomMembersById(req.params.roomId);
    return sendSuccess(res, 200, { members });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createRoom,
  getWorkspaceRooms,
  getRoomDetails,
  updateRoom,
  deleteRoom,
  getRoomMembers,
};