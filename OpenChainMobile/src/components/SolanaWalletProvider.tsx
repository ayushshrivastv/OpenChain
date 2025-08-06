import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { 
  transact, 
  Web3MobileWallet 
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { contractService } from '../services/ContractService';
import { priceService } from '../services/PriceService';

// Types
interface WalletContextType {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  sendTransaction: (transaction: Transaction) => Promise<string>;
}

// Create context
const WalletContext = createContext<WalletContextType | null>(null);

// Provider component
interface SolanaWalletProviderProps {
  children: ReactNode;
}

export const SolanaWalletProvider: React.FC<SolanaWalletProviderProps> = ({ children }) => {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Solana connection
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  const connect = async () => {
    try {
      setConnecting(true);
      
      await transact(async (wallet: Web3MobileWallet) => {
        const authResult = await wallet.authorize({
          cluster: 'devnet',
          identity: {
            name: 'OpenChain Mobile',
            uri: 'https://openchain.app',
            icon: 'favicon.ico',
          },
        });

        if (authResult.accounts.length > 0) {
          const pubKey = new PublicKey(authResult.accounts[0].address);
          setPublicKey(pubKey);
          setConnected(true);
          
          // Initialize contract service with wallet
          contractService.initializeProgram(wallet);
        }
      });
    } catch (error: any) {
      // Handle different types of wallet connection errors gracefully
      if (error?.message?.includes('cancelled by user')) {
        console.log('Wallet connection cancelled by user');
      } else if (error?.message?.includes('No wallet found')) {
        console.log('No Solana wallet found on device');
      } else {
        console.warn('Wallet connection failed:', error?.message || error);
      }
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setPublicKey(null);
    setConnected(false);
  };

  const signTransaction = async (transaction: Transaction): Promise<Transaction> => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    return new Promise((resolve, reject) => {
      transact(async (wallet: Web3MobileWallet) => {
        try {
          const signedTransactions = await wallet.signTransactions({
            transactions: [transaction],
          });
          resolve(signedTransactions[0]);
        } catch (error: any) {
          console.warn('Transaction signing failed:', error?.message || error);
          reject(error);
        }
      });
    });
  };

  const signAllTransactions = async (transactions: Transaction[]): Promise<Transaction[]> => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    return new Promise((resolve, reject) => {
      transact(async (wallet: Web3MobileWallet) => {
        try {
          const signedTransactions = await wallet.signTransactions({
            transactions,
          });
          resolve(signedTransactions);
        } catch (error: any) {
          console.warn('Transaction signing failed:', error?.message || error);
          reject(error);
        }
      });
    });
  };

  const sendTransaction = async (transaction: Transaction): Promise<string> => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    return new Promise((resolve, reject) => {
      transact(async (wallet: Web3MobileWallet) => {
        try {
          const signedTransactions = await wallet.signAndSendTransactions({
            transactions: [transaction],
          });
          resolve(signedTransactions[0]);
        } catch (error: any) {
          console.warn('Transaction signing failed:', error?.message || error);
          reject(error);
        }
      });
    });
  };

  const value: WalletContextType = {
    publicKey,
    connected,
    connecting,
    connect,
    disconnect,
    signTransaction,
    signAllTransactions,
    sendTransaction,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Hook to use wallet context
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a SolanaWalletProvider');
  }
  return context;
};
