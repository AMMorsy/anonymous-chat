import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { 
  getRoomByCode, 
  createRoomSession, 
  getRoomSession, 
  getActiveRoomSessions,
  updateRoomActivity,
  updateSessionActivity,
  deactivateRoomSession
} from "./db";

export interface ChatMessage {
  id: string;
  roomCode: string;
  handle: string;
  message: string;
  timestamp: number;
}

export interface UserJoinedEvent {
  handle: string;
  timestamp: number;
}

export interface UserLeftEvent {
  handle: string;
  timestamp: number;
}

export function setupSocketIO(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/socket.io/",
  });

  // Store active connections: socketId -> { userId, roomCode, handle }
  const activeConnections = new Map<string, { userId: number; roomCode: string; handle: string }>();

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join room
    socket.on("join-room", async (data: { roomCode: string; userId: number }) => {
      try {
        const { roomCode, userId } = data;

        // Verify room exists
        const room = await getRoomByCode(roomCode);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Get or create session
        let session = await getRoomSession(room.id, userId);
        if (!session) {
          session = await createRoomSession(room.id, userId);
        }

        if (!session) {
          socket.emit("error", { message: "Failed to create session" });
          return;
        }

        // Join socket room
        socket.join(roomCode);
        activeConnections.set(socket.id, {
          userId,
          roomCode,
          handle: session.anonymousHandle,
        });

        // Update activity
        await updateRoomActivity(room.id);
        await updateSessionActivity(session.id);

        // Get all active users in room
        const activeSessions = await getActiveRoomSessions(room.id);
        const activeUsers = activeSessions.map(s => s.anonymousHandle);

        // Notify user of successful join
        socket.emit("joined-room", {
          roomCode,
          handle: session.anonymousHandle,
          activeUsers,
        });

        // Notify others in room
        socket.to(roomCode).emit("user-joined", {
          handle: session.anonymousHandle,
          timestamp: Date.now(),
        } as UserJoinedEvent);

        console.log(`[Socket] User ${session.anonymousHandle} joined room ${roomCode}`);
      } catch (error) {
        console.error("[Socket] Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Send message
    socket.on("send-message", async (data: { message: string }) => {
      try {
        const connection = activeConnections.get(socket.id);
        if (!connection) {
          socket.emit("error", { message: "Not in a room" });
          return;
        }

        const { roomCode, handle } = connection;

        // Create message object
        const chatMessage: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          roomCode,
          handle,
          message: data.message,
          timestamp: Date.now(),
        };

        // Broadcast to room (including sender)
        io.to(roomCode).emit("new-message", chatMessage);

        // Update room activity
        const room = await getRoomByCode(roomCode);
        if (room) {
          await updateRoomActivity(room.id);
        }

        console.log(`[Socket] Message from ${handle} in ${roomCode}: ${data.message}`);
      } catch (error) {
        console.error("[Socket] Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Leave room
    socket.on("leave-room", async () => {
      try {
        const connection = activeConnections.get(socket.id);
        if (!connection) {
          return;
        }

        const { userId, roomCode, handle } = connection;

        // Get room
        const room = await getRoomByCode(roomCode);
        if (room) {
          await deactivateRoomSession(room.id, userId);
        }

        // Leave socket room
        socket.leave(roomCode);
        activeConnections.delete(socket.id);

        // Notify others
        socket.to(roomCode).emit("user-left", {
          handle,
          timestamp: Date.now(),
        } as UserLeftEvent);

        socket.emit("left-room", { roomCode });

        console.log(`[Socket] User ${handle} left room ${roomCode}`);
      } catch (error) {
        console.error("[Socket] Error leaving room:", error);
      }
    });

    // Heartbeat to update activity
    socket.on("heartbeat", async () => {
      try {
        const connection = activeConnections.get(socket.id);
        if (!connection) return;

        const { userId, roomCode } = connection;
        const room = await getRoomByCode(roomCode);
        if (room) {
          const session = await getRoomSession(room.id, userId);
          if (session) {
            await updateSessionActivity(session.id);
          }
        }
      } catch (error) {
        console.error("[Socket] Error updating heartbeat:", error);
      }
    });

    // Disconnect
    socket.on("disconnect", async () => {
      try {
        const connection = activeConnections.get(socket.id);
        if (connection) {
          const { userId, roomCode, handle } = connection;

          const room = await getRoomByCode(roomCode);
          if (room) {
            await deactivateRoomSession(room.id, userId);
          }

          socket.to(roomCode).emit("user-left", {
            handle,
            timestamp: Date.now(),
          } as UserLeftEvent);

          activeConnections.delete(socket.id);
          console.log(`[Socket] User ${handle} disconnected from ${roomCode}`);
        }

        console.log(`[Socket] Client disconnected: ${socket.id}`);
      } catch (error) {
        console.error("[Socket] Error handling disconnect:", error);
      }
    });
  });

  console.log("[Socket] Socket.IO server initialized");
  return io;
}
