export const HOME_BLOCKS = [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: ":trophy:  Leaderboards",
      emoji: true
    }
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*View your team's taco distribution*"
    }
  },
  {
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Today's Leaderboard",
          emoji: true
        },
        value: "1",
        action_id: "load-leaderboard-1"
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "7 Day Leaderboard",
          emoji: true
        },
        value: "7",
        action_id: "load-leaderboard-7"
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "30 Day Leaderboard",
          emoji: true
        },
        value: "30",
        action_id: "load-leaderboard-30"
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "All Time Leaderboard",
          emoji: true
        },
        value: "all",
        action_id: "load-leaderboard-all"
      }
    ]
  },
  {
    type: "header",
    text: {
      type: "plain_text",
      text: ":taco:  Your Tacos",
      emoji: true
    }
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*View how many tacos you've received*"
    }
  },
  {
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Today",
          emoji: true
        },
        value: "1",
        action_id: "load-my-1"
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Last 7 Days",
          emoji: true
        },
        value: "7",
        action_id: "load-my-7"
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Last 30 Days",
          emoji: true
        },
        value: "30",
        action_id: "load-my-30"
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "All Time",
          emoji: true
        },
        value: "all",
        action_id: "load-my-all"
      }
    ]
  },
]