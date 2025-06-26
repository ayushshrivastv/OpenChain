import { Card } from '@/components/ui/card';

function StatusIndicator({ status }: { status: string }) {
  const color = status === 'completed' ? 'bg-white' : status === 'pending' ? 'bg-yellow-400' : 'bg-red-400';
  return <span className={`inline-block w-2 h-2 rounded-full mr-2 ${color}`} />;
}

export default function TransactionsPage() {
  return (
    <div className="w-full flex flex-col items-center justify-center">
      <Card className="w-full bg-gray-900 border border-gray-800 p-6">
        <div className="text-xl font-semibold mb-4">Transaction History</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Source Chain</th>
                <th className="py-2 px-3">Destination Chain</th>
                <th className="py-2 px-3">Asset</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">CCIP Link</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800 text-white">
                <td className="py-2 px-3">2024-06-26 15:14</td>
                <td className="py-2 px-3">Deposit</td>
                <td className="py-2 px-3">Ethereum Sepolia</td>
                <td className="py-2 px-3">Solana Devnet</td>
                <td className="py-2 px-3">USDC</td>
                <td className="py-2 px-3"><StatusIndicator status="completed" />Completed</td>
                <td className="py-2 px-3"><a className="text-gray-300 underline" href="#" target="_blank" rel="noopener noreferrer">View</a></td>
              </tr>
              <tr className="border-b border-gray-800 text-white">
                <td className="py-2 px-3">2024-06-26 14:43</td>
                <td className="py-2 px-3">Borrow</td>
                <td className="py-2 px-3">Polygon Mumbai</td>
                <td className="py-2 px-3">Solana Devnet</td>
                <td className="py-2 px-3">WETH</td>
                <td className="py-2 px-3"><StatusIndicator status="pending" />Pending</td>
                <td className="py-2 px-3"><a className="text-gray-300 underline" href="#" target="_blank" rel="noopener noreferrer">View</a></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
