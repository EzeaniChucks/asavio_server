// src/state/ioInstance.ts
import type { Server as SocketServer } from "socket.io";

let _io: SocketServer | null = null;

export const setIo = (io: SocketServer) => { _io = io; };
export const getIo = () => _io;
