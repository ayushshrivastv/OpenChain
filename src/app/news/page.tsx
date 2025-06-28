"use client";

import React from 'react';

const newsArticles = [
  {
    title: "Chainlink CCIP Officially Launches on Mainnet, Enabling Secure Cross-Chain Applications",
    source: "Chainlink Blog",
    excerpt: "The Chainlink Cross-Chain Interoperability Protocol (CCIP) has officially launched on the mainnet, providing a new standard for secure cross-chain communication and token transfers.",
    href: "https://blog.chain.link/ccip-mainnet-early-access/",
    category: "Chainlink CCIP"
  },
  {
    title: "Solana's Latest Update Promises Increased Network Performance and Lower Fees",
    source: "Solana Foundation",
    excerpt: "The new v1.18 update for the Solana network focuses on optimizing transaction processing and reducing fees, further enhancing its scalability for dApps.",
    href: "https://solana.com/news",
    category: "Solana"
  },
  {
    title: "The Rise of Cross-Chain Lending Protocols: A New DeFi Paradigm",
    source: "DeFi Pulse",
    excerpt: "Learn how protocols are leveraging technologies like CCIP to allow users to lend and borrow assets across different blockchains without the need for traditional bridges.",
    href: "https://defipulse.com/",
    category: "DeFi"
  },
  {
    title: "How Chainlink Data Feeds Continue to Secure the DeFi Ecosystem",
    source: "Chainlink Blog",
    excerpt: "A deep dive into the architecture of Chainlink Data Feeds and their critical role in providing reliable, decentralized data for leading DeFi protocols.",
    href: "https://blog.chain.link/data-feeds/",
    category: "Chainlink"
  },
  {
    title: "Building a Cross-Chain Future: Top Projects to Watch on Solana",
    source: "Solana News",
    excerpt: "Explore the innovative projects on Solana that are pushing the boundaries of cross-chain interoperability and creating a more connected blockchain ecosystem.",
    href: "https://solana.com/news",
    category: "Solana"
  },
  {
    title: "Understanding Security in Cross-Chain Protocols: What to Look For",
    source: "Web3 Security Today",
    excerpt: "As cross-chain interactions become more common, understanding the security models of protocols like CCIP is essential for users and developers.",
    href: "#",
    category: "Security"
  }
];

function NewsPage() {
    return (
        <div className="min-h-screen p-12 text-white">
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-12">
                Latest News & Insights
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {newsArticles.map((article, index) => (
                    <div key={index} className="bg-[#F9DDC7] p-6 rounded-2xl text-[#031138] flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
                        <div>
                            <p className="text-sm font-bold text-[#031138]/70 mb-2">{article.source.toUpperCase()}</p>
                            <h2 className="text-xl font-bold mb-3">{article.title}</h2>
                            <p className="text-[#031138]/80 mb-4">{article.excerpt}</p>
                        </div>
                        <a 
                            href={article.href} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white text-[#031138] font-bold py-2 px-4 rounded-lg self-start mt-4 hover:bg-gray-200 transition-colors"
                        >
                            READ MORE
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default NewsPage; 
