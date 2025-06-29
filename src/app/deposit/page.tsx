"use client";

import { AppShell } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { SolanaWalletProvider } from "@/components/SolanaWalletProvider";
import { Toaster } from "@/components/ui/sonner";
import ClientBody from "../ClientBody";
import { WalletButton } from "@/components/WalletButton";

export default function DepositPage() {
  return (
    <ClientOnly fallback={<div className="min-h-screen bg-black"></div>}>
      <ClientBody>
        <SolanaWalletProvider>
          <AppShell>
            {/* Floating Wallet Button */}
            <div className="fixed top-6 right-6 z-50">
              <WalletButton />
            </div>
            <div className="min-h-screen bg-black p-8">
              <h1 className="text-4xl font-bold text-white mb-8">Deposit Assets</h1>
              <p className="text-white/80">Deposit functionality coming soon...</p>
            </div>
          </AppShell>
          <Toaster />
        </SolanaWalletProvider>
      </ClientBody>
    </ClientOnly>
  );
}
