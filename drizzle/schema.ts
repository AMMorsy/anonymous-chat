import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Chat rooms with non-traceable identifiers
 * Rooms are temporary and can be cleaned up after inactivity
 */
export const rooms = mysqlTable("rooms", {
  id: int("id").autoincrement().primaryKey(),
  /** Non-traceable room identifier (nanoid) */
  roomCode: varchar("roomCode", { length: 32 }).notNull().unique(),
  /** Optional room name for display */
  displayName: varchar("displayName", { length: 100 }),
  /** Creator user ID (nullable for privacy) */
  createdBy: int("createdBy"),
  /** Room creation timestamp */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** Last activity timestamp for cleanup */
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  /** Whether room is active */
  isActive: boolean("isActive").default(true).notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;

/**
 * Active user sessions in rooms
 * Temporary data - cleaned up when user leaves or session expires
 */
export const roomSessions = mysqlTable("roomSessions", {
  id: int("id").autoincrement().primaryKey(),
  /** Room ID */
  roomId: int("roomId").notNull(),
  /** User ID */
  userId: int("userId").notNull(),
  /** Anonymous handle for this session (e.g., "anon_1234") */
  anonymousHandle: varchar("anonymousHandle", { length: 50 }).notNull(),
  /** Session join timestamp */
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  /** Last seen timestamp for cleanup */
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  /** Whether session is active */
  isActive: boolean("isActive").default(true).notNull(),
});

export type RoomSession = typeof roomSessions.$inferSelect;
export type InsertRoomSession = typeof roomSessions.$inferInsert;
