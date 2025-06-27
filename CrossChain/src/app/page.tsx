'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import WalletConnector from '@/components/WalletConnector'
import { TransactionModal } from '@/components/TransactionModal'
import { useUserPosition } from '@/hooks/useUserPosition'
import { useState, useEffect, useCallback } from 'react'
import { formatUnits, formatCurrency } from '@/lib/contracts'
import { useAccount, useBalance, usePublicClient, useChainId } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/wagmi'
import { ERC20_ABI } from '@/lib/contracts'
import dynamic from 'next/dynamic'
import { CCIP_CONFIG } from '@/lib/chains'

// Disable SSR for this component
const DynamicHomeContent = dynamic(() => Promise.resolve(HomeContentInner), {
  ssr: false,
})

export default function HomePage() {
  return <DynamicHomeContent />
}

function HomeContentInner() {
  const { position, prices, isLoading, healthStatus, availableBorrowPower } = useUserPosition()
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'deposit' | 'borrow' | 'repay' | 'withdraw'
    asset: string
  }>({
    isOpen: false,
    type: 'deposit',
    asset: 'USDC'
  })
  const [assetBalances, setAssetBalances] = useState<Record<string, bigint>>({})
  const [balancesLoading, setBalancesLoading] = useState(false)

  // Wrap fetchAssetBalances in useCallback to fix dependency issue
  const fetchAssetBalances = useCallback(async () => {
    if (!address || !publicClient || !chainId) return

    const contractAddresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
    if (!contractAddresses) return

    setBalancesLoading(true)
    try {
      const balances: Record<string, bigint> = {}
      
      // Fetch balances for each supported asset
      for (const [symbol, assetAddress] of Object.entries(contractAddresses.syntheticAssets)) {
        try {
          const balance = await publicClient.readContract({
            address: assetAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address]
          }) as bigint

          balances[symbol] = balance
        } catch (error) {
          console.warn(`Failed to fetch ${symbol} balance:`, error)
          balances[symbol] = 0n
        }
      }

      setAssetBalances(balances)
    } catch (error) {
      console.error('Error fetching asset balances:', error)
    } finally {
      setBalancesLoading(false)
    }
  }, [address, publicClient, chainId])

  useEffect(() => {
    if (address && publicClient && chainId) {
      fetchAssetBalances()
    }
  }, [address, publicClient, chainId, fetchAssetBalances])

  const supportedAssets = [
    { 
      symbol: "USDC", 
      name: "USD Coin", 
      icon: "💵", 
      apy: "4.2%",
      price: prices.USDC?.price || 0n,
      balance: assetBalances.USDC || 0n,
      borrowed: position?.borrowBalances.USDC || 0n,
      collateral: position?.collateralBalances.USDC || 0n
    },
    { 
      symbol: "WETH", 
      name: "Wrapped Ether", 
      icon: "🔶", 
      apy: "3.8%",
      price: prices.WETH?.price || 0n,
      balance: assetBalances.WETH || 0n,
      borrowed: position?.borrowBalances.WETH || 0n,
      collateral: position?.collateralBalances.WETH || 0n
    },
    { 
      symbol: "SOL", 
      name: "Solana", 
      icon: "🟣", 
      apy: "5.1%",
      price: prices.SOL?.price || 0n,
      balance: assetBalances.SOL || 0n,
      borrowed: position?.borrowBalances.SOL || 0n,
      collateral: position?.collateralBalances.SOL || 0n
    }
  ]

  const openModal = (type: 'deposit' | 'borrow' | 'repay' | 'withdraw', asset: string) => {
    setModalState({ isOpen: true, type, asset })
  }

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }

  const getHealthFactorColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'danger': return 'text-orange-500'
      case 'liquidatable': return 'text-red-500'
      default: return 'text-gray-400'
    }
  }

  const formatHealthFactor = (healthFactor: bigint) => {
    const hf = Number(healthFactor) / 1e18
    if (hf > 999) return '∞'
    return hf.toFixed(2)
  }

  const currentChain = CCIP_CONFIG[chainId as keyof typeof CCIP_CONFIG]

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Hero Section with Wallet Connection */}
      <section className="text-center space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Cross-Chain DeFi Lending Protocol
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powered by Chainlink CCIP - Deposit collateral on one chain, borrow on another
          </p>
        </div>
        <WalletConnector />
      </section>

      {/* User Position Overview */}  
      <section>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-900 border border-gray-800 p-6">
            <div className="text-gray-400 text-sm">Total Supplied</div>
            <div className="text-3xl font-bold mt-2">
              {position ? `$${formatUnits(position.totalCollateralValue, 18)}` : '$0.00'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              📊 Live Chainlink Prices
            </div>
          </Card>
          
          <Card className="bg-gray-900 border border-gray-800 p-6">
            <div className="text-gray-400 text-sm">Total Borrowed</div>
            <div className="text-3xl font-bold mt-2">
              {position ? `$${formatUnits(position.totalBorrowValue, 18)}` : '$0.00'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ⚡ Cross-Chain Enabled
            </div>
          </Card>
          
          <Card className="bg-gray-900 border border-gray-800 p-6">
            <div className="text-gray-400 text-sm">Health Factor</div>
            <div className={`text-3xl font-bold mt-2 ${getHealthFactorColor(healthStatus)}`}>
              {position ? formatHealthFactor(position.healthFactor) : '-'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              🛡️ {healthStatus || 'unknown'}
            </div>
          </Card>

          <Card className="bg-gray-900 border border-gray-800 p-6">
            <div className="text-gray-400 text-sm">Borrow Power</div>
            <div className="text-3xl font-bold mt-2">
              ${formatUnits(availableBorrowPower || 0n, 18)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              🔗 CCIP Available
            </div>
          </Card>
        </div>
        
        <div className="flex items-center gap-6">
          <Button 
            variant="default" 
            className="w-40"
            onClick={() => openModal('deposit', 'USDC')}
            disabled={!address}
          >
            💰 Deposit
          </Button>
          <Button 
            variant="outline" 
            className="w-40"
            onClick={() => openModal('borrow', 'USDC')}
            disabled={!address || !position}
          >
            🏦 Borrow
          </Button>
          {position && position.totalBorrowValue > 0n && (
            <Button 
              variant="secondary" 
              className="w-40"
              onClick={() => openModal('repay', 'USDC')}
            >
              💳 Repay
            </Button>
          )}
          {position && position.totalCollateralValue > 0n && (
            <Button 
              variant="secondary" 
              className="w-40"
              onClick={() => openModal('withdraw', 'USDC')}
            >
              📤 Withdraw
            </Button>
          )}
        </div>
      </section>

      {/* Asset Markets */}
      <section>
        <Card className="bg-gray-900 border border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Asset Markets
              <span className="text-sm font-normal text-gray-400">
                (Real-time Chainlink Price Feeds)
              </span>
              {balancesLoading && (
                <span className="text-sm text-blue-400">🔄 Loading balances...</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {supportedAssets.map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between p-4 rounded-lg bg-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{asset.icon}</div>
                    <div>
                      <div className="font-semibold">{asset.symbol}</div>
                      <div className="text-sm text-gray-400">{asset.name}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    {/* Current Price */}
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Price</div>
                      <div className="font-semibold">
                        {asset.price > 0n ? `$${formatUnits(asset.price, 8)}` : 'Loading...'}
                      </div>
                    </div>

                    {/* Wallet Balance */}
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Wallet</div>
                      <div className="font-semibold">
                        {balancesLoading ? (
                          <span className="text-gray-500">Loading...</span>
                        ) : (
                          `${formatUnits(asset.balance, 18)} ${asset.symbol}`
                        )}
                      </div>
                    </div>

                    {/* Supplied Amount */}
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Supplied</div>
                      <div className="font-semibold">
                        {asset.collateral > 0n ? (
                          `${formatUnits(asset.collateral, 18)} ${asset.symbol}`
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </div>

                    {/* Borrowed Amount */}
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Borrowed</div>
                      <div className="font-semibold">
                        {asset.borrowed > 0n ? (
                          `${formatUnits(asset.borrowed, 18)} ${asset.symbol}`
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </div>

                    {/* APY */}
                    <div className="text-center">
                      <div className="text-sm text-gray-400">APY</div>
                      <div className="font-semibold text-green-400">{asset.apy}</div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => openModal('deposit', asset.symbol)}
                        disabled={!address}
                      >
                        Supply
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openModal('borrow', asset.symbol)}
                        disabled={!address || !position}
                      >
                        Borrow
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!address && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  Connect your wallet to view balances and interact with the protocol
                </div>
                <WalletConnector />
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Chainlink CCIP Features */}
      <section>
        <Card className="bg-gray-900 border border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚡ Chainlink CCIP Cross-Chain Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="text-4xl mb-2">🔗</div>
                <h3 className="font-semibold mb-1">Cross-Chain Lending</h3>
                <p className="text-sm text-gray-400">
                  Deposit on Ethereum, borrow on Polygon seamlessly
                </p>
              </div>
              <div className="text-center p-4">
                <div className="text-4xl mb-2">📊</div>
                <h3 className="font-semibold mb-1">Real-Time Prices</h3>
                <p className="text-sm text-gray-400">
                  Chainlink Price Feeds ensure accurate asset valuation
                </p>
              </div>
              <div className="text-center p-4">
                <div className="text-4xl mb-2">🛡️</div>
                <h3 className="font-semibold mb-1">Secure Messaging</h3>
                <p className="text-sm text-gray-400">
                  CCIP Risk Management Network protects your funds
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        asset={modalState.asset}
      />
    </div>
  )
}

