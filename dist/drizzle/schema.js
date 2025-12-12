"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomSessions = exports.rooms = exports.users = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
/**
 * Core user table backing auth flow.
 */
exports.users = (0, mysql_core_1.mysqlTable)("users", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    openId: (0, mysql_core_1.varchar)("openId", { length: 64 }).notNull().unique(),
    name: (0, mysql_core_1.text)("name"),
    email: (0, mysql_core_1.varchar)("email", { length: 320 }),
    loginMethod: (0, mysql_core_1.varchar)("loginMethod", { length: 64 }),
    role: (0, mysql_core_1.mysqlEnum)("role", ["user", "admin"]).default("user").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: (0, mysql_core_1.timestamp)("lastSignedIn").defaultNow().notNull(),
});
/**
 * Chat rooms with non-traceable identifiers
 * Rooms are temporary and can be cleaned up after inactivity
 */
exports.rooms = (0, mysql_core_1.mysqlTable)("rooms", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    /** Non-traceable room identifier (nanoid) */
    roomCode: (0, mysql_core_1.varchar)("roomCode", { length: 32 }).notNull().unique(),
    /** Optional room name for display */
    displayName: (0, mysql_core_1.varchar)("displayName", { length: 100 }),
    /** Creator user ID (nullable for privacy) */
    createdBy: (0, mysql_core_1.int)("createdBy"),
    /** Room creation timestamp */
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    /** Last activity timestamp for cleanup */
    lastActivityAt: (0, mysql_core_1.timestamp)("lastActivityAt").defaultNow().notNull(),
    /** Whether room is active */
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
});
/**
 * Active user sessions in rooms
 * Temporary data - cleaned up when user leaves or session expires
 */
exports.roomSessions = (0, mysql_core_1.mysqlTable)("roomSessions", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    /** Room ID */
    roomId: (0, mysql_core_1.int)("roomId").notNull(),
    /** User ID */
    userId: (0, mysql_core_1.int)("userId").notNull(),
    /** Anonymous handle for this session (e.g., "anon_1234") */
    anonymousHandle: (0, mysql_core_1.varchar)("anonymousHandle", { length: 50 }).notNull(),
    /** Session join timestamp */
    joinedAt: (0, mysql_core_1.timestamp)("joinedAt").defaultNow().notNull(),
    /** Last seen timestamp for cleanup */
    lastSeenAt: (0, mysql_core_1.timestamp)("lastSeenAt").defaultNow().notNull(),
    /** Whether session is active */
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
});
