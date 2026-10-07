const Room = require("../models/Room");
const Workspace = require("../models/Workspace");

const getRoomById = async (roomId) => {
  return Room.findById(roomId)
    .populate("createdBy", "name email avatar")
    .populate("members", "name email avatar");
};

const getRoomMembers = async (roomId) => {
  const room = await Room.findById(roomId).populate("members", "name email avatar");

  if (!room) {
    const error = new Error("Room not found");
    error.statusCode = 404;
    throw error;
  }

  return room.members;
};

const updateRoom = async ({ roomId, userId, updates }) => {
  const room = await Room.findById(roomId);

  if (!room) {
    const error = new Error("Room not found");
    error.statusCode = 404;
    throw error;
  }

  const workspace = await Workspace.findById(room.workspace);
  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  const isMember = workspace.members.some((memberId) => memberId.toString() === userId.toString());
  if (!isMember) {
    const error = new Error("You are not a member of this workspace");
    error.statusCode = 403;
    throw error;
  }

  if (updates.name) room.name = String(updates.name).trim();
  if (updates.language) room.language = String(updates.language).trim();

  await room.save();
  return room;
};

const deleteRoom = async ({ roomId, userId }) => {
  const room = await Room.findById(roomId);

  if (!room) {
    const error = new Error("Room not found");
    error.statusCode = 404;
    throw error;
  }

  if (room.createdBy.toString() !== userId.toString()) {
    const error = new Error("Only the room owner can delete this room");
    error.statusCode = 403;
    throw error;
  }

  await room.deleteOne();
  return room;
};

module.exports = {
  getRoomById,
  getRoomMembers,
  updateRoom,
  deleteRoom,
};
