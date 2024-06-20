import { useState } from "react";
import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PROGRAM_ID, TOKEN_ID } from "../constant";
import {
  SplTokenStakingIDL,
  getNextUnusedStakeReceiptNonce,
} from "@mithraic-labs/token-staking";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

const NONCE = 1;
const BA_PublicKey = new PublicKey(
  "AL145KtKMxnRDfcruv61Kt4WL7FKtVYuqPA3nM8adWk",
);

const Deposit = () => {
  const [loading] = useState(false);
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const handleDeposit = async () => {
    if (!wallet || !wallet.publicKey) return;

    const provider = new AnchorProvider(connection, wallet, {});
    setProvider(provider);

    const program = new Program(SplTokenStakingIDL, PROGRAM_ID.toBase58());

    const mint = new anchor.web3.PublicKey(TOKEN_ID.toBase58());

    const poolsOwner = BA_PublicKey;
    const depositer = wallet.publicKey;

    try {
      const [stakePool] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          new anchor.BN(NONCE).toArrayLike(Buffer, "le", 1),
          mint.toBuffer(),
          poolsOwner!.toBuffer(),
          Buffer.from("stakePool", "utf-8"),
        ],
        program.programId,
      );

      // Find next nonce of stake receipt
      const nextNonce = await getNextUnusedStakeReceiptNonce(
        program.provider.connection,
        program.programId,
        depositer!,
        stakePool,
      );

      // Find address where stored staked token
      const [vaultKey] = anchor.web3.PublicKey.findProgramAddressSync(
        [stakePool.toBuffer(), Buffer.from("vault", "utf-8")],
        program.programId,
      );

      // Find address where stored stake receipt
      const [stakeReceipt] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          depositer!.toBuffer(),
          stakePool.toBuffer(),
          new anchor.BN(nextNonce).toArrayLike(Buffer, "le", 4),
          Buffer.from("stakeDepositReceipt", "utf-8"),
        ],
        program.programId,
      );

      // Find address funding of stake token
      const mintToBeStakedAccount = getAssociatedTokenAddressSync(
        mint,
        depositer!,
        false,
        TOKEN_PROGRAM_ID,
      );

      // Find address where reward token stored
      const [rewardVaultKey] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          stakePool.toBuffer(),
          mint.toBuffer(),
          Buffer.from("rewardVault", "utf-8"),
        ],
        program.programId,
      );

      const { stakeMint, stakeMintAccountKey, createStakeMintAccountIx }: any =
        await initSPTokenAccount({ stakePool });

      const signature = await program.methods
        .deposit(
          nextNonce,
          new anchor.BN(1 * LAMPORTS_PER_SOL),
          new anchor.BN(0),
        )
        .accounts({
          payer: depositer,
          owner: depositer,
          from: mintToBeStakedAccount,
          stakePool,
          vault: vaultKey,
          stakeMint,
          destination: stakeMintAccountKey,
          stakeDepositReceipt: stakeReceipt,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .remainingAccounts([
          {
            pubkey: rewardVaultKey,
            isWritable: true,
            isSigner: false,
          },
        ])
        .preInstructions(
          createStakeMintAccountIx ? [createStakeMintAccountIx] : [],
        )
        .rpc();

      console.log("signature,", signature);
    } catch (error) {
      console.log("error", error);
    }

    // Find stake pool address
  };

  async function initSPTokenAccount(data: {
    stakePool: anchor.web3.PublicKey;
  }) {
    if (!wallet || !wallet.publicKey) return;

    const provider = new AnchorProvider(connection, wallet, {});
    setProvider(provider);

    const program = new Program(SplTokenStakingIDL, PROGRAM_ID.toBase58());
    const poolOwner = program.provider.publicKey;
    const accountOwner = program.provider.publicKey;

    // Find LP token address
    const [stakeMint] = anchor.web3.PublicKey.findProgramAddressSync(
      [data.stakePool.toBuffer(), Buffer.from("stakeMint", "utf-8")],
      program.programId,
    );

    // Get associated LP token account
    const stakeMintAccountKey = getAssociatedTokenAddressSync(
      stakeMint,
      poolOwner!,
      false,
      TOKEN_PROGRAM_ID,
    );

    let createStakeMintAccountIx:
      | anchor.web3.TransactionInstruction
      | undefined;

    try {
      await getAccount(program.provider.connection, stakeMintAccountKey);
    } catch (error) {
      if (
        error instanceof TokenAccountNotFoundError ||
        error instanceof TokenInvalidAccountOwnerError
      ) {
        // Create associated LP token account
        createStakeMintAccountIx = createAssociatedTokenAccountInstruction(
          accountOwner!,
          stakeMintAccountKey,
          accountOwner!,
          stakeMint,
          TOKEN_PROGRAM_ID,
        );
      } else {
        throw error;
      }
    }

    return {
      stakeMint,
      stakeMintAccountKey,
      createStakeMintAccountIx,
    };
  }

  return (
    <>
      <button disabled={loading} onClick={handleDeposit}>
        Deposit
      </button>
    </>
  );
};
export default Deposit;
