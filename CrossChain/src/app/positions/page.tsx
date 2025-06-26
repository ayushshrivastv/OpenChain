import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PositionsPage() {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-8">
      <div className="flex gap-4 mb-2">
        <Button variant="default">Active</Button>
        <Button variant="outline">At Risk</Button>
        <Button variant="ghost">All</Button>
      </div>
      <Card className="w-full bg-gray-900 border border-gray-800 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="py-2 px-3">Collateral</th>
                <th className="py-2 px-3">Chain</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Borrowed Asset</th>
                <th className="py-2 px-3">Health Factor</th>
                <th className="py-2 px-3">Liquidation</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800 text-white">
                <td className="py-2 px-3">USDC</td>
                <td className="py-2 px-3">Ethereum</td>
                <td className="py-2 px-3">1,000</td>
                <td className="py-2 px-3">SOL</td>
                <td className="py-2 px-3">1.31</td>
                <td className="py-2 px-3">{/* risk icon placeholder */}⚠️</td>
                <td className="py-2 px-3">Active</td>
                <td className="py-2 px-3 flex gap-2">
                  <Button size="sm" variant="outline">Repay</Button>
                  <Button size="sm" variant="ghost">Withdraw</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
