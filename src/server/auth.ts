import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import SlackProvider, { type SlackProfile } from "next-auth/providers/slack";

import { env } from "~/env.mjs";
import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      // ...other properties
      // role: UserRole;
      slackUserId?: string;
      slackTeamId?: string;
    };
  }

  interface User {
    // ...other properties
    // role: UserRole;
    slackUserId?: string;
    slackTeamId?: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  debug: true,
  callbacks: {
    signIn: async ({ user, account, profile, }) => {
      if (!account || !profile) return true;
      if (account.provider === 'slack') {
        const existingUser = await db.user.findUnique({
          where: {
            email: user.email ?? "",
          },
        });
        // Slack profile data is available in the `profile` object.
        const slackProfile = profile as SlackProfile;
        const slackUserId = slackProfile["https://slack.com/user_id"];
        const slackTeamId = slackProfile["https://slack.com/team_id"];

        if (!existingUser) {
          await db.user.create({
            data: {
              email: user.email,
              slackUserId,
              slackTeamId,
            },
          });
          return true;
        }
        if (existingUser?.slackUserId === slackUserId && existingUser?.slackTeamId === slackTeamId) {
          return true;
        }
        await db.user.update({
          where: {
            id: existingUser?.id ?? "",
          },
          data: {
            slackUserId,
            slackTeamId,
          },
        });
      }
  
      return true;  // Allow sign in.
    },
    session: ({ session, user }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          slackTeamId: user.slackTeamId,
          slackUserId: user.slackUserId,
        },
      }
    },
  },
  adapter: PrismaAdapter(db),
  providers: [
    SlackProvider({
      clientId: env.SLACK_CLIENT_ID,
      clientSecret: env.SLACK_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
