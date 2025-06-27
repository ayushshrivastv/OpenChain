# 🚀 CrossChain.io Testnet Deployment Guide
## Immediate Testnet Launch Instructions

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### **✅ Required Setup (Complete these first)**

#### **1. Get Testnet ETH & MATIC**
- **Sepolia ETH**: https://sepoliafaucet.com/
- **Mumbai MATIC**: https://faucet.polygon.technology/

#### **2. Get RPC URLs**
- **Infura**: https://infura.io/ (Free tier sufficient)
- **Alchemy**: https://alchemy.com/ (Alternative)

#### **3. Create Deployment Wallet**
```bash
# Generate a new wallet ONLY for testnet deployment
# NEVER use mainnet wallets for testnet deployment
# Use MetaMask or any wallet to generate a new private key
```

#### **4. Get API Keys (Optional - for verification)**
- **Etherscan**: https://etherscan.io/apis
- **Polygonscan**: https://polygonscan.com/apis

---

## 🔧 **ENVIRONMENT SETUP**

### **Create .env file in contracts/evm/**
```bash
# Copy this template and fill in your values:

# RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
MUMBAI_RPC_URL=https://polygon-mumbai.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Private Keys (TESTNET ONLY!)
SEPOLIA_PRIVATE_KEY=your_testnet_private_key_here
MUMBAI_PRIVATE_KEY=your_testnet_private_key_here

# API Keys (Optional)
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

---

## 🚀 **DEPLOYMENT COMMANDS**

### **1. Deploy to Sepolia Testnet**
```bash
cd contracts/evm
npx hardhat run scripts/deploy-testnet.ts --network sepolia
```

### **2. Deploy to Mumbai Testnet**
```bash
npx hardhat run scripts/deploy-testnet.ts --network mumbai
```

### **3. Verify Contracts (After deployment)**
```bash
# The deployment script will output verification commands like:
npx hardhat verify --network sepolia CONTRACT_ADDRESS
npx hardhat verify --network mumbai CONTRACT_ADDRESS
```

---

## 📊 **EXPECTED DEPLOYMENT OUTPUT**

```bash
🚀 Starting CrossChain.io Testnet Deployment...
============================================================
📡 Network: sepolia
🔗 Chain ID: 11155111
👤 Deployer: 0x1234...
💰 Balance: 0.5 ETH
🔗 CCIP Router: 0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59
🔗 LINK Token: 0x779877A7B0D9E8603169DdbD7836e478b4624789

📊 Deploying ChainlinkPriceFeed...
✅ ChainlinkPriceFeed deployed to: 0xABC123...

🔐 Deploying Permissions...
✅ Permissions deployed to: 0xDEF456...

⏱️ Deploying RateLimiter...
✅ RateLimiter deployed to: 0xGHI789...

💧 Deploying LiquidationManager...
✅ LiquidationManager deployed to: 0xJKL012...

🏦 Deploying LendingPool (Upgradeable)...
✅ LendingPool deployed to: 0xMNO345...

🪙 Deploying Synthetic USDC...
✅ Synthetic USDC deployed to: 0xPQR678...

🪙 Deploying Synthetic WETH...
✅ Synthetic WETH deployed to: 0xSTU901...

⚙️ Setting up initial configurations...
🔗 Adding supported chain: Mumbai (12532609583862916517)
💰 Adding supported assets...
⏱️ Configuring rate limits...
💧 Configuring liquidation settings...

🎉 Deployment Complete!
============================================================
📋 Contract Addresses:
============================================================
🏦 LendingPool: 0xMNO345...
📊 ChainlinkPriceFeed: 0xABC123...
🔐 Permissions: 0xDEF456...
⏱️ RateLimiter: 0xGHI789...
💧 LiquidationManager: 0xJKL012...
🪙 Synthetic USDC: 0xPQR678...
🪙 Synthetic WETH: 0xSTU901...
============================================================

💾 Deployment info saved to: deployments/sepolia-1234567890.json
🎨 Frontend config saved to: ../../CrossChain/src/config/sepolia-contracts.json
```

---

## 🔗 **DEPLOYED CONTRACT ADDRESSES**

### **Sepolia Testnet (Chain ID: 11155111)**
```json
{
  "lendingPool": "TO_BE_DEPLOYED",
  "priceFeed": "TO_BE_DEPLOYED",
  "permissions": "TO_BE_DEPLOYED",
  "rateLimiter": "TO_BE_DEPLOYED",
  "liquidationManager": "TO_BE_DEPLOYED",
  "syntheticAssets": {
    "USDC": "TO_BE_DEPLOYED",
    "WETH": "TO_BE_DEPLOYED"
  },
  "ccip": {
    "router": "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
    "linkToken": "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    "chainSelector": "16015286601757825753"
  }
}
```

### **Mumbai Testnet (Chain ID: 80001)**
```json
{
  "lendingPool": "TO_BE_DEPLOYED",
  "priceFeed": "TO_BE_DEPLOYED",
  "permissions": "TO_BE_DEPLOYED",
  "rateLimiter": "TO_BE_DEPLOYED",
  "liquidationManager": "TO_BE_DEPLOYED",
  "syntheticAssets": {
    "USDC": "TO_BE_DEPLOYED",
    "WETH": "TO_BE_DEPLOYED"
  },
  "ccip": {
    "router": "0x1035CabC275068e0F4b745A29CEDf38E13aF41b1",
    "linkToken": "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
    "chainSelector": "12532609583862916517"
  }
}
```

---

## 🎨 **FRONTEND INTEGRATION**

### **Automatic Configuration**
The deployment script automatically creates frontend configuration files:
- `CrossChain/src/config/sepolia-contracts.json`
- `CrossChain/src/config/mumbai-contracts.json`

### **Manual Integration (if needed)**
Update `CrossChain/src/lib/wagmi.ts` with deployed addresses:

```typescript
export const CONTRACT_ADDRESSES = {
  11155111: { // Sepolia
    lendingPool: "0xDEPLOYED_ADDRESS",
    priceFeed: "0xDEPLOYED_ADDRESS",
    // ... other contracts
  },
  80001: { // Mumbai
    lendingPool: "0xDEPLOYED_ADDRESS",
    priceFeed: "0xDEPLOYED_ADDRESS",
    // ... other contracts
  }
};
```

---

## 🧪 **POST-DEPLOYMENT TESTING**

### **1. Verify Deployment**
```bash
# Check contract on block explorer
# Sepolia: https://sepolia.etherscan.io/
# Mumbai: https://mumbai.polygonscan.com/
```

### **2. Test Frontend Integration**
```bash
cd ../../CrossChain
npm run dev
# Open http://localhost:3000
# Connect wallet to Sepolia/Mumbai
# Test basic functionality
```

### **3. Test Cross-Chain Functionality**
1. **Deposit** on Sepolia
2. **Borrow** cross-chain to Mumbai
3. **Repay** on Mumbai
4. **Withdraw** back to Sepolia

---

## 🔗 **CHAINLINK CCIP CONFIGURATION**

### **Official Testnet Addresses (Pre-configured)**
```javascript
// Sepolia
CCIP_Router: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59"
LINK_Token: "0x779877A7B0D9E8603169DdbD7836e478b4624789"
Chain_Selector: "16015286601757825753"

// Mumbai
CCIP_Router: "0x1035CabC275068e0F4b745A29CEDf38E13aF41b1"
LINK_Token: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB"
Chain_Selector: "12532609583862916517"
```

### **Fund Contracts with LINK**
```bash
# Get testnet LINK tokens
# Sepolia: https://faucets.chain.link/sepolia
# Mumbai: https://faucets.chain.link/polygon-mumbai

# Send LINK to deployed LendingPool contracts for CCIP fees
```

---

## 🛠️ **TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **1. "Insufficient funds for gas"**
```bash
# Solution: Get more testnet ETH/MATIC from faucets
```

#### **2. "Network not supported"**
```bash
# Solution: Check hardhat.config.ts network configuration
# Ensure RPC URLs are correct
```

#### **3. "Contract verification failed"**
```bash
# Solution: Wait a few minutes after deployment
# Ensure constructor arguments match deployment
```

#### **4. "CCIP message failed"**
```bash
# Solution: Ensure contracts have LINK tokens
# Check supported chain configurations
```

### **Debug Commands**
```bash
# Check network connection
npx hardhat console --network sepolia

# Verify contract deployment
npx hardhat verify --network sepolia CONTRACT_ADDRESS

# Check contract balance
npx hardhat run scripts/check-balance.ts --network sepolia
```

---

## 📈 **MONITORING & ANALYTICS**

### **Block Explorers**
- **Sepolia**: https://sepolia.etherscan.io/
- **Mumbai**: https://mumbai.polygonscan.com/

### **CCIP Explorer**
- **Chainlink CCIP**: https://ccip.chain.link/

### **Transaction Monitoring**
```bash
# Monitor deployment transactions
# Check contract interactions
# Verify cross-chain messages
```

---

## 🚀 **IMMEDIATE DEPLOYMENT STEPS**

### **RIGHT NOW - Execute These Commands:**

```bash
# 1. Set up environment
cd contracts/evm
cp .env.example .env
# Edit .env with your values

# 2. Deploy to Sepolia
npx hardhat run scripts/deploy-testnet.ts --network sepolia

# 3. Deploy to Mumbai  
npx hardhat run scripts/deploy-testnet.ts --network mumbai

# 4. Update frontend
cd ../../CrossChain
npm run build
npm run dev

# 5. Test the application
# Open http://localhost:3000
# Connect wallet and test functionality
```

---

## 🎯 **SUCCESS CRITERIA**

✅ **Deployment Successful When:**
- All contracts deploy without errors
- Frontend builds and runs
- Wallet connection works
- Basic transactions succeed
- Cross-chain messages process
- Block explorer shows contracts

✅ **Ready for Production When:**
- All testnet functionality verified
- Security audit completed
- Documentation finalized
- Monitoring systems active

---

**🚀 Your CrossChain.io protocol is ready for immediate testnet deployment!**

*This guide contains everything needed to deploy and test your DeFi protocol on Sepolia and Mumbai testnets.* 
