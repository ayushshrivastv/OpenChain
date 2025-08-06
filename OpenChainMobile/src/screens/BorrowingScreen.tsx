import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  ImageBackground,
  Modal,
  Pressable,
  Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useWallet } from '../components/SolanaWalletProvider';
import { priceService, PriceData } from '../services/PriceService';
import { contractService, UserAccountData } from '../services/ContractService';
import { TOKEN_CONFIGS, getTokensByNetwork } from '../services/BackendConfig';
import { PublicKey } from '@solana/web3.js';
import { Colors, Typography, Spacing } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

interface Token {
  symbol: string;
  name: string;
  available: string;
  apr: string;
  icon: string;
  price: string;
}

interface CollateralToken {
  symbol: string;
  name: string;
  balance: string;
  ltv: string;
  icon: string;
  price: string;
}

const BorrowingScreen: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [selectedBorrowToken, setSelectedBorrowToken] = useState<Token | null>(null);
  const [selectedCollateral, setSelectedCollateral] = useState<CollateralToken | null>(null);
  const [borrowAmount, setBorrowAmount] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock borrow tokens
  const borrowTokens: Token[] = [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      available: '1,000,000',
      apr: '5.2',
      icon: '💰',
      price: '$1.00',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      available: '500',
      apr: '4.8',
      icon: '⟠',
      price: '$2,400.00',
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      available: '10,000',
      apr: '6.1',
      icon: '◎',
      price: '$95.00',
    },
  ];

  // Mock collateral tokens
  const collateralTokens: CollateralToken[] = [
    {
      symbol: 'SOL',
      name: 'Solana',
      balance: '10.5',
      ltv: '75%',
      icon: '◎',
      price: '$95.00',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      balance: '2.3',
      ltv: '80%',
      icon: '⟠',
      price: '$2,400.00',
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      balance: '0.15',
      ltv: '70%',
      icon: '₿',
      price: '$43,000.00',
    },
  ];

  const handleBorrow = async (tokenSymbol: string) => {
    if (!connected || !publicKey) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      // Mock borrowing process
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Success', `Borrowed ${tokenSymbol} successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to borrow tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async (positionId: string) => {
    setLoading(true);
    try {
      // Mock repayment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Success', 'Repayment successful!');
    } catch (error) {
      Alert.alert('Error', 'Failed to repay');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollateral = async (positionId: string) => {
    setLoading(true);
    try {
      // Mock add collateral process
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Success', 'Collateral added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add collateral');
    } finally {
      setLoading(false);
    }
  };

  // Mock borrowed positions
  const borrowedPositions = [
    {
      id: '1',
      asset: 'USDC',
      amount: 1000,
      borrowedValue: 1000,
      interestRate: 5.2,
      healthFactor: 2.1,
    },
    {
      id: '2',
      asset: 'ETH',
      amount: 0.5,
      borrowedValue: 1200,
      interestRate: 4.8,
      healthFactor: 1.8,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['rgba(20, 25, 50, 1)', 'rgba(15, 20, 40, 1)']} 
        style={styles.gradientBackground}
      />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Borrow Assets</Text>
        <Text style={styles.headerSubtitle}>
          Access liquidity using your crypto as collateral
        </Text>
      </View>
      
      {/* Demo Mode */}
      <View style={styles.demoModeContainer}>
        <View style={styles.row}>
          <Ionicons name="flask-outline" size={20} color={Colors.text.secondary} />
          <Text style={[styles.demoModeText, {marginLeft: 8}]}>Demo Mode</Text>
        </View>
        <Switch
          value={true}
          trackColor={{ false: 'rgba(45, 55, 100, 0.5)', true: 'rgba(100, 110, 200, 0.5)' }}
          thumbColor={Colors.button.primary}
        />
      </View>

      {/* Wallet Connection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet Connection</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={styles.tokenIcon}>
                <Ionicons name="wallet-outline" size={18} color={Colors.text.primary} />
              </View>
              <View>
                <Text style={styles.cardTitle}>
                  {connected ? 'Connected' : 'Not Connected'}
                </Text>
                {connected && (
                  <Text style={styles.cardSubtitle}>
                    {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {}}
            >
              <Text style={styles.primaryButtonText}>
                {connected ? 'Disconnect' : 'Connect Wallet'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Available Assets */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available to Borrow</Text>
        
        {borrowTokens.map((token) => (
          <View key={token.symbol} style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.row}>
                <View style={styles.tokenIcon}>
                  <Text>{token.icon}</Text>
                </View>
                <View>
                  <Text style={styles.cardTitle}>{token.symbol}</Text>
                  <Text style={styles.cardSubtitle}>{token.name}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.cardTitle}>{token.price}</Text>
                <View style={[styles.badge, { backgroundColor: Colors.status.success }]}>
                  <Text style={{ color: Colors.text.primary, fontSize: Typography.fontSize.xs }}>
                    {token.apr}% APY
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={[styles.statsRow, { marginTop: 16 }]}>
              <View>
                <Text style={styles.label}>Available</Text>
                <Text style={styles.value}>
                  {token.available} {token.symbol}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.label}>Utilization</Text>
                <Text style={styles.value}>0%</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 16 }]}
              onPress={() => handleBorrow(token.symbol)}
              disabled={!connected}
            >
              <Text style={styles.primaryButtonText}>Borrow {token.symbol}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Your Borrowed Positions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Borrowed Positions</Text>
        
        {borrowedPositions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={Colors.text.secondary} />
            <Text style={styles.emptyText}>No borrowed positions</Text>
            <Text style={styles.emptySubtext}>
              Start borrowing to see your positions here
            </Text>
          </View>
        ) : (
          borrowedPositions.map((position) => (
            <View key={position.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.row}>
                  <View style={[
                    styles.statusIndicator, 
                    position.healthFactor > 1.5 ? styles.statusSuccess : 
                    position.healthFactor > 1.2 ? styles.statusWarning : styles.statusError
                  ]} />
                  <Text style={styles.cardTitle}>{position.asset}</Text>
                </View>
                <Text style={styles.cardTitle}>
                  {position.amount.toLocaleString()} {position.asset}
                </Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.label}>Borrowed</Text>
                  <Text style={styles.value}>
                    ${position.borrowedValue.toLocaleString()}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.label}>Interest Rate</Text>
                  <Text style={styles.value}>{position.interestRate}%</Text>
                </View>
              </View>
              
              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.label}>Health Factor</Text>
                  <Text style={[styles.value, {
                    color: position.healthFactor > 1.5 ? Colors.status.success : 
                           position.healthFactor > 1.2 ? Colors.status.warning : Colors.status.error
                  }]}>
                    {position.healthFactor.toFixed(2)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.label}>Liquidation at</Text>
                  <Text style={styles.value}>{'< 1.0'}</Text>
                </View>
              </View>
              
              <View style={[styles.row, { marginTop: 16, gap: 12 }]}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { flex: 1 }]}
                  onPress={() => handleRepay(position.id)}
                >
                  <Text style={styles.secondaryButtonText}>Repay</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, { flex: 1 }]}
                  onPress={() => handleAddCollateral(position.id)}
                >
                  <Text style={styles.primaryButtonText}>Add Collateral</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Risk Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risk Management</Text>
        <View style={styles.marketStatsContainer}>
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statsLabel}>Total Borrowed</Text>
              <Text style={styles.statsValue}>$2,200.00</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.statsLabel}>Total Collateral</Text>
              <Text style={styles.statsValue}>$4,500.00</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statsLabel}>Borrow Capacity</Text>
              <Text style={styles.statsValue}>$3,375.00</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.statsLabel}>Liquidation Threshold</Text>
              <Text style={styles.statsValue}>80%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.infoBox}>
          <View style={styles.row}>
            <View style={styles.actionCardIcon}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.status.info} />
            </View>
            <Text style={[styles.bodyText, { flex: 1 }]}>
              Borrowing allows you to access liquidity without selling your crypto assets. 
              Use your tokens as collateral to borrow other assets.{"\n\n"}
              
              Key Features:{"\n"}
              • Cross-chain borrowing support{"\n"}
              • Competitive interest rates{"\n"}
              • Powered by Chainlink CCIP{"\n"}
              • Maintain healthy collateral ratios
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default BorrowingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
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
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingVertical: Spacing.sm,
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
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 12,
    overflow: 'hidden',
    fontSize: Typography.fontSize.xs,
    color: Colors.text.primary,
    fontWeight: '500',
    marginTop: Spacing.xs / 2,
  },
  bodyText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptySubtext: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  // New styles for the redesigned UI
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  demoModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(25, 30, 60, 0.7)',
    borderRadius: 12,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.highlight,
  },
  demoModeText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.xs,
    marginRight: Spacing.sm,
  },
  actionCard: {
    backgroundColor: 'rgba(25, 30, 60, 0.6)',
    borderRadius: 12,
    padding: Spacing.md,
    flex: 1,
    minHeight: 90,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  activeActionCard: {
    backgroundColor: 'rgba(35, 45, 80, 0.8)',
    borderColor: Colors.border.highlight,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  actionCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(45, 55, 100, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  marketStatsContainer: {
    backgroundColor: 'rgba(25, 30, 60, 0.5)',
    borderRadius: 12,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  statsLabel: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.xs,
  },
  statsValue: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.primary,
    marginVertical: Spacing.sm,
  },
  tokenIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(45, 55, 100, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusSuccess: {
    backgroundColor: Colors.status.success,
  },
  statusWarning: {
    backgroundColor: Colors.status.warning,
  },
  statusError: {
    backgroundColor: Colors.status.error,
  },
  inputContainer: {
    backgroundColor: 'rgba(15, 20, 40, 0.5)',
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.sm,
  },
  infoBox: {
    backgroundColor: 'rgba(15, 20, 40, 0.5)',
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: Colors.status.info,
  },
});
