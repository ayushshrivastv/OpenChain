/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
      "ext.same-assets.com",
      "ugc.same-assets.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for WalletConnect and Solana wallet SSR issues
    if (isServer) {
      config.externals.push(
        'pino-pretty', 
        'lokijs', 
        'encoding',
        // Wallet-related libraries that use browser APIs
        '@solana/wallet-adapter-phantom',
        '@solana/wallet-adapter-solflare',
        '@solana/wallet-adapter-wallets',
        '@solana/wallet-adapter-base',
        '@solana/wallet-adapter-react',
        '@solana/wallet-adapter-react-ui',
        // WalletConnect related
        '@walletconnect/client',
        '@walletconnect/qrcode-modal',
        '@walletconnect/web3-provider',
        // Other problematic libraries
        'web3modal',
        'qr-scanner'
      );
      
      // Additional module replacements for server-side
      config.resolve.alias = {
        ...config.resolve.alias,
        'indexeddb-js': false,
        'fake-indexeddb': false,
      };
    }
    
    // Handle client-side only modules and prevent SSR issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
      // Additional browser API fallbacks
      'indexeddb-js': false,
      'fake-indexeddb': false,
    };

    // Ignore problematic modules completely on server-side
    if (isServer) {
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      
      config.module.rules.push({
        test: /node_modules[\/\\](@solana|@walletconnect|web3modal)/,
        use: 'null-loader',
      });
    }

    return config;
  },
  // Additional Next.js optimizations
  transpilePackages: [
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
    '@solana/wallet-adapter-wallets',
  ],
};

module.exports = nextConfig;
