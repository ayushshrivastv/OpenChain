"use client";

import { Menu } from 'lucide-react';
import Image from 'next/image';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Image src="/OpenChain_logo.png" alt="OpenChain Logo" width={32} height={32} />
        <span className="font-bold text-lg">OpenChain</span>
      </div>
      <button onClick={onMenuClick} className="text-white p-2">
        <Menu size={28} />
      </button>
    </header>
  );
} 
