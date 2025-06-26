import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function DepositPage() {
  return (
    <div className="w-full flex flex-col items-center justify-center">
      <Card className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 flex flex-col gap-6">
        <div className="text-xl font-semibold mb-2">Deposit</div>
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-gray-400 text-sm mb-1">Chain</div>
            <select className="bg-black border border-gray-800 rounded px-3 py-2 w-full">
              <option>Ethereum Sepolia</option>
              <option>Polygon Mumbai</option>
              <option>Solana Devnet</option>
            </select>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">Asset</div>
            <select className="bg-black border border-gray-800 rounded px-3 py-2 w-full">
              <option>USDC</option>
              <option>WETH</option>
              <option>SOL</option>
            </select>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">Amount</div>
            <Input type="number" placeholder="0.0" className="w-full" />
          </div>
        </div>
        <div className="text-gray-400 text-xs mb-2">
          Transaction Preview: Collateral and health factor will update here
        </div>
        <Button variant="default" className="w-full">Deposit</Button>
      </Card>
    </div>
  );
}
