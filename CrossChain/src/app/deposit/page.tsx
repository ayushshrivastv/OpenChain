'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import WalletConnector from '@/components/WalletConnector'
import { useTransactions } from '@/hooks/useTransactions'
import { useAccount, useChainId } from 'wagmi'
import { CCIP_CONFIG } from '@/lib/chains'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

// Disable SSR for this component
const DynamicDepositContent = dynamic(() => Promise.resolve(DepositContentInner), {
  ssr: false,
})

export default function DepositPage() {
  return <DynamicDepositContent />
}

function DepositContentInner() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { deposit, isLoading } = useTransactions()
  
  const [selectedChain, setSelectedChain] = useState(11155111) // Sepolia
  const [selectedAsset, setSelectedAsset] = useState('USDC')
  const [amount, setAmount] = useState('')
  const [isCrossChain, setIsCrossChain] = useState(false)
  const [destChain, setDestChain] = useState(80001) // Mumbai

  const handleDeposit = async () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }
    
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      await deposit(
        selectedAsset,
        amount,
        selectedChain,
        isCrossChain ? destChain : undefined
      )
      
      toast.success('Deposit transaction submitted!')
      setAmount('')
    } catch (error) {
      console.error('Deposit failed:', error)
      toast.error('Deposit failed. Please try again.')
    }
  }

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md bg-gray-900 border border-gray-800 p-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">
            {isCrossChain ? 'Cross-Chain Deposit' : 'Deposit'}
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
              {/* Cross-Chain Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cross-chain-deposit"
                  checked={isCrossChain}
                  onChange={(e) => setIsCrossChain(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="cross-chain-deposit" className="text-sm font-medium">
                  Cross-Chain Deposit via CCIP
                </label>
              </div>

              {/* Chain Selection */}
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">
                    {isCrossChain ? 'Source Chain' : 'Chain'}
                  </label>
                  <select 
                    value={selectedChain}
                    onChange={(e) => setSelectedChain(Number(e.target.value))}
                    className="bg-black border border-gray-800 rounded px-3 py-2 w-full"
                  >
                    <option value={11155111}>Ethereum Sepolia</option>
                    <option value={80001}>Polygon Mumbai</option>
                  </select>
                </div>

                {isCrossChain && (
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Destination Chain</label>
                    <select 
                      value={destChain}
                      onChange={(e) => setDestChain(Number(e.target.value))}
                      className="bg-black border border-gray-800 rounded px-3 py-2 w-full"
                    >
                      <option value={80001}>Polygon Mumbai</option>
                      <option value={11155111}>Ethereum Sepolia</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Asset Selection */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Asset</label>
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
              </div>

              {/* Transaction Preview */}
              <div className="bg-gray-800 rounded p-3 text-xs space-y-1">
                <div className="text-gray-400 font-medium">Transaction Preview:</div>
                <div className="flex justify-between">
                  <span>Asset:</span>
                  <span>{selectedAsset}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span>{amount || '0'} {selectedAsset}</span>
                </div>
                {isCrossChain && (
                  <>
                    <div className="flex justify-between">
                      <span>From:</span>
                      <span>{CCIP_CONFIG[selectedChain as keyof typeof CCIP_CONFIG]?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>To:</span>
                      <span>{CCIP_CONFIG[destChain as keyof typeof CCIP_CONFIG]?.name}</span>
                    </div>
                    <div className="flex justify-between text-blue-400">
                      <span>CCIP Fee:</span>
                      <span>~0.001 LINK</span>
                    </div>
                  </>
                )}
              </div>

              {/* Deposit Button */}
              <Button 
                onClick={handleDeposit}
                disabled={isLoading || !amount}
                className="w-full"
              >
                {isLoading ? 'Processing...' : (isCrossChain ? 'Deposit via CCIP' : 'Deposit')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
