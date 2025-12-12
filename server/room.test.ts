import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("room.create", () => {
  it("creates a room with a unique room code", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.room.create({
      displayName: "Test Room",
    });

    expect(result.roomCode).toBeDefined();
    expect(typeof result.roomCode).toBe("string");
    expect(result.roomCode?.length).toBeGreaterThan(0);
    expect(result.displayName).toBe("Test Room");
  });

  it("creates a room without display name", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.room.create({});

    expect(result.roomCode).toBeDefined();
    expect(typeof result.roomCode).toBe("string");
  });
});

describe("room.join", () => {
  it("allows joining an existing room", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // First create a room
    const created = await caller.room.create({
      displayName: "Join Test Room",
    });

    expect(created.roomCode).toBeDefined();

    // Then join it
    const joined = await caller.room.join({
      roomCode: created.roomCode!,
    });

    expect(joined.roomCode).toBe(created.roomCode);
    expect(joined.displayName).toBe("Join Test Room");
    expect(joined.roomId).toBeDefined();
  });

  it("throws error when joining non-existent room", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.room.join({
        roomCode: "nonexistent-room-code",
      })
    ).rejects.toThrow("Room not found");
  });
});

describe("room.getSession", () => {
  it("returns null for non-existent room", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const session = await caller.room.getSession({
      roomCode: "nonexistent-room",
    });

    expect(session).toBeNull();
  });
});

describe("room.getActiveUsers", () => {
  it("returns empty array for non-existent room", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const users = await caller.room.getActiveUsers({
      roomCode: "nonexistent-room",
    });

    expect(users).toEqual([]);
  });
});
