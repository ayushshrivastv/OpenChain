"use client";

import { LeftSidebar } from "@/components/LeftSidebar";
import { ClientOnly } from "@/components/ClientOnly";
import { SolanaWalletProvider } from "@/components/SolanaWalletProvider";
import { Toaster } from "@/components/ui/sonner";
import ClientBody from "./ClientBody";
import { WalletButton } from "@/components/WalletButton";
import { Dashboard } from "@/components/Dashboard";

export default function HomePage() {
  return (
    <ClientOnly fallback={<div className="min-h-screen bg-metamask-blue"></div>}>
      <ClientBody>
        <SolanaWalletProvider>
          <Dashboard />
          <Toaster />
        </SolanaWalletProvider>
      </ClientBody>
    </ClientOnly>
  );
}
