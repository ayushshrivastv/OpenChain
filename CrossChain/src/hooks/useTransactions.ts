import React, { useCallback, useEffect, useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { toast } from 'sonner'
import { CONTRACT_ADDRESSES } from '@/lib/wagmi'
import { LENDING_POOL_ABI } from '@/lib/contracts'
import { CCIP_CONFIG } from '@/lib/chains'

// Helper function to get contract addresses for a chain
const getContractAddresses = (chainId: number) => {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || null
}

interface PendingTransaction {
  id: string
  action: string
  asset: string
  amount: bigint
  status: 'pending' | 'confirmed' | 'failed'
  hash?: string
  sourceChain?: number
  destChain?: number
  timestamp: number
}

export function useTransactions() {
  const { address } = useAccount()
  const { writeContract, data: hash, error: writeError, isPending: isWritePending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })
  
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Deposit function - supports cross-chain deposits with Chainlink CCIP
  const deposit = useCallback(async (
    asset: string,
    amount: string,
    sourceChain: number,
    destChain?: number
  ) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    setIsLoading(true)
    const txId = `deposit-${Date.now()}`
    
    try {
      const contractAddresses = getContractAddresses(sourceChain)
      if (!contractAddresses) {
        throw new Error('Unsupported chain')
      }

      const amountBigInt = parseUnits(amount, 18)
      
      // Add to pending transactions
      const pendingTx: PendingTransaction = {
        id: txId,
        action: destChain && destChain !== sourceChain ? 'depositCrossChain' : 'deposit',
        asset,
        amount: amountBigInt,
        status: 'pending',
        sourceChain,
        destChain,
        timestamp: Date.now()
      }
      
      setPendingTransactions(prev => [...prev, pendingTx])

      if (destChain && destChain !== sourceChain) {
        // Cross-chain deposit via CCIP
        const destChainConfig = CCIP_CONFIG[destChain as keyof typeof CCIP_CONFIG]
        if (!destChainConfig) {
          throw new Error('Destination chain not supported')
        }

        await writeContract({
          address: contractAddresses.lendingPool as `0x${string}`,
          abi: LENDING_POOL_ABI,
          functionName: 'deposit',
          args: [
            contractAddresses.syntheticAssets[asset as keyof typeof contractAddresses.syntheticAssets] as `0x${string}`,
            amountBigInt
          ] as const,
          // value: asset === 'ETH' ? amountBigInt : 0n // For ETH deposits
        })
      } else {
        // Same-chain deposit
        await writeContract({
          address: contractAddresses.lendingPool as `0x${string}`,
          abi: LENDING_POOL_ABI,
          functionName: 'deposit',
          args: [
            contractAddresses.syntheticAssets[asset as keyof typeof contractAddresses.syntheticAssets] as `0x${string}`,
            amountBigInt
          ] as const,
          // value: asset === 'ETH' ? amountBigInt : 0n
        })
      }

      toast.success('Deposit transaction submitted')
    } catch (err) {
      console.error('Deposit error:', err)
      toast.error('Deposit failed')
      
      // Remove from pending transactions on error
      setPendingTransactions(prev => prev.filter(tx => tx.id !== txId))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [address, writeContract, getContractAddresses])

  // Borrow function - supports cross-chain borrowing with Chainlink CCIP
  const borrow = useCallback(async (
    asset: string,
    amount: string,
    sourceChain: number,
    destChain?: number
  ) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    setIsLoading(true)
    const txId = `borrow-${Date.now()}`
    
    try {
      const contractAddresses = getContractAddresses(sourceChain)
      if (!contractAddresses) {
        throw new Error('Unsupported chain')
      }

      const amountBigInt = parseUnits(amount, 18)
      
      // Add to pending transactions
      const pendingTx: PendingTransaction = {
        id: txId,
        action: destChain && destChain !== sourceChain ? 'borrowCrossChain' : 'borrow',
        asset,
        amount: amountBigInt,
        status: 'pending',
        sourceChain,
        destChain,
        timestamp: Date.now()
      }
      
      setPendingTransactions(prev => [...prev, pendingTx])

      if (destChain && destChain !== sourceChain) {
        // Cross-chain borrow via CCIP
        const destChainConfig = CCIP_CONFIG[destChain as keyof typeof CCIP_CONFIG]
        if (!destChainConfig) {
          throw new Error('Destination chain not supported')
        }

        await writeContract({
          address: contractAddresses.lendingPool as `0x${string}`,
          abi: LENDING_POOL_ABI,
          functionName: 'borrow',
          args: [
            contractAddresses.syntheticAssets[asset as keyof typeof contractAddresses.syntheticAssets] as `0x${string}`,
            amountBigInt,
            BigInt(destChainConfig.chainSelector),
            address as `0x${string}`
          ] as const
        })
      } else {
        // Same-chain borrow (use chain selector 0 for same chain)
        await writeContract({
          address: contractAddresses.lendingPool as `0x${string}`,
          abi: LENDING_POOL_ABI,
          functionName: 'borrow',
          args: [
            contractAddresses.syntheticAssets[asset as keyof typeof contractAddresses.syntheticAssets] as `0x${string}`,
            amountBigInt,
            0n, // Same chain selector
            address as `0x${string}`
          ] as const
        })
      }

      toast.success('Borrow transaction submitted')
    } catch (err) {
      console.error('Borrow error:', err)
      toast.error('Borrow failed')
      
      // Remove from pending transactions on error
      setPendingTransactions(prev => prev.filter(tx => tx.id !== txId))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [address, writeContract, getContractAddresses])

  // Repay function
  const repay = useCallback(async (
    asset: string,
    amount: string,
    sourceChain: number
  ) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    setIsLoading(true)
    const txId = `repay-${Date.now()}`
    
    try {
      const contractAddresses = getContractAddresses(sourceChain)
      if (!contractAddresses) {
        throw new Error('Unsupported chain')
      }

      const amountBigInt = parseUnits(amount, 18)
      
      // Add to pending transactions
      const pendingTx: PendingTransaction = {
        id: txId,
        action: 'repay',
        asset,
        amount: amountBigInt,
        status: 'pending',
        sourceChain,
        timestamp: Date.now()
      }
      
      setPendingTransactions(prev => [...prev, pendingTx])

      await writeContract({
        address: contractAddresses.lendingPool as `0x${string}`,
        abi: LENDING_POOL_ABI,
        functionName: 'repay',
        args: [
          contractAddresses.syntheticAssets[asset as keyof typeof contractAddresses.syntheticAssets] as `0x${string}`,
          amountBigInt
        ] as const,
        // value: asset === 'ETH' ? amountBigInt : 0n
      })

      toast.success('Repay transaction submitted')
    } catch (err) {
      console.error('Repay error:', err)
      toast.error('Repay failed')
      
      // Remove from pending transactions on error
      setPendingTransactions(prev => prev.filter(tx => tx.id !== txId))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [address, writeContract, getContractAddresses])

  // Withdraw function
  const withdraw = useCallback(async (
    asset: string,
    amount: string,
    sourceChain: number
  ) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    setIsLoading(true)
    const txId = `withdraw-${Date.now()}`
    
    try {
      const contractAddresses = getContractAddresses(sourceChain)
      if (!contractAddresses) {
        throw new Error('Unsupported chain')
      }

      const amountBigInt = parseUnits(amount, 18)
      
      // Add to pending transactions
      const pendingTx: PendingTransaction = {
        id: txId,
        action: 'withdraw',
        asset,
        amount: amountBigInt,
        status: 'pending',
        sourceChain,
        timestamp: Date.now()
      }
      
      setPendingTransactions(prev => [...prev, pendingTx])

      await writeContract({
        address: contractAddresses.lendingPool as `0x${string}`,
        abi: LENDING_POOL_ABI,
        functionName: 'withdraw',
        args: [
          contractAddresses.syntheticAssets[asset as keyof typeof contractAddresses.syntheticAssets] as `0x${string}`,
          amountBigInt
        ] as const
      })

      toast.success('Withdraw transaction submitted')
    } catch (err) {
      console.error('Withdraw error:', err)
      toast.error('Withdraw failed')
      
      // Remove from pending transactions on error
      setPendingTransactions(prev => prev.filter(tx => tx.id !== txId))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [address, writeContract, getContractAddresses])

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      const errorMessage = writeError.message || 'Transaction failed'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }, [writeError])

  // Update transaction status based on wagmi state
  useEffect(() => {
    if (hash) {
      // Update pending transaction with hash
      setPendingTransactions(prev => 
        prev.map(tx => 
          tx.status === 'pending' && !tx.hash 
            ? { ...tx, hash } 
            : tx
        )
      )
    }
  }, [hash])

  useEffect(() => {
    if (isConfirmed) {
      // Mark transactions as confirmed
      setPendingTransactions(prev => 
        prev.map(tx => 
          tx.hash === hash 
            ? { ...tx, status: 'confirmed' } 
            : tx
        )
      )
    }
  }, [isConfirmed, hash])

  useEffect(() => {
    if (writeError) {
      // Mark transactions as failed
      setPendingTransactions(prev => 
        prev.map(tx => 
          tx.status === 'pending' 
            ? { ...tx, status: 'failed' } 
            : tx
        )
      )
    }
  }, [writeError])

  // Clear pending transactions older than 1 hour
  useEffect(() => {
    const interval = setInterval(() => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      setPendingTransactions(prev => 
        prev.filter(tx => tx.timestamp > oneHourAgo)
      )
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  return {
    deposit,
    borrow,
    repay,
    withdraw,
    pendingTransactions,
    isLoading: isWritePending || isConfirming,
    error,
    clearError: () => setError(null)
  }
} 
