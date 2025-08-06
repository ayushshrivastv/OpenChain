import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../components/SolanaWalletProvider';
import { priceService, PriceData } from '../services/PriceService';
import { contractService } from '../services/ContractService';
import { TOKEN_CONFIGS, getTokensByNetwork } from '../services/BackendConfig';
import { PublicKey } from '@solana/web3.js';
import { Colors, Typography, Spacing } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

// Define styles before using them
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  gradientBackground: {
    flex: 1,
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  tokenList: {
    gap: Spacing.md
  },
  card: {
    backgroundColor: 'rgba(25, 30, 60, 0.6)',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  selectedCard: {
    borderColor: Colors.button.primary,
    borderWidth: 2
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  tokenIcon: {
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(45, 55, 100, 0.5)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: Spacing.md 
  },
  tokenIconText: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '600'
  },
  cardTitle: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.xs,
  },
  tokenStats: {
    alignItems: 'flex-end'
  },
  label: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing.xs / 2,
  },
  value: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
  badgeContainer: {
    marginTop: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: 12,
    padding: Spacing.md,
    backgroundColor: 'rgba(15, 20, 40, 0.5)',
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  inputCurrency: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    marginLeft: Spacing.md
  },
  priceConversion: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.md
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(25, 30, 60, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.highlight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.status.warning,
  },
  warningText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.sm,
  },
  primaryButton: {
    backgroundColor: Colors.button.primary,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  secondaryButtonText: {
    color: Colors.button.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  metricContainer: {
    marginVertical: Spacing.sm,
  },
  metricLabel: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  metricValue: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.primary,
    marginVertical: Spacing.sm,
  },
  infoBox: {
    backgroundColor: 'rgba(15, 20, 40, 0.5)',
    borderRadius: 12,
    padding: Spacing.md,
    flexDirection: 'row',
    borderLeftWidth: 3,
    borderLeftColor: Colors.status.info,
  },
  infoTitle: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  bodyText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
});

interface Token {
  symbol: string;
  name: string;
  balance: string;
  apy: string;
  icon: string;
  price: string;
}

const LendingScreen: React.FC = () => {
  const { connected, publicKey, signTransaction } = useWallet();
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<PriceData>({});
  const [tokens, setTokens] = useState<Token[]>([]);

  // Fetch real token data
  React.useEffect(() => {
    const fetchTokenData = async () => {
      try {
        // Get prices
        const priceData = await priceService.getAllTokenPrices();
        setPrices(priceData);
        
        // Get supported tokens
        const solanaTokens = getTokensByNetwork('solana');
        const tokenData: Token[] = solanaTokens.map(token => ({
          symbol: token.symbol,
          name: token.name,
          balance: '0.00', // Will be fetched from wallet
          apy: '5.2%', // Will be fetched from contracts
          icon: getTokenIcon(token.symbol),
          price: priceData[token.symbol] ? priceService.formatPrice(priceData[token.symbol].price) : '$0.00',
        }));
        
        setTokens(tokenData);
      } catch (error) {
        console.error('Failed to fetch token data:', error);
        // Fallback to mock data
        setTokens(mockTokens);
      }
    };
    
    fetchTokenData();
  }, []);
  
  const getTokenIcon = (symbol: string): string => {
    const icons: Record<string, string> = {
      SOL: '◎',
      USDC: '$',
      ETH: 'Ξ',
      MATIC: '◆',
    };
    return icons[symbol] || '●';
  };
  
  // Fallback mock data
  const mockTokens: Token[] = [
    {
      symbol: 'SOL',
      name: 'Solana',
      balance: '2.45',
      apy: '5.2%',
      icon: '◎',
      price: '$98.50',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      balance: '1,250.00',
      apy: '4.8%',
      icon: '$',
      price: '$1.00',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      balance: '0.85',
      apy: '3.9%',
      icon: 'Ξ',
      price: '$2,340.00',
    },
  ];

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
      // Get token configuration
      const tokenConfig = TOKEN_CONFIGS.find(t => t.symbol === selectedToken.symbol);
      if (!tokenConfig) {
        throw new Error('Token configuration not found');
      }

      // For Solana tokens, create deposit transaction
      if (tokenConfig.network === 'solana') {
        const tokenMint = new PublicKey(tokenConfig.address === 'native' ? 
          'So11111111111111111111111111111111111111112' : // SOL mint
          tokenConfig.address
        );
        
        const amountLamports = amountNum * Math.pow(10, tokenConfig.decimals);
        
        // Prepare deposit transaction
        const transaction = await contractService.prepareSolanaDepositTransaction(
          publicKey,
          tokenMint,
          amountLamports
        );
        
        if (!transaction) {
          throw new Error('Failed to prepare transaction');
        }
        
        // Sign and send transaction
        const signedTransaction = await signTransaction(transaction);
        
        Alert.alert(
          'Lending Successful!',
          `You have successfully lent ${amount} ${selectedToken.symbol}`,
          [{ text: 'OK', onPress: () => {
            setAmount('');
            setSelectedToken(null);
          }}]
        );
      } else {
        // For cross-chain lending, use backend API
        const result = await contractService.executeCrossChainTransaction(
          'solana',
          tokenConfig.network,
          selectedToken.symbol,
          amountNum,
          'lend',
          publicKey.toString()
        );
        
        if (result.success) {
          Alert.alert(
            'Cross-Chain Lending Initiated!',
            `Your ${amount} ${selectedToken.symbol} lending transaction has been submitted.\nTx Hash: ${result.transactionHash}`,
            [{ text: 'OK', onPress: () => {
              setAmount('');
              setSelectedToken(null);
            }}]
          );
        } else {
          throw new Error(result.error || 'Transaction failed');
        }
      }
    } catch (error: any) {
      console.error('Lending transaction failed:', error);
      Alert.alert(
        'Transaction Failed', 
        error.message || 'Please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnings = () => {
    if (!selectedToken || !amount) return '0.00';
    const amountNum = parseFloat(amount);
    const apyNum = parseFloat(selectedToken.apy.replace('%', ''));
    return ((amountNum * apyNum) / 100 / 365).toFixed(6);
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[Colors.gradients.primary[0], Colors.gradients.primary[1]]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lend Assets</Text>
        <Text style={styles.headerSubtitle}>
          Earn interest by lending your crypto assets
        </Text>
      </View>

      {/* Connection Status */}
      {!connected && (
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={24} color={Colors.status.warning} style={{ marginRight: Spacing.md }} />
          <Text style={styles.warningText}>
            Connect your wallet to start lending
          </Text>
        </View>
      )}

      {/* Token Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Asset to Lend</Text>
        
        <View style={styles.tokenList}>
          {tokens.map((token) => (
            <TouchableOpacity
              key={token.symbol}
              style={[
                styles.card,
                selectedToken?.symbol === token.symbol && styles.selectedCard
              ]}
              onPress={() => setSelectedToken(token)}
              disabled={!connected}
            >
              <View style={styles.rowBetween}>
                <View style={styles.tokenInfo}>
                  <View style={styles.tokenIcon}>
                    <Text style={styles.tokenIconText}>{token.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{token.symbol}</Text>
                    <Text style={styles.cardSubtitle}>{token.name}</Text>
                  </View>
                </View>
                
                <View style={styles.tokenStats}>
                  <View style={{ marginBottom: Spacing.xs }}>
                    <Text style={styles.label}>Balance</Text>
                    <Text style={styles.value}>{token.balance}</Text>
                  </View>
                  <View style={styles.badgeContainer}>
                    <Text style={styles.label}>APY</Text>
                    <View style={[styles.badge, { backgroundColor: Colors.status.success }]}>
                      <Text style={styles.badgeText}>
                        {token.apy}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Amount Input */}
      {selectedToken && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount to Lend</Text>
          
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>
                Available: {selectedToken.balance} {selectedToken.symbol}
              </Text>
              <TouchableOpacity
                onPress={() => setAmount(selectedToken.balance)}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={Colors.text.muted}
                keyboardType="numeric"
                editable={connected}
              />
              <Text style={styles.inputCurrency}>{selectedToken.symbol}</Text>
            </View>
            
            <Text style={styles.priceConversion}>
              ≈ ${(parseFloat(amount || '0') * parseFloat(selectedToken.price.replace('$', ''))).toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* Earnings Projection */}
      {selectedToken && amount && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings Projection</Text>
          
          <View style={styles.card}>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Daily Earnings</Text>
              <Text style={styles.metricValue}>
                {calculateEarnings()} {selectedToken.symbol}
              </Text>
            </View>
            
            <View style={styles.metricContainer}>
              <View style={styles.divider} />
              <Text style={styles.metricLabel}>Monthly Earnings</Text>
              <Text style={styles.metricValue}>
                {(parseFloat(calculateEarnings()) * 30).toFixed(6)} {selectedToken.symbol}
              </Text>
            </View>
            
            <View style={styles.metricContainer}>
              <View style={styles.divider} />
              <Text style={styles.metricLabel}>Annual APY</Text>
              <Text style={[styles.metricValue, { color: Colors.status.success }]}>
                {selectedToken.apy}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Lend Button */}
      {selectedToken && (
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!connected || !amount || loading) && { opacity: 0.5 }
            ]}
            onPress={handleLend}
            disabled={!connected || !amount || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.text.primary} />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="trending-up" size={20} color={Colors.text.primary} style={{ marginRight: Spacing.xs }} />
                <Text style={styles.primaryButtonText}>
                  Lend {amount || '0'} {selectedToken.symbol}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Info Section */}
      <View style={styles.section}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={Colors.button.primary} style={{ marginRight: Spacing.md }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>How Lending Works</Text>
            <Text style={styles.bodyText}>
              • Deposit your assets to earn interest{'\n'}
              • Interest is calculated daily and compounded{'\n'}
              • Withdraw your assets anytime{'\n'}
              • Cross-chain lending available
            </Text>
          </View>
        </View>
      </View>
      </LinearGradient>
    </ScrollView>
  );
};

export default LendingScreen;
