'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WalletConnector } from '@/components/WalletConnector'
import { TransactionModal } from '@/components/TransactionModal'
import { useAccount, usePublicClient, useChainId } from 'wagmi'
import { formatUnits } from '@/lib/contracts'
import { CONTRACT_ADDRESSES } from '@/lib/wagmi'
import { LENDING_POOL_ABI } from '@/lib/contracts'
import dynamic from 'next/dynamic'

// Disable SSR for this component
const DynamicPositionsContent = dynamic(() => Promise.resolve(PositionsContentInner), {
  ssr: false,
})

export default function PositionsPage() {
  return <DynamicPositionsContent />
}

interface UserPosition {
  id: string
  asset: string
  collateralAmount: bigint
  borrowAmount: bigint
  healthFactor: number
  liquidationThreshold: number
  chainId: number
}

function PositionsContentInner() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  
  const [positions, setPositions] = useState<UserPosition[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'deposit' | 'borrow' | 'repay' | 'withdraw'>('deposit')
  const [selectedAsset, setSelectedAsset] = useState('')

  // Wrap fetchUserPositions in useCallback to fix dependency issue
  const fetchUserPositions = useCallback(async () => {
    if (!address || !publicClient || !chainId) return

    setLoading(true)
    try {
      const contractAddresses = CONTRACT_ADDRESSES[chainId]
      if (!contractAddresses) return

      // Get user position events from the lending pool
      const depositEvents = await publicClient.getLogs({
        address: contractAddresses.lendingPool as `0x${string}`,
        event: {
          type: 'event',
          name: 'Deposit',
          inputs: [
            { type: 'address', name: 'user', indexed: true },
            { type: 'address', name: 'asset', indexed: true },
            { type: 'uint256', name: 'amount', indexed: false },
            { type: 'uint256', name: 'chainId', indexed: false }
          ]
        },
        args: {
          user: address
        },
        fromBlock: 'earliest'
      })

      const borrowEvents = await publicClient.getLogs({
        address: contractAddresses.lendingPool as `0x${string}`,
        event: {
          type: 'event',
          name: 'Borrow',
          inputs: [
            { type: 'address', name: 'user', indexed: true },
            { type: 'address', name: 'asset', indexed: true },
            { type: 'uint256', name: 'amount', indexed: false },
            { type: 'uint256', name: 'chainId', indexed: false }
          ]
        },
        args: {
          user: address
        },
        fromBlock: 'earliest'
      })

      // Process events to build position map
      const positionMap = new Map<string, UserPosition>()

      // Process deposits
      for (const event of depositEvents) {
        const { args } = event
        if (!args) continue
        
        const { user, asset, amount, chainId: eventChainId } = args
        if (!asset || !amount || !eventChainId) continue
        
        const positionId = `${asset}-${eventChainId}`
        
        if (positionMap.has(positionId)) {
          const existing = positionMap.get(positionId)
          if (existing) {
            existing.collateralAmount += amount
          }
        } else {
          positionMap.set(positionId, {
            id: positionId,
            asset: asset as string,
            collateralAmount: amount,
            borrowAmount: 0n,
            healthFactor: 0,
            liquidationThreshold: 80,
            chainId: Number(eventChainId)
          })
        }
      }

      // Process borrows
      for (const event of borrowEvents) {
        const { args } = event
        if (!args) continue
        
        const { user, asset, amount, chainId: eventChainId } = args
        if (!asset || !amount || !eventChainId) continue
        
        const positionId = `${asset}-${eventChainId}`
        
        if (positionMap.has(positionId)) {
          const existing = positionMap.get(positionId)
          if (existing) {
            existing.borrowAmount += amount
          }
        } else {
          positionMap.set(positionId, {
            id: positionId,
            asset: asset as string,
            collateralAmount: 0n,
            borrowAmount: amount,
            healthFactor: 0,
            liquidationThreshold: 80,
            chainId: Number(eventChainId)
          })
        }
      }

      // Calculate health factors for each position
      const positionsArray = Array.from(positionMap.values())
      for (const position of positionsArray) {
        if (position.borrowAmount > 0n) {
          // Simplified health factor calculation
          const collateralValue = Number(formatUnits(position.collateralAmount, 18)) * 1000 // Mock price
          const borrowValue = Number(formatUnits(position.borrowAmount, 18)) * 1000 // Mock price
          position.healthFactor = collateralValue / borrowValue
        } else {
          position.healthFactor = Infinity
        }
      }

      setPositions(positionsArray)
    } catch (error) {
      console.error('Error fetching user positions:', error)
      setPositions([])
    } finally {
      setLoading(false)
    }
  }, [address, publicClient, chainId])

  useEffect(() => {
    if (address && publicClient && chainId) {
      fetchUserPositions()
    }
  }, [address, publicClient, chainId, fetchUserPositions])

  const openModal = (type: 'deposit' | 'borrow' | 'repay' | 'withdraw', asset: string) => {
    setModalType(type)
    setSelectedAsset(asset)
    setModalOpen(true)
  }

  const getHealthFactorColor = (healthFactor: number) => {
    if (healthFactor === Infinity) return 'text-gray-400'
    if (healthFactor > 2) return 'text-green-400'
    if (healthFactor > 1.5) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getHealthFactorText = (healthFactor: number) => {
    if (healthFactor === Infinity) return 'N/A'
    return healthFactor.toFixed(2)
  }

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 11155111: return 'Sepolia'
      case 80001: return 'Mumbai'
      case 421614: return 'Arbitrum Sepolia'
      default: return 'Unknown'
    }
  }

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-6xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Your Positions</h1>
          <p className="text-gray-400">Monitor your lending and borrowing positions across chains</p>
        </div>

        {!address && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">
                Connect your wallet to view your positions
              </p>
              <WalletConnector />
            </CardContent>
          </Card>
        )}

        {address && (
          <>
            {/* Positions Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-green-400">Total Supplied</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${positions.reduce((sum, pos) => 
                      sum + Number(formatUnits(pos.collateralAmount, 18)) * 1000, 0
                    ).toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-400">Across {positions.length} positions</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-blue-400">Total Borrowed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${positions.reduce((sum, pos) => 
                      sum + Number(formatUnits(pos.borrowAmount, 18)) * 1000, 0
                    ).toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-400">Available to borrow more</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-yellow-400">Avg Health Factor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {positions.length > 0 ? (
                      positions.reduce((sum, pos) => 
                        sum + (pos.healthFactor === Infinity ? 0 : pos.healthFactor), 0
                      ) / positions.filter(pos => pos.healthFactor !== Infinity).length || 0
                    ).toFixed(2) : 'N/A'}
                  </div>
                  <p className="text-sm text-gray-400">Risk level indicator</p>
                </CardContent>
              </Card>
            </div>

            {/* Positions Table */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Active Positions</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading positions...</p>
                  </div>
                ) : positions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No positions found</p>
                    <Button onClick={() => openModal('deposit', 'ETH')}>
                      Start by making a deposit
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-800">
                          <th className="py-3 px-4">Asset</th>
                          <th className="py-3 px-4">Chain</th>
                          <th className="py-3 px-4">Supplied</th>
                          <th className="py-3 px-4">Borrowed</th>
                          <th className="py-3 px-4">Health Factor</th>
                          <th className="py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((position) => (
                          <tr key={position.id} className="border-b border-gray-800 text-white hover:bg-gray-800/50">
                            <td className="py-3 px-4 font-medium">{position.asset}</td>
                            <td className="py-3 px-4">{getChainName(position.chainId)}</td>
                            <td className="py-3 px-4">
                              {Number(formatUnits(position.collateralAmount, 18)).toFixed(4)}
                            </td>
                            <td className="py-3 px-4">
                              {Number(formatUnits(position.borrowAmount, 18)).toFixed(4)}
                            </td>
                            <td className={`py-3 px-4 font-medium ${getHealthFactorColor(position.healthFactor)}`}>
                              {getHealthFactorText(position.healthFactor)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => openModal('deposit', position.asset)}
                                >
                                  Supply
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => openModal('borrow', position.asset)}
                                >
                                  Borrow
                                </Button>
                                {position.borrowAmount > 0n && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => openModal('repay', position.asset)}
                                  >
                                    Repay
                                  </Button>
                                )}
                                {position.collateralAmount > 0n && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => openModal('withdraw', position.asset)}
                                  >
                                    Withdraw
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cross-Chain Status */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Cross-Chain Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Sepolia ↔ Mumbai: Active</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>EVM ↔ Solana: Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        asset={selectedAsset}
      />
    </div>
  )
}
