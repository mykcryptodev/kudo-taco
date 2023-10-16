import { type WalletConfig, type User, type Session, type PrismaClient, type Prisma } from "@prisma/client";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import { type AsyncStorage } from "@thirdweb-dev/wallets";
import { type DefaultArgs } from "@prisma/client/runtime/library";

const getWalletStorageInstance = ({ ctx, user } : {
  ctx: {
    session: Session | null;
    db: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>;
  },
  user: User | null,
}) => {
  return class WalletStorage implements AsyncStorage {
    getItem(key: string): Promise<string | null> {
      console.log({ key })
      return Promise.resolve(null);
    }
    async setItem(key: string, value: string): Promise<void> {
      if (!user) return Promise.reject();
      // store the wallet config in the db
      await ctx.db.walletConfig.create({
        data: {
          walletData: value,
          userId: user.id,
        },
      });
      return Promise.resolve();
    }
    removeItem(key: string): Promise<void> {
      console.log({ key })
      return Promise.resolve();
    }
  }
}

export const userRouter = createTRPCRouter({
  clearDatabase: publicProcedure
    .mutation(async ({ ctx }) => {
      await Promise.all([
        ctx.db.user.deleteMany({}),
        ctx.db.kudo.deleteMany({}),
        ctx.db.account.deleteMany({}),
        ctx.db.verificationToken.deleteMany({}),
        ctx.db.walletConfig.deleteMany({}),
        ctx.db.slackMessage.deleteMany({}),
        ctx.db.session.deleteMany({}),
        ctx.db.example.deleteMany({}),
      ]);
      return true;
    }),
  getByWalletAddress: publicProcedure
    .input(z.object({
      walletAddress: z.string(),
      includeWalletConfig: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.user.findUnique({
        where: {
          walletAddress: input.walletAddress,
        },
        include: {
          walletConfig: input.includeWalletConfig,
        },
      });
    }),
  getWalletAddressBySlackIds: publicProcedure
    .input(z.object({ 
      slackUserId: z.string(),
      slackTeamId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      console.log(' finding in trpc by ')
      console.log({
        input
      })
      let user: User & WalletConfig | User | null = null;
      user = await ctx.db.user.findUnique({
        where: {
          slackUserId: input.slackUserId,
        },
        include: {
          walletConfig: true,
        }
      });
      if (!user) {
        // create the user
        console.log(' creating user ...')
        user = await ctx.db.user.create({
          data: {
            slackUserId: input.slackUserId,
            slackTeamId: input.slackTeamId,
          },
        });
        console.log("created...", user)
      }
      if (!user.walletAddress) {
        console.log(" I need to make a wallet. ...")
        const ctxParam = {
          session: ctx.session,
          db: ctx.db,
        } as {
          session: Session | null,
          db: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
        };
        const walletAddress = await createWalletViaSdk({ ctx: ctxParam, user });
        // const walletAddress = await createWalletViaEngine({ ctx, input });
        // save the wallet address to the user db
        await ctx.db.user.update({
          where: {
            slackUserId: input.slackUserId,
          },
          data: {
            walletAddress,
          },
        });
        return {
          walletAddress,
        }
      }
      return {
        walletAddress: user.walletAddress,
      };
    }),
});

// async function createWalletViaEngine ({ ctx, input }: {
//   ctx: {
//     session: { id: string; sessionToken: string; userId: string; expires: Date; } | null,
//     db: {
//       user: {
//         update: (args: {
//           where: {
//             slackUserId: string,
//           },
//           data: {
//             walletAddress: string,
//           },
//         }) => Promise<void>,
//       },
//     },
//   },
//   input: {
//     slackUserId: string,
//   }}) : Promise<{ walletAddress: string }> {
//   // create the wallet for the user, store it, and return it
//   type WalletCreationSuccessResponse = {
//     result: {
//       walletAddress: string,
//       status: "success"
//     }
//   }
//   type WalletCreationErrorResponse = {
//     error: {
//       message: "string",
//       code: "BAD_REQUEST" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR",
//       statusCode: 400 | 404 | 500
//     }
//   }
//   type WalletCreationResponse = WalletCreationSuccessResponse | WalletCreationErrorResponse;
//   try {
//     const options = {
//       method: "POST",
//       headers: {
//         accept: "application/json",
//         "content-type": "application/json",
//         Authorization: `Bearer ${process.env.THIRDWEB_SDK_SECRET_KEY}`
//       },
//       body: JSON.stringify({}),
//     }
//     const walletCreationPost = await fetch(
//       `${process.env.THIRDWEB_ENGINE_URL}/wallet/create`,
//       options
//     );
//     const walletCreationResponse = await walletCreationPost.json() as unknown as WalletCreationResponse;
//     if ("result" in walletCreationResponse && walletCreationResponse.result.status === "success") {
//       const walletAddress = walletCreationResponse.result.walletAddress;
//       // save the wallet address in the db
//       await ctx.db.user.update({
//         where: {
//           slackUserId: input.slackUserId,
//         },
//         data: {
//           walletAddress,
//         },
//       });
//       return {
//         walletAddress,
//       };
//     }
//     throw new Error("Wallet creation failed");
//   } catch (e) {
//     const error = e as Error;
//     throw new Error(error.message);
//   }
// }

async function createWalletViaSdk(
  { ctx, user }: {
    ctx: {
      session: Session | null;
      db: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>;
    },
    user: User | null,
  }) : Promise<string> {
  const WalletStorage = getWalletStorageInstance({ ctx, user });
  const wallet = new LocalWalletNode({
    storage: new WalletStorage(),
  });
  try {
    const walletAddress = await wallet.generate();
    await wallet.save({
      strategy: "encryptedJson",
      password: process.env.ENCRYPTION_KEY ?? "",
    });
    return walletAddress;
  } catch (e) {
    const error = e as Error;
    throw new Error(error.message);
  }
}