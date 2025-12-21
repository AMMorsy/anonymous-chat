import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import type { NotificationPayload } from "./notification";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z
        .object({
          timestamp: z.number().min(0),
        })
        .optional()
    )
    .query(() => ({
      ok: true,
      service: "anon-chat-backend",
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input as NotificationPayload);
      return { success: delivered } as const;
    }),
});
