import { useState } from "react";
import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PROGRAM_ID, TOKEN_ID } from "../constant";
import { SplTokenStakingIDL } from "@mithraic-labs/token-staking";
import { PublicKey } from "@solana/web3.js";

const NONE = 1;

const CallContract = () => {
  const [loading] = useState(false);
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const handleStaking = async () => {
    if (!wallet) return;

    const provider = new AnchorProvider(connection, wallet, {});
    setProvider(provider);

    const program = new Program(SplTokenStakingIDL, PROGRAM_ID.toBase58());

    const mint = new anchor.web3.PublicKey(TOKEN_ID.toBase58());

    const [stakePool] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        new anchor.BN(1).toArrayLike(Buffer, "le", 1),
        mint.toBuffer(),
        new PublicKey("AL145KtKMxnRDfcruv61Kt4WL7FKtVYuqPA3nM8adWk").toBuffer(),
        Buffer.from("stakePool", "utf-8"),
      ],
      program.programId,
    );
    const result = await program.account.stakePool.fetch(stakePool);

    console.log("result", result);
  };

  return (
    <div>
      <button onClick={handleStaking} disabled={loading}>
        {loading ? "Loading" : "Click"}
      </button>
    </div>
  );
};

export default CallContract;
