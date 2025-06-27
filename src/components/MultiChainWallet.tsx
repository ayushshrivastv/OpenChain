"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";
import { WalletConnector } from "./WalletConnector";
import { Button } from "./ui/button";

export function MultiChainWallet() {
  const [activeChain, setActiveChain] = useState<"ethereum" | "solana">(
    "ethereum",
  );
  const { connected: solanaConnected, publicKey } = useWallet();

  return (
    <div className="flex items-center gap-4">
      {/* Chain Selector */}
      <div className="flex rounded-lg border border-gray-700 overflow-hidden">
        <Button
          variant={activeChain === "ethereum" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveChain("ethereum")}
          className="rounded-none px-3 py-1 text-xs"
        >
          ETH
        </Button>
        <Button
          variant={activeChain === "solana" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveChain("solana")}
          className="rounded-none px-3 py-1 text-xs"
        >
          SOL
        </Button>
      </div>

      {/* Wallet Connection */}
      {activeChain === "ethereum" ? (
        <WalletConnector />
      ) : (
        <div className="flex items-center gap-2">
          <WalletMultiButton className="!bg-blue-600 !text-white !rounded-lg !px-4 !py-2 !text-sm" />
          {solanaConnected && publicKey && (
            <div className="text-xs text-gray-400">
              {publicKey.toString().slice(0, 4)}...
              {publicKey.toString().slice(-4)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
