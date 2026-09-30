const Y = require("yjs");
const Document = require("../models/Document");
const DocumentHistory = require("../models/DocumentHistory");

const createHistorySnapshot = async ({
  roomId,
  userId,
  ydoc,
  language = "javascript",
}) => {
  const document = await Document.findOne({ room: roomId });

  if (!document) {
    return null;
  }

  const state = Y.encodeStateAsUpdate(ydoc);
  const content = ydoc.getText("code").toString();

  return DocumentHistory.create({
    room: roomId,
    document: document._id,
    yjsState: Buffer.from(state),
    content,
    language,
    savedBy: userId,
  });
};

const getHistory = async (roomId) => {
  return DocumentHistory.find({ room: roomId })
    .populate("savedBy", "name email")
    .sort({ createdAt: -1 });
};

const getHistoryById = async (historyId) => {
  return DocumentHistory.findById(historyId);
};

module.exports = {
  createHistorySnapshot,
  getHistory,
  getHistoryById,
};
