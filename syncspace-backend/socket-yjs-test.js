const { io } = require("socket.io-client");
const Y = require("yjs");

const SERVER_URL = "http://localhost:5000";

// Put your valid JWT here locally.
// DO NOT send the JWT to me.
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWI0ZmY0NjM4MGU5ZWU1ZjA0NmZjOTYiLCJpYXQiOjE3OTA0MDUwMTgsImV4cCI6MTc5MTAwOTgxOH0.h-8Cz1QzrbJRgbWBkFknE4BjkXJ_LEbvAbQCMZ7IHBU";

const ROOM_ID = "6ab5034f2cf84d0c7bd48b56";

// Create Socket.IO connection
const socket = io(SERVER_URL, {
  auth: {
    token: TOKEN,
  },
});

// Create Yjs document
const doc = new Y.Doc();

// Shared code text
const code = doc.getText("code");

// Send local Yjs changes to server
doc.on("update", (update, origin) => {
  if (origin === "remote") {
    return;
  }

  if (!socket.connected) {
    return;
  }

  console.log("Sending local Yjs update...");

  socket.emit("yjs-update", {
    roomId: ROOM_ID,
    update: Buffer.from(update),
  });
});

// Socket connected
socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
  console.log("Joining room:", ROOM_ID);

  socket.emit("join-room", ROOM_ID);
});

// Room error
socket.on("room-error", (data) => {
  console.error("Room error:", data);
});

// Initial Yjs synchronization
socket.on("yjs-sync", ({ roomId, update }) => {
  console.log("Received Yjs sync for room:", roomId);

  const updateArray = new Uint8Array(update);

  Y.applyUpdate(doc, updateArray, "remote");

  console.log("Current code:", code.toString());

  if (code.length === 0) {
    doc.transact(() => {
      code.insert(0, "Hello from Client 1!");
    });

    console.log("Test content inserted.");
  }
});

// Yjs update from another client
socket.on("yjs-update", ({ roomId, update, name }) => {
  console.log(`Received Yjs update from ${name}`);

  const updateArray = new Uint8Array(update);

  Y.applyUpdate(doc, updateArray, "remote");

  console.log("Updated code:", code.toString());
});

// Online users
socket.on("online-users", (users) => {
  console.log("Online users:");

  users.forEach((user) => {
    console.log(`- ${user.name} (${user.userId})`);
  });
});

// Presence
socket.on("presence-update", ({ roomId, users }) => {
  console.log(`Presence update for room ${roomId}`);

  console.log(
    "Users:",
    users.map((user) => user.name).join(", ")
  );
});

// User joined
socket.on("user-joined", (data) => {
  console.log(`${data.name} joined the room.`);
});

// User left
socket.on("user-left", (data) => {
  console.log(`${data.name} left the room.`);
});

// Yjs error
socket.on("yjs-error", (data) => {
  console.error("Yjs error:", data.message);
});

// Socket connection error
socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error.message);
});

// Socket disconnected
socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

// Local Yjs document change
code.observe(() => {
  console.log("Yjs document changed:", code.toString());
});