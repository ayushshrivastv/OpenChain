# Cross-Chain Lending Protocol - EVM Contracts

A comprehensive DeFi lending and borrowing protocol that enables cross-chain operations using Chainlink CCIP. Users can deposit collateral on one blockchain and borrow assets on another, all through a unified account system.

## 🌟 Features

- **Cross-Chain Lending & Borrowing**: Deposit on Ethereum, borrow on Polygon (or vice versa)
- **Unified Account System**: Single position tracking across multiple chains
- **Chainlink CCIP Integration**: Secure cross-chain messaging and asset transfers
- **Real-time Price Feeds**: Chainlink oracles for accurate asset pricing
- **Comprehensive Risk Management**: Health factors, liquidation protection, and monitoring
- **Advanced Security**: Rate limiting, permissions, emergency controls
- **Upgradeable Architecture**: Future-proof protocol evolution

## 📋 Supported Assets (MVP)

- **USDC**: Cross-chain stable borrowing
- **WETH**: Ethereum-based collateral and borrowing
- **SOL**: Solana integration (via synthetic representation)

## 🏗️ Architecture

### Core Contracts

1. **LendingPool.sol** - Main protocol logic
   - Deposit/withdraw collateral
   - Cross-chain borrowing via CCIP
   - Position management and health factor tracking
   - Emergency controls and upgradability

2. **ChainlinkPriceFeed.sol** - Price oracle integration
   - Multiple price feed support
   - Staleness checks and fallback mechanisms
   - Normalized 18-decimal pricing

3. **LiquidationManager.sol** - Liquidation engine
   - Automated liquidation detection
   - Optimal liquidation calculations
   - Liquidator incentives and bonuses

4. **RateLimiter.sol** - Transaction rate limiting
   - Multiple limiting algorithms (fixed window, sliding window, token bucket)
   - Per-user and global limits
   - Emergency mode controls

5. **Permissions.sol** - Access control system
   - Role-based permissions
   - Multi-signature operations
   - Time-locked admin functions

6. **SyntheticAsset.sol** - Cross-chain asset representation
   - Mintable/burnable ERC20 tokens
   - Represents borrowed assets on destination chains

## 🌐 Supported Networks

### Testnet Deployment
- **Ethereum Sepolia**: Primary testnet for development
- **Polygon Mumbai**: Secondary testnet for cross-chain testing

### Mainnet Support (Planned)
- **Ethereum Mainnet**
- **Polygon**
- **Arbitrum**
- **Optimism**

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Network Configuration
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Private Keys
SEPOLIA_PRIVATE_KEY=your_sepolia_private_key_here
MUMBAI_PRIVATE_KEY=your_mumbai_private_key_here

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
```

### Deployment

```bash
# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia

# Deploy to Mumbai
npm run deploy:mumbai

# Verify contracts (after deployment)
npm run verify:sepolia
npm run verify:mumbai
```

### Testing

```bash
# Run all tests
npm test

# Run tests with gas reporting
npm run gas-report

# Check contract sizes
npm run size

# Generate coverage report
npm run coverage
```

## 📊 Protocol Parameters

### Risk Management
- **Maximum LTV**: 75%
- **Liquidation Threshold**: 95%
- **Liquidation Bonus**: 5%
- **Minimum Health Factor**: 1.0

### Rate Limiting
- **Deposit Rate Limit**: 10 transactions per 15 minutes
- **Borrow Rate Limit**: 5 transactions per 15 minutes
- **Emergency Mode**: Global pause capability

### CCIP Configuration
- **Gas Limit**: 500,000 gas for cross-chain messages
- **Supported Chains**: Sepolia ↔ Mumbai

## 🔗 Chainlink Integration

### CCIP (Cross-Chain Interoperability Protocol)
- **Sepolia Router**: `0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59`
- **Mumbai Router**: `0x1035CabC275068e0F4b745A29CEDf38E13aF41b1`
- **Chain Selectors**: Unique identifiers for cross-chain messaging

### Price Feeds
- **ETH/USD**: Real-time Ethereum price feed
- **USDC/USD**: Stable coin price verification
- **MATIC/USD**: Polygon native token pricing

## 🔐 Security Features

### Access Control
- **Role-based permissions**: Admin, Operator, Liquidator, Emergency roles
- **Multi-signature operations**: Critical functions require multiple approvals
- **Time-locked operations**: 24-hour delay for sensitive changes

### Risk Management
- **Health factor monitoring**: Real-time position health tracking
- **Automatic liquidations**: Liquidation bots can trigger when positions become unhealthy
- **Emergency pause**: Protocol can be paused in case of emergencies

### Rate Limiting
- **Per-user limits**: Prevent spam and abuse
- **Global limits**: Protocol-wide safety measures
- **Dynamic thresholds**: Configurable based on market conditions

## 💧 Liquidation System

### Liquidation Triggers
- Health factor < 0.95 (95%)
- Real-time monitoring via Chainlink price feeds
- Automatic liquidation bot support

### Liquidation Process
1. **Detection**: Monitor positions for health factor violations
2. **Calculation**: Determine optimal debt repayment and collateral seizure
3. **Execution**: Transfer debt repayment and collateral with liquidation bonus
4. **Updates**: Recalculate position health and update system state

### Liquidator Incentives
- **5% liquidation bonus**: Reward for maintaining protocol health
- **Gas cost coverage**: Efficient liquidation transactions
- **MEV protection**: Fair liquidation ordering

## 🛠️ Development

### Project Structure
```
contracts/
├── evm/
│   ├── contracts/          # Solidity smart contracts
│   ├── scripts/           # Deployment and setup scripts
│   ├── test/              # Contract tests
│   ├── hardhat.config.js  # Hardhat configuration
│   └── package.json       # Dependencies and scripts
└── solana/               # Solana program (separate integration)
```

### Development Commands

```bash
# Compile contracts
npm run compile

# Clean artifacts
npm run clean

# Lint Solidity code
npm run lint
npm run lint:fix

# Run specific test file
npx hardhat test test/LendingPool.test.js

# Fork mainnet for testing
npx hardhat node --fork https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
```

### Contract Verification

After deployment, verify contracts on block explorers:

```bash
# Verify LendingPool implementation
npx hardhat verify --network sepolia LENDING_POOL_ADDRESS

# Verify price feed contract
npx hardhat verify --network sepolia PRICE_FEED_ADDRESS

# Verify synthetic assets
npx hardhat verify --network sepolia SYNTHETIC_USDC_ADDRESS "Synthetic USDC" "sUSDC"
```

## 📈 Usage Examples

### User Flow: Cross-Chain Borrowing

1. **Deposit Collateral** (Ethereum Sepolia)
```javascript
await lendingPool.deposit(USDC_ADDRESS, ethers.parseUnits("1000", 6));
```

2. **Borrow Cross-Chain** (Receive on Polygon Mumbai)
```javascript
await lendingPool.borrow(
  WETH_ADDRESS,
  ethers.parseEther("0.5"),
  MUMBAI_CHAIN_SELECTOR,
  receiverAddress
);
```

3. **Monitor Position**
```javascript
const position = await lendingPool.getUserPosition(userAddress);
console.log("Health Factor:", position.healthFactor.toString());
```

4. **Repay Debt**
```javascript
await lendingPool.repay(WETH_ADDRESS, ethers.parseEther("0.5"));
```

5. **Withdraw Collateral**
```javascript
await lendingPool.withdraw(USDC_ADDRESS, ethers.parseUnits("1000", 6));
```

### Admin Operations

```javascript
// Add supported asset
await lendingPool.addSupportedAsset(
  tokenAddress,
  priceFeedAddress,
  syntheticTokenAddress,
  ethers.parseEther("0.75"), // 75% LTV
  ethers.parseEther("0.85"), // 85% liquidation threshold
  true, // can be borrowed
  true  // can be collateral
);

// Configure rate limit
await rateLimiter.configureRateLimit(
  "deposit",
  10,    // max requests
  900,   // time window (15 minutes)
  0,     // limit type (FIXED_WINDOW)
  0,     // bucket size (not used)
  0      // refill rate (not used)
);
```

## 🔍 Monitoring and Analytics

### Health Monitoring
- Track protocol TVL (Total Value Locked)
- Monitor individual position health factors
- Alert on liquidation opportunities
- Track cross-chain message success rates

### Key Metrics
- **Total Deposits**: Sum of all collateral across chains
- **Total Borrows**: Sum of all outstanding debt
- **Utilization Rate**: Borrowed / Supplied ratio
- **Liquidation Volume**: Total liquidated value
- **Cross-Chain Activity**: CCIP message frequency and success rate

## 🚨 Emergency Procedures

### Protocol Pause
```javascript
// Emergency pause (admin only)
await lendingPool.pause();

// Resume operations
await lendingPool.unpause();
```

### Emergency Guardian
```javascript
// Set emergency mode (guardian can pause without timelock)
await permissions.setEmergencyMode(true);
```

## 📚 Additional Resources

- [Chainlink CCIP Documentation](https://docs.chain.link/ccip)
- [Chainlink Price Feeds](https://docs.chain.link/data-feeds/price-feeds)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with comprehensive tests
4. Run all tests and linting
5. Submit a pull request

## ⚠️ Disclaimer

**This is experimental software for testnet use only.**

- Never use on mainnet without thorough security review
- Always use official Chainlink contracts and price feeds
- Ensure proper testing before any production deployment
- Follow best practices for key management and access control

## 📄 License

MIT License - see LICENSE file for details.

---

## 🔗 Quick Links

- **Sepolia Faucet**: https://faucets.chain.link/sepolia
- **Mumbai Faucet**: https://faucet.polygon.technology/
- **LINK Faucet**: https://faucets.chain.link/
- **Sepolia Explorer**: https://sepolia.etherscan.io
- **Mumbai Explorer**: https://mumbai.polygonscan.com
