import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import ClientBody from "./ClientBody";
import { Toaster } from '@/components/ui/sonner';
import Link from 'next/link';
import { SolanaWalletProvider } from '@/components/SolanaWalletProvider';
import { MultiChainWallet } from '@/components/MultiChainWallet';
import { ClientOnly } from '@/components/ClientOnly';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CrossChain.io - Cross-Chain DeFi Protocol",
  description: "Seamless cross-chain lending and borrowing with Ethereum and Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientOnly fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>}>
          <SolanaWalletProvider>
            <ClientBody>
              {/* Navigation */}
              <nav className="bg-gray-900 border-b border-gray-800 p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <div className="flex items-center space-x-8">
                    <Link href="/" className="text-2xl font-bold text-white">
                      CrossChain.io
                    </Link>
                    <div className="flex space-x-6">
                      <Link href="/" className="text-gray-300 hover:text-white">
                        Dashboard
                      </Link>
                      <Link href="/deposit" className="text-gray-300 hover:text-white">
                        Deposit
                      </Link>
                      <Link href="/borrow" className="text-gray-300 hover:text-white">
                        Borrow
                      </Link>
                      <Link href="/positions" className="text-gray-300 hover:text-white">
                        Positions
                      </Link>
                      <Link href="/transactions" className="text-gray-300 hover:text-white">
                        Transactions
                      </Link>
                    </div>
                  </div>
                  <MultiChainWallet />
                </div>
              </nav>

              {/* Main Content */}
              <main className="min-h-screen bg-gray-900">
                {children}
              </main>

              {/* Toast Notifications */}
              <Toaster />
            </ClientBody>
          </SolanaWalletProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
