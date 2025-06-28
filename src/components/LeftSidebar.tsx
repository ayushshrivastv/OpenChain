"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { X } from "lucide-react";

const navigationItems = [
  { name: "Dashboard", href: "/" },
  { name: "CrossChain", href: "/crosschain" },
  { name: "Docs", href: "/docs" },
  { name: "News", href: "/news" },
];

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeftSidebar({ isOpen, onClose }: LeftSidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const handleLinkedInClick = () => {
    window.open("https://www.linkedin.com/in/ayushshrivastv/", "_blank");
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 z-40 lg:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-60 py-6 px-4 bg-black flex flex-col transition-transform duration-300 ease-in-out z-50",
        "lg:translate-x-0 lg:w-48",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between lg:justify-center mb-8 px-2">
          <Image src="/OpenChain_logo.png" alt="OpenChain Logo" width={40} height={40} className="h-10 w-auto" />
          <button onClick={onClose} className="lg:hidden text-white p-2 -mr-2">
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1">
          <ul className="space-y-0.5">
            {navigationItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between py-2 px-2 text-white text-xl hover:bg-gray-900/30 rounded-md transition-colors group",
                    hoveredItem === item.name && "bg-gray-900/50"
                  )}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <span>{item.name}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={cn(
                      "transition-opacity duration-300",
                      hoveredItem === item.name ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto pt-6">
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center justify-between py-1.5 px-2 text-white/70 text-lg hover:text-white hover:bg-gray-900/30 rounded-md transition-colors group w-full"
            onMouseEnter={() => setHoveredItem("help")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <span>Help Center</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={cn(
                "transition-opacity duration-300",
                hoveredItem === "help" ? "opacity-100" : "opacity-0"
              )}
            >
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
          <button
            onClick={() => setShowAccountModal(true)}
            className="flex items-center justify-between py-1.5 px-2 text-white/70 text-lg hover:text-white hover:bg-gray-900/30 rounded-md transition-colors group w-full"
            onMouseEnter={() => setHoveredItem("account")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <span>Account</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={cn(
                "transition-opacity duration-300",
                hoveredItem === "account" ? "opacity-100" : "opacity-0"
              )}
            >
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Help Center Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-[#F9DDC7] rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-5 right-5 text-gray-600 hover:text-black transition-colors"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            <div className="text-left">
              <h2 className="text-3xl font-extrabold text-[#031138] mb-6">Help Center</h2>
              
              <div className="mb-6">
                <h3 className="font-bold text-lg text-[#031138] mb-2">Contact & Support</h3>
                <p className="text-[#031138]/80 mb-4 text-base">
                  If you need any assistance or have questions about the OpenChain protocol, please feel free to reach out via my LinkedIn profile.
                </p>
                <button
                  onClick={handleLinkedInClick}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white rounded-xl hover:bg-gray-100 transition-colors text-gray-900 font-bold text-base shadow"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="6" fill="#0A66C2"/>
                    <path d="M17.1 17.1h-2.1v-3.3c0-.8-.3-1.3-1-1.3-.6 0-1 .4-1 1.3v3.3h-2.1v-6h2.1v.8c.3-.5.9-.9 1.7-.9 1.3 0 2.1.8 2.1 2.3v3.8zM8.2 8.7c-.7 0-1.2-.5-1.2-1.2 0-.7.5-1.2 1.2-1.2.7 0 1.2.5 1.2 1.2 0 .7-.5 1.2-1.2 1.2zm1 8.4h-2.1v-6h2.1v6z" fill="white"/>
                  </svg>
                  LinkedIn Profile
                </button>
              </div>

              <div>
                <h3 className="font-bold text-lg text-[#031138] mb-2">Important Notice</h3>
                <div className="bg-black/5 p-4 rounded-xl text-sm text-[#031138]/90 space-y-2">
                  <p>
                    <strong>Chainlink Hackathon Project:</strong> OpenChain was designed and built in just a few days for a Chainlink Hackathon.
                  </p>
                  <p>
                    <strong>Testnet Advisory:</strong> As this is a rapidly developed project, it is strongly advised to only interact with the protocol on a testnet network for evaluation and testing purposes.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#F9DDC7] rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl flex flex-col items-center relative">
            <button
              onClick={() => setShowAccountModal(false)}
              className="absolute top-5 right-5 text-gray-600 hover:text-black transition-colors"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            <div className="flex flex-col items-center w-full">
              <h2 className="text-3xl font-extrabold text-[#031138] mb-4 text-center">Account</h2>
              <p className="text-[#031138]/90 text-center mb-1">
                Account management features coming soon!
              </p>
              <p className="text-[#031138]/70 text-center mb-6 text-base">
                Connect your wallet to access personalized features and manage your DeFi positions across multiple chains.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
