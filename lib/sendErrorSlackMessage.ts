export const sendErrorSlackMessage = async ({
  channel, user, message
}: {
  channel: string, user: string, message: string
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
      text: `There was a problem sending kudos: ${message}`,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  return response;
}