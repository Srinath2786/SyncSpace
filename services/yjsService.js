const Y = require("yjs");

const roomDocuments = new Map();

const getYDoc = (roomId) => {
  if (!roomDocuments.has(roomId)) {
    const doc = new Y.Doc();
    doc.getText("code");
    roomDocuments.set(roomId, doc);
  }

  return roomDocuments.get(roomId);
};

const setYDoc = (roomId, doc) => {
  const existingDoc = roomDocuments.get(roomId);

  if (existingDoc && existingDoc !== doc) {
    existingDoc.destroy();
  }

  roomDocuments.set(roomId, doc);
  return doc;
};

const destroyYDoc = (roomId) => {
  const doc = roomDocuments.get(roomId);

  if (!doc) {
    return false;
  }

  doc.destroy();
  roomDocuments.delete(roomId);

  return true;
};

const encodeStateAsUpdate = (roomId) => {
  return Y.encodeStateAsUpdate(getYDoc(roomId));
};

const applyUpdate = (roomId, update) => {
  const doc = getYDoc(roomId);
  const updateArray =
    update instanceof Uint8Array ? update : new Uint8Array(update);

  Y.applyUpdate(doc, updateArray);

  return doc;
};

const getCode = (roomId) => {
  return getYDoc(roomId).getText("code").toString();
};

const setCode = (roomId, content) => {
  const doc = getYDoc(roomId);
  const text = doc.getText("code");

  if (text.length > 0) {
    text.delete(0, text.length);
  }

  if (content) {
    text.insert(0, String(content));
  }

  return doc;
};

const getActiveDocumentCount = () => {
  return roomDocuments.size;
};

module.exports = {
  getYDoc,
  setYDoc,
  destroyYDoc,
  encodeStateAsUpdate,
  applyUpdate,
  getCode,
  setCode,
  getActiveDocumentCount,
};