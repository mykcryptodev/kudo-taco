import { type NextApiRequest, type NextApiResponse } from "next";
import { type Block, WebClient } from "@slack/web-api";
import { HOME_BLOCKS } from "~/constants/slack";
import { getSlackLeaderboardBlocks } from "lib/getSlackLeaderboardBlocks";
import { type Kudo, type User } from "@prisma/client";
import { fetchWithKudoHeader } from "lib/fetchWithKudoHeader";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN ?? "");

type KudoWithGiverAndReceiver = Kudo & {
  giver: User,
  receiver: User,
};
export default async function interact(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const body = req.body as { payload: string };
    const payload = JSON.parse(body.payload) as Interaction;
    const { type, actions, user, team } = payload;
    if (type === "block_actions") {
      if (actions[0]?.action_id.includes('load-leaderboard')) {
        const value = actions[0]?.value;
        const leaderboardBlocks = await getSlackLeaderboardBlocks(team.id, value);

        await slack.views.publish({
          user_id: user.id,
          view: {
            type: "home",
            blocks: [
              ...HOME_BLOCKS,
              {
                type: "header",
                block_id: "leaderboard_header",
                text: {
                  type: "plain_text",
                  text: `:trophy:  ${actions[0]?.text.text.replace("Load", "") || ""}`,
                  emoji: true,
                }
              } as Block,
              ...leaderboardBlocks
            ]
          }
        });

        return res.status(200).json({});
      }
      if (actions[0]?.action_id.includes('load-my')) {
        const value = actions[0]?.value;
        const kudosReq = await fetchWithKudoHeader(`${process.env.NEXTAUTH_URL}/api/kudo/get/slackUser/${user.id}/${value || "1"}`);
        const kudos = await kudosReq.json() as KudoWithGiverAndReceiver[];
        await slack.views.publish({
          user_id: user.id,
          view: {
            type: "home",
            blocks: [
              ...HOME_BLOCKS,
              {
                type: "header",
                block_id: "user_kudos_header",
                text: {
                  type: "plain_text",
                  text: `:calendar:  ${actions[0]?.text.text.replace("Load", "") || ""}`,
                  emoji: true,
                }
              } as Block,
              {
                type: "section",
                block_id: "user_kudos",
                text: {
                  type: "plain_text",
                  text: `:taco:  You received ${kudos.length} taco${kudos.length === 1 ? '' : 's'}!`,
                  emoji: true,
                }
              }
            ]
          }
        });
      }
    }
    return res.status(200).json({ message: 'ok' });
  }
}