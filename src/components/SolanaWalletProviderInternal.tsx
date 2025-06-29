"use client";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { type FC, type ReactNode, useMemo, useEffect, useState } from "react";

// Import default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";

interface SolanaWalletProviderInternalProps {
  children: ReactNode;
}

export const SolanaWalletProviderInternal: FC<SolanaWalletProviderInternalProps> = ({
  children,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);

  // Multiple layers of client-side checks
  useEffect(() => {
    // Check if we're in browser environment
    setIsBrowser(typeof window !== 'undefined' && typeof document !== 'undefined');
    
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 200); // Increased delay to ensure DOM is fully ready

    return () => clearTimeout(timer);
  }, []);

  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => {
    if (!isBrowser || !isReady) return 'https://api.devnet.solana.com';
    
    try {
      return clusterApiUrl(network);
    } catch (error) {
      console.warn('Failed to get cluster API URL, using fallback:', error);
      return 'https://api.devnet.solana.com';
    }
  }, [network, isBrowser, isReady]);

  // Create wallet adapters - with extensive safety checks
  const wallets = useMemo(() => {
    if (!isReady || !isBrowser || typeof window === 'undefined') {
      return [];
    }

    // Additional check for indexedDB availability
    if (typeof indexedDB === 'undefined') {
      console.warn('IndexedDB not available, wallet adapters disabled');
      return [];
    }

    try {
      // Additional check for wallet availability
      const adapters = [];
      
      // Only add Phantom if detected or available
      try {
        if (typeof window !== 'undefined') {
          adapters.push(new PhantomWalletAdapter());
        }
      } catch (error) {
        console.warn('Phantom wallet adapter failed to initialize:', error);
      }

      // Only add Solflare if detected or available  
      try {
        if (typeof window !== 'undefined') {
          adapters.push(new SolflareWalletAdapter());
        }
      } catch (error) {
        console.warn('Solflare wallet adapter failed to initialize:', error);
      }

      return adapters;
    } catch (error) {
      console.warn('Failed to initialize any wallet adapters:', error);
      return [];
    }
  }, [isReady, isBrowser]);

  if (!isReady || !isBrowser) {
    return <>{children}</>;
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={false}
        onError={(error) => {
          console.warn('Wallet provider error:', error);
          // Don't throw, just log the error
        }}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Also export as default for dynamic import compatibility
export default SolanaWalletProviderInternal; 
