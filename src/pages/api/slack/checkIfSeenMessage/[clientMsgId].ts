import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { ensureKudoHeader } from "lib/ensureKudoHeader";
import { type NextApiRequest, type NextApiResponse } from "next";

import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const checkIfSeenSlackMessageHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  ensureKudoHeader(req, res);
  // Create context and caller
  const ctx = await createTRPCContext({ req, res });
  const caller = appRouter.createCaller(ctx);
  try {
    const { clientMsgId } = req.query as { clientMsgId: string };
    const slackMessage = await caller.slack.getByClientMsgId({
      clientMsgId,
    });
    return res.status(200).json({ seen: !!slackMessage });
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

export default checkIfSeenSlackMessageHandler;