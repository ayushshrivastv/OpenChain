"use client";

import { LeftSidebar } from "@/components/LeftSidebar";
import { ClientOnly } from "@/components/ClientOnly";
import { SolanaWalletProvider } from "@/components/SolanaWalletProvider";
import { Toaster } from "@/components/ui/sonner";
import ClientBody from "../ClientBody";
import { WalletButton } from "@/components/WalletButton";

export default function PositionsPage() {
  return (
    <ClientOnly fallback={<div className="min-h-screen bg-black"></div>}>
      <ClientBody>
        <SolanaWalletProvider>
          <LeftSidebar />
          {/* Floating Wallet Button */}
          <div className="fixed top-6 right-6 z-50">
            <WalletButton />
          </div>
          <main className="pl-48">
            <div className="min-h-screen bg-black">
            </div>
          </main>
          <Toaster />
        </SolanaWalletProvider>
      </ClientBody>
    </ClientOnly>
  );
}
