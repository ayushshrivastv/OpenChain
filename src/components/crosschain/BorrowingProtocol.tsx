"use client";

import { Dispatch, SetStateAction } from 'react';

// SVG Logo Components from parent
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

interface BorrowingProtocolProps {
  networks: string[];
  selectedNetwork: string;
  setSelectedNetwork: Dispatch<SetStateAction<string>>;
}

export function BorrowingProtocol({ networks, selectedNetwork, setSelectedNetwork }: BorrowingProtocolProps) {
  return (
    <div className="flex-grow pt-12">
      <h2 className="text-3xl font-bold text-white mb-8">Borrowing Protocol</h2>

      {/* Network Selector Buttons */}
      <div className="flex items-center space-x-3 mb-6">
        {networks.map((network: string) => (
          <button
            key={network}
            onClick={() => setSelectedNetwork(network)}
            className={`flex items-center justify-center font-semibold py-2 px-5 rounded-full text-base transition-colors ${
              selectedNetwork === network
                ? 'bg-black text-white p-1 animate-rainbow-border'
                : 'bg-black/50 hover:bg-black/80 text-gray-300'
            }`}
          >
            <span className={`flex items-center justify-center w-full h-full rounded-full ${selectedNetwork === network ? 'bg-black' : ''}`}>
              {network === 'Polygon' ? <PolygonLogo /> : <EthLogo />}
              {network}
            </span>
          </button>
        ))}
      </div>

      {/* Empty Insight Box */}
      <div className="bg-white/5 border border-sky-300/40 rounded-2xl h-48 mb-12">
        {/* Intentionally empty for future data visualizations */}
      </div>
      
      {/* Feature Cards for Borrowing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: Select Asset to Borrow */}
        <div className="bg-[#F9DDC7] p-8 rounded-2xl text-[#031138] flex flex-col justify-between shadow-xl transition-transform hover:scale-105">
          <div>
            <h2 className="text-4xl font-extrabold mb-4">Select an Asset to Borrow</h2>
            <p className="text-lg mb-6">Choose from a variety of synthetic assets to borrow against your cross-chain collateral. Your loan is instantly available on the selected network.</p>
          </div>
          <button className="bg-white text-[#031138] font-bold py-3 px-6 rounded-lg self-start mt-4">
            CHOOSE ASSET
          </button>
        </div>

        {/* Card 2: Flexible Repayment */}
        <div className="bg-[#F9DDC7] p-8 rounded-2xl text-[#031138] flex flex-col justify-between shadow-xl transition-transform hover:scale-105">
          <div>
            <h2 className="text-4xl font-extrabold mb-4">Flexible Repayment</h2>
            <p className="text-lg mb-6">Repay your loan at any time, with any of the supported assets on this chain. Manage your debt with ease and flexibility.</p>
          </div>
          <button className="bg-white text-[#031138] font-bold py-3 px-6 rounded-lg self-start mt-4">
            REPAY LOAN
          </button>
        </div>
      </div>
    </div>
  );
} 
