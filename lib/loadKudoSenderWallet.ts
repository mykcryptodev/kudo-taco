import { type WalletConfig } from "@prisma/client";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { type SmartWalletConfig, type AsyncStorage, SmartWallet } from "@thirdweb-dev/wallets";
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import { ACCOUNT_FACTORY } from "~/constants/addresses";
import { CHAIN } from "~/constants/chains";
import { fetchWithKudoHeader } from "./fetchWithKudoHeader";

export const loadKudoSenderWallet = async ({
  fromWalletAddress,
} : {
  fromWalletAddress: string,
}) : Promise<{ 
  kudoSenderSmartWalletSdk: ThirdwebSDK 
}> => {
  console.log('loading the sender wallet...')
  class WalletStorage implements AsyncStorage {
    async getItem(_key: string): Promise<string | null> {
      const fromWalletConfigReq = await fetchWithKudoHeader(`${process.env.NEXTAUTH_URL}/api/user/getWalletConfig/${fromWalletAddress}`);
      const fromWalletConfig = await fromWalletConfigReq.json() as WalletConfig | null;
      if (!fromWalletConfig?.walletData) {
        return Promise.reject("No wallet stored");
      }
      return Promise.resolve(fromWalletConfig.walletData);
    }
    async setItem(_key: string, _value: string): Promise<void> {
      return Promise.resolve();
    }
    removeItem(_key: string): Promise<void> {
      return Promise.resolve();
    }
  }
  const localWalletNode = new LocalWalletNode({
    storage: new WalletStorage(),
    chain: CHAIN,
  });
  const fromWallet = await localWalletNode.load({
    strategy: "encryptedJson",
    password: process.env.ENCRYPTION_KEY ?? "",
  });
  const smartWalletConfig: SmartWalletConfig = {
    chain: CHAIN,
    factoryAddress: ACCOUNT_FACTORY[CHAIN.slug],
    secretKey: process.env.THIRDWEB_SDK_SECRET_KEY,
    gasless: true,
  };
  const smartWallet = new SmartWallet(smartWalletConfig);
  await smartWallet.connect({
    personalWallet: localWalletNode,
  });
  console.log({ fromWallet });
  const kudoSenderSmartWalletSdk = await ThirdwebSDK.fromWallet(smartWallet, CHAIN, {
    secretKey: process.env.THIRDWEB_SDK_SECRET_KEY,
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
  });
  return {
    kudoSenderSmartWalletSdk
  };
}