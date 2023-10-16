import { type NextApiRequest, type NextApiResponse } from "next";
import { env } from "~/env.mjs";

export const ensureKudoHeader = (req: NextApiRequest, res: NextApiResponse) => {
  // Check if the request is coming from your own application
  const { headers } = req;
  const isRequestFromYourApp = headers['x-kudo-secret'] === env.KUDO_SECRET;

  if (!isRequestFromYourApp) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}