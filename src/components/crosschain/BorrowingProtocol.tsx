"use client";

import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import Image from 'next/image';
import { DepositModal } from '@/components/DepositModal';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';

// SVG Logo Components from parent
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

interface BorrowingProtocolProps {
  networks: string[];
  selectedNetwork: string;
  setSelectedNetwork: Dispatch<SetStateAction<string>>;
}

export function BorrowingProtocol({ networks, selectedNetwork, setSelectedNetwork }: BorrowingProtocolProps) {
  const [selectedBorrowingToken, setSelectedBorrowingToken] = useState('USDC');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [userBorrowData, setUserBorrowData] = useState<{
    availableTokens?: Array<{ symbol: string; currentRate: string }>;
    userPositions?: Array<{ token: string }>;
  } | null>(null);
  const [borrowAmount, setBorrowAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Wagmi hooks for wallet integration
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();

  // Contract addresses
  const CONTRACTS = {
    LENDING_POOL: '0x473AC85625b7f9F18eA21d2250ea19Ded1093a99',
    SYNTH_USDC: '0x77036167D0b74Fb82BA5966a507ACA06C5E16B30',
    SYNTH_WETH: '0x39CdAe9f7Cb7e06A165f8B4C6864850cCef5CC44'
  };

        // Enhanced price fetching from Chainlink smart contracts - NO MORE MOCK DATA!
  useEffect(() => {
    const fetchPrices = async () => {
      setPricesLoading(true);
      console.log('🔄 Fetching real-time market prices...');
      try {
        const response = await fetch('/api/token-prices');
                  if (response.ok) {
            const prices = await response.json();
            console.log('✅ Real-time market prices loaded:', prices);
            setTokenPrices(prices);
          } else {
            console.error('❌ Failed to fetch market prices:', response.statusText);
          }
        } catch (error) {
          console.error('❌ Failed to fetch market prices:', error);
      } finally {
        setPricesLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 15000); // Update every 15 seconds for real-time market data
    return () => clearInterval(interval);
  }, []);

  // Fetch user borrow data when wallet is connected
  useEffect(() => {
    const fetchUserBorrowData = async () => {
      if (!address || !isConnected) return;

      try {
        const response = await fetch(`/api/borrow?userAddress=${address}`);
        if (response.ok) {
          const data = await response.json();
          setUserBorrowData(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch user borrow data:', error);
      }
    };

    fetchUserBorrowData();
    if (isConnected) {
      const interval = setInterval(fetchUserBorrowData, 30000);
      return () => clearInterval(interval);
    }
  }, [address, isConnected]);

  const formatTokenBalance = (balance: { value?: bigint; toString?: () => string } | string | undefined) => {
    if (typeof balance === 'string') return balance;
    if (balance?.toString) return balance.toString();
    return balance?.value?.toString() || '0.00';
  };

  // Handle borrow transaction
  const handleBorrow = async (tokenSymbol: string, amount: string) => {
    if (!address || !isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      const token = getNetworkTokens().find(t => t.symbol === tokenSymbol);
      if (!token) throw new Error('Token not found');

      // Call backend API to prepare transaction
      const response = await fetch('/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          tokenAddress: token.address,
          amount: parseEther(amount).toString(),
          action: 'borrow'
        })
      });

      const result = await response.json();
      if (result.success) {
        // In a real implementation, you would use writeContract here
        console.log('Borrow transaction prepared:', result.transactionData);
        alert(`Borrow transaction prepared for ${amount} ${tokenSymbol}`);
        
        // Reset form
        setBorrowAmount('');
        setIsDepositModalOpen(false);
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Borrow error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle repay transaction
  const handleRepay = async (tokenSymbol: string, amount: string) => {
    if (!address || !isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const token = getNetworkTokens().find(t => t.symbol === tokenSymbol);
      if (!token) throw new Error('Token not found');

      const response = await fetch('/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          tokenAddress: token.address,
          amount: parseEther(amount).toString(),
          action: 'repay'
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('Repay transaction prepared:', result.transactionData);
        alert(`Repay transaction prepared for ${amount} ${tokenSymbol}`);
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Repay error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

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
            balance: '2.45',
            price: tokenPrices.ETH || 0,
            crossChainEnabled: true
          },
          {
            symbol: 'USDC',
            name: 'USDC',
            address: '0x77036167D0b74Fb82BA5966a507ACA06C5E16B30', // SyntheticAsset.sol (USDC)
            network: 'Sepolia Testnet',
            contractType: 'SyntheticAsset.sol',
            balance: '1,250.00',
            price: tokenPrices.USDC || 1,
            crossChainEnabled: true
          },
          {
            symbol: 'WETH',
            name: 'Wrapped Ethereum',
            address: '0x39CdAe9f7Cb7e06A165f8B4C6864850cCef5CC44', // SyntheticAsset.sol (WETH)
            network: 'Sepolia Testnet',
            contractType: 'SyntheticAsset.sol',
            balance: '2.45',
            price: tokenPrices.WETH || tokenPrices.ETH || 0,
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
            price: tokenPrices.USDC || 1,
            crossChainEnabled: true
          }
        ];
    }
  };

  return (
    <div className="flex-grow pt-4">
      <div className="flex justify-between items-center mb-8">
                  <div>
            <h2 className="text-3xl font-bold text-white">Borrowing Protocol</h2>
          </div>
      </div>

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
        {/* Available Assets tag */}
        <div className="absolute -top-2 left-0 z-10">
          <div className="bg-white text-black font-extrabold px-4 py-2 rounded-t-2xl text-sm tracking-wide">
            Available to Borrow
          </div>
        </div>
        
        <div className="bg-white/5 rounded-2xl p-6 pt-12">
          <div className="grid grid-cols-3 gap-4">
            {getNetworkTokens().map((token, index) => (
              <div
                key={token.symbol}
                onClick={() => setSelectedBorrowingToken(token.symbol)}
                className={`bg-gradient-to-br from-gray-50 to-gray-100 border-2 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg relative cursor-pointer ${
                  selectedBorrowingToken === token.symbol
                    ? 'border-red-500 shadow-xl ring-2 ring-red-200'
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
                        <span className="text-4xl font-bold text-gray-500">Loading market prices...</span>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl font-bold text-gray-900 mb-3">
                          ${token.price.toLocaleString('en-US', {
                            minimumFractionDigits: token.symbol === 'USDC' || token.symbol === 'DAI' ? 2 : 0,
                            maximumFractionDigits: token.symbol === 'USDC' || token.symbol === 'DAI' ? 2 : 0
                          })}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {isConnected && userBorrowData?.availableTokens?.find((t: { symbol: string; currentRate: string }) => t.symbol === token.symbol) && (
                              <span>APR: {userBorrowData.availableTokens.find((t: { symbol: string; currentRate: string }) => t.symbol === token.symbol)?.currentRate}%</span>
                            )}
                          </div>
                          {selectedBorrowingToken === token.symbol && (
                            <div className="flex gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const amount = prompt(`Enter amount to borrow (${token.symbol}):`);
                                  if (amount) handleBorrow(token.symbol, amount);
                                }}
                                disabled={!isConnected || isLoading}
                                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-extrabold py-2 px-4 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
                              >
                                {isLoading ? 'Processing...' : 'Borrow'}
                              </button>
                              {userBorrowData?.userPositions?.some((p: { token: string }) => p.token === token.symbol) && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const amount = prompt(`Enter amount to repay (${token.symbol}):`);
                                    if (amount) handleRepay(token.symbol, amount);
                                  }}
                                  disabled={!isConnected || isLoading}
                                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-extrabold py-2 px-4 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
                                >
                                  Repay
                                </button>
                              )}
                            </div>
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
        {/* Card 1: Select Asset to Borrow */}
        <div className="bg-[#F9DDC7] p-8 rounded-2xl text-[#031138] flex flex-col justify-between shadow-xl transition-transform hover:scale-105">
          <div>
            <h2 className="text-4xl font-extrabold mb-4">Borrow Against Collateral</h2>
            <p className="text-lg mb-6">Use your cross-chain collateral to borrow assets instantly on any supported network. Your collateral remains secure on its native chain while you access liquidity where you need it.</p>
          </div>
          <button className="bg-white text-[#031138] font-bold py-3 px-6 rounded-lg self-start mt-4">
            BORROW NOW
          </button>
        </div>

        {/* Card 2: Flexible Repayment */}
        <div className="bg-[#F9DDC7] p-8 rounded-2xl text-[#031138] flex flex-col justify-between shadow-xl transition-transform hover:scale-105">
          <div>
            <h2 className="text-4xl font-extrabold mb-4">Flexible Repayment</h2>
            <p className="text-lg mb-6">Repay your loan at any time with any supported asset on the network. Manage your debt with ease and maintain healthy collateral ratios across all chains.</p>
          </div>
          <button className="bg-white text-[#031138] font-bold py-3 px-6 rounded-lg self-start mt-4">
            REPAY LOAN
          </button>
        </div>
      </div>

      {/* Borrow Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        token={getNetworkTokens().find(t => t.symbol === selectedBorrowingToken) || getNetworkTokens()[0]}
      />
    </div>
  );
} 
