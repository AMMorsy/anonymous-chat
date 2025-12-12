import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, rooms, roomSessions, InsertRoom, InsertRoomSession } from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from 'nanoid';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
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
      values.role = 'admin';
      updateSet.role = 'admin';
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
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Room management functions

export async function createRoom(displayName?: string, createdBy?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const roomCode = nanoid(12); // Generate non-traceable room code
  
  const values: InsertRoom = {
    roomCode,
    displayName: displayName || null,
    createdBy: createdBy || null,
  };

  const result = await db.insert(rooms).values(values);
  
  // Fetch the created room
  const [room] = await db.select().from(rooms).where(eq(rooms.roomCode, roomCode)).limit(1);
  
  return room;
}

export async function getRoomByCode(roomCode: string) {
  const db = await getDb();
  if (!db) return undefined;

  const [room] = await db.select().from(rooms)
    .where(and(eq(rooms.roomCode, roomCode), eq(rooms.isActive, true)))
    .limit(1);

  return room;
}

export async function updateRoomActivity(roomId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(rooms)
    .set({ lastActivityAt: new Date() })
    .where(eq(rooms.id, roomId));
}

export async function deactivateRoom(roomId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(rooms)
    .set({ isActive: false })
    .where(eq(rooms.id, roomId));
}

// Room session management

export async function createRoomSession(roomId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate anonymous handle
  const anonymousHandle = `anon_${nanoid(8)}`;

  const values: InsertRoomSession = {
    roomId,
    userId,
    anonymousHandle,
  };

  await db.insert(roomSessions).values(values);

  // Return the created session
  const [session] = await db.select().from(roomSessions)
    .where(and(
      eq(roomSessions.roomId, roomId),
      eq(roomSessions.userId, userId),
      eq(roomSessions.isActive, true)
    ))
    .orderBy(desc(roomSessions.joinedAt))
    .limit(1);

  return session;
}

export async function getRoomSession(roomId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const [session] = await db.select().from(roomSessions)
    .where(and(
      eq(roomSessions.roomId, roomId),
      eq(roomSessions.userId, userId),
      eq(roomSessions.isActive, true)
    ))
    .orderBy(desc(roomSessions.joinedAt))
    .limit(1);

  return session;
}

export async function getActiveRoomSessions(roomId: number) {
  const db = await getDb();
  if (!db) return [];

  const sessions = await db.select().from(roomSessions)
    .where(and(
      eq(roomSessions.roomId, roomId),
      eq(roomSessions.isActive, true)
    ))
    .orderBy(roomSessions.joinedAt);

  return sessions;
}

export async function updateSessionActivity(sessionId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(roomSessions)
    .set({ lastSeenAt: new Date() })
    .where(eq(roomSessions.id, sessionId));
}

export async function deactivateRoomSession(roomId: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(roomSessions)
    .set({ isActive: false })
    .where(and(
      eq(roomSessions.roomId, roomId),
      eq(roomSessions.userId, userId)
    ));
}

export async function cleanupInactiveSessions(inactiveMinutes: number = 30) {
  const db = await getDb();
  if (!db) return;

  const cutoffTime = new Date(Date.now() - inactiveMinutes * 60 * 1000);

  await db.update(roomSessions)
    .set({ isActive: false })
    .where(and(
      eq(roomSessions.isActive, true),
      // @ts-ignore - drizzle typing issue with date comparison
      desc(roomSessions.lastSeenAt) < cutoffTime
    ));
}
