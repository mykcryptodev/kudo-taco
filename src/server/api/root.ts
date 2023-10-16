import { exampleRouter } from "~/server/api/routers/example";
import { kudoRouter } from "~/server/api/routers/kudo";
import { slackRouter } from "~/server/api/routers/slack";
import { userRouter } from "~/server/api/routers/user";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  kudo: kudoRouter,
  slack: slackRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
