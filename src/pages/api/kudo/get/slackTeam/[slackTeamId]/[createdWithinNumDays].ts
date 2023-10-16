import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { ensureKudoHeader } from "lib/ensureKudoHeader";
import { type NextApiRequest, type NextApiResponse } from "next";

import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const getKudosHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  ensureKudoHeader(req, res);
  // Create context and caller
  const ctx = await createTRPCContext({ req, res });
  const caller = appRouter.createCaller(ctx);
  try {
    const { slackTeamId, createdWithinNumDays } = req.query as { slackTeamId: string; createdWithinNumDays: string; };
    if (createdWithinNumDays === 'all') {
      const kudo = await caller.kudo.getAllBySlackTeamId({
        slackTeamId: slackTeamId,
        startDate: new Date(0),
        endDate: new Date(),
      });
      return res.status(200).json(kudo);
    }
    const kudo = await caller.kudo.getAllBySlackTeamId({
      slackTeamId: slackTeamId,
      startDate: new Date(new Date().setDate(new Date().getDate() - Number(createdWithinNumDays))),
      endDate: new Date(),
    });
    res.status(200).json(kudo);
  } catch (cause) {
    if (cause instanceof TRPCError) {
      // An error from tRPC occured
      const httpCode = getHTTPStatusCodeFromError(cause);
      return res.status(httpCode).json(cause);
    }
    // Another error occured
    console.error(cause);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default getKudosHandler;