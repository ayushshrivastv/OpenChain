"use client";

import { ConnectButton, useChainModal } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";

export function WalletButton() {
  const [mounted, setMounted] = useState(false);
  const [showChainModal, setShowChainModal] = useState(false);
  
  // Always call the hook - it should be available from RainbowKit
  const { openChainModal } = useChainModal();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="px-6 py-2 bg-[#2a3a5e] text-white font-extrabold text-lg rounded-lg hover:bg-blue-900/80 transition-colors">
        Connect Wallet
      </button>
    );
  }

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openConnectModal,
        openAccountModal,
        openChainModal: rkOpenChainModal,
        authenticationStatus,
        mounted: rainbowMounted,
      }) => {
        const ready = rainbowMounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === "authenticated");

        // Use RainbowKit's openChainModal if available, else fallback to custom
        const handleChainModal = rkOpenChainModal || openChainModal || (() => setShowChainModal(true));

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
            className="flex items-center gap-3"
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className="px-6 py-2 bg-[#2a3a5e] text-white font-extrabold text-lg rounded-lg hover:bg-blue-900/80 transition-colors"
              >
                Connect Wallet
              </button>
            ) : (
              <>
                {/* Chain Logo and Balance on the left, clickable for modal */}
                {chain && (
                  <button
                    onClick={handleChainModal}
                    className="flex items-center gap-2 bg-transparent border border-gray-600 rounded-xl px-3 py-1 shadow-sm hover:bg-gray-900/10 transition-colors"
                  >
                    {chain.iconUrl && (
                      <img
                        src={chain.iconUrl}
                        alt={chain.name}
                        className="w-5 h-5 rounded-full"
                        style={{ background: chain.iconBackground }}
                      />
                    )}
                    <span className="text-white font-medium text-base">
                      {account.displayBalance} {chain.name}
                    </span>
                  </button>
                )}
                <button
                  onClick={openAccountModal}
                  className="px-6 py-2 bg-[#2a3a5e] text-white font-extrabold text-lg rounded-lg hover:bg-blue-900/80 transition-colors"
                  title="Click to view account details and disconnect"
                >
                  Connected
                </button>
                {/* Custom Chain Modal (if needed) */}
                {showChainModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-[#f9f9f9] rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl flex flex-col items-center relative">
                      <button
                        onClick={() => setShowChainModal(false)}
                        className="absolute top-5 right-5 bg-[#ececec] hover:bg-gray-200 rounded-full p-2 transition-colors"
                        aria-label="Close"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                      <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Select Network</h2>
                      {/* Custom network list including Solana USDC */}
                      <div className="w-full flex flex-col gap-4">
                        {/* Example EVM network (current chain) */}
                        {chain && (
                          <div className="flex items-center justify-between bg-white rounded-2xl shadow border border-gray-200 px-4 py-3">
                            <div className="flex items-center gap-3">
                              {chain.iconUrl && (
                                <img src={chain.iconUrl} alt={chain.name} className="w-7 h-7 rounded-full" style={{ background: chain.iconBackground }} />
                              )}
                              <span className="text-gray-900 font-medium text-base">{chain.name}</span>
                            </div>
                            <button className="px-4 py-2 bg-gray-900 text-white rounded-xl font-medium text-sm cursor-default opacity-60">Connected</button>
                          </div>
                        )}
                        {/* Solana USDC option */}
                        <div className="flex items-center justify-between bg-white rounded-2xl shadow border border-gray-200 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" alt="Solana USDC" className="w-7 h-7 rounded-full" />
                            <span className="text-gray-900 font-medium text-base">Solana USDC</span>
                          </div>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors">Connect</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
} 
