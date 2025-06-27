'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { WalletConnector } from '@/components/WalletConnector'
import { useTransactions } from '@/hooks/useTransactions'
import { useUserPosition } from '@/hooks/useUserPosition'
import { useAccount } from 'wagmi'
import { CCIP_CONFIG } from '@/lib/chains'
import { formatUnits } from '@/lib/contracts'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

// Disable SSR for this component
const DynamicBorrowContent = dynamic(() => Promise.resolve(BorrowContentInner), {
  ssr: false,
})

export default function BorrowPage() {
  return <DynamicBorrowContent />
}

function BorrowContentInner() {
  const { address } = useAccount()
  const { borrow, isLoading } = useTransactions()
  const { position, healthStatus, availableBorrowPower } = useUserPosition()
  
  const [selectedSourceChain, setSelectedSourceChain] = useState(11155111) // Sepolia
  const [selectedDestChain, setSelectedDestChain] = useState(80001) // Mumbai
  const [selectedAsset, setSelectedAsset] = useState('USDC')
  const [amount, setAmount] = useState('')
  const [receiverAddress, setReceiverAddress] = useState('')

  const handleBorrow = async () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }
    
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    // Check if user has sufficient collateral
    const borrowAmountBigInt = BigInt(Math.floor(Number.parseFloat(amount) * 1e18))
    if (availableBorrowPower && borrowAmountBigInt > availableBorrowPower) {
      toast.error('Insufficient collateral for this borrow amount')
      return
    }

    try {
      await borrow(
        selectedAsset,
        amount,
        selectedDestChain.toString()
      )
      
      toast.success('Cross-chain borrow transaction submitted!')
      setAmount('')
      setReceiverAddress('')
    } catch (error) {
      console.error('Borrow failed:', error)
      toast.error('Borrow failed. Please try again.')
    }
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

  const getHealthFactorPercentage = () => {
    if (!position?.healthFactor) return 0
    const hf = Number(position.healthFactor) / 1e18
    if (hf >= 2) return 100
    if (hf <= 1) return 10
    return Math.max(10, Math.min(100, (hf - 1) * 100))
  }

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md bg-gray-900 border border-gray-800 p-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">
            Cross-Chain Borrow
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!address && (
            <div className="text-center">
              <WalletConnector />
            </div>
          )}
          
          {address && (
            <>
              {/* User Position Summary */}
              {position && (
                <div className="bg-gray-800 rounded p-4 space-y-3">
                  <div className="text-sm font-medium text-gray-300">Your Position</div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-400">Total Collateral</div>
                      <div className="font-medium">${formatUnits(position.totalCollateralValue, 18)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Available to Borrow</div>
                      <div className="font-medium text-green-400">${formatUnits(availableBorrowPower || 0n, 18)}</div>
                    </div>
                  </div>
                  
                  {/* Health Factor Visualization */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Health Factor:</span>
                      <span className={`font-medium ${getHealthFactorColor(healthStatus)}`}>
                        {formatHealthFactor(position.healthFactor)} ({healthStatus})
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          healthStatus === 'healthy' ? 'bg-green-500' :
                          healthStatus === 'warning' ? 'bg-yellow-500' :
                          healthStatus === 'danger' ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${getHealthFactorPercentage()}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Chain Selection */}
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Source Chain (Collateral)</label>
                  <select 
                    value={selectedSourceChain}
                    onChange={(e) => setSelectedSourceChain(Number(e.target.value))}
                    className="bg-black border border-gray-800 rounded px-3 py-2 w-full"
                  >
                    <option value={11155111}>Ethereum Sepolia</option>
                    <option value={80001}>Polygon Mumbai</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Destination Chain (Receive Assets)</label>
                  <select 
                    value={selectedDestChain}
                    onChange={(e) => setSelectedDestChain(Number(e.target.value))}
                    className="bg-black border border-gray-800 rounded px-3 py-2 w-full"
                  >
                    <option value={80001}>Polygon Mumbai</option>
                    <option value={11155111}>Ethereum Sepolia</option>
                  </select>
                </div>
              </div>

              {/* Asset Selection */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Asset to Borrow</label>
                <select 
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="bg-black border border-gray-800 rounded px-3 py-2 w-full"
                >
                  <option value="USDC">💵 USDC</option>
                  <option value="WETH">🔶 WETH</option>
                  <option value="SOL">🟣 SOL</option>
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Amount</label>
                <Input 
                  type="number" 
                  placeholder="0.0" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full" 
                />
                {availableBorrowPower && (
                  <div className="text-xs text-gray-400 mt-1">
                    Max: ${formatUnits(availableBorrowPower, 18)}
                  </div>
                )}
              </div>

              {/* Receiver Address (Optional) */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Receiver Address (Optional)
                </label>
                <Input 
                  type="text" 
                  placeholder="0x... (leave empty to use your wallet)" 
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  className="w-full text-xs" 
                />
              </div>

              {/* Transaction Preview */}
              <div className="bg-gray-800 rounded p-3 text-xs space-y-1">
                <div className="text-gray-400 font-medium">Cross-Chain Transaction Preview:</div>
                <div className="flex justify-between">
                  <span>Asset:</span>
                  <span>{selectedAsset}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span>{amount || '0'} {selectedAsset}</span>
                </div>
                <div className="flex justify-between">
                  <span>From:</span>
                  <span>{CCIP_CONFIG[selectedSourceChain as keyof typeof CCIP_CONFIG]?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>To:</span>
                  <span>{CCIP_CONFIG[selectedDestChain as keyof typeof CCIP_CONFIG]?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Receiver:</span>
                  <span>{receiverAddress ? `${receiverAddress.slice(0, 6)}...${receiverAddress.slice(-4)}` : 'Your wallet'}</span>
                </div>
                <div className="flex justify-between text-blue-400">
                  <span>CCIP Fee:</span>
                  <span>~0.001 LINK</span>
                </div>
                <div className="flex justify-between text-yellow-400">
                  <span>Via:</span>
                  <span>⚡ Chainlink CCIP</span>
                </div>
              </div>

              {/* Health Factor Warning */}
              {amount && Number.parseFloat(amount) > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-600/30 rounded p-3 text-xs">
                  <div className="text-yellow-400 font-medium">⚠️ Health Factor Impact</div>
                  <div className="text-gray-300 mt-1">
                    Borrowing will decrease your health factor. Ensure it stays above 1.0 to avoid liquidation.
                  </div>
                </div>
              )}

              {/* Borrow Button */}
              <Button 
                onClick={handleBorrow}
                disabled={isLoading || !amount || !position}
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Borrow via CCIP'}
              </Button>

              {!position && (
                <div className="text-center text-sm text-gray-400">
                  You need to deposit collateral first before borrowing
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
