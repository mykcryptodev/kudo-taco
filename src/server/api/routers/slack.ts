import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const slackRouter = createTRPCRouter({
  getByClientMsgId: publicProcedure
    .input(z.object({ clientMsgId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.slackMessage.findUnique({
        where: {
          client_msg_id: input.clientMsgId,
        },
      });
    }),
  save: publicProcedure
    .input(z.object({ clientMsgId: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.slackMessage.create({
        data: {
          client_msg_id: input.clientMsgId,
        },
      });
    }),
});
