const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Room = require("../models/Room");
const Workspace = require("../models/Workspace");
const { saveActivity } = require("../services/collaborationService");

const {
  getYDoc,
  setYDoc,
  encodeStateAsUpdate,
  applyUpdate,
} = require("../services/yjsService");
const {
  loadYjsDocument,
  saveYjsDocument,
} = require("../services/documentPersistenceService");
const {
  createHistorySnapshot,
} = require("../services/documentHistoryService");

const roomUsers = new Map();

const getUsersForRoom = (roomId) => {
  const users = roomUsers.get(roomId) || new Map();
  roomUsers.set(roomId, users);
  return users;
};

const emitRoomPresence = (io, roomId) => {
  const users = Array.from(getUsersForRoom(roomId).values());

  io.to(roomId).emit("online-users", users);
  io.to(roomId).emit("presence-update", {
    roomId,
    users,
  });
};

const removeUserFromRoom = (io, socket, roomId) => {
  const roomState = getUsersForRoom(roomId);

  if (roomState.has(socket.user._id.toString())) {
    roomState.delete(socket.user._id.toString());

    socket.to(roomId).emit("user-left", {
      userId: socket.user._id,
      name: socket.user.name,
      roomId,
    });

    emitRoomPresence(io, roomId);

    if (roomState.size === 0) {
      roomUsers.delete(roomId);
    }
  }
};

const isUserRoomMember = (room, userId) => {
  return room.members.some(
    (memberId) => memberId.toString() === userId.toString()
  );
};

const initializeSocket = (io) => {
  // --------------------------------------------------
  // SOCKET JWT AUTHENTICATION
  // --------------------------------------------------
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "syncspace_super_secret_change_this"
      );

      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;

      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  // --------------------------------------------------
  // CONNECTION
  // --------------------------------------------------
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.name}`);

    // --------------------------------------------------
    // JOIN ROOM
    // --------------------------------------------------
    socket.on("join-room", async (roomId) => {
      try {
        if (!roomId) {
          socket.emit("room-error", {
            message: "Room ID is required",
          });
          return;
        }

        const room = await Room.findById(roomId);

        if (!room) {
          socket.emit("room-error", {
            message: "Room not found",
          });
          return;
        }

        const workspace = await Workspace.findById(room.workspace);

        if (!workspace) {
          socket.emit("room-error", {
            message: "Workspace not found",
          });
          return;
        }

        const userId = socket.user._id.toString();

        // Workspace membership check
        const isWorkspaceMember = workspace.members.some(
          (memberId) => memberId.toString() === userId
        );

        if (!isWorkspaceMember) {
          socket.emit("room-error", {
            message: "You are not a member of this workspace",
          });
          return;
        }

        // Room membership check
        const isRoomMember = isUserRoomMember(room, userId);

        if (!isRoomMember) {
          socket.emit("room-error", {
            message: "You are not a member of this room",
          });
          return;
        }

        // Join Socket.IO room
        socket.join(roomId);

        // Remember current room for this socket
        socket.currentRoomId = roomId;

        const { ydoc } = await loadYjsDocument(roomId);
        setYDoc(roomId, ydoc);

        const state = encodeStateAsUpdate(roomId);

        socket.emit("yjs-sync", {
          roomId,
          update: Buffer.from(state),
        });

        // Track online user
        const roomState = getUsersForRoom(roomId);

        roomState.set(userId, {
          userId,
          name: socket.user.name,
          avatar: socket.user.avatar,
          roomId,
        });

        // Save activity
        await saveActivity({
          user: socket.user._id,
          workspace: room.workspace,
          room: roomId,
          action: "joined-room",
          details: `${socket.user.name} joined the room`,
        });

        const users = Array.from(roomState.values());

        io.to(roomId).emit("user-joined", {
          userId: socket.user._id,
          name: socket.user.name,
          roomId,
          users,
        });

        io.to(roomId).emit("online-users", users);

        socket.emit("online-users", users);

        socket.emit("presence-update", {
          roomId,
          users,
        });
      } catch (error) {
        console.error("Join room error:", error);

        socket.emit("room-error", {
          message: "Unable to join room",
        });
      }
    });

    // --------------------------------------------------
    // LEAVE ROOM
    // --------------------------------------------------
    socket.on("leave-room", async (roomId) => {
      try {
        if (!roomId) return;

        if (socket.currentRoomId !== roomId) {
          return;
        }

        socket.leave(roomId);

        removeUserFromRoom(io, socket, roomId);

        socket.currentRoomId = null;

        await saveActivity({
          user: socket.user._id,
          room: roomId,
          action: "left-room",
          details: `${socket.user.name} left the room`,
        });
      } catch (error) {
        console.error("Leave room error:", error);
      }
    });

    // --------------------------------------------------
    // YJS UPDATE
    // --------------------------------------------------
    socket.on("yjs-update", async ({ roomId, update }) => {
      try {
        if (!roomId || !update) {
          return;
        }

        if (socket.currentRoomId !== roomId) {
          return;
        }

        const room = io.sockets.adapter.rooms.get(roomId);

        if (!room || !room.has(socket.id)) {
          return;
        }

        const updateArray =
          update instanceof Uint8Array
            ? update
            : new Uint8Array(update);

        applyUpdate(roomId, updateArray);

        await saveYjsDocument({
          roomId,
          userId: socket.user._id,
          ydoc: getYDoc(roomId),
        });

        await createHistorySnapshot({
          roomId,
          userId: socket.user._id,
          ydoc: getYDoc(roomId),
        });

        socket.to(roomId).emit("yjs-update", {
          roomId,
          update: Buffer.from(updateArray),
          userId: socket.user._id.toString(),
          name: socket.user.name,
        });
      } catch (error) {
        console.error("Yjs update error:", error);

        socket.emit("yjs-error", {
          message: "Unable to synchronize Yjs update",
        });
      }
    });

    // --------------------------------------------------
    // CODE CHANGE
    // Temporary compatibility event
    // --------------------------------------------------
    socket.on("code-change", ({ roomId, content, language }) => {
      if (!roomId) return;

      if (socket.currentRoomId !== roomId) {
        return;
      }

      socket.to(roomId).emit("code-change", {
        userId: socket.user._id,
        name: socket.user.name,
        content,
        language,
      });
    });

    // --------------------------------------------------
    // CURSOR CHANGE
    // --------------------------------------------------
    socket.on("cursor-change", ({ roomId, cursorPosition }) => {
      if (!roomId) return;

      if (socket.currentRoomId !== roomId) {
        return;
      }

      socket.to(roomId).emit("cursor-change", {
        userId: socket.user._id,
        name: socket.user.name,
        cursorPosition,
      });
    });

    // --------------------------------------------------
    // TYPING
    // --------------------------------------------------
    socket.on("typing", ({ roomId, isTyping }) => {
      if (!roomId) return;

      if (socket.currentRoomId !== roomId) {
        return;
      }

      socket.to(roomId).emit("typing", {
        userId: socket.user._id,
        name: socket.user.name,
        isTyping,
      });
    });

    // --------------------------------------------------
    // DISCONNECT
    // --------------------------------------------------
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.name}`);

      const roomId = socket.currentRoomId;

      if (roomId) {
        removeUserFromRoom(io, socket, roomId);
      }

      socket.currentRoomId = null;
    });
  });
};

module.exports = initializeSocket;