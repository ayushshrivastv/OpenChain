import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { SolanaWalletProvider } from "@/components/SolanaWalletProvider";
import { Toaster } from "@/components/ui/sonner";
import ClientBody from "./ClientBody";

export const metadata: Metadata = {
  title: "OpenChain: CrossChain Lending and Borrowing Protocol Powered by Chainlink",
  description: "A Cross-Chain Lending and Borrowing Protocol powered by Chainlink.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased bg-black text-white">
        <ClientOnly fallback={<div className="min-h-screen bg-black"></div>}>
          <ClientBody>
            <SolanaWalletProvider>
              <AppShell>
                {children}
              </AppShell>
              <Toaster />
            </SolanaWalletProvider>
          </ClientBody>
        </ClientOnly>
      </body>
    </html>
  );
}
