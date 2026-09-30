const Y = require("yjs");
const Document = require("../models/Document");

const loadYjsDocument = async (roomId) => {
  const ydoc = new Y.Doc();

  const document = await Document.findOne({ room: roomId });

  if (document?.yjsState?.length) {
    Y.applyUpdate(ydoc, new Uint8Array(document.yjsState));
  }

  return {
    ydoc,
    document,
  };
};

const saveYjsDocument = async ({
  roomId,
  userId,
  ydoc,
  language = "javascript",
}) => {
  if (!roomId || !userId || !ydoc) {
    return null;
  }

  const state = Y.encodeStateAsUpdate(ydoc);
  const content = ydoc.getText("code").toString();

  const document = await Document.findOneAndUpdate(
    { room: roomId },
    {
      $set: {
        content,
        yjsState: Buffer.from(state),
        language,
        updatedBy: userId,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return document;
};

module.exports = {
  loadYjsDocument,
  saveYjsDocument,
};
