import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../components/SolanaWalletProvider';
import { priceService, PriceData } from '../services/PriceService';
import { contractService } from '../services/ContractService';
import {
  TOKEN_CONFIGS,
  getTokensByNetwork,
} from '../services/BackendConfig';
import { PublicKey } from '@solana/web3.js';
import { theme } from '../theme/shadcn-inspired';
import { Button } from '../components/ui/Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/Card';
import { Input } from '../components/ui/Input';

interface Token {
  symbol: string;
  name: string;
  balance: string;
  apy: string;
  icon: string;
  price: string;
}

const getTokenIcon = (symbol: string): string => {
  const icons: Record<string, string> = {
    SOL: '◎',
    USDC: '$',
    ETH: 'Ξ',
    MATIC: '◆',
  };
  return icons[symbol] || '●';
};

const LendingScreenShadcn: React.FC = () => {
  const { connected, publicKey, signTransaction } = useWallet();
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<PriceData>({});
  const [tokens, setTokens] = useState<Token[]>([]);

  const fetchTokenData = useCallback(async () => {
    setLoading(true);
    try {
      const priceData = await priceService.getAllTokenPrices();
      setPrices(priceData);

      const solanaTokens = getTokensByNetwork('solana');
      const tokenData: Token[] = solanaTokens.map(token => ({
        symbol: token.symbol,
        name: token.name,
        balance: '0.00',
        apy: '5.2%', // Placeholder
        icon: getTokenIcon(token.symbol),
        price: priceData[token.symbol]
          ? priceService.formatPrice(priceData[token.symbol].price)
          : '$0.00',
      }));
      setTokens(tokenData);
    } catch (error) {
      console.error('Failed to fetch token data:', error);
      Alert.alert('Error', 'Failed to fetch market data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokenData();
  }, [fetchTokenData]);

  const handleLend = async () => {
    if (!connected || !publicKey) {
      Alert.alert('Wallet Not Connected', 'Please connect your wallet first');
      return;
    }

    if (!selectedToken || !amount) {
      Alert.alert('Invalid Input', 'Please select a token and enter an amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      const tokenConfig = TOKEN_CONFIGS.find(
        t => t.symbol === selectedToken.symbol
      );
      if (!tokenConfig) {
        throw new Error('Token configuration not found');
      }

      if (tokenConfig.network === 'solana') {
        const tokenMint = new PublicKey(
          tokenConfig.address === 'native'
            ? 'So11111111111111111111111111111111111111112' // SOL mint
            : tokenConfig.address
        );

        const amountLamports = amountNum * Math.pow(10, tokenConfig.decimals);

        const transaction = await contractService.prepareSolanaDepositTransaction(
          publicKey,
          tokenMint,
          amountLamports
        );

        if (!transaction) {
          throw new Error('Failed to prepare transaction');
        }

        const signedTransaction = await signTransaction(transaction);
        // In a real app, we would send and confirm the transaction

        Alert.alert(
          'Lending Successful!',
          `You have successfully lent ${amount} ${selectedToken.symbol}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setAmount('');
                setSelectedToken(null);
                fetchTokenData(); // Refresh data
              },
            },
          ]
        );
      } else {
        // Handle cross-chain logic
        Alert.alert('Info', 'Cross-chain lending is not yet implemented.');
      }
    } catch (error: any) {
      console.error('Lending failed:', error);
      Alert.alert('Lending Failed', error.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const renderTokenCard = (item: Token) => (
    <Card
      key={item.symbol}
      style={StyleSheet.flatten([
        styles.tokenCard,
        selectedToken?.symbol === item.symbol && styles.selectedTokenCard,
      ])}
    >
        <TouchableOpacity onPress={() => setSelectedToken(item)} style={{ flex: 1 }}>
          <CardHeader>
            <View style={styles.cardHeaderContainer}>
              <View style={styles.tokenInfo}>
                <View style={styles.tokenIconContainer}>
                  <Text style={styles.tokenIconText}>{item.icon}</Text>
                </View>
                <View>
                  <CardTitle>{item.symbol}</CardTitle>
                  <CardDescription>{item.name}</CardDescription>
                </View>
              </View>
              <View style={styles.tokenStats}>
                <Text style={styles.apyLabel}>APY</Text>
                <Text style={styles.apyValue}>{item.apy}</Text>
              </View>
            </View>
          </CardHeader>
        <CardContent>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>{item.price}</Text>
          </View>
        </CardContent>
      </TouchableOpacity>
    </Card>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lend Assets</Text>
        <Text style={styles.headerSubtitle}>
          Supply assets to the OpenChain protocol and earn interest.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Markets</Text>
        {loading && !tokens.length ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.foreground.primary}
          />
        ) : (
          <View style={styles.tokenList}>{tokens.map(renderTokenCard)}</View>
        )}
      </View>

      {selectedToken && (
        <Card style={styles.lendingCard}>
          <CardHeader>
            <CardTitle>Lend {selectedToken.symbol}</CardTitle>
            <CardDescription>
              Enter the amount you want to supply.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              label={`Amount in ${selectedToken.symbol}`}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
            />
            <Text style={styles.balanceText}>
              Wallet Balance: {selectedToken.balance} {selectedToken.symbol}
            </Text>
          </CardContent>
          <CardFooter>
                        <Button
              title={`Supply ${selectedToken.symbol}`}
              onPress={handleLend}
              disabled={loading || !amount}
              loading={loading}
            />
          </CardFooter>
        </Card>
      )}

      {!connected && (
        <Card style={styles.warningCard}>
          <CardHeader>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name="alert-circle-outline"
                size={24}
                color={theme.colors.foreground.destructive}
                style={{ marginRight: theme.spacing.sm }}
              />
              <CardTitle>Wallet Not Connected</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <Text style={styles.warningText}>
              Please connect your wallet to lend assets.
            </Text>
          </CardContent>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  contentContainer: {
    padding: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.foreground.primary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.foreground.muted,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.foreground.primary,
    marginBottom: theme.spacing.md,
  },
  tokenList: {
    gap: theme.spacing.md,
  },
  tokenCard: {
    // Uses default Card styling
  },
  selectedTokenCard: {
    borderColor: theme.colors.border.primary,
    borderWidth: 2,
  },
  cardHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  tokenIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.foreground.primary,
  },
  tokenStats: {
    alignItems: 'flex-end',
  },
  apyLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.foreground.muted,
  },
  apyValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    color: theme.colors.foreground.primary,
  },
  priceContainer: {
    marginTop: theme.spacing.sm,
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.foreground.muted,
  },
  priceValue: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.foreground.primary,
  },
  lendingCard: {
    marginTop: theme.spacing.lg,
  },
  balanceText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.foreground.muted,
    textAlign: 'right',
    marginTop: theme.spacing.sm,
  },
  warningCard: {
    marginTop: theme.spacing.lg,
    borderColor: theme.colors.border.destructive,
    borderLeftWidth: 4,
  },
  warningText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.foreground.destructive,
  },
});

export default LendingScreenShadcn;
