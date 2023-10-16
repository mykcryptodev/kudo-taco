import { type TransactionError, ThirdwebSDK } from "@thirdweb-dev/sdk";
import { KUDOS_CONTRACT } from "~/constants/addresses";
import { CHAIN } from "~/constants/chains";
import { ethers } from "ethers";

export const ensureRoleIsGranted = async ({
  role,
  addressToEnsure,
} : {
  role: string,
  addressToEnsure: string,
}) => {
  try {
    const sdk = ThirdwebSDK.fromPrivateKey(
      process.env.PRIVATE_KEY ?? "",
      CHAIN
    );
    const contract = await sdk.getContract(KUDOS_CONTRACT[CHAIN.slug]);
    const hasKudoGiverRole = await contract.call(
      "hasRole", 
      [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role)), 
        addressToEnsure
      ]
    ) as boolean;
    if (!hasKudoGiverRole) {
      await contract.call(
        "grantRole",
        [
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role)),
          addressToEnsure
        ]
      ) as ethers.providers.TransactionResponse;
    }
  } catch (e) {
    console.error(e);
    const error = e as TransactionError;
    throw new Error(error.message);
  }
}