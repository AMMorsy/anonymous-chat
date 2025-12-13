"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.upsertUser = upsertUser;
exports.getUserByOpenId = getUserByOpenId;
exports.createRoom = createRoom;
exports.getRoomByCode = getRoomByCode;
exports.updateRoomActivity = updateRoomActivity;
exports.deactivateRoom = deactivateRoom;
exports.createRoomSession = createRoomSession;
exports.getRoomSession = getRoomSession;
exports.getActiveRoomSessions = getActiveRoomSessions;
exports.updateSessionActivity = updateSessionActivity;
exports.deactivateRoomSession = deactivateRoomSession;
const drizzle_orm_1 = require("drizzle-orm");
const mysql2_1 = require("drizzle-orm/mysql2");
const promise_1 = __importDefault(require("mysql2/promise"));
const schema_1 = require("../drizzle/schema");
const env_1 = require("./_core/env");
const nanoid_1 = require("nanoid");
let _db = null;
let _pool = null;
function getPool() {
    if (_pool)
        return _pool;
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set");
    }
    _pool = promise_1.default.createPool(process.env.DATABASE_URL);
    return _pool;
}
function getDb() {
    if (_db)
        return _db;
    const pool = getPool();
    _db = (0, mysql2_1.drizzle)(pool);
    return _db;
}
// ================= USERS =================
async function upsertUser(user) {
    if (!user.openId) {
        throw new Error("User openId is required for upsert");
    }
    const db = getDb();
    const values = {
        openId: user.openId,
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
        const value = user[field];
        if (value === undefined)
            return;
        const normalized = value ?? null;
        values[field] = normalized;
        updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
        values.lastSignedIn = user.lastSignedIn;
        updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
        values.role = user.role;
        updateSet.role = user.role;
    }
    else if (user.openId === env_1.ENV.ownerOpenId) {
        values.role = "admin";
        updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
        values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
        updateSet.lastSignedIn = new Date();
    }
    await db.insert(schema_1.users).values(values).onDuplicateKeyUpdate({
        set: updateSet,
    });
}
async function getUserByOpenId(openId) {
    const db = getDb();
    const result = await db
        .select()
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.openId, openId))
        .limit(1);
    return result[0];
}
// ================= ROOMS =================
async function createRoom(displayName, createdBy) {
    const db = getDb();
    const roomCode = (0, nanoid_1.nanoid)(12);
    const values = {
        roomCode,
        displayName: displayName ?? null,
        createdBy: createdBy ?? null,
    };
    await db.insert(schema_1.rooms).values(values);
    const [room] = await db
        .select()
        .from(schema_1.rooms)
        .where((0, drizzle_orm_1.eq)(schema_1.rooms.roomCode, roomCode))
        .limit(1);
    return room;
}
async function getRoomByCode(roomCode) {
    const db = getDb();
    const [room] = await db
        .select()
        .from(schema_1.rooms)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rooms.roomCode, roomCode), (0, drizzle_orm_1.eq)(schema_1.rooms.isActive, true)))
        .limit(1);
    return room;
}
async function updateRoomActivity(roomId) {
    const db = getDb();
    await db
        .update(schema_1.rooms)
        .set({ lastActivityAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.rooms.id, roomId));
}
async function deactivateRoom(roomId) {
    const db = getDb();
    await db
        .update(schema_1.rooms)
        .set({ isActive: false })
        .where((0, drizzle_orm_1.eq)(schema_1.rooms.id, roomId));
}
// ================= SESSIONS =================
async function createRoomSession(roomId, userId) {
    const db = getDb();
    const anonymousHandle = `anon_${(0, nanoid_1.nanoid)(8)}`;
    const values = {
        roomId,
        userId,
        anonymousHandle,
    };
    await db.insert(schema_1.roomSessions).values(values);
    const [session] = await db
        .select()
        .from(schema_1.roomSessions)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.roomSessions.roomId, roomId), (0, drizzle_orm_1.eq)(schema_1.roomSessions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.roomSessions.isActive, true)))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.roomSessions.joinedAt))
        .limit(1);
    return session;
}
async function getRoomSession(roomId, userId) {
    const db = getDb();
    const [session] = await db
        .select()
        .from(schema_1.roomSessions)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.roomSessions.roomId, roomId), (0, drizzle_orm_1.eq)(schema_1.roomSessions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.roomSessions.isActive, true)))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.roomSessions.joinedAt))
        .limit(1);
    return session;
}
async function getActiveRoomSessions(roomId) {
    const db = getDb();
    return await db
        .select()
        .from(schema_1.roomSessions)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.roomSessions.roomId, roomId), (0, drizzle_orm_1.eq)(schema_1.roomSessions.isActive, true)))
        .orderBy(schema_1.roomSessions.joinedAt);
}
async function updateSessionActivity(sessionId) {
    const db = getDb();
    await db
        .update(schema_1.roomSessions)
        .set({ lastSeenAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.roomSessions.id, sessionId));
}
async function deactivateRoomSession(roomId, userId) {
    const db = getDb();
    await db
        .update(schema_1.roomSessions)
        .set({ isActive: false })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.roomSessions.roomId, roomId), (0, drizzle_orm_1.eq)(schema_1.roomSessions.userId, userId)));
}
