"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTransactions } from "@/hooks/useTransactions";
import { CCIP_CONFIG } from "@/lib/chains";
import { formatCurrency, formatUnits, parseUnits } from "@/lib/contracts";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccount, useChainId } from "wagmi";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "deposit" | "borrow" | "repay" | "withdraw";
  asset: string;
  availableBalance?: bigint;
  currentPrice?: bigint;
  onTransaction?: (txId: string) => void;
}

export function TransactionModal({
  isOpen,
  onClose,
  type,
  asset,
  availableBalance = 0n,
  currentPrice = 0n,
  onTransaction,
}: TransactionModalProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { deposit, borrow, repay, withdraw, isLoading } = useTransactions();

  const [amount, setAmount] = useState("");
  const [selectedSourceChain, setSelectedSourceChain] = useState<number>(
    chainId || 11155111,
  );
  const [selectedDestChain, setSelectedDestChain] = useState<number>(
    chainId || 11155111,
  );
  const [isCrossChain, setIsCrossChain] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<bigint>(0n);
  const [receiverAddress, setReceiverAddress] = useState("");

  // Reset form when modal opens/closes or type changes
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setSelectedSourceChain(chainId || 11155111);
      setSelectedDestChain(chainId || 11155111);
      setIsCrossChain(false);
      setEstimatedFee(0n);
    }
  }, [isOpen, chainId]);

  // Update cross-chain status when chains change
  useEffect(() => {
    setIsCrossChain(selectedSourceChain !== selectedDestChain);
  }, [selectedSourceChain, selectedDestChain]);

  // Estimate CCIP fees when cross-chain is enabled
  useEffect(() => {
    if (isCrossChain && amount && (type === "borrow" || type === "deposit")) {
      // For now, use a fixed estimate - in production this would call the CCIP router
      setEstimatedFee(BigInt(Math.floor(Number.parseFloat("0.001") * 1e18))); // 0.001 ETH estimated fee
    } else {
      setEstimatedFee(0n);
    }
  }, [isCrossChain, amount, type]);

  const handleTransaction = async () => {
    if (!amount || !address) {
      toast.error("Please enter an amount and connect your wallet");
      return;
    }

    try {
      switch (type) {
        case "deposit":
          await deposit(
            asset,
            amount,
            selectedSourceChain,
            isCrossChain ? selectedDestChain : undefined,
          );
          break;
        case "borrow":
          await borrow(
            asset,
            amount,
            isCrossChain ? selectedDestChain.toString() : undefined,
          );
          break;
        case "repay":
          await repay(asset, amount, selectedDestChain.toString());
          break;
        case "withdraw":
          await withdraw(asset, amount, selectedDestChain.toString());
          break;
        default:
          throw new Error("Unknown transaction type");
      }

      onTransaction?.("transaction-submitted");
      onClose();
      setAmount("");
      setReceiverAddress("");
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  const getModalTitle = () => {
    const action = type.charAt(0).toUpperCase() + type.slice(1);
    return isCrossChain ? `${action} (Cross-Chain)` : action;
  };

  const getActionButtonText = () => {
    if (isLoading) return "Processing...";
    return isCrossChain
      ? `${type.charAt(0).toUpperCase() + type.slice(1)} via CCIP`
      : type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 11155111:
        return "Sepolia";
      case 80001:
        return "Mumbai";
      case 421614:
        return "Arbitrum Sepolia";
      default:
        return "Unknown";
    }
  };

  const supportedChains = [
    { id: 11155111, name: "Sepolia" },
    { id: 80001, name: "Mumbai" },
    { id: 421614, name: "Arbitrum Sepolia" },
  ];

  const canBeCrossChain = type === "deposit" || type === "borrow";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "deposit" && "💰"}
            {type === "borrow" && "🏦"}
            {type === "repay" && "💳"}
            {type === "withdraw" && "📤"}
            {getModalTitle()} {asset}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-16"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {asset}
              </div>
            </div>

            {/* Available Balance */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available:</span>
              <span>{formatCurrency(availableBalance, 18, asset)}</span>
            </div>

            {/* USD Value */}
            {amount && currentPrice && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">USD Value:</span>
                <span>
                  $
                  {formatUnits(
                    (BigInt(Math.floor(Number.parseFloat(amount) * 1e18)) *
                      currentPrice) /
                      BigInt(1e8),
                    18,
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Source Chain Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {type === "deposit" ? "From Chain" : "Source Chain"}
            </label>
            <select
              value={selectedSourceChain.toString()}
              onChange={(e) => setSelectedSourceChain(Number(e.target.value))}
              className="w-full p-2 text-sm border rounded"
            >
              {supportedChains.map((chain) => (
                <option key={chain.id} value={chain.id.toString()}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Chain Selection (for cross-chain operations) */}
          {canBeCrossChain && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {type === "deposit" ? "To Chain" : "Destination Chain"}
              </label>
              <select
                value={selectedDestChain.toString()}
                onChange={(e) => setSelectedDestChain(Number(e.target.value))}
                className="w-full p-2 text-sm border rounded"
              >
                {supportedChains.map((chain) => (
                  <option key={chain.id} value={chain.id.toString()}>
                    {chain.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cross-Chain Toggle */}
          {(type === "deposit" || type === "borrow") && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cross-chain"
                  checked={isCrossChain}
                  onChange={(e) => setIsCrossChain(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="cross-chain" className="text-sm font-medium">
                  Cross-Chain Transaction
                </label>
              </div>

              {isCrossChain && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      ⚡ Chainlink CCIP
                    </div>

                    {/* CCIP Fee Estimate */}
                    {estimatedFee > 0n && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">CCIP Fee:</span>
                        <span>{formatUnits(estimatedFee, 18)} LINK</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Transaction Summary */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="text-sm font-medium">Transaction Summary</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Action:</span>
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asset:</span>
                  <span>{asset}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span>
                    {amount || "0"} {asset}
                  </span>
                </div>
                {isCrossChain && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">From Chain:</span>
                      <span>{getChainName(selectedSourceChain)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">To Chain:</span>
                      <span>{getChainName(selectedDestChain)}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Receiver Address for Cross-Chain Borrow */}
          {type === "borrow" && isCrossChain && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Receiver Address (Optional)
              </label>
              <Input
                placeholder="0x... (leave empty to use your wallet)"
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
                className="text-sm"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleTransaction}
              disabled={!amount || isLoading}
              className="flex-1"
            >
              {getActionButtonText()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
