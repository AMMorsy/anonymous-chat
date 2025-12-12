import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createRoom, getRoomByCode, getRoomSession, getActiveRoomSessions } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Room management
  room: router({
    create: protectedProcedure
      .input(z.object({
        displayName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const room = await createRoom(input.displayName, ctx.user.id);
        return {
          roomCode: room?.roomCode,
          displayName: room?.displayName,
        };
      }),

    join: protectedProcedure
      .input(z.object({
        roomCode: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const room = await getRoomByCode(input.roomCode);
        if (!room) {
          throw new Error("Room not found");
        }

        return {
          roomCode: room.roomCode,
          displayName: room.displayName,
          roomId: room.id,
        };
      }),

    getSession: protectedProcedure
      .input(z.object({
        roomCode: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const room = await getRoomByCode(input.roomCode);
        if (!room) {
          return null;
        }

        const session = await getRoomSession(room.id, ctx.user.id);
        return session ? {
          handle: session.anonymousHandle,
          joinedAt: session.joinedAt.getTime(),
        } : null;
      }),

    getActiveUsers: protectedProcedure
      .input(z.object({
        roomCode: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const room = await getRoomByCode(input.roomCode);
        if (!room) {
          return [];
        }

        const sessions = await getActiveRoomSessions(room.id);
        return sessions.map(s => ({
          handle: s.anonymousHandle,
          joinedAt: s.joinedAt.getTime(),
        }));
      }),
  }),
});

export type AppRouter = typeof appRouter;
