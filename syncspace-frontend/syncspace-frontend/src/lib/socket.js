import { io } from "socket.io-client";
import { API_URL } from "../api/client";

export const createSocket = (token) =>
  io(API_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionDelayMax: 4000,
  });
