import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LendingPool, Pool } from "../types/lending_pool";
import { PublicKey, Keypair } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";

async function main() {
  console.log("🚀 Deploying Cross-Chain Lending Pool on Solana...");

  // Configure the client to use the devnet cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.LendingPool as Program<LendingPool>;
  const deployer = provider.wallet;

  console.log("📡 Cluster:", provider.connection.rpcEndpoint);
  console.log("👤 Deployer:", deployer.publicKey.toString());

  // Get program ID
  console.log("🏗️ Program ID:", program.programId.toString());

  // Deploy and initialize the program
  const admin = deployer.publicKey;
  const ccipProgram = new PublicKey("11111111111111111111111111111111"); // Placeholder

  // Derive pool PDA
  const [poolAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool")],
    program.programId
  );

  try {
    // Initialize the lending pool
    console.log("\n🏦 Initializing Lending Pool...");
    const initTx = await program.methods
      .initialize(admin, ccipProgram)
      .accounts({
        pool: poolAccount,
        admin: admin,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Pool initialized:", initTx);
    console.log("🏦 Pool Address:", poolAccount.toString());

    // Verify initialization
    const poolState = await program.account.pool.fetch(poolAccount) as Pool;
    console.log("✅ Pool State:");
    console.log("  - Admin:", poolState.admin.toString());
    console.log("  - CCIP Program:", poolState.ccipProgram.toString());
    console.log("  - Is Paused:", poolState.isPaused);
    console.log("  - Total Assets:", poolState.totalAssets);

    console.log("\n🎉 Deployment Complete!");
    console.log("=".repeat(60));
    console.log("📋 Contract Information:");
    console.log("=".repeat(60));
    console.log(`🏦 Program ID: ${program.programId.toString()}`);
    console.log(`🏦 Pool Address: ${poolAccount.toString()}`);
    console.log(`👤 Admin: ${admin.toString()}`);
    console.log("=".repeat(60));

    console.log("\n🔍 Next Steps:");
    console.log("1. Add supported assets using addSupportedAsset instruction");
    console.log("2. Configure Chainlink price feeds");
    console.log("3. Set up cross-chain CCIP integration");
    console.log("4. Test basic functionality with test tokens");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
