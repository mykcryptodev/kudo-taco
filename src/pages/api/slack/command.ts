import { type NextApiRequest, type NextApiResponse } from "next";
import { type Block, WebClient } from "@slack/web-api";
import { getSlackLeaderboardBlocks } from "lib/getSlackLeaderboardBlocks";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN ?? "");

export default async function command(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { team_id, text, channel_id } = req.body as { 
      team_id: string, 
      text: string, 
      channel_id: string 
    };
    const leaderboardBlocks = await getSlackLeaderboardBlocks(
      team_id,
      text === '' ? 'all' : text,
    );
    const blocks = [
      {
        type: "header",
        block_id: "leaderboard_header",
        text: {
          type: "plain_text",
          text: `:trophy: ${text === '' ? 'All Time' : text.concat(' Day')} Leaderboard`,
          emoji: true,
        }
      } as Block,
      ...leaderboardBlocks,
    ];
    try {
      await slack.chat.postMessage({
        channel: channel_id,
        blocks,
      });
      res.status(200).send('');
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}