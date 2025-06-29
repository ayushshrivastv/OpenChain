"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAccount, useBalance, useChainId, useReadContract, useWriteContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther, parseEther, Address } from 'viem';
import { LENDING_POOL_ABI, ERC20_ABI } from '@/lib/contracts';
import { CONTRACT_ADDRESSES } from '@/lib/wagmi';
import { toast } from "sonner";
import { ArrowDown, CheckCircle, XCircle, Loader } from 'lucide-react';

const assetsConfig = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000' as Address,
    logo: '/ethereum-logo.png',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x77036167D0b74Fb82BA5966a507ACA06C5E16B30' as Address,
    logo: '/USDC.png',
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    address: '0x39CdAe9f7Cb7e06A165f8B4C6864850cCef5CC44' as Address,
    logo: '/ethereum-logo.png',
  }
];

export default function DepositPage() {
  const [selectedAsset, setSelectedAsset] = useState(assetsConfig[0]);
  const [depositAmount, setDepositAmount] = useState('');
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContract } = useWriteContract();

  const contractInfo = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  const lendingPoolAddress = contractInfo && "lendingPool" in contractInfo ? contractInfo.lendingPool as Address : undefined;

  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: address,
    token: selectedAsset.symbol === 'ETH' ? undefined : selectedAsset.address,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 5000,
    }
  });

  const { data: assetData, isLoading: assetDataLoading } = useReadContract({
    address: lendingPoolAddress,
    abi: LENDING_POOL_ABI,
    functionName: 'getAssetConfiguration',
    args: [selectedAsset.address],
    query: {
      enabled: !!lendingPoolAddress,
      select: (data) => {
        const [ltv, liquidationThreshold, , isActive, canBeCollateral] = data as [bigint, bigint, bigint, boolean, boolean];
        return {
          ltv: Number(ltv) / 10000,
          liquidationThreshold: Number(liquidationThreshold) / 10000,
          isActive,
          canBeCollateral
        };
      }
    }
  });

  const [tokenPrices, setTokenPrices] = useState<{[key: string]: number}>({});
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/token-prices');
        if (response.ok) setTokenPrices(await response.json());
      } catch (error) {
        console.error("Failed to fetch prices", error);
        setTokenPrices({ ETH: 2500, USDC: 1, WETH: 2500 }); // Fallback
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDeposit = () => {
    if (!depositAmount || !lendingPoolAddress) return;
    const amount = parseEther(depositAmount);

    const baseConfig = {
      address: lendingPoolAddress,
      abi: LENDING_POOL_ABI,
      functionName: 'deposit' as const,
      args: [selectedAsset.address, amount] as const,
    };

    const config = selectedAsset.symbol === 'ETH'
      ? { ...baseConfig, value: amount }
      : baseConfig;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    writeContract(config as any, {
      onSuccess: (hash) => toast.loading(`Depositing ${depositAmount} ${selectedAsset.symbol}...`, { id: hash, description: `Transaction: ${hash}` }),
      onError: (error) => toast.error("Deposit failed", { description: error.message })
    });
  }

  const formatBalance = () => {
    if (balanceLoading) return '...';
    if (!balance?.value) return '0.0000';
    return parseFloat(formatEther(balance.value)).toFixed(4);
  };

  const depositValue = (parseFloat(depositAmount) || 0) * (tokenPrices[selectedAsset.symbol] || 0);

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-white">Deposit</h1>
          <p className="text-gray-400 mt-2">Supply assets to the OpenChain protocol to earn interest and use as collateral.</p>
        </header>

        {!isConnected ? (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-gray-400 mb-6">Connect your wallet to start depositing assets.</p>
            <ConnectButton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="md:col-span-3 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-white">Select Asset to Supply</h2>
              </div>
              <div className="p-6 space-y-6">

                <div className="relative">
                  <button onClick={() => setIsAssetSelectorOpen(!isAssetSelectorOpen)} className="w-full flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Image src={selectedAsset.logo} alt={selectedAsset.name} width={32} height={32} className="rounded-full" />
                      <div>
                        <p className="text-white font-semibold">{selectedAsset.symbol}</p>
                        <p className="text-gray-400 text-sm">{selectedAsset.name}</p>
                      </div>
                    </div>
                    <ArrowDown className={`w-5 h-5 text-gray-400 transition-transform ${isAssetSelectorOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isAssetSelectorOpen && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
                      {assetsConfig.map(asset => (
                        <div key={asset.symbol} onClick={() => { setSelectedAsset(asset); setIsAssetSelectorOpen(false); setDepositAmount(''); }} className="flex items-center space-x-3 p-4 hover:bg-gray-700 cursor-pointer">
                          <Image src={asset.logo} alt={asset.name} width={32} height={32} className="rounded-full" />
                          <div>
                            <p className="text-white font-semibold">{asset.symbol}</p>
                            <p className="text-gray-400 text-sm">{asset.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <label className="text-sm font-medium text-gray-400">Amount</label>
                    <p className="text-sm text-gray-400">Balance: {formatBalance()}</p>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-2xl font-mono text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/50"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                      <span className="text-gray-200 font-semibold">{selectedAsset.symbol}</span>
                      <button onClick={() => setDepositAmount(formatBalance())} className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded">MAX</button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0 || (balance && parseEther(depositAmount) > balance.value)}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all text-lg"
                >
                  {balance && depositAmount && parseEther(depositAmount) > balance.value ? 'Insufficient Balance' : `Deposit ${selectedAsset.symbol}`}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Transaction Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deposit Value</span>
                    <span className="text-white font-mono">${depositValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network Fee</span>
                    <span className="text-white font-mono">~ $2.50</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Asset Details</h3>
                {assetDataLoading ? (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Loader className="animate-spin w-4 h-4" />
                    <span>Loading asset data...</span>
                  </div>
                ) : assetData && assetData.isActive ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Can be used as collateral</span>
                      {assetData.canBeCollateral ?
                        <CheckCircle className="w-5 h-5 text-green-500" /> :
                        <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Max LTV</span>
                      <span className="text-white font-mono">{(assetData.ltv * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Liquidation Threshold</span>
                      <span className="text-white font-mono">{(assetData.liquidationThreshold * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-500 text-sm">This asset is not supported on the protocol.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
