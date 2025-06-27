# 🌐 CrossChain.io - Cross-Chain DeFi Lending Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.19-blue)](https://soliditylang.org/)
[![Chainlink](https://img.shields.io/badge/Chainlink-CCIP-blue)](https://chain.link/)

A decentralized cross-chain lending and borrowing protocol built with Chainlink CCIP, enabling users to deposit collateral on one blockchain and borrow synthetic assets on another.

## 🚀 **LIVE DEPLOYMENT STATUS**

### ✅ **Sepolia Testnet (LIVE)**
- **Network**: Ethereum Sepolia Testnet (Chain ID: 11155111)
- **Deployment Date**: June 27, 2025
- **Status**: 🟢 **ACTIVE**

#### 📋 **Contract Addresses**
```
LendingPool:        0xDD5c505d69703230CFFfA1307753923302CEb586
SyntheticAsset:     0x7b0d1FCC2e4839Ae10a7F936bB2FFd411237068e
ChainlinkPriceFeed: 0x63efCbA94D2A1A4a9dF59A6e73514E0348ED31ff
Permissions:        0xEAF4ECeBeE04f7D10c47ff31d152a82596D90800
RateLimiter:        0xb6CCE115d1535693C8e60F62DB6B11DCC0e93BDf
LiquidationManager: 0x3b9340C9cC41Fe6F22eF05B555641DC6D7F70c83
ChainlinkSecurity:  0xE5B92e04bfb0eb8A1905231586326760E1e42855
TimeLock:           0xA5Fc6F5Dfdc2b16cb5570404069310366f482204
```

#### 🔗 **Etherscan Links**
- [LendingPool Contract](https://sepolia.etherscan.io/address/0xDD5c505d69703230CFFfA1307753923302CEb586)
- [USDC Synthetic Asset](https://sepolia.etherscan.io/address/0x7b0d1FCC2e4839Ae10a7F936bB2FFd411237068e)

## 🏗️ **Architecture Overview**

### **Multi-Chain Design**
- **EVM Chains**: Ethereum, Polygon, Arbitrum, Optimism
- **Solana**: Native Solana program integration
- **Cross-Chain**: Chainlink CCIP for secure message passing

### **Core Components**
1. **LendingPool**: Main contract for deposits and borrows
2. **SyntheticAssets**: Cross-chain synthetic tokens (sUSDC, sETH, etc.)
3. **ChainlinkPriceFeed**: Real-time price oracles
4. **ChainlinkSecurity**: Cross-chain security and validation
5. **LiquidationManager**: Automated liquidation system
6. **Permissions**: Role-based access control
7. **RateLimiter**: Transaction rate limiting for security
8. **TimeLock**: Governance and upgrade delays

## 🛠️ **Technology Stack**

### **Frontend**
- **Framework**: Next.js 15.3.4 with Turbopack
- **UI Library**: shadcn/ui + Tailwind CSS
- **Web3**: wagmi + viem + RainbowKit
- **TypeScript**: Full type safety

### **Smart Contracts**
- **EVM**: Solidity ^0.8.19 + Hardhat
- **Solana**: Rust + Anchor Framework
- **Oracles**: Chainlink Price Feeds
- **Cross-Chain**: Chainlink CCIP

### **Infrastructure**
- **RPC**: Alchemy API
- **Deployment**: Hardhat + Custom Scripts
- **Testing**: Hardhat + Mocha

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ and npm
- Git
- MetaMask or compatible wallet
- Testnet ETH and LINK tokens

### **1. Clone Repository**
```bash
git clone https://github.com/your-username/CrossChain.io.git
cd CrossChain.io
```

### **2. Install Dependencies**
```bash
# Install root dependencies
npm install

# Install EVM contract dependencies
cd contracts/evm
npm install

# Install Solana dependencies (optional)
cd ../solana
npm install
```

### **3. Environment Setup**
```bash
# Copy environment template
cp env-template.txt contracts/evm/.env

# Edit .env with your values:
# - SEPOLIA_RPC_URL: Your Alchemy/Infura API URL
# - PRIVATE_KEY: Your wallet private key (for deployment)
```

### **4. Run Development Server**
```bash
# From project root
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 💼 **Usage Guide**

### **For Users**
1. **Connect Wallet**: Connect MetaMask to Sepolia testnet
2. **Get Testnet Tokens**: Use faucets to get ETH and LINK
3. **Deposit Collateral**: Deposit ETH or supported tokens
4. **Borrow Assets**: Borrow synthetic assets against collateral
5. **Monitor Positions**: Track health factors and liquidation risk
6. **Repay Loans**: Repay borrowed amounts to maintain health

### **For Developers**
1. **Deploy Contracts**: Use provided deployment scripts
2. **Verify Contracts**: Verify on block explorers
3. **Update Frontend**: Update contract addresses in config
4. **Test Integration**: Test with real testnet transactions

## 🔧 **Development Commands**

### **Smart Contracts**
```bash
cd contracts/evm

# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia

# Deploy to Mumbai
npm run deploy:mumbai

# Update frontend config
npm run update-frontend
```

### **Frontend**
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🔐 **Security Features**

### **Smart Contract Security**
- ✅ **ReentrancyGuard**: Prevents reentrancy attacks
- ✅ **AccessControl**: Role-based permissions
- ✅ **TimeLock**: Governance delays for upgrades
- ✅ **RateLimiter**: Transaction rate limiting
- ✅ **PriceOracles**: Chainlink price feeds
- ✅ **Liquidation Protection**: Automated liquidations

### **Cross-Chain Security**
- ✅ **Chainlink CCIP**: Secure cross-chain messaging
- ✅ **Message Validation**: Cryptographic verification
- ✅ **Rate Limiting**: Cross-chain transaction limits
- ✅ **Emergency Pause**: Circuit breaker functionality

## 🌐 **Supported Networks**

### **Live Testnets**
- ✅ **Ethereum Sepolia**: Fully deployed and active
- 🔄 **Polygon Mumbai**: Ready for deployment
- 🔄 **Arbitrum Sepolia**: Ready for deployment

### **Planned Mainnets**
- 🔄 **Ethereum Mainnet**
- 🔄 **Polygon**
- 🔄 **Arbitrum**
- 🔄 **Optimism**
- 🔄 **Solana**

## 📊 **Features**

### **Core Features**
- ✅ Cross-chain lending and borrowing
- ✅ Synthetic asset minting
- ✅ Real-time price feeds
- ✅ Liquidation management
- ✅ Health factor monitoring
- ✅ Multi-chain support

### **Advanced Features**
- ✅ Flash loans (coming soon)
- ✅ Yield farming (coming soon)
- ✅ Governance tokens (coming soon)
- ✅ Insurance pools (coming soon)

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Process**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation**: [docs.crosschain.io](https://docs.crosschain.io)
- **Discord**: [Join our community](https://discord.gg/crosschain)
- **Twitter**: [@CrossChainIO](https://twitter.com/CrossChainIO)
- **Email**: support@crosschain.io

## 🎯 **Roadmap**

### **Q1 2025**
- ✅ Testnet deployment
- ✅ Frontend application
- 🔄 Solana integration
- 🔄 Additional EVM chains

### **Q2 2025**
- 🔄 Mainnet launch
- 🔄 Governance token
- 🔄 Flash loans
- 🔄 Mobile app

### **Q3 2025**
- 🔄 Insurance protocols
- 🔄 Yield farming
- 🔄 NFT collateral
- 🔄 Layer 2 expansion

## ⚠️ **Disclaimer**

This software is in active development and is provided "as is" without warranty. Use at your own risk. Never use private keys or funds you cannot afford to lose on testnets or experimental software.

---

**Built with ❤️ by the CrossChain.io Team**

*Empowering the future of decentralized finance across all blockchains.*
