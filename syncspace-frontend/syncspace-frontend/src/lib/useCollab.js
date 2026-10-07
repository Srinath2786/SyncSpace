import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as Y from "yjs";
import { createSocket } from "./socket";
import { bufferToUint8 } from "./utils";

/**
 * One hook owns the whole real-time session for a room:
 *  - Socket.IO connection (JWT in handshake)
 *  - one Y.Doc holding Y.Text "code" (Monaco) and Y.Map "shapes" (whiteboard)
 *  - presence, remote cursors and typing indicators
 */
export function useCollab(roomId, token, me) {
  const ydoc = useMemo(() => new Y.Doc(), [roomId]);
  const socketRef = useRef(null);
  const syncedOnce = useRef(false);

  const [status, setStatus] = useState("connecting"); // connecting | connected | reconnecting | error
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const [typing, setTyping] = useState({});
  const [remoteLanguage, setRemoteLanguage] = useState(null);

  useEffect(() => {
    if (!roomId || !token) return;
    syncedOnce.current = false;
    setSynced(false);
    setError(null);
    setStatus("connecting");

    const socket = createSocket(token);
    socketRef.current = socket;

    const onLocalUpdate = (update, origin) => {
      if (origin === "remote") return;
      if (socket.connected) socket.emit("yjs-update", { roomId, update });
    };
    ydoc.on("update", onLocalUpdate);

    socket.on("connect", () => {
      setStatus("connected");
      socket.emit("join-room", roomId);
    });
    socket.on("disconnect", () => {
      setStatus("reconnecting");
      setUsers([]);
      setCursors({});
      setTyping({});
    });
    socket.io.on("reconnect_attempt", () => setStatus("reconnecting"));
    socket.on("connect_error", (err) => {
      setStatus("error");
      setError(err.message);
    });

    socket.on("room-error", ({ message }) => {
      setError(message);
      setStatus("error");
    });
    socket.on("yjs-error", ({ message }) => setError(message));

    socket.on("yjs-sync", ({ update }) => {
      Y.applyUpdate(ydoc, bufferToUint8(update), "remote");
      if (syncedOnce.current) {
        // reconnected: push anything we typed while offline
        socket.emit("yjs-update", { roomId, update: Y.encodeStateAsUpdate(ydoc) });
      }
      syncedOnce.current = true;
      setSynced(true);
      setError(null);
    });

    socket.on("yjs-update", ({ update }) => {
      Y.applyUpdate(ydoc, bufferToUint8(update), "remote");
    });

    socket.on("online-users", (list) => {
      setUsers(list);
      setCursors((prev) => {
        const ids = new Set(list.map((u) => u.userId));
        const next = {};
        Object.keys(prev).forEach((k) => ids.has(k) && (next[k] = prev[k]));
        return next;
      });
    });

    socket.on("user-left", ({ userId }) => {
      setCursors((prev) => {
        const next = { ...prev };
        delete next[String(userId)];
        return next;
      });
    });

    socket.on("cursor-change", ({ userId, name, cursorPosition }) => {
      if (!cursorPosition) return;
      const id = String(userId);
      setCursors((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          name,
          [cursorPosition.kind]: { ...cursorPosition, ts: Date.now() },
        },
      }));
    });

    socket.on("typing", ({ userId, name, isTyping }) => {
      setTyping((prev) => {
        const next = { ...prev };
        if (isTyping) next[String(userId)] = name;
        else delete next[String(userId)];
        return next;
      });
    });

    socket.on("code-change", ({ language }) => {
      if (language) setRemoteLanguage({ language, ts: Date.now() });
    });

    return () => {
      ydoc.off("update", onLocalUpdate);
      socket.emit("leave-room", roomId);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, token, ydoc]);

  const sendCursor = useCallback(
    (cursorPosition) => {
      const s = socketRef.current;
      if (s?.connected) s.emit("cursor-change", { roomId, cursorPosition });
    },
    [roomId]
  );

  const sendTyping = useCallback(
    (isTyping) => {
      const s = socketRef.current;
      if (s?.connected) s.emit("typing", { roomId, isTyping });
    },
    [roomId]
  );

  const sendLanguage = useCallback(
    (language) => {
      const s = socketRef.current;
      if (s?.connected) s.emit("code-change", { roomId, language });
    },
    [roomId]
  );

  // drop stale cursors (no move for 15s)
  useEffect(() => {
    const t = setInterval(() => {
      setCursors((prev) => {
        const now = Date.now();
        let changed = false;
        const next = {};
        for (const [id, c] of Object.entries(prev)) {
          const canvas = c.canvas && now - c.canvas.ts < 15000 ? c.canvas : undefined;
          const editor = c.editor && now - c.editor.ts < 60000 ? c.editor : undefined;
          if (canvas !== c.canvas || editor !== c.editor) changed = true;
          next[id] = { ...c, canvas, editor };
        }
        return changed ? next : prev;
      });
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const remoteUsers = users.filter((u) => u.userId !== String(me?.id));

  return {
    ydoc,
    status,
    synced,
    error,
    users,
    remoteUsers,
    cursors,
    typing,
    remoteLanguage,
    sendCursor,
    sendTyping,
    sendLanguage,
  };
}
