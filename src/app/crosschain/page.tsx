"use client";

import { useState } from 'react';
import Image from 'next/image';
import { LendingProtocol } from '@/components/crosschain/LendingProtocol';
import { BorrowingProtocol } from '@/components/crosschain/BorrowingProtocol';
import { YourAssets } from '@/components/crosschain/YourAssets';
import { WalletButton } from '@/components/WalletButton';

// SVG Logo Components
const EthLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
    <path d="M12 2.9L11.5 3.5V15.9L12 16.4L17.5 13.1L12 2.9Z" fill="white"/>
    <path d="M12 2.9L6.5 13.1L12 16.4V2.9Z" fill="gray"/>
    <path d="M12 17.6L11.6 17.9V21L12 22.1L17.5 14.3L12 17.6Z" fill="white"/>
    <path d="M12 22.1V17.6L6.5 14.3L12 22.1Z" fill="gray"/>
    <path d="M12 16.4L17.5 13.1L12 9.8V16.4Z" fill="silver"/>
    <path d="M6.5 13.1L12 16.4V9.8L6.5 13.1Z" fill="gray"/>
  </svg>
);

const PolygonLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
    <path d="M6.79 7.97a.76.76 0 0 0-.76.76v6.54a.76.76 0 0 0 .76.76h.94v-2.18h-.19V9.48h3.33v1.88h-1.32v.94h1.32v2.54H9.04v2.18h3.8a.76.76 0 0 0 .76-.76V9.48a.76.76 0 0 0-.76-.76h-6.05zm8.43 0a.76.76 0 0 0-.76.76v6.54a.76.76 0 0 0 .76.76h3.8a.76.76 0 0 0 .76-.76V9.48a.76.76 0 0 0-.76-.76h-3.8zm.75 2.18h2.28v3.02h-2.28V10.15z" fill="#8247E5"/>
  </svg>
);

export default function CrossChainPage() {
  const [activeTab, setActiveTab] = useState("Cross Chain Lending");
  const [selectedNetwork, setSelectedNetwork] = useState('Ethereum');
  const networks = ['Ethereum', 'Solana'];
  const TABS = ["Cross Chain Lending", "Cross Chain Borrowing", "Your Assets"];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header: Title and Wallet on the same line */}
      <div className="flex items-center justify-between gap-8 mb-12">
        <h1 className="flex-1 text-4xl lg:text-5xl font-extrabold text-white leading-tight">
          Cross Chain: Unlock Liquidity<br />
          Across All Blockchains
        </h1>
        <div className="flex-shrink-0">
          <WalletButton />
        </div>
      </div>

      {/* Tab Navigation and Content */}
      <div className="flex items-end justify-between border-b border-gray-700 mb-8">
        <div className="flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 font-extrabold text-lg transition-colors relative ${
                activeTab === tab
                  ? 'text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED]"></div>
              )}
            </button>
          ))}
        </div>
        <div className="pb-4">
          <Image
            src="/Chinlink.png"
            alt="Powered by Chainlink"
            width={120}
            height={40}
            className="object-contain"
          />
        </div>
      </div>

      <div>
        {activeTab === 'Cross Chain Lending' && <LendingProtocol networks={networks} selectedNetwork={selectedNetwork} setSelectedNetwork={setSelectedNetwork} />}
        {activeTab === 'Cross Chain Borrowing' && <BorrowingProtocol networks={networks} selectedNetwork={selectedNetwork} setSelectedNetwork={setSelectedNetwork} />}
        {activeTab === 'Your Assets' && <YourAssets selectedNetwork={selectedNetwork} />}
      </div>
    </div>
  );
}
