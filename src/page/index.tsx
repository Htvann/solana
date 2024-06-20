import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { useEffect, useState } from "react";

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [balanceWallet, setBalance] = useState(0);
  const { connection } = useConnection();
  const { sendTransaction, publicKey } = useWallet();

  const handleClick = async () => {
    if (!publicKey) throw new WalletNotConnectedError();

    const lamports = await connection.getMinimumBalanceForRentExemption(0);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: Keypair.generate().publicKey,
        lamports,
      }),
    );

    const {
      context: { slot: minContextSlot },
      value: { blockhash, lastValidBlockHeight },
    } = await connection.getLatestBlockhashAndContext();

    const signature = await sendTransaction(transaction, connection, {
      minContextSlot,
    });

    try {
      setLoading(true);
      const result = await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      });
      console.log("result", result);
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey)
      (async () => {
        const balance = await connection.getBalance(publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      })();
  }, [publicKey]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      Balance: {balanceWallet}
      <button onClick={handleClick}>
        {loading ? "Loading" : "Send transaction"}
      </button>
    </div>
  );
};

export default Home;
