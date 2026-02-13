import { io } from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

export const socket = io(socketUrl, {
  autoConnect: false,
    transports: ["websocket"],
});
