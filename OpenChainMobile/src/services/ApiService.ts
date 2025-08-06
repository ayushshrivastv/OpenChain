// API Service for OpenChain Mobile Backend Integration
import { API_ENDPOINTS } from './BackendConfig';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChainlinkPriceFeedResponse {
  answer: string;
  decimals: number;
  description: string;
  roundId: string;
  updatedAt: string;
  startedAt: string;
}

export interface UserPositionResponse {
  positions: Array<{
    id: string;
    asset: string;
    amount: number;
    apy: number;
    type: 'deposit' | 'borrow';
    network: string;
    timestamp: string;
    txHash: string;
  }>;
  totalDeposits: number;
  totalBorrows: number;
  healthFactor: number;
}

export interface PoolStatisticsResponse {
  network: string;
  totalValueLocked: number;
  totalBorrowed: number;
  utilizationRate: number;
  averageAPY: number;
  activeUsers: number;
  assets: Array<{
    symbol: string;
    totalSupply: number;
    totalBorrow: number;
    supplyAPY: number;
    borrowAPY: number;
    price: number;
  }>;
}

export interface TransactionHistoryResponse {
  transactions: Array<{
    id: string;
    type: 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'cross_chain';
    asset: string;
    amount: number;
    network: string;
    txHash: string;
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: string;
    gasUsed?: number;
    gasFee?: number;
  }>;
  totalCount: number;
  page: number;
  limit: number;
}

class ApiService {
  private static instance: ApiService;
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_ENDPOINTS.BACKEND_API;
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Chainlink Price Feed Integration
  async getChainlinkPrice(symbol: string): Promise<ApiResponse<ChainlinkPriceFeedResponse>> {
    return this.makeRequest<ChainlinkPriceFeedResponse>(`/chainlink/price/${symbol}`);
  }

  async getMultipleChainlinkPrices(symbols: string[]): Promise<ApiResponse<Record<string, ChainlinkPriceFeedResponse>>> {
    return this.makeRequest<Record<string, ChainlinkPriceFeedResponse>>(
      `/chainlink/prices`,
      {
        method: 'POST',
        body: JSON.stringify({ symbols }),
      }
    );
  }

  // User Account Data
  async getUserAccountData(
    userAddress: string,
    network: string
  ): Promise<ApiResponse<UserPositionResponse>> {
    return this.makeRequest<UserPositionResponse>(
      `/user/${userAddress}/account-data?network=${network}`
    );
  }

  async getUserPositions(userAddress: string): Promise<ApiResponse<UserPositionResponse>> {
    return this.makeRequest<UserPositionResponse>(`/user/${userAddress}/positions`);
  }

  async getTransactionHistory(
    userAddress: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<TransactionHistoryResponse>> {
    return this.makeRequest<TransactionHistoryResponse>(
      `/user/${userAddress}/transactions?page=${page}&limit=${limit}`
    );
  }

  // Pool Statistics
  async getPoolStatistics(network: string): Promise<ApiResponse<PoolStatisticsResponse>> {
    return this.makeRequest<PoolStatisticsResponse>(`/pools/statistics?network=${network}`);
  }

  async getAllPoolStatistics(): Promise<ApiResponse<Record<string, PoolStatisticsResponse>>> {
    return this.makeRequest<Record<string, PoolStatisticsResponse>>('/pools/statistics');
  }

  // Cross-Chain Operations
  async executeCrossChainTransaction(params: {
    fromNetwork: string;
    toNetwork: string;
    asset: string;
    amount: number;
    operation: 'lend' | 'borrow';
    userAddress: string;
  }): Promise<ApiResponse<{ txHash: string; estimatedTime: number }>> {
    return this.makeRequest<{ txHash: string; estimatedTime: number }>(
      '/crosschain/execute',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  }

  async getCrossChainStatus(txHash: string): Promise<ApiResponse<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    estimatedTimeRemaining: number;
    steps: Array<{
      name: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      txHash?: string;
      network?: string;
    }>;
  }>> {
    return this.makeRequest(`/crosschain/status/${txHash}`);
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest('/health');
  }

  // Market Data
  async getMarketOverview(): Promise<ApiResponse<{
    totalValueLocked: number;
    totalBorrowed: number;
    totalUsers: number;
    supportedAssets: number;
    networks: string[];
    topAssets: Array<{
      symbol: string;
      tvl: number;
      apy: number;
      volume24h: number;
    }>;
  }>> {
    return this.makeRequest('/market/overview');
  }

  // Asset Information
  async getAssetInfo(symbol: string): Promise<ApiResponse<{
    symbol: string;
    name: string;
    price: number;
    marketCap: number;
    volume24h: number;
    priceChange24h: number;
    supportedNetworks: string[];
    totalSupply: number;
    totalBorrow: number;
    supplyAPY: number;
    borrowAPY: number;
  }>> {
    return this.makeRequest(`/assets/${symbol}`);
  }

  // Yield Farming / Rewards
  async getUserRewards(userAddress: string): Promise<ApiResponse<{
    totalRewards: number;
    claimableRewards: number;
    rewardsByAsset: Array<{
      asset: string;
      amount: number;
      apy: number;
      claimable: boolean;
    }>;
  }>> {
    return this.makeRequest(`/user/${userAddress}/rewards`);
  }

  async claimRewards(
    userAddress: string,
    assets: string[]
  ): Promise<ApiResponse<{ txHash: string; totalClaimed: number }>> {
    return this.makeRequest(
      `/user/${userAddress}/rewards/claim`,
      {
        method: 'POST',
        body: JSON.stringify({ assets }),
      }
    );
  }
}

export const apiService = ApiService.getInstance();
