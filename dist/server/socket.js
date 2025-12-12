"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketIO = setupSocketIO;
const socket_io_1 = require("socket.io");
const db_1 = require("./db");
function setupSocketIO(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
        path: "/socket.io/",
    });
    // Store active connections: socketId -> { userId, roomCode, handle }
    const activeConnections = new Map();
    io.on("connection", (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);
        // Join room
        socket.on("join-room", async (data) => {
            try {
                const { roomCode, userId } = data;
                // Verify room exists
                const room = await (0, db_1.getRoomByCode)(roomCode);
                if (!room) {
                    socket.emit("error", { message: "Room not found" });
                    return;
                }
                // Get or create session
                let session = await (0, db_1.getRoomSession)(room.id, userId);
                if (!session) {
                    session = await (0, db_1.createRoomSession)(room.id, userId);
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
                await (0, db_1.updateRoomActivity)(room.id);
                await (0, db_1.updateSessionActivity)(session.id);
                // Get all active users in room
                const activeSessions = await (0, db_1.getActiveRoomSessions)(room.id);
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
                });
                console.log(`[Socket] User ${session.anonymousHandle} joined room ${roomCode}`);
            }
            catch (error) {
                console.error("[Socket] Error joining room:", error);
                socket.emit("error", { message: "Failed to join room" });
            }
        });
        // Send message
        socket.on("send-message", async (data) => {
            try {
                const connection = activeConnections.get(socket.id);
                if (!connection) {
                    socket.emit("error", { message: "Not in a room" });
                    return;
                }
                const { roomCode, handle } = connection;
                // Create message object
                const chatMessage = {
                    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    roomCode,
                    handle,
                    message: data.message,
                    timestamp: Date.now(),
                };
                // Broadcast to room (including sender)
                io.to(roomCode).emit("new-message", chatMessage);
                // Update room activity
                const room = await (0, db_1.getRoomByCode)(roomCode);
                if (room) {
                    await (0, db_1.updateRoomActivity)(room.id);
                }
                console.log(`[Socket] Message from ${handle} in ${roomCode}: ${data.message}`);
            }
            catch (error) {
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
                const room = await (0, db_1.getRoomByCode)(roomCode);
                if (room) {
                    await (0, db_1.deactivateRoomSession)(room.id, userId);
                }
                // Leave socket room
                socket.leave(roomCode);
                activeConnections.delete(socket.id);
                // Notify others
                socket.to(roomCode).emit("user-left", {
                    handle,
                    timestamp: Date.now(),
                });
                socket.emit("left-room", { roomCode });
                console.log(`[Socket] User ${handle} left room ${roomCode}`);
            }
            catch (error) {
                console.error("[Socket] Error leaving room:", error);
            }
        });
        // Heartbeat to update activity
        socket.on("heartbeat", async () => {
            try {
                const connection = activeConnections.get(socket.id);
                if (!connection)
                    return;
                const { userId, roomCode } = connection;
                const room = await (0, db_1.getRoomByCode)(roomCode);
                if (room) {
                    const session = await (0, db_1.getRoomSession)(room.id, userId);
                    if (session) {
                        await (0, db_1.updateSessionActivity)(session.id);
                    }
                }
            }
            catch (error) {
                console.error("[Socket] Error updating heartbeat:", error);
            }
        });
        // Disconnect
        socket.on("disconnect", async () => {
            try {
                const connection = activeConnections.get(socket.id);
                if (connection) {
                    const { userId, roomCode, handle } = connection;
                    const room = await (0, db_1.getRoomByCode)(roomCode);
                    if (room) {
                        await (0, db_1.deactivateRoomSession)(room.id, userId);
                    }
                    socket.to(roomCode).emit("user-left", {
                        handle,
                        timestamp: Date.now(),
                    });
                    activeConnections.delete(socket.id);
                    console.log(`[Socket] User ${handle} disconnected from ${roomCode}`);
                }
                console.log(`[Socket] Client disconnected: ${socket.id}`);
            }
            catch (error) {
                console.error("[Socket] Error handling disconnect:", error);
            }
        });
    });
    console.log("[Socket] Socket.IO server initialized");
    return io;
}
