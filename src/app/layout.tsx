import type { Metadata } from "next";
import "./globals.css";
import { LeftSidebar } from "@/components/LeftSidebar";

export const metadata: Metadata = {
  title: "OnChain - Cross-Chain DeFi Protocol",
  description: "Cross-Chain Lending and Borrowing Protocol",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased bg-black text-white">
        <div className="flex">
          <LeftSidebar />
          <main className="flex-1 pl-48">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
