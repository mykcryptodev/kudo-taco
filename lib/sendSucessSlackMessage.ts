export const sendSuccessSlackMessage = async ({
  channel, user, kudosSent, kudosRemainingAfterGive
}: {
  channel: string, user: string, kudosSent: number, kudosRemainingAfterGive: number
}) => {
  // send a message to the channel saying that the sender successfully gave tacos
  const response = await fetch(`https://slack.com/api/chat.postEphemeral`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify({
      channel,
      user,
      text: `You successfully gave out ${kudosSent} taco${kudosSent > 1 ? 's' : ''}! You have ${kudosRemainingAfterGive} taco${kudosRemainingAfterGive !== 1 ? 's' : ''} left to give today.`,
    }),
  });
  console.log({ response })
  console.log(JSON.stringify(response));
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  return response;
}