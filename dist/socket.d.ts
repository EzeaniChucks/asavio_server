import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { onlineUsers } from "./state/presence";
export { onlineUsers };
export declare function initSocket(httpServer: HttpServer): SocketServer;
//# sourceMappingURL=socket.d.ts.map