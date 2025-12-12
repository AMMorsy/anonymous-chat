"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const const_1 = require("../shared/const");
const cookies_1 = require("./_core/cookies");
const systemRouter_1 = require("./_core/systemRouter");
const trpc_1 = require("./_core/trpc");
const zod_1 = require("zod");
const db_1 = require("./db");
exports.appRouter = (0, trpc_1.router)({
    system: systemRouter_1.systemRouter,
    auth: (0, trpc_1.router)({
        me: trpc_1.publicProcedure.query(opts => opts.ctx.user),
        logout: trpc_1.publicProcedure.mutation(({ ctx }) => {
            const cookieOptions = (0, cookies_1.getSessionCookieOptions)(ctx.req);
            ctx.res.clearCookie(const_1.COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
            return {
                success: true,
            };
        }),
    }),
    // Room management
    room: (0, trpc_1.router)({
        create: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            displayName: zod_1.z.string().optional(),
        }))
            .mutation(async ({ ctx, input }) => {
            const room = await (0, db_1.createRoom)(input.displayName, ctx.user.id);
            return {
                roomCode: room?.roomCode,
                displayName: room?.displayName,
            };
        }),
        join: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            roomCode: zod_1.z.string(),
        }))
            .mutation(async ({ ctx, input }) => {
            const room = await (0, db_1.getRoomByCode)(input.roomCode);
            if (!room) {
                throw new Error("Room not found");
            }
            return {
                roomCode: room.roomCode,
                displayName: room.displayName,
                roomId: room.id,
            };
        }),
        getSession: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            roomCode: zod_1.z.string(),
        }))
            .query(async ({ ctx, input }) => {
            const room = await (0, db_1.getRoomByCode)(input.roomCode);
            if (!room) {
                return null;
            }
            const session = await (0, db_1.getRoomSession)(room.id, ctx.user.id);
            return session ? {
                handle: session.anonymousHandle,
                joinedAt: session.joinedAt.getTime(),
            } : null;
        }),
        getActiveUsers: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            roomCode: zod_1.z.string(),
        }))
            .query(async ({ ctx, input }) => {
            const room = await (0, db_1.getRoomByCode)(input.roomCode);
            if (!room) {
                return [];
            }
            const sessions = await (0, db_1.getActiveRoomSessions)(room.id);
            return sessions.map(s => ({
                handle: s.anonymousHandle,
                joinedAt: s.joinedAt.getTime(),
            }));
        }),
    }),
});
