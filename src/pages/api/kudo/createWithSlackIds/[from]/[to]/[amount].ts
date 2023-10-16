import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { ensureKudoHeader } from "lib/ensureKudoHeader";
import { type NextApiRequest, type NextApiResponse } from "next";

import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const createKudoHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  ensureKudoHeader(req, res);
  // Create context and caller
  const ctx = await createTRPCContext({ req, res });
  const caller = appRouter.createCaller(ctx);
  try {
    const { from, to, amount } = req.query as { from: string; to: string; amount: string };
    const kudo = await caller.kudo.createWithSlackIds({
      giverId: from,
      receiverId: to,
      amount: Number(amount),
    });
    console.log({ kudo })
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

export default createKudoHandler;