"use client";

import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import Image from 'next/image';
import { useReadContract, useChainId, useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/wagmi';
import { CHAINLINK_PRICE_FEED_ABI } from '@/lib/contracts';
import { DepositModal } from '@/components/DepositModal';
import { getContractAddresses, DeployedContracts } from '../../lib/contracts';

// SVG Logo Components
const EthLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
    <path d="M12 2.9L11.5 3.5V15.9L12 16.4L17.5 13.1L12 2.9Z" fill="white"/>
    <path d="M12 2.9L6.5 13.1L12 16.4V2.9Z" fill="gray"/>
    <path d="M12 17.6L11.6 17.9V21L12 22.1L17.5 14.3L12 17.6Z" fill="white"/>
    <path d="M12 22.1V17.6L6.5 14.3L12 22.1Z" fill="gray"/>
    <path d="M12 16.4L17.5 13.1L12 9.8V16.4Z" fill="silver"/>
    <path d="M6.5 13.1L12 16.4V9.8L6.5 13.1Z" fill="gray"/>
  </svg>
);

const PolygonLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
    <path d="M6.79 7.97a.76.76 0 0 0-.76.76v6.54a.76.76 0 0 0 .76.76h.94v-2.18h-.19V9.48h3.33v1.88h-1.32v.94h1.32v2.54H9.04v2.18h3.8a.76.76 0 0 0 .76-.76V9.48a.76.76 0 0 0-.76-.76h-6.05zm8.43 0a.76.76 0 0 0-.76.76v6.54a.76.76 0 0 0 .76.76h3.8a.76.76 0 0 0 .76-.76V9.48a.76.76 0 0 0-.76-.76h-3.8zm.75 2.18h2.28v3.02h-2.28V10.15z" fill="#8247E5"/>
  </svg>
);

interface LendingProtocolProps {
  networks: string[];
  selectedNetwork: string;
  setSelectedNetwork: Dispatch<SetStateAction<string>>;
}

export function LendingProtocol({ networks, selectedNetwork, setSelectedNetwork }: LendingProtocolProps) {
  const [selectedLendingToken, setSelectedLendingToken] = useState<string>('USDC');
  const [tokenPrices, setTokenPrices] = useState<{[key: string]: number}>({});
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const chainId = useChainId();
  const { address } = useAccount();

  // Get ETH balance for native token
  const { data: ethBalance } = useBalance({
    address: address,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    }
  });

  // Get USDC balance
  const { data: usdcBalance } = useBalance({
    address: address,
    token: '0x77036167D0b74Fb82BA5966a507ACA06C5E16B30' as `0x${string}`,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    }
  });

  // Get WETH balance
  const { data: wethBalance } = useBalance({
    address: address,
    token: '0x39CdAe9f7Cb7e06A165f8B4C6864850cCef5CC44' as `0x${string}`,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    }
  });

  // Get contract addresses for current chain (only EVM chains have price feeds)
  const contractAddresses = chainId && chainId !== 31337 && chainId !== 11155111 ? 
    CONTRACT_ADDRESSES[11155111] : // Default to Sepolia
    CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[11155111];

  // Only fetch prices for EVM chains
  const isEvmChain = chainId === 31337 || chainId === 11155111;

  // Real-time Chainlink Price Feed Contract Calls (EVM only)
  // ETH Price (native asset, address 0x0)
  const { data: ethPrice, isLoading: ethLoading } = useReadContract({
    address: isEvmChain && contractAddresses && 'priceFeed' in contractAddresses ? contractAddresses.priceFeed as `0x${string}` : undefined,
    abi: CHAINLINK_PRICE_FEED_ABI,
    functionName: 'getSafePrice',
    args: ['0x0000000000000000000000000000000000000000'], // ETH native address
    query: {
      refetchInterval: 10000, // Refetch every 10 seconds
      enabled: isEvmChain,
    }
  });

  // USDC Price
  const { data: usdcPrice, isLoading: usdcLoading } = useReadContract({
    address: isEvmChain && contractAddresses && 'priceFeed' in contractAddresses ? contractAddresses.priceFeed as `0x${string}` : undefined,
    abi: CHAINLINK_PRICE_FEED_ABI,
    functionName: 'getSafePrice',
    args: [isEvmChain && contractAddresses && 'synthUSDC' in contractAddresses ? contractAddresses.synthUSDC as `0x${string}` : '0x0000000000000000000000000000000000000000'],
    query: {
      refetchInterval: 10000,
      enabled: isEvmChain,
    }
  });

  // WETH Price (same as ETH)
  const { data: wethPrice, isLoading: wethLoading } = useReadContract({
    address: isEvmChain && contractAddresses && 'priceFeed' in contractAddresses ? contractAddresses.priceFeed as `0x${string}` : undefined,
    abi: CHAINLINK_PRICE_FEED_ABI,
    functionName: 'getSafePrice',
    args: [isEvmChain && contractAddresses && 'synthWETH' in contractAddresses ? contractAddresses.synthWETH as `0x${string}` : '0x0000000000000000000000000000000000000000'],
    query: {
      refetchInterval: 10000,
      enabled: isEvmChain,
    }
  });

  // Process contract price data and update state
  useEffect(() => {
    const processContractPrices = async () => {
      const newPrices: {[key: string]: number} = {};

      if (isEvmChain) {
        // Process ETH price (18 decimals from contract)
        if (ethPrice && Array.isArray(ethPrice)) {
          const [price, isStale] = ethPrice as [bigint, boolean];
          if (!isStale && price > 0n) {
            newPrices.ETH = Number(price) / 1e18; // Convert from 18 decimals
          }
        }

        // Process USDC price
        if (usdcPrice && Array.isArray(usdcPrice)) {
          const [price, isStale] = usdcPrice as [bigint, boolean];
          if (!isStale && price > 0n) {
            newPrices.USDC = Number(price) / 1e18;
          }
        }

        // Process WETH price (same as ETH)
        if (wethPrice && Array.isArray(wethPrice)) {
          const [price, isStale] = wethPrice as [bigint, boolean];
          if (!isStale && price > 0n) {
            newPrices.WETH = Number(price) / 1e18;
          }
        }
      }

      // Fetch prices for non-EVM chains or fallback
      try {
        const coingeckoIds = [];
        if (selectedNetwork === 'Solana' || !isEvmChain) {
          coingeckoIds.push('solana');
        }
        if (!newPrices.ETH) coingeckoIds.push('ethereum');
        if (!newPrices.USDC) coingeckoIds.push('usd-coin');

        if (coingeckoIds.length > 0) {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds.join(',')}&vs_currencies=usd`
          );
      const data = await response.json();

          if (selectedNetwork === 'Solana' || !isEvmChain) {
            newPrices.SOL = data.solana?.usd || 180;
          }
          if (!newPrices.ETH) {
            newPrices.ETH = data.ethereum?.usd || 3200;
            newPrices.WETH = newPrices.ETH; // WETH same as ETH
          }
          if (!newPrices.USDC) {
            newPrices.USDC = data['usd-coin']?.usd || 1.00;
          }
        }
      } catch (error) {
        console.error('Fallback price fetch error:', error);
        // Hard fallback prices
        if (selectedNetwork === 'Solana' || !isEvmChain) {
          newPrices.SOL = 180;
        }
        if (!newPrices.ETH) {
          newPrices.ETH = 3200;
          newPrices.WETH = 3200;
        }
        if (!newPrices.USDC) {
          newPrices.USDC = 1.00;
        }
      }

      setTokenPrices(prev => ({ ...prev, ...newPrices }));
    };

    processContractPrices();
  }, [ethPrice, usdcPrice, wethPrice, selectedNetwork, isEvmChain]);

  // Loading state
  const pricesLoading = ethLoading || usdcLoading || wethLoading;

  // Helper function to format balance
  const formatTokenBalance = (balance: { value?: bigint } | undefined) => {
    if (!balance || !balance.value) return '0.0000';
    return parseFloat(formatEther(balance.value)).toFixed(4);
  };

  // Get deployed smart contract tokens based on actual OpenChain protocol deployments
  const getNetworkTokens = () => {
    switch (selectedNetwork) {
      case 'ethereum':
      case 'Ethereum':
        // Sepolia Testnet - Your deployed 9-contract infrastructure
        return [
          {
            symbol: 'ETH',
            name: 'Ethereum',
            address: 'native', // Native ETH on Sepolia
            network: 'Sepolia Testnet',
            contractType: 'Native Asset',
            balance: formatTokenBalance(ethBalance),
            price: tokenPrices.ETH || 0,
            crossChainEnabled: true
          },
      {
        symbol: 'USDC',
            name: 'USDC',
            address: '0x77036167D0b74Fb82BA5966a507ACA06C5E16B30', // SyntheticAsset.sol (USDC)
            network: 'Sepolia Testnet',
            contractType: 'SyntheticAsset.sol',
            balance: formatTokenBalance(usdcBalance),
            price: tokenPrices.USDC || 0,
            crossChainEnabled: true
      },
      {
        symbol: 'WETH',
            name: 'Wrapped Ethereum',
            address: '0x39CdAe9f7Cb7e06A165f8B4C6864850cCef5CC44', // SyntheticAsset.sol (WETH)
            network: 'Sepolia Testnet',
            contractType: 'SyntheticAsset.sol',
            balance: formatTokenBalance(wethBalance),
            price: tokenPrices.WETH || 0,
            crossChainEnabled: true
          }
        ];
      
      default:
        // Solana Network - Connected via Chainlink CCIP
        return [
          {
            symbol: 'SOL',
            name: 'Solana',
            address: '46PEhxKNPS6TNy6SHuMBF6eAXR54onGecnLXvv52uwWJ', // Your Solana Program
            network: 'Solana Devnet',
            contractType: 'Rust Program',
            balance: '12.45',
            price: tokenPrices.SOL || 0,
            crossChainEnabled: true
          },
          {
            symbol: 'USDC',
            name: 'USDC',
            address: 'SPL-USDC', // Solana SPL USDC
            network: 'Solana Devnet',
            contractType: 'SPL Token',
            balance: '850.00',
            price: tokenPrices.USDC || 0,
            crossChainEnabled: true
          }
        ];
    }
  };

  return (
    <div className="flex-grow pt-4">
      <h2 className="text-3xl font-bold text-white mb-8">Lending Protocol</h2>

      {/* Network Selector Buttons */}
      <div className="flex items-center space-x-3 mb-6">
        {networks.map((network: string) => (
          <button
            key={network}
            onClick={() => setSelectedNetwork(network)}
            className={`flex items-center justify-center font-semibold py-2 px-5 rounded-full text-base transition-colors ${
              selectedNetwork === network
                ? 'bg-black text-white p-1 animate-rainbow-border'
                : 'bg-black/50 hover:bg-black/80 text-gray-300'
            }`}
          >
            <span className={`flex items-center justify-center w-full h-full rounded-full ${selectedNetwork === network ? 'bg-black' : ''}`}>
              {network === 'Solana' ? (
                <Image
                  src="/Solana_logo.png"
                  alt="Solana Logo"
                  width={20}
                  height={20}
                  className="mr-2"
                />
              ) : (
                <EthLogo />
              )}
              {network}
            </span>
          </button>
        ))}
      </div>

      {/* Token Selection Insight Box */}
      <div className="relative mb-12">
        {/* Available Collateral tag */}
        <div className="absolute -top-2 left-0 z-10">
          <div className="bg-white text-black font-extrabold px-4 py-2 rounded-t-2xl text-sm tracking-wide">
            Available Chains
          </div>
              </div>
        
        <div className="bg-white/5 rounded-2xl p-6 pt-12">
          <div className="grid grid-cols-3 gap-4">
            {getNetworkTokens().map((token, index) => (
              <div
                  key={token.symbol}
                  onClick={() => setSelectedLendingToken(token.symbol)}
                className={`bg-gradient-to-br from-gray-50 to-gray-100 border-2 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg relative cursor-pointer ${
                    selectedLendingToken === token.symbol
                    ? 'border-blue-500 shadow-xl ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 overflow-hidden">
                      {token.symbol === 'USDC' ? (
                      <Image
                        src="/USDC.png"
                        alt="USDC Logo"
                        width={56}
                        height={56}
                        className="rounded-full"
                      />
                    ) : token.symbol === 'WETH' || token.symbol === 'ETH' ? (
                      <Image
                        src="/ethereum-logo.png"
                        alt="Ethereum Logo"
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : token.symbol === 'SOL' ? (
                      <Image
                        src="/Solana_logo.png"
                        alt="Solana Logo"
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : token.symbol === 'MATIC' ? (
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">MATIC</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">{token.symbol}</span>
                      </div>
                    )}
                  </div>
              </div>
              
                <div className="text-left">
                  <div className="text-gray-900 font-bold text-xl mb-1">
                    {token.name}
                  </div>
                  <div className="text-gray-600 text-sm mb-1">{token.symbol}</div>
                  <div className="text-gray-500 text-xs mb-2 font-mono">
                    {token.address === 'native' ? 'native' : 
                     token.address === 'SPL-USDC' ? 'SPL-USDC' :
                     token.address.slice(0, 6) + '...' + token.address.slice(-4)}
              </div>

                  <div className="text-left mt-6">
                    {pricesLoading ? (
                      <div className="animate-pulse">
                        <span className="text-4xl font-bold text-gray-500">Loading...</span>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl font-bold text-gray-900 mb-3">
                          ${token.price.toLocaleString('en-US', {
                            minimumFractionDigits: token.symbol === 'USDC' ? 2 : 0,
                            maximumFractionDigits: token.symbol === 'USDC' ? 2 : 0
                          })}
                        </div>
                        
                        <div className="flex items-center justify-end">
                          {selectedLendingToken === token.symbol && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card selection
                                setIsDepositModalOpen(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 px-6 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              Deposit
                            </button>
                          )}
                    </div>
                  </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

       {/* Feature Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-16">
        {/* Card 1: Supply Collateral */}
        <div className="bg-[#F9DDC7] p-8 rounded-2xl text-[#031138] flex flex-col justify-between shadow-xl transition-transform hover:scale-105">
          <div>
            <h2 className="text-4xl font-extrabold mb-4">Supply & Earn</h2>
            <p className="text-lg mb-6">Supply assets on their native chain (e.g., ETH on Ethereum) to earn competitive yield. Your collateral is never bridged, maximizing security and capital efficiency.</p>
          </div>
          <button className="bg-white text-[#031138] font-bold py-3 px-6 rounded-lg self-start mt-4">
            SUPPLY ASSETS
          </button>
        </div>

        {/* Card 2: Borrow Across Chains */}
        <div className="bg-[#F9DDC7] p-8 rounded-2xl text-[#031138] flex flex-col justify-between shadow-xl transition-transform hover:scale-105">
          <div>
            <h2 className="text-4xl font-extrabold mb-4">Borrow Instantly</h2>
            <p className="text-lg mb-6">Use your collateral on one chain to instantly borrow on another, like supplying ETH on Ethereum to borrow USDC on Solana. Access liquidity where you need it, without bridging fees, powered by Chainlink CCIP.</p>
          </div>
          <button className="bg-white text-[#031138] font-bold py-3 px-6 rounded-lg self-start mt-4">
            BORROW NOW
          </button>
        </div>
      </div>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        token={getNetworkTokens().find(t => t.symbol === selectedLendingToken) || getNetworkTokens()[0]}
      />
    </div>
  );
}
