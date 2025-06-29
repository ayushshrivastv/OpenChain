"use client";

import { type FC, type ReactNode, useEffect, useState } from "react";
import dynamic from 'next/dynamic';

interface SolanaWalletProviderProps {
  children: ReactNode;
}

// Properly type the dynamic import component
interface SolanaWalletProviderInternalProps {
  children: ReactNode;
}

// Dynamic import of the actual wallet provider to ensure it's never loaded server-side
const DynamicSolanaProvider = dynamic(
  () => import('./SolanaWalletProviderInternal').then(mod => ({ 
    default: mod.SolanaWalletProviderInternal 
  })),
  {
    ssr: false,
    loading: () => <div className="opacity-0">Loading Solana wallet...</div>
  }
) as FC<SolanaWalletProviderInternalProps>;

export const SolanaWalletProvider: FC<SolanaWalletProviderProps> = ({
  children,
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <DynamicSolanaProvider>
      {children}
    </DynamicSolanaProvider>
  );
};

