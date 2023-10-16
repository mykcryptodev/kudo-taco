type Interaction = {
  type: string;
  user: {
      id: string;
      username: string;
      name: string;
      team_id: string;
  };
  api_app_id: string;
  token: string;
  container: {
      type: string;
      view_id: string;
  };
  trigger_id: string;
  team: {
      id: string;
      domain: string;
  };
  enterprise: null;
  is_enterprise_install: boolean;
  view: {
      id: string;
      team_id: string;
      type: string;
      blocks: Array<{
          type: string;
          block_id: string;
          text?: {
              type: string;
              text: string;
              verbatim?: boolean;
              emoji?: boolean;
          };
          elements?: Array<{
              type: string;
              action_id: string;
              text: {
                  type: string;
                  text: string;
                  emoji: boolean;
              };
              value: string;
          }>;
      }>;
      private_metadata: string;
      callback_id: string;
      state: {
          values: {};
      };
      hash: string;
      title: {
          type: string;
          text: string;
          emoji: boolean;
      };
      clear_on_close: boolean;
      notify_on_close: boolean;
      close: null;
      submit: null;
      previous_view_id: null;
      root_view_id: string;
      app_id: string;
      external_id: string;
      app_installed_team_id: string;
      bot_id: string;
  };
  actions: Array<{
      action_id: string;
      block_id: string;
      text: {
          type: string;
          text: string;
          emoji: boolean;
      };
      value: string;
      type: string;
      action_ts: string;
  }>;
};
