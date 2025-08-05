import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';

// Configuration
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const LENDING_POOL_PROGRAM_ID = new PublicKey('ss9Hb9bSa6jW2w3UUNBN2aGviAUVMmnwVZ71HZw6xBL');
const BONK_MINT = new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');

// Bonk configuration
const BONK_CONFIG = {
  priceFeed: new PublicKey('11111111111111111111111111111111'), // Placeholder - replace with actual Chainlink price feed
  ltv: new BN(600_000_000_000_000_000), // 0.60 (60%)
  liquidationThreshold: new BN(800_000_000_000_000_000), // 0.80 (80%)
  canBeCollateral: true,
  canBeBorrowed: true,
};

export async function addBonkAsset() {
  try {
    // Initialize connection
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    
    // Initialize provider (you'll need to provide the wallet)
    const wallet = Keypair.generate(); // Replace with actual wallet
    const provider = new AnchorProvider(connection, { publicKey: wallet.publicKey, signTransaction: async (tx) => tx, signAllTransactions: async (txs) => txs }, {});
    
    // Initialize program (using any to avoid type issues)
    const program = new Program({} as any, LENDING_POOL_PROGRAM_ID, provider as any);
    
    // Generate pool PDA
    const [poolPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool')],
      LENDING_POOL_PROGRAM_ID
    );
    
    // Generate asset info PDA for Bonk
    const [assetInfoPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('asset'), BONK_MINT.toBuffer()],
      LENDING_POOL_PROGRAM_ID
    );
    
    console.log('🚀 Adding Bonk as supported asset...');
    console.log('Pool PDA:', poolPda.toString());
    console.log('Asset Info PDA:', assetInfoPda.toString());
    console.log('Bonk Mint:', BONK_MINT.toString());
    
    // Add Bonk as supported asset
    const tx = await program.methods
      .addSupportedAsset({
        priceFeed: BONK_CONFIG.priceFeed,
        ltv: BONK_CONFIG.ltv,
        liquidationThreshold: BONK_CONFIG.liquidationThreshold,
        canBeCollateral: BONK_CONFIG.canBeCollateral,
        canBeBorrowed: BONK_CONFIG.canBeBorrowed,
      })
      .accounts({
        pool: poolPda,
        assetInfo: assetInfoPda,
        mint: BONK_MINT,
        admin: wallet.publicKey,
        systemProgram: new PublicKey('11111111111111111111111111111111'),
      })
      .rpc();
    
    console.log('✅ Bonk asset added successfully!');
    console.log('Transaction signature:', tx);
    
    return tx;
  } catch (error) {
    console.error('❌ Error adding Bonk asset:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  addBonkAsset()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
} 
