#!/bin/bash

# 🚀 CROSSCHAIN.IO COMPLETE DEPLOYMENT AUTOMATION
# This script handles the entire deployment process from start to finish

set -e  # Exit on any error

echo "🚀 CROSSCHAIN.IO COMPLETE DEPLOYMENT STARTED"
echo "============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ] || [ ! -d "contracts" ]; then
    print_error "Please run this script from the CrossChain.io project root directory"
    exit 1
fi

print_status "Starting complete deployment process..."

# Phase 1: Pre-deployment checks
echo ""
echo "🔍 PHASE 1: PRE-DEPLOYMENT CHECKS"
echo "=================================="

# Check if .env file exists
if [ ! -f "contracts/evm/.env" ]; then
    print_warning ".env file not found"
    print_info "Creating .env from example..."
    cd contracts/evm
    cp .env.example .env
    print_error "Please edit contracts/evm/.env with your private key and run again"
    print_info "NEVER use mainnet private keys for testnet deployment!"
    exit 1
fi

cd contracts/evm

# Check balances
print_info "Checking wallet balances..."
echo ""
echo "📊 SEPOLIA BALANCE:"
npm run check:sepolia || {
    print_error "Insufficient Sepolia balance or connection failed"
    print_info "Get testnet ETH from: https://sepoliafaucet.com/"
    exit 1
}

echo ""
echo "📊 MUMBAI BALANCE:"
npm run check:mumbai || {
    print_error "Insufficient Mumbai balance or connection failed"
    print_info "Get testnet MATIC from: https://faucet.polygon.technology/"
    exit 1
}

print_status "Pre-deployment checks completed"

# Phase 2: Contract Compilation
echo ""
echo "🔧 PHASE 2: CONTRACT COMPILATION"
echo "================================="

print_info "Compiling smart contracts..."
npx hardhat compile || {
    print_error "Contract compilation failed"
    exit 1
}

print_status "All contracts compiled successfully"

# Phase 3: Deployment
echo ""
echo "🚀 PHASE 3: CONTRACT DEPLOYMENT"
echo "==============================="

print_info "Deploying to Sepolia testnet..."
npm run deploy:sepolia || {
    print_error "Sepolia deployment failed"
    exit 1
}

print_status "Sepolia deployment completed"

print_info "Deploying to Mumbai testnet..."
npm run deploy:mumbai || {
    print_error "Mumbai deployment failed"
    exit 1
}

print_status "Mumbai deployment completed"

# Phase 4: Frontend Update
echo ""
echo "🎯 PHASE 4: FRONTEND INTEGRATION"
echo "================================="

print_info "Updating frontend with deployed contract addresses..."
npm run update-frontend || {
    print_error "Frontend update failed"
    exit 1
}

print_status "Frontend updated with live contract addresses"

# Phase 5: Frontend Build Test
echo ""
echo "🏗️ PHASE 5: FRONTEND BUILD TEST"
echo "==============================="

cd ../..

print_info "Testing frontend build with live contracts..."
npm run build || {
    print_error "Frontend build failed with live contracts"
    exit 1
}

print_status "Frontend builds successfully with live contracts"

# Phase 6: Summary
echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "====================================="

# Display deployment summary
cd ../contracts/evm

if [ -f "deployments/sepolia-11155111.json" ]; then
    echo ""
    echo "📋 SEPOLIA DEPLOYMENT:"
    echo "======================"
    SEPOLIA_LENDING_POOL=$(cat deployments/sepolia-11155111.json | grep -o '"lendingPool":"[^"]*' | cut -d'"' -f4)
    SEPOLIA_DEPLOYER=$(cat deployments/sepolia-11155111.json | grep -o '"deployer":"[^"]*' | cut -d'"' -f4)
    echo "🏦 LendingPool: $SEPOLIA_LENDING_POOL"
    echo "👤 Deployer: $SEPOLIA_DEPLOYER"
    echo "🔗 Explorer: https://sepolia.etherscan.io/address/$SEPOLIA_LENDING_POOL"
fi

if [ -f "deployments/mumbai-80001.json" ]; then
    echo ""
    echo "📋 MUMBAI DEPLOYMENT:"
    echo "===================="
    MUMBAI_LENDING_POOL=$(cat deployments/mumbai-80001.json | grep -o '"lendingPool":"[^"]*' | cut -d'"' -f4)
    MUMBAI_DEPLOYER=$(cat deployments/mumbai-80001.json | grep -o '"deployer":"[^"]*' | cut -d'"' -f4)
    echo "🏦 LendingPool: $MUMBAI_LENDING_POOL"
    echo "👤 Deployer: $MUMBAI_DEPLOYER"
    echo "🔗 Explorer: https://mumbai.polygonscan.com/address/$MUMBAI_LENDING_POOL"
fi

echo ""
echo "🚀 NEXT STEPS:"
echo "=============="
echo "1. 🔗 Setup Chainlink VRF subscriptions:"
echo "   • Sepolia: https://vrf.chain.link/sepolia"
echo "   • Mumbai: https://vrf.chain.link/mumbai"
echo ""
echo "2. ⚙️  Setup Chainlink Automation upkeeps:"
echo "   • Sepolia: https://automation.chain.link/sepolia"
echo "   • Mumbai: https://automation.chain.link/mumbai"
echo ""
echo "3. 💰 Fund contracts with LINK tokens:"
echo "   • Get LINK: https://faucets.chain.link/"
echo ""
echo "4. 🌐 Deploy frontend to hosting platform:"
echo "   • Vercel: vercel.com"
echo "   • Netlify: netlify.com"
echo ""
echo "5. 🧪 Test all functionality:"
echo "   • Connect wallet to Sepolia/Mumbai"
echo "   • Test deposits, borrowing, cross-chain transfers"
echo "   • Monitor transactions on block explorers"
echo ""
echo "6. 📢 Share with community:"
echo "   • Twitter/X announcement"
echo "   • Discord communities"
echo "   • Reddit posts"
echo ""

print_status "Your CrossChain.io protocol is now LIVE on testnets! 🎉"

echo ""
echo "🎯 LIVE PROTOCOL URLS:"
echo "====================="
echo "📱 Frontend: Deploy to get public URL"
echo "🔗 Sepolia Explorer: https://sepolia.etherscan.io/"
echo "🔗 Mumbai Explorer: https://mumbai.polygonscan.com/"
echo ""

print_info "Deployment completed in $(date)"
print_status "Ready for real user testing and community engagement!"

echo ""
echo "💎 You've built something REAL that people can actually use!"
echo "🚀 Time to get users and validate your protocol!" 
