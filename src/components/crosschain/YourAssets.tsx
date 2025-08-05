"use client";

import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { CONTRACT_ADDRESSES, LENDING_POOL_ABI } from '@/lib/contracts';
import { formatEther } from 'viem';
import { useReadContract } from 'wagmi';
import { SUPPORTED_ASSETS } from '@/lib/contracts';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, ReferenceArea } from 'recharts';
import { getNetworkTokens, getNetworkConfig } from '@/lib/tokenConfig';
import { priceService } from '@/lib/priceService';

const ETHERSCAN_BASE = 'https://sepolia.etherscan.io/tx/';

interface YourAssetsProps {
  selectedNetwork: string;
}

export function YourAssets({ selectedNetwork }: YourAssetsProps) {
  // EVM (wagmi):
  const { address: evmAddress } = useAccount();

  // EVM asset addresses for Sepolia (11155111)
  const assets = [
    { symbol: 'ETH', address: CONTRACT_ADDRESSES[11155111].synthWETH },
    { symbol: 'USDC', address: CONTRACT_ADDRESSES[11155111].synthUSDC },
  ];
  const lendingPoolAddr = CONTRACT_ADDRESSES[11155111].lendingPool;

  const [evmAssets, setEvmAssets] = useState<any[]>([]);
  const [evmHealth, setEvmHealth] = useState<number | null>(null);

  const [solAssets, setSolAssets] = useState<any[]>([]);

  // Solana context:
  const { publicKey: solanaKey } = useWallet();

  // EVM transaction history state
  const [evmHistory, setEvmHistory] = useState<any[]>([]);

  // State for real-time prices
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    if (!evmAddress || Object.keys(tokenPrices).length === 0) return;
    async function fetchAssets() {
      const promises = assets.map(async (a) => {
        let supplied = 0, borrowed = 0, price = 0, ltv = 0.8;
        try {
          const result = await fetch('/api/viem/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractAddress: lendingPoolAddr,
              abi: LENDING_POOL_ABI,
              functionName: 'getUserAssetBalance',
              args: [evmAddress, a.address],
            })
          });
          const { collateralBalance, borrowBalance } = await result.json();
          supplied = parseFloat(formatEther(BigInt(collateralBalance)));
          borrowed = parseFloat(formatEther(BigInt(borrowBalance)));
        } catch {}
        // Use real-time price from price service instead of contract
        price = tokenPrices[a.symbol] || 0;
        try {
          const r = await fetch('/api/viem/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractAddress: lendingPoolAddr,
              abi: LENDING_POOL_ABI,
              functionName: 'getAssetConfiguration',
              args: [a.address],
            })
          });
          // config returns .ltv
          const { ltv: ltvRaw } = await r.json();
          ltv = parseFloat(formatEther(BigInt(ltvRaw)));
        } catch {}
        return {
          symbol: a.symbol,
          supplied,
          borrowed,
          price,
          ltv,
          health: 2.0, // replaced below
        };
      });
      const all = await Promise.all(promises);

      // Fetch overall health factor
      let healthFactor = 2.0;
      try {
        const r = await fetch('/api/viem/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress: lendingPoolAddr,
            abi: LENDING_POOL_ABI,
            functionName: 'getUserPosition',
            args: [evmAddress],
          })
        });
        const { healthFactor: hfRaw } = await r.json();
        healthFactor = parseFloat(formatEther(BigInt(hfRaw)));
        setEvmHealth(healthFactor);
      } catch {
        setEvmHealth(null);
      }

      // Assign health factor to all assets for display (or you could split per-asset if available)
      setEvmAssets(all.map(asset => ({
        ...asset,
        health: healthFactor,
      })));
    }
    fetchAssets();
  }, [evmAddress, tokenPrices]);

  // Fetch real-time prices for all tokens
  useEffect(() => {
    async function fetchPrices() {
      setPriceLoading(true);
      try {
        // Get all tokens from both networks
        const evmTokens = getNetworkTokens('ethereum');
        const solanaTokens = getNetworkTokens('solana');
        const allTokens = [...evmTokens, ...solanaTokens];
        
        // Fetch prices using the price service
        const prices = await priceService.getTokenPrices(allTokens);
        setTokenPrices(prices);
      } catch (error) {
        console.error('Failed to fetch token prices:', error);
        // Use fallback prices on error
        const evmTokens = getNetworkTokens('ethereum');
        const solanaTokens = getNetworkTokens('solana');
        const fallbackPrices: Record<string, number> = {};
        [...evmTokens, ...solanaTokens].forEach(token => {
          fallbackPrices[token.symbol] = token.symbol === 'ETH' ? 3200 : 
                                        token.symbol === 'USDC' ? 1 :
                                        token.symbol === 'SOL' ? 180 :
                                        token.symbol === 'BONK' ? 0.00000123 : 0;
        });
        setTokenPrices(fallbackPrices);
      } finally {
        setPriceLoading(false);
      }
    }
    
    fetchPrices();
    // Refresh prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Solana: fetch position data from on-chain program
    async function fetchSol() {
      if (!solanaKey) {
        setSolAssets([]);
        return;
      }
      
      try {
        const networkConfig = getNetworkConfig('solana');
        if (networkConfig?.rpcUrl) {
          const conn = new Connection(networkConfig.rpcUrl);
          const solanaTokens = getNetworkTokens('solana');
          
          // TODO: Replace with actual on-chain data fetching
          // For now, simulate fetching from Solana program
          const solanaAssets = await Promise.all(
            solanaTokens.map(async (token) => {
              try {
                // TODO: Implement actual Solana program calls here
                // This is a placeholder structure for real implementation
                
                // Simulate fetching user's position from Solana program
                const supplied = 0; // await fetchUserSuppliedAmount(conn, solanaKey, token.address);
                const borrowed = 0; // await fetchUserBorrowedAmount(conn, solanaKey, token.address);
                const ltv = 0.75; // await fetchAssetLTV(conn, token.address);
                
                // Get real-time price
                const price = tokenPrices[token.symbol] || 0;
                
                // Calculate health factor (simplified)
                const collateralValue = supplied * price * ltv;
                const borrowValue = borrowed * price;
                const health = borrowValue > 0 ? collateralValue / borrowValue : 2.0;
                
                return {
                  symbol: token.symbol,
                  supplied,
                  borrowed,
                  price,
                  ltv,
                  health
                };
              } catch (error) {
                console.error(`Error fetching ${token.symbol} data:`, error);
                return {
                  symbol: token.symbol,
                  supplied: 0,
                  borrowed: 0,
                  price: tokenPrices[token.symbol] || 0,
                  ltv: 0.75,
                  health: 2.0
                };
              }
            })
          );
          
          setSolAssets(solanaAssets);
        }
      } catch (error) {
        console.error('Error fetching Solana assets:', error);
        setSolAssets([]);
      }
    }
    
    // Only fetch Solana data if we have prices and a connected wallet
    if (Object.keys(tokenPrices).length > 0) {
      fetchSol();
    }
  }, [solanaKey, tokenPrices]);

  // Fetch EVM transaction history (Deposit, Borrow, Repay events)
  useEffect(() => {
    if (!evmAddress) return;
    async function fetchHistory() {
      // Read Deposit, Borrow, Repay events for user from contract logs (last 50)
      try {
        const res = await fetch('/api/viem/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress: lendingPoolAddr,
            abi: LENDING_POOL_ABI,
            user: evmAddress,
            fromBlock: 'latest-5000',
          })
        });
        const { logs } = await res.json();
        setEvmHistory(logs);
      } catch {
        setEvmHistory([]);
      }
    }
    fetchHistory();
  }, [evmAddress]);

  // Calculate total supplied/borrowed for summary
  const evmSupplied = evmAssets.reduce((acc, a) => acc + a.supplied * a.price, 0);
  const solSupplied = solAssets.reduce((acc, a) => acc + a.supplied * a.price, 0);
  const evmBorrowed = evmAssets.reduce((acc, a) => acc + a.borrowed * a.price, 0);
  const solBorrowed = solAssets.reduce((acc, a) => acc + a.borrowed * a.price, 0);
  const totalSupplied = evmSupplied + solSupplied;
  const totalBorrowed = evmBorrowed + solBorrowed;

  // Helper for price formatting
  function formatPrice(price: number): string {
    if (price < 0.01) {
      return price.toFixed(8);
    } else if (price < 1) {
      return price.toFixed(4);
    } else {
      return price.toFixed(2);
    }
  }

  // Helper for health color
  function healthColor(health: number) {
    if (health > 2) return 'text-green-500'; // Healthy
    if (health > 1.1) return 'text-yellow-400'; // Warning
    return 'text-red-600 font-bold'; // Danger
  }

  // Build chart series from evmHistory
  const chartData: Array<{ date: string, Supplied: number, Borrowed: number }> = [];
  let runningSupplied = 0;
  let runningBorrowed = 0;
  evmHistory?.slice().reverse().forEach(evt => {
    let amt = Number(evt.amount);
    if (evt.type === 'deposit') runningSupplied += amt;
    if (evt.type === 'withdraw') runningSupplied -= amt;
    if (evt.type === 'borrow') runningBorrowed += amt;
    if (evt.type === 'repay') runningBorrowed -= amt;
    chartData.push({
      date: evt.time ? new Date(evt.time * 1000).toLocaleDateString() : '',
      Supplied: Math.max(0, runningSupplied),
      Borrowed: Math.max(0, runningBorrowed)
    });
  });
  chartData.reverse();

  // Build LTV chart data
  const ltvChartData: Array<{ date: string, LTV: number }> = [];
  let runningSuppliedLTV = 0;
  let runningBorrowedLTV = 0;
  evmHistory?.slice().reverse().forEach(evt => {
    const amt = Number(evt.amount);
    if (evt.type === 'deposit') runningSuppliedLTV += amt;
    if (evt.type === 'withdraw') runningSuppliedLTV -= amt;
    if (evt.type === 'borrow') runningBorrowedLTV += amt;
    if (evt.type === 'repay') runningBorrowedLTV -= amt;
    // Avoid div0
    const LTV = runningSuppliedLTV > 0 ? (runningBorrowedLTV / runningSuppliedLTV) : 0;
    ltvChartData.push({
      date: evt.time ? new Date(evt.time * 1000).toLocaleDateString() : '',
      LTV: Math.max(0, LTV)
    });
  });
  ltvChartData.reverse();

  // Render table for EVM history
  function renderEvmHistory() {
    if (!evmHistory.length) return <div className="text-gray-600">No EVM transactions found.</div>;
    return (
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Type</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Asset</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Amount</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Date</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Tx</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {evmHistory.map((log: any) => (
            <tr key={log.txHash + log.logIndex} className="hover:bg-gray-50 transition-colors">
              <td className="px-3 py-1 font-medium capitalize text-xs text-gray-900">{log.type}</td>
              <td className="px-3 py-1 font-mono text-xs text-gray-900">{log.asset ?? '-'}</td>
              <td className="px-3 py-1 text-right text-xs text-gray-900">{log.amount}</td>
              <td className="px-3 py-1 text-xs text-gray-900">{log.time ? new Date(log.time * 1000).toLocaleString() : '-'}</td>
              <td className="px-3 py-1 text-xs">
                <a href={ETHERSCAN_BASE + log.txHash} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">View</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="flex-grow pt-12">
      <h3 className="text-white text-2xl font-bold mb-6">Your Unified Portfolio</h3>
      <div className="flex flex-wrap gap-8 mb-8">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 rounded-2xl p-6 shadow-lg min-w-[200px]">
          <div className="text-gray-600 text-base mb-2">Total Supplied</div>
          <div className="text-gray-900 text-3xl font-bold">${formatPrice(totalSupplied)}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 rounded-2xl p-6 shadow-lg min-w-[200px]">
          <div className="text-gray-600 text-base mb-2">Total Borrowed</div>
          <div className="text-gray-900 text-3xl font-bold">${formatPrice(totalBorrowed)}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        <div>
          <h4 className="text-yellow-200 text-lg font-bold mb-4">EVM Assets</h4>
          {evmAssets.map(asset => (
            <div key={asset.symbol} className="mb-4 bg-gradient-to-br from-gray-50 to-gray-100 border-2 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-2">
                <span className="text-gray-900 font-extrabold text-xl mr-2">{asset.symbol}</span>
                <span className="text-gray-600 ml-2 text-sm">
                  Price: ${priceLoading ? '...' : formatPrice(asset.price)}
                  {!priceLoading && <span className="text-green-500 ml-1">●</span>}
                </span>
              </div>
              <div className="flex flex-wrap gap-8 mb-1">
                <div className="text-green-400">Supplied: {asset.supplied}</div>
                <div className="text-red-400">Borrowed: {asset.borrowed}</div>
                <div className="text-blue-400">LTV: {(asset.ltv * 100).toFixed(0)}%</div>
                <div className={healthColor(asset.health)}>Health: {asset.health.toFixed(2)}</div>
              </div>
              {asset.health <= 1.1 && (<div className="text-red-400 text-sm mt-2 font-semibold">⚠️ Risk: Can be liquidated soon. Add more collateral or repay!</div>)}
            </div>
          ))}
        </div>
        <div>
          <h4 className="text-purple-200 text-lg font-bold mb-4">Solana Assets</h4>
          {solAssets.map(asset => (
            <div key={asset.symbol} className="mb-4 bg-gradient-to-br from-gray-50 to-gray-100 border-2 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-2">
                <span className="text-gray-900 font-extrabold text-xl mr-2">{asset.symbol}</span>
                <span className="text-gray-600 ml-2 text-sm">
                  Price: ${priceLoading ? '...' : formatPrice(asset.price)}
                  {!priceLoading && <span className="text-green-500 ml-1">●</span>}
                </span>
              </div>
              <div className="flex flex-wrap gap-8 mb-1">
                <div className="text-green-400">Supplied: {asset.supplied}</div>
                <div className="text-red-400">Borrowed: {asset.borrowed}</div>
                <div className="text-blue-400">LTV: {(asset.ltv * 100).toFixed(0)}%</div>
                <div className={healthColor(asset.health)}>Health: {asset.health.toFixed(2)}</div>
              </div>
              {asset.health <= 1.1 && (<div className="text-red-400 text-sm mt-2 font-semibold">⚠️ Risk: Can be liquidated soon. Add more collateral or repay!</div>)}
            </div>
          ))}
        </div>
      </div>
      <div className="mb-8 max-w-4xl mx-auto">
        <h4 className="text-white/80 text-lg font-bold mb-4">Portfolio Value Over Time</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292750" />
            <XAxis dataKey="date" tick={{ fill: '#AAA' }} />
            <YAxis tick={{ fill: '#AAA' }} />
            <Tooltip wrapperStyle={{ zIndex:40 }} contentStyle={{ background:'#181c1d', borderColor:'#292750', color:'#fff' }}/>
            <Legend verticalAlign="top" iconType="circle" height={36} />
            <Line type="monotone" dataKey="Supplied" stroke="#36e0a1" strokeWidth={3} activeDot={{ r: 7 }} />
            <Line type="monotone" dataKey="Borrowed" stroke="#e0365d" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mb-8 max-w-4xl mx-auto">
        <h4 className="text-white/80 text-lg font-bold mb-4">LTV (Loan to Value) Risk Over Time</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={ltvChartData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#292750" />
            <XAxis dataKey="date" tick={{ fill: '#AAA' }} />
            <YAxis domain={[0, 1.5]} tickFormatter={v => (v * 100).toFixed(0) + '%'} tick={{ fill: '#AAA' }}/>
            <Tooltip formatter={v => (Number(v) * 100).toFixed(2) + '%'} contentStyle={{ background:'#181c1d', borderColor:'#292750', color:'#fff' }}/>
            <Legend verticalAlign="top" iconType="circle" height={36} />
            {/* Safe/warning/danger background bands */}
            <ReferenceArea y1={0} y2={0.7} strokeOpacity={0} fill="#44ff0060" />
            <ReferenceArea y1={0.7} y2={0.85} strokeOpacity={0} fill="#ffe04460" />
            <ReferenceArea y1={0.85} y2={1.5} strokeOpacity={0} fill="#ff446060" />
            {/* LTV Line */}
            <Line type="monotone" dataKey="LTV" stroke="#e0bc36" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="text-xs mt-2">
          <span className="text-green-500">Safe: LTV &lt; 70%</span> / <span className="text-yellow-400">Warning: 70%-85%</span> / <span className="text-red-600 font-bold">Danger: &gt; 85%</span> — If LTV approaches 1.0 (100%) you risk liquidation!
        </div>
      </div>
      <div className="mt-12">
        <h4 className="text-white/80 text-lg font-bold mb-4">Recent Activity</h4>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 rounded-2xl p-6 shadow-lg overflow-x-auto">
          <div className="mb-2 font-semibold text-gray-800">EVM (Ethereum):</div>
          {renderEvmHistory()}
          <div className="mb-2 mt-8 font-semibold text-gray-800">Solana:</div>
          <div className="text-gray-600">Solana transaction history will be displayed here once available.</div>
        </div>
      </div>
      <p className="text-gray-400 text-base pt-8">
        Your cross-chain OpenChain portfolio—aggregated in real time from Ethereum and Solana. (Requires wallet connections on both networks.)
      </p>
    </div>
  );
}
