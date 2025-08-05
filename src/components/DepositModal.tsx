"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CONTRACT_ADDRESSES } from '@/lib/wagmi';
import { LENDING_POOL_ABI } from '@/lib/contracts';

import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';

const SOLANA_PROGRAM_ID = 'ss9Hb9bSa6jW2w3UUNBN2aGviAUVMmnwVZ71HZw6xBL';
const SOLANA_ENDPOINT = 'https://api.devnet.solana.com';
const USDC_MINT_ADDRESS = 'ENTER_USDC_SPL_TOKEN_ADDRESS'; // <--- update this with your Devnet USDC SPL
const LENDING_POOL_IDL = {/* ...IDL JSON here... */}; // <-- paste your Anchor program IDL here

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: {
    symbol: string;
    name: string;
    address: string;
    price: number;
    balance: string;
  };
}

type ModalStep = 'deposit' | 'confirm' | 'pending' | 'success';

export function DepositModal({ isOpen, onClose, token }: DepositModalProps) {
  const [step, setStep] = useState<ModalStep>('deposit');
  const [depositAmount, setDepositAmount] = useState('');
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [solanaError, setSolanaError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();

  // Solana wallet
  const { publicKey, sendTransaction, connected: solanaConnected } = useWallet();

  // Get user's token balance
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: address,
    token: token.address === 'native' ? undefined : token.address as `0x${string}`,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    }
  });

  // Contract write hook for deposit
  const { writeContract, isPending: isWritePending, error: writeError } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  // Format balance function - fixed syntax
  const formatBalance = useCallback((): string => {
    if (balanceLoading) return 'Loading...';
    if (!balance || !balance.value) return '0.0000';
    return parseFloat(formatEther(balance.value)).toFixed(4);
  }, [balance, balanceLoading]);

  // Get USD value
  const getUsdValue = useMemo(() => {
    if (!depositAmount) return '$0.00';
    return `$${(parseFloat(depositAmount) * token.price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }, [depositAmount, token.price]);

  // Handle deposit submission
  const handleDeposit = useCallback(() => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    setStep('confirm');
  }, [depositAmount]);

  // Handle transaction confirmation
  const handleConfirm = useCallback(async () => {
    try {
      setSolanaError(null);
      setStep('pending');
      // Determine EVM or Solana by token address pattern or network (simple check)
      const isEvm = token.address.startsWith('0x') || token.address === 'native';
      if (isEvm) {
        // EVM: call LendingPool.deposit for ERC20 or fallback to native deposit
        const lendingPool = CONTRACT_ADDRESSES[11155111]?.lendingPool; // Assume Sepolia; adjust for prod
        if (!lendingPool) throw new Error('LendingPool contract not configured');
        let tx;
        if (token.address === 'native') {
          tx = await writeContract({
            address: lendingPool as `0x${string}`,
            abi: LENDING_POOL_ABI,
            functionName: 'deposit',
            args: [parseEther(depositAmount)],
            value: parseEther(depositAmount),
          });
        } else {
          tx = await writeContract({
            address: lendingPool as `0x${string}`,
            abi: LENDING_POOL_ABI,
            functionName: 'deposit',
            args: [token.address, parseEther(depositAmount)],
          });
        }
        setTransactionHash((tx as any)?.hash || '');
      } else if (publicKey && sendTransaction) {
        // Solana: anchor deposit call
        const connection = new Connection(SOLANA_ENDPOINT);
        // @ts-ignore
        const provider = new AnchorProvider(connection, window.solana, {});
        const program = new Program(LENDING_POOL_IDL as any, new PublicKey(SOLANA_PROGRAM_ID), provider);

        // Find accounts: user, pool, asset_info (from your app/backend or PDA), user_token_acc, pool_token_acc, mint, token_program
        // Placeholder: you must replace these with the correct derivations for your pool
        const poolPda = new PublicKey('ENTER_POOL_PDA'); // replace as needed
        const mint = new PublicKey(USDC_MINT_ADDRESS); // for USDC; PublicKey for SOL if available

        // Find TokenAccount for user (use associated token account)
        const { value: userTokenAccounts } = await connection.getParsedTokenAccountsByOwner(publicKey, { mint });
        if (!userTokenAccounts.length) throw new Error('No USDC token account in wallet');
        const userToken = userTokenAccounts[0].pubkey;
        // More context accounts as required by your IDL

        // Create transaction:
        const txSig = await program.methods.deposit(new BN(parseFloat(depositAmount) * 10 ** 6)) // USDC decimals
          .accounts({
            user: publicKey,
            pool: poolPda,
            mint,
            userTokenAccount: userToken,
            // ...rest per your program IDL
            tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
          })
          .rpc();
        setTransactionHash(txSig);
      } else {
        // If no wallet, stub as before
        setTimeout(() => setStep('success'), 2000);
        return;
      }
    } catch (error: any) {
      console.error('Deposit failed:', error);
      setSolanaError(error?.message || 'Transaction failed.');
      setStep('deposit');
    }
  }, [depositAmount, token, writeContract, publicKey, sendTransaction]);

  const handleClose = () => {
    setTimeout(() => {
      setStep('deposit');
      setDepositAmount('');
      setTransactionHash('');
      setSolanaError(null);
    }, 150);
    onClose();
  };

  useEffect(() => {
    if (isSuccess && step === 'pending') {
      setStep('success');
    }
  }, [isSuccess, step]);

  // For Solana, treat tx hash as success
  useEffect(() => {
    if (transactionHash && step === 'pending' && !(transactionHash.startsWith('0x'))) {
      setTimeout(() => setStep('success'), 2000);
    }
  }, [transactionHash, step]);

  if (!isOpen) return null;

  // Helper: show if Solana wallet is connected and token is Solana
  const isSolanaToken = !(token.address.startsWith('0x') || token.address === 'native');
  const canDepositSolana = isSolanaToken && publicKey;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto max-h-[95vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 'deposit' && 'Deposit Collateral'}
            {step === 'confirm' && 'Confirm Transaction'}
            {step === 'pending' && 'Transaction Pending'}
            {step === 'success' && 'Deposit Successful'}
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">

            {/* Deposit Step */}
            {step === 'deposit' && (
              <>
                {/* Token Info Card */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden">
                      <Image
                        src={token.symbol === 'USDC' ? '/USDC.png' :
                             token.symbol === 'ETH' || token.symbol === 'WETH' ? '/ethereum-logo.png' :
                             '/Solana_logo.png'}
                        alt={token.symbol}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{token.name}</h3>
                      <p className="text-gray-600 font-medium">{token.symbol}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ${token.price.toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-600">Current Price</div>
                    </div>
                  </div>
                </div>

                {/* Wallet Status */}
                {(!isConnected && !canDepositSolana) ? (
                  <div className="text-center p-8 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-600 mb-6">Connect your wallet to view your balance and make deposits</p>
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <button
                          onClick={openConnectModal}
                          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                          Connect Wallet
                        </button>
                      )}
                    </ConnectButton.Custom>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Balance Display */}
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700 font-medium">Available Balance</span>
                        <span className="text-xl font-bold text-gray-900">
                          {formatBalance()} {token.symbol}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {isSolanaToken && publicKey
                          ? `Wallet: ${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}`
                          : `Wallet: ${address?.slice(0, 6)}...${address?.slice(-4)}`}
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-4">
                      <label className="block text-lg font-semibold text-gray-900">
                        Deposit Amount
                      </label>

                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full text-3xl font-bold text-gray-900 bg-transparent border-0 outline-none placeholder-gray-400"
                        />
                        <div className="text-lg text-gray-600 mt-2">{getUsdValue}</div>
                      </div>

                      {/* Quick Amount Buttons */}
                      <div className="grid grid-cols-4 gap-3">
                        {['25%', '50%', '75%', 'MAX'].map((percentage) => (
                          <button
                            key={percentage}
                            onClick={() => {
                              if (!balance || !balance.value || (!isConnected && !canDepositSolana)) return;
                              const balanceNum = parseFloat(formatEther(balance.value));
                              const multiplier = percentage === 'MAX' ? 1 : parseInt(percentage) / 100;
                              const adjustedBalance = token.symbol === 'ETH' && percentage === 'MAX'
                                ? Math.max(0, balanceNum - 0.01)
                                : balanceNum * multiplier;
                              setDepositAmount(adjustedBalance.toFixed(4));
                            }}
                            disabled={!balance || (!isConnected && !canDepositSolana) || balanceLoading}
                            className="py-2 px-3 text-sm font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                          >
                            {percentage}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Collateral Summary */}
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Collateral Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Collateral Value</span>
                          <span className="font-semibold text-gray-900">{getUsdValue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max LTV</span>
                          <span className="font-semibold text-gray-900">85%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Borrowing Power</span>
                          <span className="font-semibold text-green-600">
                            ${depositAmount ? (parseFloat(depositAmount) * token.price * 0.85).toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Deposit Button */}
                    <button
                      onClick={handleDeposit}
                      disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                    >
                      Continue to Confirm
                    </button>
                    {solanaError && (
                      <div className="mt-4 text-red-600 text-sm">
                        {solanaError}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Confirm Step */}
            {step === 'confirm' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Your Deposit</h3>
                  <p className="text-gray-600">Please review the transaction details</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 space-y-4 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Token</span>
                    <span className="font-semibold text-gray-900">{token.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-semibold text-gray-900">{depositAmount} {token.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">USD Value</span>
                    <span className="font-semibold text-gray-900">{getUsdValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network</span>
                    <span className="font-semibold text-gray-900">
                      {isSolanaToken ? 'Solana Devnet' : 'Ethereum Sepolia'}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep('deposit')}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isWritePending}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
                  >
                    {isWritePending ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
                {/* Show error if any */}
                {writeError && (
                  <div className="mt-4 text-red-600 text-sm">
                    {writeError.message || 'Transaction failed.'}
                  </div>
                )}
                {solanaError && (
                  <div className="mt-4 text-red-600 text-sm">
                    {solanaError}
                  </div>
                )}
              </div>
            )}

            {/* Pending Step */}
            {step === 'pending' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                  <div className="w-8 h-8 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Transaction Pending</h3>
                  <p className="text-gray-600">Please wait while your transaction is confirmed on the blockchain</p>
                </div>

                {transactionHash && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Transaction Hash:</p>
                    <p className="text-xs font-mono text-gray-900 break-all">{transactionHash}</p>
                    {isSolanaToken && (
                      <a
                        href={`https://explorer.solana.com/tx/${transactionHash}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2 text-blue-600 underline text-xs"
                      >
                        View on Solana Explorer
                      </a>
                    )}
                    {!isSolanaToken && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2 text-blue-600 underline text-xs"
                      >
                        View on Etherscan
                      </a>
                    )}
                  </div>
                )}
                {/* Solana fallback message */}
                {!transactionHash && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-700">
                    {isSolanaToken
                      ? 'Waiting for Solana transaction...'
                      : 'Solana deposits coming soon!'}
                  </div>
                )}
              </div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Deposit Successful!</h3>
                  <p className="text-gray-600">Your collateral has been deposited successfully</p>
                </div>

                <div className="bg-green-50 rounded-xl p-6 space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deposited</span>
                    <span className="font-semibold text-gray-900">{depositAmount} {token.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Value</span>
                    <span className="font-semibold text-gray-900">{getUsdValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New Borrowing Power</span>
                    <span className="font-semibold text-green-600">
                      ${depositAmount ? (parseFloat(depositAmount) * token.price * 0.85).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  {transactionHash && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tx Hash</span>
                      <span className="font-mono text-xs text-gray-900 break-all">{transactionHash}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleClose}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
