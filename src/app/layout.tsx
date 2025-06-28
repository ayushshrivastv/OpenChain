import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "OpenChain: CrossChain Lending and Borrowing Protocol Powered by Chainlink",
  description: "A Cross-Chain Lending and Borrowing Protocol powered by Chainlink.",
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
