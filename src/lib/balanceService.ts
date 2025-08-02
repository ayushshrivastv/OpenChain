import { Connection, PublicKey } from '@solana/web3.js';
import { TokenConfig, getNetworkConfig } from './tokenConfig';

export interface TokenBalance {
  symbol: string;
  balance: string;
  rawBalance?: bigint;
}

export class BalanceService {
  private static instance: BalanceService;

  static getInstance(): BalanceService {
    if (!BalanceService.instance) {
      BalanceService.instance = new BalanceService();
    }
    return BalanceService.instance;
  }

  // Format balance with proper decimals
  formatBalance(rawBalance: bigint, decimals: number = 18): string {
    const divisor = BigInt(10 ** decimals);
    const wholePart = rawBalance / divisor;
    const fractionalPart = rawBalance % divisor;
    
    if (fractionalPart === 0n) {
      return wholePart.toString();
    }
    
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalStr.replace(/0+$/, '');
    
    if (trimmedFractional === '') {
      return wholePart.toString();
    }
    
    return `${wholePart}.${trimmedFractional}`;
  }

  // Get Solana token balances
  async getSolanaBalances(
    publicKey: PublicKey,
    tokens: TokenConfig[]
  ): Promise<TokenBalance[]> {
    const networkConfig = getNetworkConfig('solana');
    if (!networkConfig?.rpcUrl) {
      throw new Error('Solana RPC URL not configured');
    }

    const connection = new Connection(networkConfig.rpcUrl);
    const balances: TokenBalance[] = [];

    for (const token of tokens) {
      try {
        if (token.symbol === 'SOL') {
          // Native SOL balance
          const solBalanceLamports = await connection.getBalance(publicKey);
          const balance = this.formatBalance(BigInt(solBalanceLamports), 9);
          balances.push({
            symbol: token.symbol,
            balance,
            rawBalance: BigInt(solBalanceLamports)
          });
        } else if (token.address && token.address !== 'SPL-USDC') {
          // SPL Token balance
          try {
            const mintAddress = new PublicKey(token.address);
            const accounts = await connection.getTokenAccountsByOwner(
              publicKey,
              { mint: mintAddress }
            );

            let balance = '0';
            let rawBalance = 0n;

            if (accounts.value.length > 0) {
              const accountInfo = await connection.getParsedAccountInfo(
                accounts.value[0].pubkey
              );
              const data = accountInfo.value?.data as any;
              
              if (data?.parsed?.info?.tokenAmount) {
                const tokenAmount = data.parsed.info.tokenAmount;
                rawBalance = BigInt(tokenAmount.amount);
                balance = this.formatBalance(
                  rawBalance,
                  tokenAmount.decimals || token.decimals || 6
                );
              }
            }

            balances.push({
              symbol: token.symbol,
              balance,
              rawBalance
            });
          } catch (error) {
            console.warn(`Failed to fetch balance for ${token.symbol}:`, error);
            balances.push({
              symbol: token.symbol,
              balance: '0',
              rawBalance: 0n
            });
          }
        } else {
          // Placeholder for tokens without proper address
          balances.push({
            symbol: token.symbol,
            balance: '0',
            rawBalance: 0n
          });
        }
      } catch (error) {
        console.error(`Error fetching balance for ${token.symbol}:`, error);
        balances.push({
          symbol: token.symbol,
          balance: '0',
          rawBalance: 0n
        });
      }
    }

    return balances;
  }

  // Get EVM token balance (formatted)
  formatEvmBalance(balance: { value?: bigint } | undefined, decimals: number = 18): string {
    if (!balance?.value) return '0';
    return this.formatBalance(balance.value, decimals);
  }

  // Validate token address
  isValidAddress(address: string, network: 'ethereum' | 'solana'): boolean {
    if (network === 'ethereum') {
      return address === 'native' || /^0x[a-fA-F0-9]{40}$/.test(address);
    } else if (network === 'solana') {
      try {
        new PublicKey(address);
        return true;
      } catch {
        return address === 'SPL-USDC' || address.startsWith('SPL-');
      }
    }
    return false;
  }
}

// Export singleton instance
export const balanceService = BalanceService.getInstance();
