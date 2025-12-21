"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketIO = setupSocketIO;
const socket_io_1 = require("socket.io");
const crypto_1 = __importDefault(require("crypto"));
function setupSocketIO(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: { origin: "*" },
        path: "/socket.io/",
    });
    const rooms = new Map();
    const socketRoom = new Map(); // socket.id -> roomId
    function sys(socket, msg) {
        socket.emit("system", msg);
    }
    io.on("connection", (socket) => {
        sys(socket, "[SYSTEM] Socket connected");
        sys(socket, "[SYSTEM] Type /help");
        sys(socket, "[SYSTEM] /create <room_name>");
        sys(socket, "[SYSTEM] /join <room_id>");
        sys(socket, "[SYSTEM] /leave");
        socket.on("command", (raw) => {
            const [cmd, ...rest] = raw.trim().split(" ");
            const arg = rest.join(" ").trim();
            // ---------------- HELP ----------------
            if (cmd === "/help") {
                sys(socket, "[SYSTEM] /create <room_name>");
                sys(socket, "[SYSTEM] /join <room_id>");
                sys(socket, "[SYSTEM] /leave");
                sys(socket, "[SYSTEM] Anything else = message");
                return;
            }
            // ---------------- CREATE ----------------
            if (cmd === "/create") {
                if (!arg) {
                    sys(socket, "[SYSTEM] ERROR: /create <room_name>");
                    return;
                }
                const roomId = crypto_1.default.randomBytes(3).toString("hex");
                const room = {
                    id: roomId,
                    name: arg,
                    members: new Set(),
                };
                rooms.set(roomId, room);
                socket.join(roomId);
                room.members.add(socket.id);
                socketRoom.set(socket.id, roomId);
                sys(socket, `[SYSTEM] Room created`);
                sys(socket, `[SYSTEM] Room name: ${arg}`);
                sys(socket, `[SYSTEM] Room ID: ${roomId}`);
                sys(socket, `[SYSTEM] Joined room ${roomId}`);
                return;
            }
            // ---------------- JOIN ----------------
            if (cmd === "/join") {
                if (!arg) {
                    sys(socket, "[SYSTEM] ERROR: /join <room_id>");
                    return;
                }
                const room = rooms.get(arg);
                if (!room) {
                    sys(socket, "[SYSTEM] ERROR: Room not found");
                    return;
                }
                socket.join(room.id);
                room.members.add(socket.id);
                socketRoom.set(socket.id, room.id);
                sys(socket, `[SYSTEM] Joined room ${room.id} (${room.name})`);
                socket.to(room.id).emit("message", `[SYSTEM] User joined`);
                return;
            }
            // ---------------- LEAVE ----------------
            if (cmd === "/leave") {
                const roomId = socketRoom.get(socket.id);
                if (!roomId) {
                    sys(socket, "[SYSTEM] ERROR: Not in a room");
                    return;
                }
                socket.leave(roomId);
                socketRoom.delete(socket.id);
                rooms.get(roomId)?.members.delete(socket.id);
                sys(socket, `[SYSTEM] Left room ${roomId}`);
                socket.to(roomId).emit("message", `[SYSTEM] User left`);
                return;
            }
            sys(socket, "[SYSTEM] ERROR: Unknown command");
        });
        socket.on("message", (msg) => {
            const roomId = socketRoom.get(socket.id);
            if (!roomId) {
                sys(socket, "[SYSTEM] ERROR: Join a room first");
                return;
            }
            io.to(roomId).emit("message", msg);
        });
        socket.on("disconnect", () => {
            const roomId = socketRoom.get(socket.id);
            if (roomId) {
                rooms.get(roomId)?.members.delete(socket.id);
                socketRoom.delete(socket.id);
                socket.to(roomId).emit("message", "[SYSTEM] User disconnected");
            }
        });
    });
    console.log("[Socket] Ready");
}
