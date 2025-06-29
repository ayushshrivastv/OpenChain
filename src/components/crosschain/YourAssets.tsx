"use client";

interface YourAssetsProps {
  selectedNetwork: string;
}

export function YourAssets({ selectedNetwork }: YourAssetsProps) {
  return (
    <div className="flex-grow pt-12">
      <h3 className="text-white text-2xl font-bold mb-6">Your Holdings on {selectedNetwork}</h3>
      <div className="flex items-start space-x-12 mb-6">
        <div>
          <h4 className="text-gray-400 text-base mb-2">Total Supplied</h4>
          <div className="text-white text-4xl font-bold">$0.00</div>
        </div>
        <div>
          <h4 className="text-gray-400 text-base mb-2">Total Borrowed</h4>
          <div className="text-white text-4xl font-bold">$0.00</div>
        </div>
      </div>
      <p className="text-gray-400 text-base">
        You don't have any holdings yet. Get started by supplying assets to unlock cross-chain borrowing.
      </p>
    </div>
  );
} 
