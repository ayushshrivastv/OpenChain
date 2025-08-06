import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../components/SolanaWalletProvider';
import { Colors, Typography, Spacing } from '../theme/colors';
import { priceService, PriceData } from '../services/PriceService';
import { getTokensByNetwork, TokenConfig } from '../services/BackendConfig';
import { LinearGradient } from 'expo-linear-gradient';

// Define styles for dark theme
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
    marginLeft: Spacing.md,
  },
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 20, 40, 0.7)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: Colors.button.primary,
  },
  tabButtonText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
  },
  activeTabButtonText: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
  cardTitle: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  metricContainer: {
    marginVertical: Spacing.sm,
  },
  metricLabel: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs / 2,
  },
  metricValue: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  positionCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(45, 55, 100, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  tokenIconText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  tokenName: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  tokenSymbol: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.xs,
  },
  chainBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    backgroundColor: 'rgba(45, 55, 100, 0.8)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  chainText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
  },
  positionDetails: {
    marginTop: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.xs / 2,
  },
  detailLabel: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
  },
  detailValue: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
  apyValue: {
    color: Colors.status.success,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.button.primary,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  buttonText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 55, 100, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs / 2,
  },
  transactionAmount: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
  transactionDate: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
  },
  transactionHash: {
    color: Colors.button.primary,
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xs / 2,
  },
  emptyList: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyListText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  summaryCard: {
    backgroundColor: 'rgba(25, 30, 60, 0.6)',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    minHeight: 80,
  },
  healthFactorGood: {
    color: Colors.status.success,
  },
  healthFactorWarning: {
    color: Colors.status.warning,
  },
  healthFactorDanger: {
    color: Colors.status.error,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.primary,
    marginVertical: Spacing.sm,
  },
  // Add missing styles from the bottom StyleSheet
  livePriceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginLeft: 6,
  },
  warningTextDark: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.sm,
    marginLeft: Spacing.md,
  },
  sectionTitleDark: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  netWorthText: {
    color: '#4f46e5',
  },
  safeText: {
    color: '#10b981',
  },
  dangerText: {
    color: '#ef4444',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#4f46e5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  positionsList: {
    gap: 16,
  },
  positionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionToken: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  positionChain: {
    fontSize: 14,
    color: '#9ca3af',
  },
  positionType: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#2d2d44',
  },
  positionTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lendingText: {
    color: '#10b981',
  },
  borrowingText: {
    color: '#f59e0b',
  },
  positionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  positionStat: {
    alignItems: 'center',
  },
  positionStatLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  positionStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  positionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  withdrawButton: {
    backgroundColor: '#10b981',
  },
  repayButton: {
    backgroundColor: '#f59e0b',
  },
  positionActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2d2d44',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionTime: {
    fontSize: 12,
    color: '#9ca3af',
  }
});

interface Position {
  id: string;
  type: 'lending' | 'borrowing';
  token: string;
  amount: string;
  value: string;
  apy: string;
  icon: string;
  chain: string;
  loading?: boolean;
  tokenConfig?: TokenConfig;
}

interface Transaction {
  id: string;
  type: 'lend' | 'borrow' | 'repay' | 'withdraw';
  token: string;
  amount: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  txHash: string;
}

const PortfolioScreen: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'positions' | 'transactions'>('positions');
  const [prices, setPrices] = useState<PriceData>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Portfolio summary data
  const [portfolioData, setPortfolioData] = useState({
    totalDeposited: '$2,450.00',
    totalBorrowed: '$1,200.00',
    netWorth: '$1,250.00',
    healthFactor: '2.04',
  });

  // Token positions with real-time pricing
  const [positions, setPositions] = useState<Position[]>([
    {
      id: '1',
      type: 'lending',
      token: 'SOL',
      amount: '12.5',
      value: '$0.00',
      apy: '5.2%',
      icon: '◎',
      chain: 'Solana',
      loading: true,
      tokenConfig: getTokensByNetwork('solana').find(t => t.symbol === 'SOL'),
    },
    {
      id: '2',
      type: 'lending',
      token: 'BONK',
      amount: '250000.00',
      value: '$0.00',
      apy: '14.2%',
      icon: '🐶',
      chain: 'Solana',
      loading: true,
      tokenConfig: getTokensByNetwork('solana').find(t => t.symbol === 'BONK'),
    },
    {
      id: '3',
      type: 'lending',
      token: 'USDC',
      amount: '500.00',
      value: '$0.00',
      apy: '4.8%',
      icon: '$',
      chain: 'Ethereum',
      loading: true,
      tokenConfig: getTokensByNetwork('ethereum').find(t => t.symbol === 'USDC'),
    },
    {
      id: '4',
      type: 'borrowing',
      token: 'USDC',
      amount: '800.00',
      value: '$0.00',
      apy: '8.5%',
      icon: '$',
      chain: 'Polygon',
      loading: true,
      tokenConfig: getTokensByNetwork('polygon').find(t => t.symbol === 'USDC'),
    },
  ]);

  // Mock transactions
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'lend',
      token: 'SOL',
      amount: '5.0',
      timestamp: '2025-01-04 14:30',
      status: 'completed',
      txHash: '5KJp...9mNx',
    },
    {
      id: '2',
      type: 'borrow',
      token: 'USDC',
      amount: '400.00',
      timestamp: '2025-01-04 12:15',
      status: 'completed',
      txHash: '3Hx7...2kLp',
    },
    {
      id: '3',
      type: 'lend',
      token: 'USDC',
      amount: '500.00',
      timestamp: '2025-01-03 16:45',
      status: 'completed',
      txHash: '8Ry4...5nQw',
    },
    {
      id: '4',
      type: 'borrow',
      token: 'USDC',
      amount: '400.00',
      timestamp: '2025-01-03 10:20',
      status: 'pending',
      txHash: '2Mx9...7vBc',
    },
  ]);

  // Fetch token prices and update positions
  const fetchPrices = async () => {
    setLoading(true);
    try {
      // Get tokens from all positions
      const tokens = positions.map(pos => pos.token);
      const priceData = await priceService.getTokenPrices(tokens);
      setPrices(priceData);
      
      // Update position values
      const updatedPositions = positions.map(pos => {
        const tokenPrice = priceData[pos.token];
        if (tokenPrice) {
          const amountNum = parseFloat(pos.amount);
          const usdValue = amountNum * tokenPrice.price;
          return {
            ...pos,
            value: priceService.formatPrice(usdValue),
            loading: false
          };
        }
        return pos;
      });
      
      setPositions(updatedPositions);
      
      // Update portfolio summary based on new prices
      updatePortfolioSummary(updatedPositions);
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updatePortfolioSummary = (updatedPositions: Position[]) => {
    let totalDeposited = 0;
    let totalBorrowed = 0;
    
    updatedPositions.forEach(pos => {
      const value = parseFloat(pos.value.replace('$', '').replace(',', ''));
      if (pos.type === 'lending') {
        totalDeposited += value;
      } else {
        totalBorrowed += value;
      }
    });
    
    const netWorth = totalDeposited - totalBorrowed;
    const healthFactor = totalBorrowed > 0 ? (totalDeposited / totalBorrowed).toFixed(2) : '∞';
    
    setPortfolioData({
      totalDeposited: `$${totalDeposited.toLocaleString(undefined, {maximumFractionDigits: 2})}`,
      totalBorrowed: `$${totalBorrowed.toLocaleString(undefined, {maximumFractionDigits: 2})}`,
      netWorth: `$${netWorth.toLocaleString(undefined, {maximumFractionDigits: 2})}`,
      healthFactor: healthFactor
    });
  };

  useEffect(() => {
    fetchPrices();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (!refreshing) fetchPrices();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchPrices, refreshing]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPrices();
    setRefreshing(false);
  };

  const handleWithdraw = (position: Position) => {
    Alert.alert(
      'Withdraw Confirmation',
      `Are you sure you want to withdraw ${position.amount} ${position.token}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Withdraw', 
          onPress: () => {
            Alert.alert('Success', 'Withdrawal initiated successfully');
          }
        },
      ]
    );
  };

  const handleRepay = (position: Position) => {
    Alert.alert(
      'Repay Confirmation',
      `Are you sure you want to repay ${position.amount} ${position.token}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Repay', 
          onPress: () => {
            Alert.alert('Success', 'Repayment initiated successfully');
          }
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const getTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'lend': return 'trending-up';
      case 'borrow': return 'trending-down';
      case 'repay': return 'arrow-up';
      case 'withdraw': return 'arrow-down';
      default: return 'help';
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={[Colors.gradients.primary[0], Colors.gradients.primary[1]]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Portfolio</Text>
          <Text style={styles.headerSubtitle}>
            Track your lending and borrowing positions
          </Text>
        </View>

        {/* Connection Status */}
        {!connected ? (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color={Colors.status.warning} />
            <Text style={styles.warningTextDark}>
              Connect your wallet to view your portfolio
            </Text>
          </View>
        ) : (
        <>
          {/* Portfolio Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitleDark}>Portfolio Summary</Text>
            
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{portfolioData.totalDeposited}</Text>
                <Text style={styles.summaryLabel}>Total Deposited</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{portfolioData.totalBorrowed}</Text>
                <Text style={styles.summaryLabel}>Total Borrowed</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, styles.netWorthText]}>
                  {portfolioData.netWorth}
                </Text>
                <Text style={styles.summaryLabel}>Net Worth</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <Text style={[
                  styles.summaryValue, 
                  parseFloat(portfolioData.healthFactor) > 1.5 ? styles.safeText : styles.dangerText
                ]}>
                  {portfolioData.healthFactor}
                </Text>
                <Text style={styles.summaryLabel}>Health Factor</Text>
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'positions' && styles.activeTab]}
              onPress={() => setActiveTab('positions')}
            >
              <Text style={[styles.tabText, activeTab === 'positions' && styles.activeTabText]}>
                Positions
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
              onPress={() => setActiveTab('transactions')}
            >
              <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>
                Transactions
              </Text>
            </TouchableOpacity>
          </View>

          {/* Positions Tab */}
          {activeTab === 'positions' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Positions</Text>
              
              {positions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="wallet-outline" size={48} color="#6b7280" />
                  <Text style={styles.emptyStateText}>No active positions</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Start lending or borrowing to see your positions here
                  </Text>
                </View>
              ) : (
                <View style={styles.positionsList}>
                  {positions.map((position) => (
                    <View key={position.id} style={styles.positionCard}>
                      <View style={styles.positionHeader}>
                        <View style={styles.positionInfo}>
                          <View style={styles.tokenIcon}>
                            <Text style={styles.tokenIconText}>{position.icon}</Text>
                          </View>
                          <View style={styles.positionDetails}>
                            <Text style={styles.positionToken}>{position.token}</Text>
                            <Text style={styles.positionChain}>{position.chain}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.positionType}>
                          <Text style={[
                            styles.positionTypeText,
                            position.type === 'lending' ? styles.lendingText : styles.borrowingText
                          ]}>
                            {position.type === 'lending' ? 'Lending' : 'Borrowing'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.positionStats}>
                        <View style={styles.positionStat}>
                          <Text style={styles.positionStatLabel}>Amount</Text>
                          <Text style={styles.positionStatValue}>
                            {position.amount} {position.token}
                          </Text>
                        </View>
                        
                        <View style={styles.positionStat}>
                          <Text style={styles.positionStatLabel}>Value</Text>
                          <View>
                          {position.loading ? (
                            <ActivityIndicator size="small" color={Colors.button.primary} />
                          ) : (
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                              <Text>{position.value}</Text>
                              {position.tokenConfig?.coingeckoId && (
                                <View style={styles.livePriceIndicator} />
                              )}
                            </View>
                          )}
                        </View>
                        </View>
                        
                        <View style={styles.positionStat}>
                          <Text style={styles.positionStatLabel}>
                            {position.type === 'lending' ? 'APY' : 'APR'}
                          </Text>
                          <Text style={[
                            styles.positionStatValue,
                            position.type === 'lending' ? styles.lendingText : styles.borrowingText
                          ]}>
                            {position.apy}
                          </Text>
                        </View>
                      </View>
                      
                      <TouchableOpacity
                        style={[
                          styles.positionAction,
                          position.type === 'lending' ? styles.withdrawButton : styles.repayButton
                        ]}
                        onPress={() => position.type === 'lending' ? handleWithdraw(position) : handleRepay(position)}
                      >
                        <Ionicons 
                          name={position.type === 'lending' ? 'arrow-down' : 'arrow-up'} 
                          size={16} 
                          color="#fff" 
                        />
                        <Text style={styles.positionActionText}>
                          {position.type === 'lending' ? 'Withdraw' : 'Repay'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              
              {transactions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="receipt-outline" size={48} color="#6b7280" />
                  <Text style={styles.emptyStateText}>No transactions</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Your transaction history will appear here
                  </Text>
                </View>
              ) : (
                <View style={styles.transactionsList}>
                  {transactions.map((transaction) => (
                    <View key={transaction.id} style={styles.transactionCard}>
                      <View style={styles.transactionHeader}>
                        <View style={styles.transactionIcon}>
                          <Ionicons 
                            name={getTypeIcon(transaction.type)} 
                            size={20} 
                            color="#4f46e5" 
                          />
                        </View>
                        
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionType}>
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </Text>
                          <Text style={styles.transactionAmount}>
                            {transaction.amount} {transaction.token}
                          </Text>
                        </View>
                        
                        <View style={styles.transactionStatus}>
                          <View style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(transaction.status) }
                          ]} />
                          <Text style={[
                            styles.statusText,
                            { color: getStatusColor(transaction.status) }
                          ]}>
                            {transaction.status}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.transactionFooter}>
                        <Text style={styles.transactionTime}>{transaction.timestamp}</Text>
                        <Text style={styles.transactionHash}>{transaction.txHash}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </>
      )}
      </LinearGradient>
    </ScrollView>
  );
};



export default PortfolioScreen;
