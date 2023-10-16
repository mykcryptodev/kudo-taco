import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { CHAIN } from "~/constants/chains";
import { ethers } from "ethers";
import { KUDOS_CONTRACT } from "~/constants/addresses";

export const ensureSufficientKudos = async ({
  addressToCheck,
  channel,
  kudosToGive,
  user,
} : {
  addressToCheck: string,
  channel: string,
  kudosToGive: number,
  user: string,
}) : Promise<{
  kudosRemainingAfterGive: number,
  error: string | null,
}> => {
  // check to make sure that the user has enough tacos to give today
  const readOnlySdk = new ThirdwebSDK(CHAIN.slug, {
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ?? "",
    secretKey: process.env.THIRDWEB_SDK_SECRET_KEY
  });
  try {
    const contract = await readOnlySdk.getContract(KUDOS_CONTRACT[CHAIN.slug]);
    const kudosRemainingLookup = await contract.call("kudosRemainingToday", [addressToCheck]) as ethers.BigNumber;
    const kudosRemainingToday = Number(ethers.utils.formatEther(kudosRemainingLookup));
    const kudosRemainingAfterGive = kudosRemainingToday - kudosToGive;
    if (kudosRemainingToday < kudosToGive) {
      // send a message back to the channel that only the user can see
      // letting them know that they do not have enough tacos to give today
      const ephemeralResponse = `You do not have enough tacos to give today. Give some out tomorrow!`;
      const response = await fetch(`https://slack.com/api/chat.postEphemeral`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify({
          channel,
          user,
          text: ephemeralResponse,
          token: process.env.SLACK_BOT_TOKEN,
        }),
      });
      if (!response.ok) {
        return {
          error: "Failed to send ephemeral response",
          kudosRemainingAfterGive: 0,
        }
      }
      return {
        error: "Not enough kudos to give today",
        kudosRemainingAfterGive: 0,
      }
    }
    return {
      kudosRemainingAfterGive,
      error: null,
    };
  } catch (e) {
    console.error(e);
    return {
      error: "Failed to check kudos remaining",
      kudosRemainingAfterGive: 0,
    }
  }
}