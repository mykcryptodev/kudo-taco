import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { type NextApiRequest, type NextApiResponse } from "next";

import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const walletConfigHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Create context and caller
  const ctx = await createTRPCContext({ req, res });
  const caller = appRouter.createCaller(ctx);
  try {
    const { address } = req.query as { address: string };
    const user = await caller.user.getByWalletAddress({
      walletAddress: address,
      includeWalletConfig: true,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { walletConfig } = user;
    console.log('/api/getWalletConfig/User')
    console.log({ walletConfig: walletConfig })
    res.status(200).json(walletConfig);
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

export default walletConfigHandler;