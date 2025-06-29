"use client";

import { useUserPosition } from "@/hooks/useUserPosition";
import { formatUnits } from "viem";
import Image from "next/image";
import { WalletButton } from "./WalletButton";
import Link from "next/link";

export function Dashboard() {
  const { position, isLoading } = useUserPosition();
  const portfolioValue = position ? position.totalCollateralValue : 0n;

  return (
    <>
      <div className="min-h-screen p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Side */}
          <div className="flex flex-col items-start space-y-8">
            <h1 className="text-5xl font-extrabold text-white leading-tight">
              Your Portal to Crosschain Liquidity. Lend, borrow, and manage assets anywhere.
            </h1>
            {/* Chainlink SVG Image */}
            <a href="https://docs.chain.link/ccip" target="_blank" rel="noopener noreferrer">
              <div className="w-72 h-72 bg-[#0E1F4B] rounded-full flex items-center justify-center p-2 transition-transform duration-300 ease-in-out hover:scale-105 animate-rainbow-border">
                <Image
                  src="/Chainlink.svg"
                  alt="Chainlink Logo"
                  width={280}
                  height={280}
                  className="object-contain"
                />
              </div>
            </a>
          </div>

          {/* Right Side */}
          <div className="flex flex-col gap-6">
            <div className="flex justify-end">
              <WalletButton />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Supply & Earn */}
              <div className="bg-[#F9DDC7] p-6 rounded-2xl text-[#031138] flex flex-col justify-between transition-transform duration-300 hover:scale-105">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Supply & Earn</h2>
                  <p>Deposit assets on their native chain to start earning competitive interest from cross-chain borrowers.</p>
                </div>
                <Link href="/crosschain">
                  <button className="bg-white text-[#031138] font-bold py-2 px-4 rounded-lg self-start mt-4 hover:bg-gray-200 transition-colors">
                    DEPOSIT
                  </button>
                </Link>
              </div>
              {/* Borrow Across Chains */}
              <div className="bg-[#F9DDC7] p-6 rounded-2xl text-[#031138] flex flex-col justify-between transition-transform duration-300 hover:scale-105">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Borrow Across Chains</h2>
                  <p>Use your collateral on one chain to borrow assets on another, instantly, without bridging.</p>
                </div>
                <Link href="/crosschain">
                  <button className="bg-white text-[#031138] font-bold py-2 px-4 rounded-lg self-start mt-4 hover:bg-gray-200 transition-colors">
                    BORROW
                  </button>
                </Link>
              </div>
              {/* Manage Positions */}
              <div className="bg-[#F9DDC7] p-6 rounded-2xl text-[#031138] flex flex-col justify-between transition-transform duration-300 hover:scale-105">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Manage Positions</h2>
                  <p>Track your supplied assets, outstanding loans, and health factor across all connected chains.</p>
                </div>
                <Link href="/crosschain">
                  <button className="bg-white text-[#031138] font-bold py-2 px-4 rounded-lg self-start mt-4 hover:bg-gray-200 transition-colors">
                    VIEW POSITIONS
                  </button>
                </Link>
              </div>
              {/* How It Works */}
              <div className="bg-[#F9DDC7] p-6 rounded-2xl text-[#031138] flex flex-col justify-between transition-transform duration-300 hover:scale-105">
                <div>
                  <h2 className="text-2xl font-bold mb-2">How It Works</h2>
                  <p>Learn how we connect liquidity across blockchains without direct asset bridging.</p>
                </div>
                <Link href="/docs">
                  <button className="bg-white text-[#031138] font-bold py-2 px-4 rounded-lg self-start mt-4 hover:bg-gray-200 transition-colors">
                    READ DOCS
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* "Dive Into Web3" Section */}
      <section className="py-24 px-8 bg-metamask-blue text-center">
        <h2 className="text-7xl font-extrabold text-white tracking-tighter">
          Dive into Cross Chain
        </h2>
        <p className="text-xl text-white/80 mt-4 mb-8 max-w-2xl mx-auto">
          Designed for Chromion: A Chainlink Hackathon powered by Chainlink
        </p>
        <Link href="/docs">
        <button className="bg-white text-metamask-blue font-bold py-3 px-8 rounded-full text-lg transition-transform hover:scale-105">
            EXPLORE DOCUMENTATION
        </button>
        </Link>
      </section>
    </>
  );
} 
