# Bonk Integration with Solana Cross-Chain Lending & Borrowing

## Overview

This document outlines the integration of Bonk (BONK) token with the OpenChain cross-chain lending and borrowing protocol on Solana. Bonk is now supported as both collateral and borrowable asset with specific risk parameters optimized for meme tokens.

## 🚀 Features

### Bonk Token Support
- **Token Symbol**: BONK
- **Mint Address**: `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
- **Decimals**: 5
- **Network**: Solana Devnet/Mainnet
- **Cross-Chain Enabled**: ✅

### Risk Parameters
- **Loan-to-Value (LTV)**: 60% (lower than standard tokens due to volatility)
- **Liquidation Threshold**: 80%
- **Minimum Deposit**: 1,000 BONK tokens
- **Health Factor**: 1.0 minimum required

## 🔧 Technical Implementation

### Solana Program Updates

The lending pool program has been enhanced with Bonk-specific logic:

```rust
// Bonk-specific constants
pub const BONK_MINT: &str = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
pub const BONK_DECIMALS: u8 = 5;
pub const BONK_LTV: u64 = 600_000_000_000_000_000; // 0.60 (60%)
pub const BONK_LIQUIDATION_THRESHOLD: u64 = 800_000_000_000_000_000; // 0.80 (80%)
```

### Frontend Integration

The UI components have been updated to support Bonk:

1. **Token Configuration**: Added to `src/lib/tokenConfig.ts`
2. **UI Components**: Updated `BorrowingProtocol.tsx` and `LendingProtocol.tsx`
3. **Logo**: Custom Bonk logo SVG created
4. **Price Integration**: Connected to CoinGecko API

## 📊 Usage Examples

### Depositing Bonk as Collateral

```typescript
// Example: Deposit 10,000 BONK as collateral
const depositAmount = 10000; // BONK tokens
const bonkMint = new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');

await program.methods
  .deposit(new BN(depositAmount))
  .accounts({
    pool: poolPda,
    assetInfo: assetInfoPda,
    mint: bonkMint,
    userTokenAccount: userBonkAccount,
    poolTokenAccount: poolBonkAccount,
    user: wallet.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Borrowing Against Bonk Collateral

```typescript
// Example: Borrow USDC against BONK collateral
const borrowAmount = 100; // USDC amount
const destChain = 1; // Ethereum chain selector

await program.methods
  .borrowCrossChain(
    new BN(borrowAmount * 1e6), // USDC has 6 decimals
    new BN(destChain),
    receiverAddress
  )
  .accounts({
    pool: poolPda,
    assetInfo: assetInfoPda,
    userPosition: userPositionPda,
    mint: bonkMint,
    priceFeed: priceFeedAccount,
    ccipProgram: ccipProgramId,
    user: wallet.publicKey,
  })
  .rpc();
```

## 🎨 UI Components

### Token Display
- Custom Bonk logo with orange background
- Real-time price display
- Balance tracking
- Health factor monitoring

### Lending Interface
- Deposit BONK as collateral
- Earn yield on BONK deposits
- View collateralization ratio
- Monitor liquidation risk

### Borrowing Interface
- Borrow against BONK collateral
- Cross-chain borrowing support
- Real-time LTV calculations
- Health factor warnings

## 🔒 Security Considerations

### Risk Management
1. **Lower LTV**: 60% vs standard 75% to account for volatility
2. **Higher Liquidation Threshold**: 80% to provide safety buffer
3. **Minimum Deposit**: 1,000 BONK to prevent dust attacks
4. **Rate Limiting**: 15-minute cooldown between operations

### Price Oracle Integration
- Chainlink price feeds for accurate BONK pricing
- Fallback to CoinGecko API
- Stale price detection and handling

## 🚀 Deployment

### Adding Bonk to the Protocol

1. **Deploy the updated Solana program**:
   ```bash
   cd contracts/solana
   anchor build
   anchor deploy
   ```

2. **Add Bonk as supported asset**:
   ```bash
   node scripts/add-bonk-asset.js
   ```

3. **Update frontend configuration**:
   ```bash
   # Add environment variables
   NEXT_PUBLIC_SOLANA_BONK_MINT=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
   ```

### Environment Variables

```bash
# Required for Bonk integration
NEXT_PUBLIC_SOLANA_BONK_MINT=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## 📈 Monitoring & Analytics

### Key Metrics
- Total BONK deposited as collateral
- Total BONK borrowed
- Average LTV for BONK positions
- Liquidation events
- Cross-chain transaction volume

### Health Monitoring
- Real-time health factor tracking
- Liquidation risk alerts
- Price volatility monitoring
- Protocol utilization rates

## 🔄 Cross-Chain Features

### Supported Operations
1. **Deposit BONK on Solana** → **Borrow USDC on Ethereum**
2. **Deposit ETH on Ethereum** → **Borrow BONK on Solana**
3. **Cross-chain collateralization**
4. **Multi-chain position management**

### CCIP Integration
- Chainlink CCIP for cross-chain messaging
- Secure asset bridging
- Atomic cross-chain operations
- Message verification and validation

## 🐛 Troubleshooting

### Common Issues

1. **Insufficient Collateral**
   - Ensure minimum 1,000 BONK deposit
   - Check LTV requirements (60% max)
   - Verify health factor > 1.0

2. **Price Feed Issues**
   - Check Chainlink oracle status
   - Verify price feed account
   - Use fallback price sources

3. **Transaction Failures**
   - Verify sufficient SOL for transaction fees
   - Check account rent requirements
   - Ensure proper account initialization

### Debug Commands

```bash
# Check BONK balance
spl-token balance DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263

# Verify program deployment
solana program show ss9Hb9bSa6jW2w3UUNBN2aGviAUVMmnwVZ71HZw6xBL

# Check account info
solana account <ACCOUNT_ADDRESS>
```

## 📚 Additional Resources

- [Bonk Token Documentation](https://bonkcoin.com/)
- [Solana Program Development](https://docs.solana.com/developing/programming-model/overview)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Chainlink CCIP](https://chainlinkcommunity.com/ccip)

## 🤝 Contributing

To contribute to the Bonk integration:

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request
5. Ensure all tests pass

## 📄 License

This integration is part of the OpenChain project and follows the same licensing terms. 
