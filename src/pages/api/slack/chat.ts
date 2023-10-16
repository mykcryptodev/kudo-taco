import { type NextApiRequest, type NextApiResponse } from 'next';
import { type TransactionResult } from '@thirdweb-dev/sdk';
import { CHAIN } from '~/constants/chains';
import { ethers } from 'ethers';
import { KUDOS_CONTRACT } from '~/constants/addresses';
import { sendSuccessSlackMessage } from 'lib/sendSucessSlackMessage';
import { ensureRoleIsGranted } from 'lib/ensureRoleIsGranted';
import { ensureSufficientKudos } from 'lib/ensureSufficientKudos';
import { loadKudoSenderWallet } from 'lib/loadKudoSenderWallet';
import { sendAppHomeLeaderBoard } from 'lib/sendAppHomeLeaderBoard';
import { verifySlack } from 'lib/verifySlack';
import { fetchWithKudoHeader } from 'lib/fetchWithKudoHeader';
import { sendErrorSlackMessage } from 'lib/sendErrorSlackMessage';

export default async function chat(req: NextApiRequest, res: NextApiResponse) {
  // verify that the request came from slack (returns if not)
  verifySlack(req, res);
  if (req.method === 'POST') {
    const { type, event } = req.body as {
      type: string,
      event: {
        client_msg_id: string,
        type: string,
        text: string,
        team: string,
        user: string,
        channel: string,
        bot_id?: string,
      },
    };
    console.log({ type, event })
    // handle challenges
    if (type === 'url_verification') {
      const { challenge } = req.body as { challenge: string };
      // Verify the Slack Event URL
      return res.status(200).send(challenge);
    }
    // parse messages
    if (type === 'event_callback') {
      // handle app home opens
      if (event.type === 'app_home_opened') {
        await sendAppHomeLeaderBoard({
          user: event.user,
          teamId: event.team,
        });
      }
      if (event.type === 'message' && !event.bot_id) {
        const { text, team, user, channel, client_msg_id } = event as {
          text: string,
          team: string,
          user: string,
          channel: string,
          client_msg_id: string,
        };
        // check if we have already seen this message
        const seenMessageReq = await fetchWithKudoHeader(`${process.env.NEXTAUTH_URL}/api/slack/checkIfSeenMessage/${client_msg_id}`);
        const seenMessageJson = await seenMessageReq.json() as { seen: boolean };
        console.log({ seenMessageJson });
        if (seenMessageJson.seen) {
          return res.status(200).json({ message: 'Already processed' });
        }
        // add to seen messages
        await fetchWithKudoHeader(`${process.env.NEXTAUTH_URL}/api/slack/saveSeenMessage/${client_msg_id}`);

        // parse the mentions and the kudos
        const mentions = text.match(/<@U[a-zA-Z0-9]+>/g) ?? [];
        const kudos = text.match(/:taco:/g) ?? [];
        
        // if there are no mentions and no kudos, then we don't need to do anything
        if (mentions.length === 0 && kudos.length === 0) {
          return res.status(200).json({ message: 'No mentions or kudos' });
        }
        // if there are mentions but no kudos, then we don't need to do anything
        if (mentions.length > 0 && kudos.length === 0) {
          return res.status(200).json({ message: 'No kudos' });
        }
        // if there are kudos but no mentions, then we don't need to do anything
        if (mentions.length === 0 && kudos.length > 0) {
          return res.status(200).json({ message: 'No mentions' });
        }
        // if we got this far, there is work to do!


        // get the from address (wallet of the user who is giving kudos)
        const fromWalletAddressReq = await fetchWithKudoHeader(
          `${process.env.NEXTAUTH_URL}/api/user/getWalletAddressBySlackIds/${team}/${user}`
        );
        const fromWalletAddressJson = await fromWalletAddressReq.json() as { walletAddress: string };
        const fromWalletAddress: string = fromWalletAddressJson.walletAddress;
        
        // load or create the smart wallet of the sender
        const { kudoSenderSmartWalletSdk } = await loadKudoSenderWallet({
          fromWalletAddress
        });
        const fromSmartWalletAddress = await kudoSenderSmartWalletSdk.wallet.getAddress();

        // check to make sure that the user has enough tacos to give today
        const kudosToGive = kudos.length * mentions.length;
        const { 
          error: ensureSufficientKudosError,
          kudosRemainingAfterGive,
        } = await ensureSufficientKudos({
          addressToCheck: fromSmartWalletAddress,
          kudosToGive,
          channel,
          user
        });
        if (ensureSufficientKudosError) {
          return res.status(500).json({ message: ensureSufficientKudosError });
        }

        // check to make sure that the user has the KUDO_GIVER_ROLE
        try {
          await ensureRoleIsGranted({
            role: "KUDO_GIVER_ROLE",
            addressToEnsure: fromSmartWalletAddress,
          });
        } catch (e) {
          console.error(e);
          return res.status(500).json({ message: "Internal server error" });
        }
        const contract = await kudoSenderSmartWalletSdk.getContract(KUDOS_CONTRACT[CHAIN.slug]);
        // give kudos to a single receipient
        if (mentions.length === 1) {
          const toSlackUserId = mentions[0].substring(2, mentions[0].length - 1); // strip the <@ and > characters
          const toWalletAddressReq = await fetchWithKudoHeader(
            `${process.env.NEXTAUTH_URL}/api/user/getWalletAddressBySlackIds/${team}/${toSlackUserId}`
          );
          const toWalletAddressJson = await toWalletAddressReq.json() as { walletAddress: string };
          const toWalletAddress: string = toWalletAddressJson.walletAddress;
          const isSendingToSelf = fromWalletAddress === toWalletAddress;
          if (isSendingToSelf) {
            await sendErrorSlackMessage({
              channel,
              user,
              message: 'Cannot send kudos to yourself',
            });
            return res.status(200).json({ message: 'Cannot send kudos to yourself' });
          }
          await contract.call("giveKudos", [
            toWalletAddress,
            ethers.utils.parseEther(kudos.length.toString())
          ]) as Promise<TransactionResult>;
          await sendSuccessSlackMessage({
            channel,
            user,
            kudosSent: kudosToGive,
            kudosRemainingAfterGive,
          });
          await fetchWithKudoHeader(
            `${process.env.NEXTAUTH_URL}/api/kudo/createWithSlackIds/${user}/${toSlackUserId}/${kudos.length}`
          );
          return res.status(200).json({ message: 'Kudos sent' });
        }
        // give kudos to multiple recipients in one call
        const toWalletAddresses = await Promise.all(mentions.map(async (mention) => {
          const toSlackUserId = mention.substring(2, mention.length - 1); // strip the <@ and > characters
          const toWalletAddressReq = await fetchWithKudoHeader(
            `${process.env.NEXTAUTH_URL}/api/user/getWalletAddressBySlackIds/${team}/${toSlackUserId}`
          );
          const toWalletAddressJson = await toWalletAddressReq.json() as { walletAddress: string };
          const toWalletAddress: string = toWalletAddressJson.walletAddress;
          return toWalletAddress;
        }));
        const isSendingToSelf = toWalletAddresses.some((toWalletAddress) => fromWalletAddress === toWalletAddress);
        if (isSendingToSelf) {
          await sendErrorSlackMessage({
            channel,
            user,
            message: 'Cannot send kudos to yourself',
          });
          return res.status(200).json({ message: 'Cannot send kudos to yourself' });
        }
        // everyone gets the same amount of kudos
        const kudoAmounts = toWalletAddresses.map(() => ethers.utils.parseEther(kudos.length.toString()));
        await contract.call("giveMultipleKudos", [
          toWalletAddresses,
          kudoAmounts,
        ]) as Promise<TransactionResult>;
        await sendSuccessSlackMessage({
          channel,
          user,
          kudosSent: kudosToGive,
          kudosRemainingAfterGive,
        });
        await Promise.all(mentions.map(async (mention) => {
          const toSlackUserId = mention.substring(2, mention.length - 1); // strip the <@ and > characters
          return await fetchWithKudoHeader(
            `${process.env.NEXTAUTH_URL}/api/kudo/createWithSlackIds/${user}/${toSlackUserId}/${kudos.length}`
          );
        }));
        return res.status(200).json({ message: 'Kudos sent' });
      }
    }
    res.status(200).json({ message: 'Webhook received' });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
