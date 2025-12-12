"use strict";
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
exports.cleanupInactiveSessions = cleanupInactiveSessions;
const drizzle_orm_1 = require("drizzle-orm");
const mysql2_1 = require("drizzle-orm/mysql2");
const schema_1 = require("../drizzle/schema");
const env_1 = require("./_core/env");
const nanoid_1 = require("nanoid");
let _db = null;
async function getDb() {
    if (!_db && process.env.DATABASE_URL) {
        try {
            _db = (0, mysql2_1.drizzle)(process.env.DATABASE_URL);
        }
        catch (error) {
            console.warn("[Database] Failed to connect:", error);
            _db = null;
        }
    }
    return _db;
}
async function upsertUser(user) {
    if (!user.openId) {
        throw new Error("User openId is required for upsert");
    }
    const db = await getDb();
    if (!db) {
        console.warn("[Database] Cannot upsert user: database not available");
        return;
    }
    try {
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
            values.role = 'admin';
            updateSet.role = 'admin';
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
    catch (error) {
        console.error("[Database] Failed to upsert user:", error);
        throw error;
    }
}
async function getUserByOpenId(openId) {
    const db = await getDb();
    if (!db) {
        console.warn("[Database] Cannot get user: database not available");
        return undefined;
    }
    const result = await db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
}
// Room management functions
async function createRoom(displayName, createdBy) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    const roomCode = (0, nanoid_1.nanoid)(12); // Generate non-traceable room code
    const values = {
        roomCode,
        displayName: displayName || null,
        createdBy: createdBy || null,
    };
    const result = await db.insert(schema_1.rooms).values(values);
    // Fetch the created room
    const [room] = await db.select().from(schema_1.rooms).where((0, drizzle_orm_1.eq)(schema_1.rooms.roomCode, roomCode)).limit(1);
    return room;
}
async function getRoomByCode(roomCode) {
    const db = await getDb();
    if (!db)
        return undefined;
    const [room] = await db.select().from(schema_1.rooms)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rooms.roomCode, roomCode), (0, drizzle_orm_1.eq)(schema_1.rooms.isActive, true)))
        .limit(1);
    return room;
}
async function updateRoomActivity(roomId) {
    const db = await getDb();
    if (!db)
        return;
    await db.update(schema_1.rooms)
        .set({ lastActivityAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.rooms.id, roomId));
}
async function deactivateRoom(roomId) {
    const db = await getDb();
    if (!db)
        return;
    await db.update(schema_1.rooms)
        .set({ isActive: false })
        .where((0, drizzle_orm_1.eq)(schema_1.rooms.id, roomId));
}
// Room session management
async function createRoomSession(roomId, userId) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    // Generate anonymous handle
    const anonymousHandle = `anon_${(0, nanoid_1.nanoid)(8)}`;
    const values = {
        roomId,
        userId,
        anonymousHandle,
    };
    await db.insert(schema_1.roomSessions).values(values);
    // Return the created session
    const [session] = await db.select().from(schema_1.roomSessions)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.roomSessions.roomId, roomId), (0, drizzle_orm_1.eq)(schema_1.roomSessions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.roomSessions.isActive, true)))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.roomSessions.joinedAt))
        .limit(1);
    return session;
}
async function getRoomSession(roomId, userId) {
    const db = await getDb();
    if (!db)
        return undefined;
    const [session] = await db.select().from(schema_1.roomSessions)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.roomSessions.roomId, roomId), (0, drizzle_orm_1.eq)(schema_1.roomSessions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.roomSessions.isActive, true)))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.roomSessions.joinedAt))
        .limit(1);
    return session;
}
async function getActiveRoomSessions(roomId) {
    const db = await getDb();
    if (!db)
        return [];
    const sessions = await db.select().from(schema_1.roomSessions)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.roomSessions.roomId, roomId), (0, drizzle_orm_1.eq)(schema_1.roomSessions.isActive, true)))
        .orderBy(schema_1.roomSessions.joinedAt);
    return sessions;
}
async function updateSessionActivity(sessionId) {
    const db = await getDb();
    if (!db)
        return;
    await db.update(schema_1.roomSessions)
        .set({ lastSeenAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_1.roomSessions.id, sessionId));
}
async function deactivateRoomSession(roomId, userId) {
    const db = await getDb();
    if (!db)
        return;
    await db.update(schema_1.roomSessions)
        .set({ isActive: false })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.roomSessions.roomId, roomId), (0, drizzle_orm_1.eq)(schema_1.roomSessions.userId, userId)));
}
async function cleanupInactiveSessions(inactiveMinutes = 30) {
    const db = await getDb();
    if (!db)
        return;
    const cutoffTime = new Date(Date.now() - inactiveMinutes * 60 * 1000);
    await db.update(schema_1.roomSessions)
        .set({ isActive: false })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.roomSessions.isActive, true), 
    // @ts-ignore - drizzle typing issue with date comparison
    (0, drizzle_orm_1.desc)(schema_1.roomSessions.lastSeenAt) < cutoffTime));
}
