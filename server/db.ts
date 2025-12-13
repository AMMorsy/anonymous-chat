import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  InsertUser,
  users,
  rooms,
  roomSessions,
  InsertRoom,
  InsertRoomSession,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { nanoid } from "nanoid";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

function getPool() {
  if (_pool) return _pool;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  _pool = mysql.createPool(process.env.DATABASE_URL);
  return _pool;
}

export function getDb() {
  if (_db) return _db;

  const pool = getPool();
  _db = drizzle(pool);
  return _db;
}

// ================= USERS =================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = getDb();

  const values: InsertUser = {
    openId: user.openId,
  };

  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
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
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) {
    values.lastSignedIn = new Date();
  }

  if (Object.keys(updateSet).length === 0) {
    updateSet.lastSignedIn = new Date();
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({
    set: updateSet,
  });
}

export async function getUserByOpenId(openId: string) {
  const db = getDb();

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result[0];
}

// ================= ROOMS =================

export async function createRoom(displayName?: string, createdBy?: number) {
  const db = getDb();

  const roomCode = nanoid(12);

  const values: InsertRoom = {
    roomCode,
    displayName: displayName ?? null,
    createdBy: createdBy ?? null,
  };

  await db.insert(rooms).values(values);

  const [room] = await db
    .select()
    .from(rooms)
    .where(eq(rooms.roomCode, roomCode))
    .limit(1);

  return room;
}

export async function getRoomByCode(roomCode: string) {
  const db = getDb();

  const [room] = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.roomCode, roomCode), eq(rooms.isActive, true)))
    .limit(1);

  return room;
}

export async function updateRoomActivity(roomId: number) {
  const db = getDb();

  await db
    .update(rooms)
    .set({ lastActivityAt: new Date() })
    .where(eq(rooms.id, roomId));
}

export async function deactivateRoom(roomId: number) {
  const db = getDb();

  await db
    .update(rooms)
    .set({ isActive: false })
    .where(eq(rooms.id, roomId));
}

// ================= SESSIONS =================

export async function createRoomSession(roomId: number, userId: number) {
  const db = getDb();

  const anonymousHandle = `anon_${nanoid(8)}`;

  const values: InsertRoomSession = {
    roomId,
    userId,
    anonymousHandle,
  };

  await db.insert(roomSessions).values(values);

  const [session] = await db
    .select()
    .from(roomSessions)
    .where(
      and(
        eq(roomSessions.roomId, roomId),
        eq(roomSessions.userId, userId),
        eq(roomSessions.isActive, true)
      )
    )
    .orderBy(desc(roomSessions.joinedAt))
    .limit(1);

  return session;
}

export async function getRoomSession(roomId: number, userId: number) {
  const db = getDb();

  const [session] = await db
    .select()
    .from(roomSessions)
    .where(
      and(
        eq(roomSessions.roomId, roomId),
        eq(roomSessions.userId, userId),
        eq(roomSessions.isActive, true)
      )
    )
    .orderBy(desc(roomSessions.joinedAt))
    .limit(1);

  return session;
}

export async function getActiveRoomSessions(roomId: number) {
  const db = getDb();

  return await db
    .select()
    .from(roomSessions)
    .where(and(eq(roomSessions.roomId, roomId), eq(roomSessions.isActive, true)))
    .orderBy(roomSessions.joinedAt);
}

export async function updateSessionActivity(sessionId: number) {
  const db = getDb();

  await db
    .update(roomSessions)
    .set({ lastSeenAt: new Date() })
    .where(eq(roomSessions.id, sessionId));
}

export async function deactivateRoomSession(roomId: number, userId: number) {
  const db = getDb();

  await db
    .update(roomSessions)
    .set({ isActive: false })
    .where(
      and(eq(roomSessions.roomId, roomId), eq(roomSessions.userId, userId))
    );
}
