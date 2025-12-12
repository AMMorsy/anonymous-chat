"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const routers_1 = require("./routers");
function createTestContext(userId = 1) {
    const user = {
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
        },
        res: {},
    };
}
(0, vitest_1.describe)("room.create", () => {
    (0, vitest_1.it)("creates a room with a unique room code", async () => {
        const ctx = createTestContext();
        const caller = routers_1.appRouter.createCaller(ctx);
        const result = await caller.room.create({
            displayName: "Test Room",
        });
        (0, vitest_1.expect)(result.roomCode).toBeDefined();
        (0, vitest_1.expect)(typeof result.roomCode).toBe("string");
        (0, vitest_1.expect)(result.roomCode?.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(result.displayName).toBe("Test Room");
    });
    (0, vitest_1.it)("creates a room without display name", async () => {
        const ctx = createTestContext();
        const caller = routers_1.appRouter.createCaller(ctx);
        const result = await caller.room.create({});
        (0, vitest_1.expect)(result.roomCode).toBeDefined();
        (0, vitest_1.expect)(typeof result.roomCode).toBe("string");
    });
});
(0, vitest_1.describe)("room.join", () => {
    (0, vitest_1.it)("allows joining an existing room", async () => {
        const ctx = createTestContext();
        const caller = routers_1.appRouter.createCaller(ctx);
        // First create a room
        const created = await caller.room.create({
            displayName: "Join Test Room",
        });
        (0, vitest_1.expect)(created.roomCode).toBeDefined();
        // Then join it
        const joined = await caller.room.join({
            roomCode: created.roomCode,
        });
        (0, vitest_1.expect)(joined.roomCode).toBe(created.roomCode);
        (0, vitest_1.expect)(joined.displayName).toBe("Join Test Room");
        (0, vitest_1.expect)(joined.roomId).toBeDefined();
    });
    (0, vitest_1.it)("throws error when joining non-existent room", async () => {
        const ctx = createTestContext();
        const caller = routers_1.appRouter.createCaller(ctx);
        await (0, vitest_1.expect)(caller.room.join({
            roomCode: "nonexistent-room-code",
        })).rejects.toThrow("Room not found");
    });
});
(0, vitest_1.describe)("room.getSession", () => {
    (0, vitest_1.it)("returns null for non-existent room", async () => {
        const ctx = createTestContext();
        const caller = routers_1.appRouter.createCaller(ctx);
        const session = await caller.room.getSession({
            roomCode: "nonexistent-room",
        });
        (0, vitest_1.expect)(session).toBeNull();
    });
});
(0, vitest_1.describe)("room.getActiveUsers", () => {
    (0, vitest_1.it)("returns empty array for non-existent room", async () => {
        const ctx = createTestContext();
        const caller = routers_1.appRouter.createCaller(ctx);
        const users = await caller.room.getActiveUsers({
            roomCode: "nonexistent-room",
        });
        (0, vitest_1.expect)(users).toEqual([]);
    });
});
