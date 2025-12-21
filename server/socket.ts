import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import crypto from "crypto";

type Room = {
  id: string;
  name: string;
  members: Set<string>;
};

export function setupSocketIO(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
    path: "/socket.io/",
  });

  const rooms = new Map<string, Room>();
  const socketRoom = new Map<string, string>(); // socket.id -> roomId

  function sys(socket: any, msg: string) {
    socket.emit("system", msg);
  }

  io.on("connection", (socket) => {
    sys(socket, "[SYSTEM] Socket connected");
    sys(socket, "[SYSTEM] Type /help");
    sys(socket, "[SYSTEM] /create <room_name>");
    sys(socket, "[SYSTEM] /join <room_id>");
    sys(socket, "[SYSTEM] /leave");

    socket.on("command", (raw: string) => {
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

        const roomId = crypto.randomBytes(3).toString("hex");
        const room: Room = {
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

    socket.on("message", (msg: string) => {
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
