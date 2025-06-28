import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

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
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
