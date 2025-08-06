import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../components/SolanaWalletProvider';
import { Colors, Spacing } from '../theme/colors';
import { SharedStyles } from '../theme/styles';

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

const PortfolioScreen: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'positions' | 'transactions'>('positions');

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
      icon: '◎',
      chain: 'Solana',
    },
    {
      id: '2',
      type: 'lending',
      token: 'USDC',
      amount: '1,500.00',
      value: '$1,500.00',
      apy: '4.8%',
      icon: '💰',
      chain: 'Ethereum',
    },
    {
      id: '3',
      type: 'borrowing',
      token: 'USDC',
      amount: '800.00',
      value: '$800.00',
      apy: '6.1%',
      icon: '💰',
      chain: 'Polygon',
    },
  ]);

  // Mock transactions
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'lend',
      token: 'SOL',
      amount: '5.25',
      timestamp: '2025-01-04 14:30',
      status: 'completed',
      txHash: '5Kx8...3mNp',
    },
    {
      id: '2',
      type: 'repay',
      token: 'USDC',
      amount: '200.00',
      timestamp: '2025-01-04 09:15',
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

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
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
      case 'completed': return Colors.status.success;
      case 'pending': return Colors.status.warning;
      case 'failed': return Colors.status.error;
      default: return Colors.text.muted;
    }
  };

  const getTypeIcon = (type: string) => {
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
      style={SharedStyles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={SharedStyles.header}>
        <Text style={SharedStyles.headerTitle}>Portfolio</Text>
        <Text style={[SharedStyles.bodyTextOnDark, { marginTop: Spacing.xs }]}>
          Track your lending and borrowing positions
        </Text>
      </View>

      {/* Connection Status */}
      {!connected ? (
        <View style={[SharedStyles.card, { flexDirection: 'row', alignItems: 'center', margin: Spacing.lg, backgroundColor: Colors.background.accent }]}>
          <Ionicons name="warning" size={24} color={Colors.status.warning} />
          <Text style={[SharedStyles.bodyText, { color: Colors.text.onCard, marginLeft: Spacing.md }]}>
            Connect your wallet to view your portfolio
          </Text>
        </View>
      ) : (
        <>
          {/* Portfolio Summary */}
          <View style={{ marginBottom: Spacing.lg }}>
            <Text style={SharedStyles.titleOnDark}>Portfolio Summary</Text>
            
            <View style={{ gap: Spacing.md }}>
              <View style={[SharedStyles.card, { minHeight: 80 }]}>
                <View style={SharedStyles.metricContainer}>
                  <Text style={SharedStyles.metricValue}>{portfolioData.totalDeposited}</Text>
                  <Text style={SharedStyles.metricLabel}>Total Deposited</Text>
                </View>
              </View>
              
              <View style={[SharedStyles.card, { minHeight: 80 }]}>
                <View style={SharedStyles.metricContainer}>
                  <Text style={SharedStyles.metricValue}>{portfolioData.totalBorrowed}</Text>
                  <Text style={SharedStyles.metricLabel}>Total Borrowed</Text>
                </View>
              </View>
              
              <View style={[SharedStyles.card, { minHeight: 80 }]}>
                <View style={SharedStyles.metricContainer}>
                  <Text style={[SharedStyles.metricValue, { color: Colors.status.success }]}>
                    {portfolioData.netWorth}
                  </Text>
                  <Text style={SharedStyles.metricLabel}>Net Worth</Text>
                </View>
              </View>
              
              <View style={[SharedStyles.card, { minHeight: 80 }]}>
                <View style={SharedStyles.metricContainer}>
                  <Text style={[
                    SharedStyles.metricValue, 
                    { color: parseFloat(portfolioData.healthFactor) > 1.5 ? Colors.status.success : Colors.status.error }
                  ]}>
                    {portfolioData.healthFactor}
                  </Text>
                  <Text style={SharedStyles.metricLabel}>Health Factor</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={{ flexDirection: 'row', marginBottom: Spacing.lg, gap: Spacing.md }}>
            <TouchableOpacity
              style={[
                SharedStyles.secondaryButton,
                { flex: 1 },
                activeTab === 'positions' && { backgroundColor: Colors.button.primary }
              ]}
              onPress={() => setActiveTab('positions')}
            >
              <Text style={[
                SharedStyles.secondaryButtonText,
                activeTab === 'positions' && { color: Colors.text.primary }
              ]}>
                Positions
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                SharedStyles.secondaryButton,
                { flex: 1 },
                activeTab === 'transactions' && { backgroundColor: Colors.button.primary }
              ]}
              onPress={() => setActiveTab('transactions')}
            >
              <Text style={[
                SharedStyles.secondaryButtonText,
                activeTab === 'transactions' && { color: Colors.text.primary }
              ]}>
                Transactions
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content based on active tab */}
          {activeTab === 'positions' ? (
            <View style={{ marginBottom: Spacing.lg }}>
              <Text style={SharedStyles.titleOnDark}>Your Positions</Text>
              
              {positions.length === 0 ? (
                <View style={SharedStyles.emptyState}>
                  <Ionicons name="wallet-outline" size={48} color={Colors.text.secondary} />
                  <Text style={SharedStyles.emptyText}>No positions found</Text>
                  <Text style={SharedStyles.emptySubtext}>
                    Start lending or borrowing to see your positions here
                  </Text>
                </View>
              ) : (
                <View style={{ gap: Spacing.md }}>
                  {positions.map((position) => (
                    <View key={position.id} style={SharedStyles.card}>
                      <View style={SharedStyles.rowBetween}>
                        <View style={SharedStyles.row}>
                          <View style={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: 20, 
                            backgroundColor: Colors.button.primary, 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            marginRight: Spacing.md 
                          }}>
                            <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: '600' }}>
                              {position.icon}
                            </Text>
                          </View>
                          <View>
                            <Text style={SharedStyles.cardTitle}>{position.token}</Text>
                            <Text style={SharedStyles.cardSubtitle}>
                              {position.type === 'lending' ? 'Lending' : 'Borrowing'} • {position.chain}
                            </Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={SharedStyles.cardTitle}>{position.amount} {position.token}</Text>
                          <Text style={SharedStyles.cardSubtitle}>{position.value}</Text>
                        </View>
                      </View>
                      
                      <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
                        <View style={SharedStyles.rowBetween}>
                          <Text style={SharedStyles.label}>APY</Text>
                          <Text style={[SharedStyles.value, { 
                            color: position.type === 'lending' ? Colors.status.success : Colors.status.warning 
                          }]}>
                            {position.apy}
                          </Text>
                        </View>
                      </View>
                      
                      <TouchableOpacity
                        style={[SharedStyles.primaryButton, { marginTop: Spacing.md }]}
                        onPress={() => position.type === 'lending' ? handleWithdraw(position) : handleRepay(position)}
                      >
                        <Text style={SharedStyles.primaryButtonText}>
                          {position.type === 'lending' ? 'Withdraw' : 'Repay'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={{ marginBottom: Spacing.lg }}>
              <Text style={SharedStyles.titleOnDark}>Recent Transactions</Text>
              
              {transactions.length === 0 ? (
                <View style={SharedStyles.emptyState}>
                  <Ionicons name="document-outline" size={48} color={Colors.text.secondary} />
                  <Text style={SharedStyles.emptyText}>No transactions found</Text>
                  <Text style={SharedStyles.emptySubtext}>
                    Your transaction history will appear here
                  </Text>
                </View>
              ) : (
                <View style={{ gap: Spacing.md }}>
                  {transactions.map((transaction) => (
                    <View key={transaction.id} style={SharedStyles.card}>
                      <View style={SharedStyles.rowBetween}>
                        <View style={SharedStyles.row}>
                          <View style={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: 20, 
                            backgroundColor: getStatusColor(transaction.status), 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            marginRight: Spacing.md 
                          }}>
                            <Ionicons 
                              name={getTypeIcon(transaction.type) as any} 
                              size={20} 
                              color={Colors.text.primary} 
                            />
                          </View>
                          <View>
                            <Text style={SharedStyles.cardTitle}>
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} {transaction.token}
                            </Text>
                            <Text style={SharedStyles.cardSubtitle}>{transaction.timestamp}</Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={SharedStyles.cardTitle}>
                            {transaction.amount} {transaction.token}
                          </Text>
                          <Text style={[SharedStyles.badge, { backgroundColor: getStatusColor(transaction.status) }]}>
                            {transaction.status}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={{ marginTop: Spacing.md }}>
                        <Text style={SharedStyles.label}>Transaction Hash</Text>
                        <Text style={[SharedStyles.value, { fontFamily: 'monospace' }]}>
                          {transaction.txHash}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

export default PortfolioScreen;
