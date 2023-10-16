import { type Kudo, type User } from "@prisma/client";
import { type Block, type KnownBlock, WebClient } from "@slack/web-api";
import { fetchWithKudoHeader } from "./fetchWithKudoHeader";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN ?? "");

type KudoWithGiverAndReceiver = Kudo & {
  giver: User,
  receiver: User,
};
export async function getSlackLeaderboardBlocks(teamId: string, actionValue: string): Promise<Array<Block | KnownBlock>> {
  const kudosReq = await fetchWithKudoHeader(`${process.env.NEXTAUTH_URL}/api/kudo/get/slackTeam/${teamId}/${actionValue || "1"}`);
  const kudos = await kudosReq.json() as KudoWithGiverAndReceiver[];

  type KudosByReceiver = Record<string, number>;
  // get the number of kudos received by each receiver
  const kudosByReceiver = kudos.reduce((acc: KudosByReceiver, kudo) => {
    const receiver = kudo.receiver.slackUserId!;
    if (!acc[receiver]) {
      acc[receiver] = 0;
    }
    acc[receiver]++;
    return acc;
  }, {} as KudosByReceiver);

  const users = await Promise.all(Object.keys(kudosByReceiver).map(async (receiver) => {
    const userReq = await slack.users.info({
      user: receiver,
    });
    return userReq.user;
  }));

  const kudosBlocks: Array<Block | KnownBlock> = users.filter(
    u => u
  ).sort((a, b) => {
    // sort by number of kudos received
    return (kudosByReceiver[b?.id ?? ""] ?? 0) - (kudosByReceiver[a?.id ?? ""] ?? 0);
  }).map((user, i) => {
    if (!user?.id) return null;
    if (i === 0) {
      return {
        type: "section",
        block_id: user.id,
        fields: [
          {
            type: "mrkdwn",
            text: `:first_place_medal: First Place\n *${user?.profile?.display_name ?? user?.name}*`,
          },
          {
            type: "mrkdwn",
            text: `:taco: Tacos Received\n *${kudosByReceiver[user.id] ?? 0}*`,
          },
        ],
        accessory: {
          type: "image",
          image_url: user.profile?.image_72 ?? "https://placekitten.com/72/72",
          alt_text: "cute cat"
        }
      }
    }
    if (i === 1) {
      return {
        type: "section",
        block_id: user.id,
        fields: [
          {
            type: "mrkdwn",
            text: `:second_place_medal: Second Place\n *${user?.profile?.display_name ?? user?.name}*`,
          },
          {
            type: "mrkdwn",
            text: `:taco: Tacos Received\n *${kudosByReceiver[user.id] ?? 0}*`,
          },
        ],
        accessory: {
          type: "image",
          image_url: user.profile?.image_72 ?? "https://placekitten.com/72/72",
          alt_text: "cute cat"
        }
      }
    }
    if (i === 2) {
      return {
        type: "section",
        block_id: user.id,
        fields: [
          {
            type: "mrkdwn",
            text: `:third_place_medal: Third Place\n *${user?.profile?.display_name ?? user?.name}*`,
          },
          {
            type: "mrkdwn",
            text: `:taco: Tacos Received\n *${kudosByReceiver[user.id] ?? 0}*`,
          },
        ],
        accessory: {
          type: "image",
          image_url: user.profile?.image_72 ?? "https://placekitten.com/72/72",
          alt_text: "cute cat"
        }
      }
    }
    return {
      type: "context",
      block_id: user.id,
      elements: [
        {
          type: "image",
          image_url: user.profile?.image_72 ?? "https://placekitten.com/72/72",
          alt_text: user.name,
        },
        {
          type: "mrkdwn",
          text: `*${user?.profile?.display_name ?? user?.name}*: ${kudosByReceiver[user.id] ?? 0}`,
        }
      ],
    }
  }).filter(block => block !== null) as Array<Block | KnownBlock>;

  return kudosBlocks;
}