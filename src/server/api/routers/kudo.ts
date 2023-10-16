import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const kudoRouter = createTRPCRouter({
  createWithSlackIds: publicProcedure
    .input(z.object({
      giverId: z.string(),
      receiverId: z.string(),
      amount: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const giverUser = await ctx.db.user.findUnique({
        where: {
          slackUserId: input.giverId,
        },
      });
      if (!giverUser) {
        throw new Error(`No user found for slackUserId ${input.giverId}`);
      }
      const receiverUser = await ctx.db.user.findUnique({
        where: {
          slackUserId: input.receiverId,
        },
      });
      if (!receiverUser) {
        throw new Error(`No user found for slackUserId ${input.receiverId}`);
      }
      return await Promise.all(Array.from({ length: input.amount }).map(async () => {
        await ctx.db.kudo.create({
          data: {
            giverId: giverUser.id,
            receiverId: receiverUser.id,
          },
        });
      }));
    }),
  getAllBySlackTeamId: publicProcedure
    .input(z.object({
      slackTeamId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.kudo.findMany({
        where: {
          receiver: {
            slackTeamId: input.slackTeamId,
          },
          createdAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        include: {
          giver: true,
          receiver: true,
        }
      });
    }),
  getAllBySlackUserId: publicProcedure
    .input(z.object({
      slackUserId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.kudo.findMany({
        where: {
          receiver: {
            slackUserId: input.slackUserId,
          },
          createdAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        include: {
          giver: true,
          receiver: true,
        }
      });
    }),
});
