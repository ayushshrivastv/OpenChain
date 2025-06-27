"use client";

import { WalletConnector } from "@/components/WalletConnector";
import { Card } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { formatUnits } from "@/lib/contracts";
import dynamic from "next/dynamic";
import { useAccount } from "wagmi";

// Disable SSR for this component
const DynamicTransactionsContent = dynamic(
  () => Promise.resolve(TransactionsContentInner),
  {
    ssr: false,
  },
);

export default function TransactionsPage() {
  return <DynamicTransactionsContent />;
}

function StatusIndicator({ status }: { status: string }) {
  const color =
    status === "completed"
      ? "bg-green-500"
      : status === "pending"
        ? "bg-yellow-400"
        : "bg-red-400";
  return <span className={`inline-block w-2 h-2 rounded-full mr-2 ${color}`} />;
}

function TransactionsContentInner() {
  const { address } = useAccount();
  const { pendingTransactions, recentTransactions, isLoading } =
    useTransactions();

  const getExplorerUrl = (hash: string, chain: string) => {
    if (chain.includes("Sepolia")) {
      return `https://sepolia.etherscan.io/tx/${hash}`;
    }
    if (chain.includes("Mumbai")) {
      return `https://mumbai.polygonscan.com/tx/${hash}`;
    }
    if (chain.includes("Solana")) {
      return `https://explorer.solana.com/tx/${hash}?cluster=devnet`;
    }
    return "#";
  };

  const getCCIPExplorerUrl = (messageId: string) => {
    return `https://ccip.chain.link/msg/${messageId}`;
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-6xl bg-gray-900 border border-gray-800 p-6">
        <div className="text-xl font-semibold mb-4">Transaction History</div>

        {!address && (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">
              Connect your wallet to view transaction history
            </p>
            <WalletConnector />
          </div>
        )}

        {address && (
          <>
            {isLoading && (
              <div className="text-center py-8">
                <p className="text-gray-400">Loading transaction history...</p>
              </div>
            )}

            {/* Pending Transactions */}
            {pendingTransactions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-yellow-400">
                  Pending Transactions
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-800">
                        <th className="py-2 px-3">Action</th>
                        <th className="py-2 px-3">Asset</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="border-b border-gray-800 text-white"
                        >
                          <td className="py-2 px-3 capitalize">{tx.action}</td>
                          <td className="py-2 px-3">{tx.asset}</td>
                          <td className="py-2 px-3">
                            {formatUnits(tx.amount, 18)} {tx.asset}
                          </td>
                          <td className="py-2 px-3">
                            <StatusIndicator status={tx.status} />
                            <span className="capitalize">{tx.status}</span>
                          </td>
                          <td className="py-2 px-3">
                            {tx.hash ? (
                              <a
                                className="text-blue-400 underline"
                                href={getExplorerUrl(
                                  tx.hash,
                                  tx.sourceChain?.toString() || "",
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {tx.hash.slice(0, 10)}...
                              </a>
                            ) : (
                              <span className="text-gray-500">Pending...</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Transactions from Blockchain Events */}
            <div>
              <h3 className="text-lg font-medium mb-3">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-800">
                      <th className="py-2 px-3">Timestamp</th>
                      <th className="py-2 px-3">Action</th>
                      <th className="py-2 px-3">Source Chain</th>
                      <th className="py-2 px-3">Destination Chain</th>
                      <th className="py-2 px-3">Asset</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Tx Hash</th>
                      <th className="py-2 px-3">CCIP Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-gray-800 text-white"
                      >
                        <td className="py-2 px-3">
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2 px-3">{tx.action}</td>
                        <td className="py-2 px-3">{tx.sourceChain}</td>
                        <td className="py-2 px-3">{tx.destChain}</td>
                        <td className="py-2 px-3">{tx.asset}</td>
                        <td className="py-2 px-3">
                          {formatUnits(tx.amount, 18)} {tx.asset}
                        </td>
                        <td className="py-2 px-3">
                          <StatusIndicator status={tx.status} />
                          <span className="capitalize">{tx.status}</span>
                        </td>
                        <td className="py-2 px-3">
                          <a
                            className="text-blue-400 underline"
                            href={getExplorerUrl(
                              tx.hash,
                              tx.sourceChain?.toString() || "",
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {tx.hash.slice(0, 10)}...
                          </a>
                        </td>
                        <td className="py-2 px-3">
                          {tx.ccipMessageId && (
                            <a
                              className="text-yellow-400 underline"
                              href={getCCIPExplorerUrl(tx.ccipMessageId)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View CCIP
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {!isLoading &&
              recentTransactions.length === 0 &&
              pendingTransactions.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>No transactions found</p>
                  <p className="text-sm mt-2">
                    Start by making a deposit or borrow to see your transaction
                    history
                  </p>
                </div>
              )}
          </>
        )}
      </Card>
    </div>
  );
}
