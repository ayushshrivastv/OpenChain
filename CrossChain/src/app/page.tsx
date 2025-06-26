import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="w-full flex flex-col gap-8">
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gray-900 border border-gray-800 p-6">
            <div className="text-gray-400 text-sm">Total Supplied</div>
            <div className="text-3xl font-bold mt-2">$0.00</div>
          </Card>
          <Card className="bg-gray-900 border border-gray-800 p-6">
            <div className="text-gray-400 text-sm">Total Borrowed</div>
            <div className="text-3xl font-bold mt-2">$0.00</div>
          </Card>
          <Card className="bg-gray-900 border border-gray-800 p-6">
            <div className="text-gray-400 text-sm">Health Factor</div>
            <div className="text-3xl font-bold mt-2">-</div>
          </Card>
        </div>
        <div className="flex items-center gap-6">
          <Button variant="default" className="w-40">Deposit</Button>
          <Button variant="outline" className="w-40">Borrow</Button>
        </div>
      </section>
      <section>
        <Card className="bg-gray-900 border border-gray-800 p-6">
          <div className="text-xl font-semibold mb-4">Chain Breakdown</div>
          <div className="text-gray-400 text-sm">(Breakdown of balances per chain will appear here)</div>
        </Card>
      </section>
    </div>
  );
}
