import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Contract addresses from deployment
const CONTRACTS = {
  LENDING_POOL: '0x473AC85625b7f9F18eA21d2250ea19Ded1093a99',
  CHAINLINK_SECURITY: '0x90d25B11B7C7d4814B6D583DfE26321d08ba66ed',
  PRICE_FEED: '0x2E38242Ff1FDa1783fdA682c24A3f409b5c8163f',
  SYNTH_USDC: '0x77036167D0b74Fb82BA5966a507ACA06C5E16B30',
  SYNTH_WETH: '0x39CdAe9f7Cb7e06A165f8B4C6864850cCef5CC44',
  RATE_LIMITER: '0x4FFc21015131556B90A86Ab189D9Cba970683205',
  LIQUIDATION_MANAGER: '0x53E0672c2280e621f29dCC47696043d6B436F970'
};

// Simplified ABI for borrowing operations
const LENDING_POOL_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "asset", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "address", "name": "onBehalfOf", "type": "address" }
    ],
    "name": "borrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "asset", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "address", "name": "onBehalfOf", "type": "address" }
    ],
    "name": "repay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "address", "name": "asset", "type": "address" }
    ],
    "name": "getUserBorrowBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getUserAccountData",
    "outputs": [
      { "internalType": "uint256", "name": "totalCollateralETH", "type": "uint256" },
      { "internalType": "uint256", "name": "totalDebtETH", "type": "uint256" },
      { "internalType": "uint256", "name": "availableBorrowsETH", "type": "uint256" },
      { "internalType": "uint256", "name": "currentLiquidationThreshold", "type": "uint256" },
      { "internalType": "uint256", "name": "ltv", "type": "uint256" },
      { "internalType": "uint256", "name": "healthFactor", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Rate limiter (simple in-memory)
const requestCounts = new Map<string, { count: number; last: number }>();
const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 10; // per IP per minute

const BorrowSchema = z.object({
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, { message: "Invalid Ethereum address format for userAddress" }),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, { message: "Invalid Ethereum address format for tokenAddress" }),
  amount: z.string().refine(
    (val) => {
      const n = +val;
      return !isNaN(n) && n > 0 && n < 1e32;
    },
    { message: "Amount must be a positive number less than 1e32" }
  ),
  action: z.enum(['borrow', 'repay', 'getUserData', 'getBorrowBalance'])
});

export async function POST(request: NextRequest) {
  // Rate limit per IP
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown';
  const now = Date.now();
  let meta = requestCounts.get(ip) || { count: 0, last: now };
  if (now - meta.last < WINDOW_MS) {
    meta.count++;
    if (meta.count > MAX_REQUESTS) {
      console.warn(`[API][RateLimit] Too many requests from ${ip}`);
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  } else {
    meta = { count: 1, last: now };
  }
  requestCounts.set(ip, meta);

  try {
    const body = await request.json();

    // Validate with schema
    const parsed = BorrowSchema.safeParse(body);
    if (!parsed.success) {
      console.warn('[API][Validation] Invalid input', parsed.error.issues, body);
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      );
    }
    const { userAddress, tokenAddress, amount, action } = parsed.data;

    // Do not allow request if keys/mnemonics present
    if ('privateKey' in body || 'mnemonic' in body) {
      console.warn('[API][Security] Key/mnemonic leaked attempt', body);
      return NextResponse.json(
        { error: 'Prohibited field(s) in request body' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'getUserData':
        // Mock user account data
        const mockUserData = {
          totalCollateralETH: '5000000000000000000', // 5 ETH
          totalDebtETH: '2000000000000000000', // 2 ETH
          availableBorrowsETH: '2500000000000000000', // 2.5 ETH
          currentLiquidationThreshold: '8000', // 80%
          ltv: '7500', // 75%
          healthFactor: '2500000000000000000' // 2.5
        };

        return NextResponse.json({
          success: true,
          data: mockUserData
        });

      case 'getBorrowBalance':
        if (!tokenAddress) {
          // Should not happen due to schema, but double check
          console.warn('[API][Validation] Missing tokenAddress for getBorrowBalance', body);
          return NextResponse.json(
            { error: 'Token address required for balance query' },
            { status: 400 }
          );
        }

        // Mock borrow balance
        const mockBalance =
          tokenAddress === CONTRACTS.SYNTH_USDC
            ? '1000000000'
            : '500000000000000000';

        return NextResponse.json({
          success: true,
          balance: mockBalance
        });

      case 'borrow':
        if (!tokenAddress || !amount) {
          // Should not happen due to schema, but double check
          console.warn('[API][Validation] Missing tokenAddress or amount for borrow', body);
          return NextResponse.json(
            { error: 'Token address and amount required for borrowing' },
            { status: 400 }
          );
        }

        // In production, this would:
        // 1. Check user's collateral
        // 2. Verify borrowing capacity
        // 3. Execute the borrow transaction
        // 4. Update user's debt position

        return NextResponse.json({
          success: true,
          message: 'Borrow transaction prepared',
          transactionData: {
            to: CONTRACTS.LENDING_POOL,
            data: `borrow(${tokenAddress}, ${amount}, ${userAddress})`,
            gasEstimate: '150000'
          }
        });

      case 'repay':
        if (!tokenAddress || !amount) {
          // Should not happen due to schema, but double check
          console.warn('[API][Validation] Missing tokenAddress or amount for repay', body);
          return NextResponse.json(
            { error: 'Token address and amount required for repayment' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Repay transaction prepared',
          transactionData: {
            to: CONTRACTS.LENDING_POOL,
            data: `repay(${tokenAddress}, ${amount}, ${userAddress})`,
            gasEstimate: '120000'
          }
        });

      default:
        console.warn('[API][Validation] Invalid action', body);
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in borrow API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');

    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address required' },
        { status: 400 }
      );
    }

    // Return user's borrowing overview
    return NextResponse.json({
      success: true,
      data: {
        availableTokens: [
          {
            symbol: 'USDC',
            address: CONTRACTS.SYNTH_USDC,
            maxBorrowAmount: '10000000000', // 10,000 USDC
            currentRate: '5.2' // 5.2% APR
          },
          {
            symbol: 'WETH',
            address: CONTRACTS.SYNTH_WETH,
            maxBorrowAmount: '3000000000000000000', // 3 ETH
            currentRate: '4.8' // 4.8% APR
          }
        ],
        userPositions: [
          {
            token: 'USDC',
            borrowed: '1000000000', // 1,000 USDC
            interestOwed: '52000000' // 52 USDC
          }
        ]
      }
    });

  } catch (error) {
    console.error('Error fetching borrow data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch borrow data' },
      { status: 500 }
    );
  }
}
