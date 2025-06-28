"use client";

import { WalletButton } from "@/components/WalletButton";
import { ClientOnly } from "@/components/ClientOnly";
import { SolanaWalletProvider } from "@/components/SolanaWalletProvider";
import { Toaster } from "@/components/ui/sonner";
import ClientBody from "../ClientBody";

export default function CrossChainPage() {
  return (
    <ClientOnly>
      <ClientBody>
        <SolanaWalletProvider>
          <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="flex justify-end">
              <WalletButton />
            </div>
            <div className="flex flex-col items-center justify-center flex-grow pt-16">
            </div>
          </div>
          <Toaster />
        </SolanaWalletProvider>
      </ClientBody>
    </ClientOnly>
  );
} 
