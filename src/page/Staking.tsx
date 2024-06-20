import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  SignerWalletAdapterProps,
  WalletNotConnectedError,
} from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { useState } from "react";

const MINT_ADDRESS = "GNn5ZNqT8ZpKHKRWipCXVWqWBWRM4gggsKwaKcArAGtA"; //You must change this value!

const mintToken = new PublicKey(MINT_ADDRESS);

const recipientAddress = new PublicKey(
  "AL145KtKMxnRDfcruv61Kt4WL7FKtVYuqPA3nM8adWk",
);

const Staking = () => {
  const [loading, setLoading] = useState(false);
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  const handlePayment = async () => {
    if (!publicKey || !signTransaction) {
      throw new WalletNotConnectedError();
    }
    try {
      setLoading(true);
      const transactionInstructions: TransactionInstruction[] = [];

      const associatedTokenFrom = await getAssociatedTokenAddress(
        mintToken,
        publicKey,
      );

      const fromAccount = await getAccount(connection, associatedTokenFrom);

      const associatedTokenTo = await getAssociatedTokenAddress(
        mintToken,
        recipientAddress,
      );

      if (!(await connection.getAccountInfo(associatedTokenTo))) {
        transactionInstructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey,
            associatedTokenTo,
            recipientAddress,
            mintToken,
          ),
        );
      }

      transactionInstructions.push(
        createTransferInstruction(
          fromAccount.address,
          associatedTokenTo,
          publicKey,
          8 * LAMPORTS_PER_SOL,
        ),
      );

      const transaction = new Transaction().add(...transactionInstructions);

      const signature = await configureAndSendCurrentTransaction(
        transaction,
        connection,
        publicKey,
        signTransaction,
      );

      console.log("signature", signature);

      // signature is transaction address, you can confirm your transaction on 'https://explorer.solana.com/?cluster=devnet'
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? "Loading" : publicKey ? publicKey.toBase58() : "Click"}
    </button>
  );
};

export default Staking;

export const configureAndSendCurrentTransaction = async (
  transaction: Transaction,
  connection: Connection,
  feePayer: PublicKey,
  signTransaction: SignerWalletAdapterProps["signTransaction"],
) => {
  const blockHash = await connection.getLatestBlockhash();
  transaction.feePayer = feePayer;
  transaction.recentBlockhash = blockHash.blockhash;
  const signed = await signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction({
    blockhash: blockHash.blockhash,
    lastValidBlockHeight: blockHash.lastValidBlockHeight,
    signature,
  });
  return signature;
};
