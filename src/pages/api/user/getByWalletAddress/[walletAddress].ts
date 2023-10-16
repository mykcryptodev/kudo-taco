import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { type NextApiRequest, type NextApiResponse } from "next";

import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const userByWalletAddressHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Create context and caller
  const ctx = await createTRPCContext({ req, res });
  const caller = appRouter.createCaller(ctx);
  try {
    const { slackTeamId, slackUserId } = req.query as { slackTeamId: string, slackUserId: string };
    const walletAddress = await caller.user.getWalletAddressBySlackIds({
      slackTeamId,
      slackUserId
    });
    res.status(200).json(walletAddress);
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

export default userByWalletAddressHandler;