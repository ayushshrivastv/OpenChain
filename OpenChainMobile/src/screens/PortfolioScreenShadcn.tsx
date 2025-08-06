import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWallet } from '../components/SolanaWalletProvider';
import { ShadcnColors, ShadcnTypography, ShadcnSpacing, ShadcnBorderRadius, ShadcnShadows } from '../theme/shadcn-inspired';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';

interface Position {
  id: string;
  type: 'lending' | 'borrowing';
  token: string;
  amount: string;
  value: string;
  apy: string;
  icon: string;
  chain: string;
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

const PortfolioScreenShadcn: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'positions' | 'transactions'>('positions');
  const [loading, setLoading] = useState(false);

  // Mock portfolio data
  const [portfolioData] = useState({
    totalDeposited: '$2,450.00',
    totalBorrowed: '$1,200.00',
    netWorth: '$1,250.00',
    healthFactor: '2.04',
  });

  // Mock positions
  const [positions] = useState<Position[]>([
    {
      id: '1',
      type: 'lending',
      token: 'SOL',
      amount: '10.5',
      value: '$997.50',
      apy: '5.2%',
      icon: '☀️',
      chain: 'Solana',
    },
    {
      id: '2',
      type: 'lending',
      token: 'USDC',
      amount: '1,200.00',
      value: '$1,200.00',
      apy: '4.8%',
      icon: '💰',
      chain: 'Solana',
    },
    {
      id: '3',
      type: 'borrowing',
      token: 'USDT',
      amount: '800.00',
      value: '$800.00',
      apy: '6.2%',
      icon: '💵',
      chain: 'Ethereum',
    },
  ]);

  // Mock transactions
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'lend',
      token: 'SOL',
      amount: '5.0',
      timestamp: '2024-01-15 14:30',
      status: 'completed',
      txHash: '0x1234...5678',
    },
    {
      id: '2',
      type: 'borrow',
      token: 'USDT',
      amount: '400.00',
      timestamp: '2024-01-14 10:15',
      status: 'completed',
      txHash: '0xabcd...efgh',
    },
    {
      id: '3',
      type: 'repay',
      token: 'USDT',
      amount: '100.00',
      timestamp: '2024-01-13 16:45',
      status: 'pending',
      txHash: '0x9876...5432',
    },
  ]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const MetricCard = ({ label, value, trend }: { label: string; value: string; trend?: 'up' | 'down' | 'neutral' }) => (
    <Card style={styles.metricCard}>
      <CardContent style={styles.metricCardContent}>
        <Text style={styles.metricLabel}>{label}</Text>
        <View style={styles.metricValueContainer}>
          <Text style={styles.metricValue}>{value}</Text>
          {trend && (
            <Ionicons 
              name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'} 
              size={16} 
              color={trend === 'up' ? ShadcnColors.status.success : trend === 'down' ? ShadcnColors.status.error : ShadcnColors.foreground.secondary} 
            />
          )}
        </View>
      </CardContent>
    </Card>
  );

  const PositionCard = ({ position }: { position: Position }) => (
    <Card style={styles.positionCard}>
      <CardContent style={styles.positionCardContent}>
        <View style={styles.positionHeader}>
          <View style={styles.tokenInfo}>
            <View style={styles.tokenIcon}>
              <Text style={styles.tokenIconText}>{position.icon}</Text>
            </View>
            <View>
              <Text style={styles.tokenName}>{position.token}</Text>
              <Text style={styles.chainName}>{position.chain}</Text>
            </View>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: position.type === 'lending' ? ShadcnColors.status.success : ShadcnColors.status.warning }]}>
            <Text style={styles.typeBadgeText}>
              {position.type === 'lending' ? 'LENDING' : 'BORROWING'}
            </Text>
          </View>
        </View>
        
        <View style={styles.positionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>{position.amount} {position.token}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Value</Text>
            <Text style={styles.detailValue}>{position.value}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>APY</Text>
            <Text style={[styles.detailValue, { color: ShadcnColors.status.success }]}>{position.apy}</Text>
          </View>
        </View>
      </CardContent>
      
      <CardFooter style={styles.positionFooter}>
        <Button
          title={position.type === 'lending' ? 'Withdraw' : 'Repay'}
          variant="outline"
          size="sm"
          onPress={() => {}}
          style={styles.actionButton}
        />
        <Button
          title={position.type === 'lending' ? 'Add More' : 'Borrow More'}
          variant="secondary"
          size="sm"
          onPress={() => {}}
          style={styles.actionButton}
        />
      </CardFooter>
    </Card>
  );

  const TransactionCard = ({ transaction }: { transaction: Transaction }) => {
    const getTransactionIcon = (type: string) => {
      switch (type) {
        case 'lend': return 'arrow-up-circle';
        case 'borrow': return 'arrow-down-circle';
        case 'repay': return 'checkmark-circle';
        case 'withdraw': return 'remove-circle';
        default: return 'help-circle';
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return ShadcnColors.status.success;
        case 'pending': return ShadcnColors.status.warning;
        case 'failed': return ShadcnColors.status.error;
        default: return ShadcnColors.foreground.secondary;
      }
    };

    return (
      <Card style={styles.transactionCard}>
        <CardContent style={styles.transactionCardContent}>
          <View style={styles.transactionHeader}>
            <View style={styles.transactionIconContainer}>
              <Ionicons 
                name={getTransactionIcon(transaction.type) as any} 
                size={24} 
                color={ShadcnColors.foreground.primary} 
              />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionType}>
                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} {transaction.token}
              </Text>
              <Text style={styles.transactionTimestamp}>{transaction.timestamp}</Text>
            </View>
            <View style={styles.transactionAmount}>
              <Text style={styles.transactionAmountText}>
                {transaction.type === 'lend' || transaction.type === 'repay' ? '+' : '-'}{transaction.amount}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) }]}>
                <Text style={styles.statusText}>{transaction.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </CardContent>
      </Card>
    );
  };

  if (!connected) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={64} color={ShadcnColors.foreground.secondary} />
          <Text style={styles.emptyTitle}>Connect Your Wallet</Text>
          <Text style={styles.emptyDescription}>
            Connect your wallet to view your portfolio and transaction history
          </Text>
          <Button
            title="Connect Wallet"
            onPress={() => {}}
            style={styles.connectButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Portfolio</Text>
          <Text style={styles.headerSubtitle}>
            {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
          </Text>
        </View>

        {/* Portfolio Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Portfolio Summary</Text>
          <View style={styles.metricsGrid}>
            <MetricCard label="Total Deposited" value={portfolioData.totalDeposited} trend="up" />
            <MetricCard label="Total Borrowed" value={portfolioData.totalBorrowed} trend="neutral" />
            <MetricCard label="Net Worth" value={portfolioData.netWorth} trend="up" />
            <MetricCard label="Health Factor" value={portfolioData.healthFactor} trend="up" />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
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

        {/* Content */}
        <View style={styles.contentSection}>
          {activeTab === 'positions' ? (
            <View>
              {positions.map((position) => (
                <PositionCard key={position.id} position={position} />
              ))}
            </View>
          ) : (
            <View>
              {transactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ShadcnColors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: ShadcnSpacing.lg,
    paddingTop: ShadcnSpacing['2xl'],
    paddingBottom: ShadcnSpacing.lg,
  },
  headerTitle: {
    fontSize: ShadcnTypography.fontSize['3xl'],
    fontWeight: ShadcnTypography.fontWeight.extrabold,
    color: ShadcnColors.foreground.primary,
  },
  headerSubtitle: {
    fontSize: ShadcnTypography.fontSize.sm,
    color: ShadcnColors.foreground.secondary,
    marginTop: ShadcnSpacing.xs,
  },
  summarySection: {
    paddingHorizontal: ShadcnSpacing.lg,
    marginBottom: ShadcnSpacing.xl,
  },
  sectionTitle: {
    fontSize: ShadcnTypography.fontSize.xl,
    fontWeight: ShadcnTypography.fontWeight.bold,
    color: ShadcnColors.foreground.primary,
    marginBottom: ShadcnSpacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ShadcnSpacing.sm,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
  },
  metricCardContent: {
    padding: ShadcnSpacing.md,
  },
  metricLabel: {
    fontSize: ShadcnTypography.fontSize.xs,
    color: ShadcnColors.foreground.secondary,
    marginBottom: ShadcnSpacing.xs,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricValue: {
    fontSize: ShadcnTypography.fontSize.lg,
    fontWeight: ShadcnTypography.fontWeight.bold,
    color: ShadcnColors.foreground.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: ShadcnSpacing.lg,
    marginBottom: ShadcnSpacing.lg,
    backgroundColor: ShadcnColors.background.secondary,
    borderRadius: ShadcnBorderRadius.md,
    padding: ShadcnSpacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: ShadcnSpacing.sm,
    alignItems: 'center',
    borderRadius: ShadcnBorderRadius.sm,
  },
  activeTab: {
    backgroundColor: ShadcnColors.background.primary,
  },
  tabText: {
    fontSize: ShadcnTypography.fontSize.sm,
    fontWeight: ShadcnTypography.fontWeight.medium,
    color: ShadcnColors.foreground.secondary,
  },
  activeTabText: {
    color: ShadcnColors.foreground.primary,
    fontWeight: ShadcnTypography.fontWeight.semibold,
  },
  contentSection: {
    paddingHorizontal: ShadcnSpacing.lg,
    paddingBottom: ShadcnSpacing.xl,
  },
  positionCard: {
    marginBottom: ShadcnSpacing.md,
  },
  positionCardContent: {
    padding: ShadcnSpacing.md,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ShadcnSpacing.md,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: ShadcnBorderRadius.lg,
    backgroundColor: ShadcnColors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ShadcnSpacing.sm,
  },
  tokenIconText: {
    fontSize: ShadcnTypography.fontSize.lg,
  },
  tokenName: {
    fontSize: ShadcnTypography.fontSize.base,
    fontWeight: ShadcnTypography.fontWeight.semibold,
    color: ShadcnColors.foreground.primary,
  },
  chainName: {
    fontSize: ShadcnTypography.fontSize.xs,
    color: ShadcnColors.foreground.secondary,
  },
  typeBadge: {
    paddingHorizontal: ShadcnSpacing.sm,
    paddingVertical: ShadcnSpacing.xs / 2,
    borderRadius: ShadcnBorderRadius.sm,
  },
  typeBadgeText: {
    fontSize: ShadcnTypography.fontSize.xs,
    fontWeight: ShadcnTypography.fontWeight.semibold,
    color: ShadcnColors.foreground.primary,
  },
  positionDetails: {
    gap: ShadcnSpacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: ShadcnTypography.fontSize.sm,
    color: ShadcnColors.foreground.secondary,
  },
  detailValue: {
    fontSize: ShadcnTypography.fontSize.sm,
    fontWeight: ShadcnTypography.fontWeight.medium,
    color: ShadcnColors.foreground.primary,
  },
  positionFooter: {
    flexDirection: 'row',
    gap: ShadcnSpacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  transactionCard: {
    marginBottom: ShadcnSpacing.sm,
  },
  transactionCardContent: {
    padding: ShadcnSpacing.md,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: ShadcnBorderRadius.lg,
    backgroundColor: ShadcnColors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ShadcnSpacing.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: ShadcnTypography.fontSize.base,
    fontWeight: ShadcnTypography.fontWeight.medium,
    color: ShadcnColors.foreground.primary,
  },
  transactionTimestamp: {
    fontSize: ShadcnTypography.fontSize.xs,
    color: ShadcnColors.foreground.secondary,
    marginTop: ShadcnSpacing.xs / 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: ShadcnTypography.fontSize.base,
    fontWeight: ShadcnTypography.fontWeight.semibold,
    color: ShadcnColors.foreground.primary,
    marginBottom: ShadcnSpacing.xs / 2,
  },
  statusBadge: {
    paddingHorizontal: ShadcnSpacing.xs,
    paddingVertical: ShadcnSpacing.xs / 2,
    borderRadius: ShadcnBorderRadius.sm,
  },
  statusText: {
    fontSize: ShadcnTypography.fontSize.xs,
    fontWeight: ShadcnTypography.fontWeight.semibold,
    color: ShadcnColors.foreground.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ShadcnSpacing.xl,
  },
  emptyTitle: {
    fontSize: ShadcnTypography.fontSize.xl,
    fontWeight: ShadcnTypography.fontWeight.bold,
    color: ShadcnColors.foreground.primary,
    marginTop: ShadcnSpacing.lg,
    marginBottom: ShadcnSpacing.sm,
  },
  emptyDescription: {
    fontSize: ShadcnTypography.fontSize.base,
    color: ShadcnColors.foreground.secondary,
    textAlign: 'center',
    lineHeight: ShadcnTypography.lineHeight.relaxed * ShadcnTypography.fontSize.base,
    marginBottom: ShadcnSpacing.xl,
  },
  connectButton: {
    minWidth: 200,
  },
});

export default PortfolioScreenShadcn;
