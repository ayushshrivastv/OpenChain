"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState, useEffect } from "react";

export function WalletConnector() {
  const [selectedWallet, setSelectedWallet] = useState<"evm" | "solana" | null>(
    null,
  );
  const [isClient, setIsClient] = useState(false);

  // Ensure component is client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Loading wallet connections...
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <CardContent className="space-y-4 p-0">
              <div className="w-full h-32 bg-gray-800 rounded-lg animate-pulse" />
            </CardContent>
          </Card>
          <Card className="p-6">
            <CardContent className="space-y-4 p-0">
              <div className="w-full h-32 bg-gray-800 rounded-lg animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground">
          Connect your EVM or Solana wallet to start using the cross-chain
          protocol
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* EVM Wallet Connection */}
        <Card className="p-6">
          <CardContent className="space-y-4 p-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                🔶
              </div>
              <div>
                <h3 className="font-semibold">EVM Chains</h3>
                <p className="text-sm text-muted-foreground">
                  Ethereum, Polygon & more
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Supported Networks:</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-secondary rounded text-xs">
                  Sepolia Testnet
                </span>
                <span className="px-2 py-1 bg-secondary rounded text-xs">
                  Mumbai Testnet
                </span>
              </div>
            </div>

            <div className="pt-2">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  authenticationStatus,
                  mounted,
                }) => {
                  const ready = mounted && authenticationStatus !== "loading";
                  const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                      authenticationStatus === "authenticated");

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
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <Button
                              onClick={openConnectModal}
                              className="w-full"
                              variant="default"
                            >
                              Connect EVM Wallet
                            </Button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <Button
                              onClick={openChainModal}
                              className="w-full"
                              variant="destructive"
                            >
                              Wrong network
                            </Button>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            <Button
                              onClick={openChainModal}
                              className="w-full"
                              variant="outline"
                            >
                              {chain.hasIcon && (
                                <div
                                  style={{
                                    background: chain.iconBackground,
                                    width: 16,
                                    height: 16,
                                    borderRadius: 999,
                                    overflow: "hidden",
                                    marginRight: 8,
                                  }}
                                >
                                  {chain.iconUrl && (
                                    <img
                                      alt={chain.name ?? "Chain icon"}
                                      src={chain.iconUrl}
                                      style={{ width: 16, height: 16 }}
                                    />
                                  )}
                                </div>
                              )}
                              {chain.name}
                            </Button>

                            <Button
                              onClick={openAccountModal}
                              className="w-full"
                              variant="outline"
                            >
                              {account.displayName}
                              {account.displayBalance
                                ? ` (${account.displayBalance})`
                                : ""}
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          </CardContent>
        </Card>

        {/* Solana Wallet Connection */}
        <Card className="p-6">
          <CardContent className="space-y-4 p-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                🟣
              </div>
              <div>
                <h3 className="font-semibold">Solana</h3>
                <p className="text-sm text-muted-foreground">Solana Devnet</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Supported Network:</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-secondary rounded text-xs">
                  Devnet
                </span>
              </div>
            </div>

            <div className="pt-2">
              <WalletMultiButton className="!w-full !bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-md !h-10" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cross-Chain Features Info */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3 flex items-center">
            ⚡ Chainlink CCIP Integration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Cross-Chain Lending:</strong>
              <p className="text-muted-foreground">
                Deposit on one chain, borrow on another
              </p>
            </div>
            <div>
              <strong>Real-Time Prices:</strong>
              <p className="text-muted-foreground">
                Chainlink Price Feeds for accurate valuation
              </p>
            </div>
            <div>
              <strong>Secure Messaging:</strong>
              <p className="text-muted-foreground">
                CCIP ensures safe cross-chain communication
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
