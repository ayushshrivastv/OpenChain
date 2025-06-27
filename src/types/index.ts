// Core protocol types
export interface UserPosition {
  user: string;
  totalCollateralValue: bigint;
  totalBorrowValue: bigint;
  healthFactor: bigint;
  lastUpdateTimestamp: bigint;
  collateralBalances: Record<string, bigint>;
  borrowBalances: Record<string, bigint>;
}

export interface Asset {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
  ltv: bigint;
  liquidationThreshold: bigint;
  isActive: boolean;
  canBeBorrowed: boolean;
  canBeCollateral: boolean;
}

export interface CrossChainMessage {
  user: string;
  action: "deposit" | "borrow" | "repay" | "withdraw";
  asset: string;
  amount: bigint;
  sourceChain: bigint;
  destChain: bigint;
  receiver: string;
}

export interface Transaction {
  id: string;
  hash: string;
  action: "deposit" | "depositCrossChain" | "borrow" | "repay" | "withdraw";
  asset: string;
  amount: bigint;
  timestamp: number | string;
  status: "pending" | "completed" | "failed";
  sourceChain?: number | string;
  destChain?: number | string;
  ccipMessageId?: string;
  user?: string;
}

export interface ChainConfig {
  id: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: {
      http: string[];
    };
    public: {
      http: string[];
    };
  };
  blockExplorers?: {
    default: {
      name: string;
      url: string;
    };
  };
  testnet?: boolean;
}

export interface PriceData {
  asset: string;
  price: bigint;
  timestamp: number;
  confidence: number;
}

export interface LiquidationData {
  user: string;
  asset: string;
  debtAmount: bigint;
  collateralAmount: bigint;
  healthFactor: bigint;
  liquidationThreshold: bigint;
}

// Chainlink specific types
export interface ChainlinkPriceFeed {
  feed: string;
  decimals: number;
  heartbeat: number;
  isActive: boolean;
  description: string;
}

export interface CCIPConfig {
  router: string;
  linkToken: string;
  chainSelector: string;
  gasLimit: number;
}

// Contract addresses type
export interface ContractAddresses {
  lendingPool: string;
  chainlinkPriceFeed: string;
  liquidationManager: string;
  rateLimiter: string;
  permissions: string;
  syntheticAssets: Record<string, string>;
}

// Wallet types
export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
  connector?: string;
}

export interface SolanaWalletConnection {
  publicKey: string;
  isConnected: boolean;
  cluster: "devnet" | "testnet" | "mainnet-beta";
}

// UI State types
export interface UIState {
  isLoading: boolean;
  error: string | null;
  pendingTransactions: string[];
  lastUpdate: number;
}

export interface ModalState {
  isOpen: boolean;
  type: "deposit" | "borrow" | "repay" | "withdraw" | null;
  asset: string | null;
  chain: number | null;
}

// Chain-specific data
export interface ChainData {
  chainId: number;
  positions: UserPosition[];
  assets: Asset[];
  totalSupplied: bigint;
  totalBorrowed: bigint;
  healthFactor: bigint;
}

// Hooks return types
export interface UseUserPositionReturn {
  position: UserPosition | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseTransactionsReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UsePricesReturn {
  prices: Record<string, PriceData>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Security types for Chainlink Security module
export interface SecurityStatus {
  securityScore: number;
  emergencyMode: boolean;
  emergencyCount: number;
  lastHealthCheck: Date;
  liquidatorCount: number;
  isHealthy: boolean;
}

export interface SecurityProfile {
  riskScore: number;
  lastActivity: Date;
  liquidationHistory: number;
  isHighRisk: boolean;
  securityDelay: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface LiquidationRequest {
  user: string;
  liquidator: string;
  amount: bigint;
  timestamp: Date;
  executed: boolean;
  isEmergency: boolean;
}

export interface SecurityAlert {
  id: string;
  type: string;
  user: string;
  severity: number;
  details: string;
  timestamp: Date;
  resolved: boolean;
}

// VRF and Automation types
export interface VRFConfig {
  coordinator: string;
  keyHash: string;
  subscriptionId: number;
  requestConfirmations: number;
  callbackGasLimit: number;
}

export interface AutomationConfig {
  registry: string;
  registrar: string;
  linkToken: string;
  upkeepGasLimit: number;
  checkDataSize: number;
}

export interface TimeLockConfig {
  minDelay: number;
  criticalDelay: number;
  emergencyDelay: number;
}

export interface AssetConfig {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  priceFeed: string;
  ltv: number;
  liquidationThreshold: number;
  canBeBorrowed: boolean;
  canBeCollateral: boolean;
  isActive: boolean;
}
