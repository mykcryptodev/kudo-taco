import { WebClient } from "@slack/web-api";
import { KUDOS_CONTRACT } from "~/constants/addresses";
import { CHAIN } from "~/constants/chains";
import { HOME_BLOCKS } from "~/constants/slack";
import { fetchWithKudoHeader } from "./fetchWithKudoHeader";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN ?? "");

export const sendAppHomeLeaderBoard = async ({
  user,
  teamId,
} : {
  user: string,
  teamId: string,
}) => {
  try {
    const userWalletReq = await fetchWithKudoHeader(`${process.env.NEXTAUTH_URL}/api/user/getWalletAddressBySlackIds/${teamId}/${user}`);
    const { walletAddress } = await userWalletReq.json() as { walletAddress: string };
    // Call views.publish with the built-in web client
    const result = await slack.views.publish({
      // The user ID who opened your app's app home
      user_id: user,
      // The view payload that appears in the app home
      view: {
        type: 'home',
        blocks: [
          ...HOME_BLOCKS,
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `View my tacos on <${CHAIN.explorers[1].url}/token/${KUDOS_CONTRACT[CHAIN.slug]}?a=${walletAddress}|the blockchain>`
              }
            ]
          },
        ],
      },
    });
    return result;
  }
  catch (error) {
    console.error(error);
  }
};