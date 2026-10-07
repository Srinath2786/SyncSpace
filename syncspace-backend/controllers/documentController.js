const Document = require("../models/Document");
const Room = require("../models/Room");
const Workspace = require("../models/Workspace");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const getDocument = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId);

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

    let document = await Document.findOne({ room: roomId });
    if (!document) {
      document = await Document.create({
        room: roomId,
        content: "",
        language: room.language,
        updatedBy: req.user._id,
      });
    }

    return sendSuccess(res, 200, { document });
  } catch (error) {
    return next(error);
  }
};

const updateDocument = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { content, language } = req.body;

    const room = await Room.findById(roomId);
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

    let document = await Document.findOne({ room: roomId });
    if (!document) {
      document = await Document.create({
        room: roomId,
        content: content || "",
        language: language || room.language,
        updatedBy: req.user._id,
      });
    } else {
      if (content !== undefined) document.content = content;
      if (language !== undefined) document.language = language;
      document.updatedBy = req.user._id;
      await document.save();
    }

    return sendSuccess(res, 200, {
      message: "Document updated successfully",
      document,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDocument,
  updateDocument,
};