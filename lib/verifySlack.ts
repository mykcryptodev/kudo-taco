// Import the necessary libraries
import { type NextApiRequest, type NextApiResponse } from "next";
import * as crypto from "crypto";

// Define your signing secret
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET!;

export const verifySlack = 
(req: NextApiRequest, res: NextApiResponse) => {
  // Retrieve the X-Slack-Request-Timestamp header and the body of the request
  const timestamp = req.headers['x-slack-request-timestamp'] as string;
  const slackSignature = req.headers['x-slack-signature'] as string;

  // Make sure the timestamp is recent to prevent replay attacks
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 60 * 5) {
    res.status(400).send("Ignore this request.");
    return;
  }

  // The raw body of the request to form the basestring
  const rawBody = JSON.stringify(req.body);  // Assuming the request body is parsed as JSON

  // Concatenate the version number, the timestamp, and the body of the request to form a basestring
  const baseString = `v0:${timestamp}:${rawBody}`;

  // Hash the basestring using the Slack Signing Secret as the key
  const mySignature = 'v0=' + crypto.createHmac('sha256', slackSigningSecret)
                                    .update(baseString)
                                    .digest('hex');

  // Compare the computed signature to the X-Slack-Signature header on the request
  if (crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(slackSignature))) {
    // Hooray, the request came from Slack!
    // Deal with the request    
  } else {
    console.warn(`
    
    ⚠️ UNVERIFIED REQUEST ⚠️
    
    `)
    res.status(400).send("Verification failed");
  }
  // app logic continues...
}
