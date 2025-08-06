import { Connection, PublicKey } from '@solana/web3.js';
import { NETWORK_CONFIGS, getNetworkConfig } from './BackendConfig';
import { apiService } from './ApiService';

export interface UserAccountData {
  totalCollateral: number;
  totalDebt: number;
  availableBorrows: number;
  currentLiquidationThreshold: number;
  ltv: number;
  healthFactor: number;
  positions: Array<{
    token: string;
    balance: number;
    type: 'collateral' | 'debt';
  }>;
}

export interface LendingPosition {
  asset: string;
  amount: number;
  apy: number;
  type: 'deposit' | 'borrow';
  network: string;
}

class ContractService {
  private static instance: ContractService;
  private connection: Connection;

  constructor() {
    const solanaConfig = getNetworkConfig('solana');
    if (!solanaConfig) {
      throw new Error('Solana configuration not found');
    }
    this.connection = new Connection(solanaConfig.rpcUrl, 'confirmed');
  }

  static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService();
    }
    return ContractService.instance;
  }

  // Initialize connection with wallet (simplified)
  async initializeProgram(wallet: any): Promise<void> {
    try {
      console.log('Contract service initialized with wallet:', wallet.publicKey?.toString());
      // In a real implementation, this would set up the Anchor program
      // For now, we'll use API-based interactions
    } catch (error) {
      console.error('Failed to initialize contract service:', error);
      throw error;
    }
  }

  // Get user account data via API
  async getUserAccountData(userAddress: string): Promise<UserAccountData> {
    try {
      const response = await apiService.getUserPositions(userAddress);
      const data = response.data;
      return {
        totalCollateral: data?.totalDeposits || 0,
        totalDebt: data?.totalBorrows || 0,
        availableBorrows: (data?.totalDeposits || 0) * 0.8, // 80% LTV
        currentLiquidationThreshold: 80,
        ltv: 75,
        healthFactor: data?.healthFactor || 1.5,
        positions: data?.positions?.map(pos => ({
          token: pos.asset,
          balance: pos.amount,
          type: pos.type === 'deposit' ? 'collateral' : 'debt'
        })) || []
      };
    } catch (error) {
      console.error('Failed to get user account data:', error);
      // Return default values
      return {
        totalCollateral: 0,
        totalDebt: 0,
        availableBorrows: 0,
        currentLiquidationThreshold: 80,
        ltv: 75,
        healthFactor: 1.5,
        positions: []
      };
    }
  }

  // Execute cross-chain lending transaction
  async executeCrossChainLending(params: {
    sourceChain: string;
    targetChain: string;
    asset: string;
    amount: number;
    userAddress: string;
  }): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      const response = await apiService.executeCrossChainTransaction({
        fromNetwork: params.sourceChain,
        toNetwork: params.targetChain,
        asset: params.asset,
        amount: params.amount,
        operation: 'lend',
        userAddress: params.userAddress
      });

      return {
        success: response.success,
        transactionHash: response.data?.txHash,
        error: response.error
      };
    } catch (error) {
      console.error('Cross-chain lending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Execute cross-chain borrowing transaction
  async executeCrossChainBorrowing(params: {
    sourceChain: string;
    targetChain: string;
    collateralAsset: string;
    borrowAsset: string;
    collateralAmount: number;
    borrowAmount: number;
    userAddress: string;
  }): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      const response = await apiService.executeCrossChainTransaction({
        fromNetwork: params.sourceChain,
        toNetwork: params.targetChain,
        asset: params.borrowAsset,
        amount: params.borrowAmount,
        operation: 'borrow',
        userAddress: params.userAddress
      });

      return {
        success: response.success,
        transactionHash: response.data?.txHash,
        error: response.error
      };
    } catch (error) {
      console.error('Cross-chain borrowing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get user lending positions
  async getUserPositions(userAddress: string): Promise<LendingPosition[]> {
    try {
      const accountData = await this.getUserAccountData(userAddress);
      return accountData.positions.map(position => ({
        asset: position.token,
        amount: position.balance,
        apy: 5.2, // Mock APY
        type: position.type === 'collateral' ? 'deposit' : 'borrow',
        network: 'solana' // Default to Solana for now
      }));
    } catch (error) {
      console.error('Failed to get user positions:', error);
      return [];
    }
  }

  // Simple balance check for Solana
  async getSolanaBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Failed to get Solana balance:', error);
      return 0;
    }
  }

  // Get pool statistics via API
  async getPoolStatistics(): Promise<any> {
    try {
      const response = await apiService.getAllPoolStatistics();
      return response.data || {};
    } catch (error) {
      console.error('Failed to get pool statistics:', error);
      return {};
    }
  }

  // Prepare Solana deposit transaction
  async prepareSolanaDepositTransaction(
    publicKey: PublicKey,
    tokenMint: PublicKey,
    amount: number
  ): Promise<any> {
    try {
      // For now, return a mock transaction structure
      // In a real implementation, this would create an actual Solana transaction
      console.log('Preparing Solana deposit transaction:', {
        publicKey: publicKey.toString(),
        tokenMint: tokenMint.toString(),
        amount
      });
      
      return {
        transaction: null, // Mock transaction
        success: true
      };
    } catch (error) {
      console.error('Failed to prepare Solana deposit transaction:', error);
      throw error;
    }
  }

  // Execute cross-chain transaction (alias for backward compatibility)
  async executeCrossChainTransaction(
    sourceChain: string,
    targetChain: string,
    asset: string,
    amount: number,
    operation: 'lend' | 'borrow',
    userAddress: string
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    if (operation === 'lend') {
      return this.executeCrossChainLending({
        sourceChain,
        targetChain,
        asset,
        amount,
        userAddress
      });
    } else {
      return this.executeCrossChainBorrowing({
        sourceChain,
        targetChain,
        collateralAsset: asset,
        borrowAsset: asset,
        collateralAmount: amount,
        borrowAmount: amount,
        userAddress
      });
    }
  }
}

export const contractService = ContractService.getInstance();
