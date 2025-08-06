import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Image, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '../theme/colors';
import { SharedStyles } from '../theme/styles';
import { useWallet } from '../components/SolanaWalletProvider';
import BonkRewards from '../components/BonkRewards';
import { getTokenConfig } from '../services/BackendConfig';
import { priceService } from '../services/PriceService';

const BonkRewardsScreen: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [bonkPrice, setBonkPrice] = useState(0);
  const [bonkBalance, setBonkBalance] = useState('250000');
  const [bonkStaked, setBonkStaked] = useState('500000');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('staking'); // 'staking' or 'history'

  // Stats for rewards program
  const stats = {
    totalStaked: '1.2B',
    currentAPY: '24.2%',
    participants: '15,842',
    rewardsDistributed: '82.5M'
  };

  useEffect(() => {
    fetchBonkPrice();
    const interval = setInterval(fetchBonkPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBonkPrice = async () => {
    setIsLoading(true);
    try {
      const bonkConfig = getTokenConfig('BONK');
      if (bonkConfig) {
        const priceData = await priceService.getTokenPrice('BONK');
        if (priceData) {
          setBonkPrice(priceData.price);
        }
      }
    } catch (error) {
      console.error('Error fetching BONK price:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBonkPrice();
    setRefreshing(false);
  };

  const handleStakeSuccess = (amount: string) => {
    // Update balances after successful staking
    const amountNum = parseFloat(amount);
    const formattedAmount = amountNum.toLocaleString();

    // Subtract from available balance
    const newBalance = Math.max(parseFloat(bonkBalance.replace(/,/g, '')) - amountNum, 0);
    setBonkBalance(newBalance.toLocaleString());

    // Add to staked balance
    const newStaked = parseFloat(bonkStaked.replace(/,/g, '')) + amountNum;
    setBonkStaked(newStaked.toLocaleString());
  };

  const formatNumber = (value: string) => {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatUsdValue = (value: number) => {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatTimeAgo = (date: Date) => {
    const timeAgo = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (timeAgo < 60) {
      return `${timeAgo} seconds ago`;
    } else if (timeAgo < 3600) {
      return `${Math.floor(timeAgo / 60)} minutes ago`;
    } else if (timeAgo < 86400) {
      return `${Math.floor(timeAgo / 3600)} hours ago`;
    } else {
      return `${Math.floor(timeAgo / 86400)} days ago`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BONK Rewards</Text>
        <View style={styles.headerRight}>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.button.primary} />
          ) : (
            <View style={styles.livePriceContainer}>
              <Text style={styles.updatedText}>Updated {formatTimeAgo(lastUpdated)}</Text>
              <View style={styles.liveIndicator} />
            </View>
          )}
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* BONK Token Banner Card */}
        <View style={styles.bannerCard}>
          <View style={styles.tokenInfoHeader}>
            <View style={styles.tokenLogoContainer}>
              <Image
                source={require('../assets/bonk-logo.png')}
                style={styles.tokenLogo}
              />
            </View>
            <View style={styles.tokenDetails}>
              <Text style={styles.tokenName}>BONK Token</Text>
              <Text style={styles.tokenPrice}>
                ${bonkPrice.toFixed(8)} USD
              </Text>
            </View>
          </View>
        </View>

        {/* BONK Balance Cards */}
        <View style={styles.balanceCardsContainer}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>{formatNumber(bonkBalance)} BONK</Text>
            <Text style={styles.balanceUsd}>
              ${formatUsdValue(Number(bonkBalance) * bonkPrice)}
            </Text>
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Staked Balance</Text>
            <Text style={styles.balanceValue}>{formatNumber(bonkStaked)} BONK</Text>
            <Text style={styles.balanceUsd}>
              ${formatUsdValue(Number(bonkStaked) * bonkPrice)}
            </Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'staking' && styles.activeTabButton]}
            onPress={() => setActiveTab('staking')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'staking' && styles.activeTabText]}>Staking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'history' && styles.activeTabButton]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'history' && styles.activeTabText]}>History</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'staking' ? (
          /* Program Stats */
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Program Stats</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalStaked}</Text>
                <Text style={styles.statLabel}>Total BONK Staked</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.currentAPY}</Text>
                <Text style={styles.statLabel}>Current APY</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.participants}</Text>
                <Text style={styles.statLabel}>Participants</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.rewardsDistributed}</Text>
                <Text style={styles.statLabel}>BONK Distributed</Text>
              </View>
            </View>
          </View>
        ) : (
          <View>
            <Text>History</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  livePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updatedText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginRight: Spacing.sm,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  
  // Banner card styles
  bannerCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tokenInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  tokenLogo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  tokenDetails: {
    flex: 1,
  },
  tokenName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  tokenPrice: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  livePriceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.primary,
    marginVertical: Spacing.sm,
  },
  
  // Balance cards styles
  balanceCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: Spacing.md,
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  balanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  balanceUsd: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  
  // Tab navigation styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: Colors.button.primary,
  },
  tabButtonText: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Stats section styles
  section: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  statsContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: Colors.background.overlay,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.button.primary,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  
  // Info section styles
  infoSection: {
    margin: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.background.overlay,
    borderRadius: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
});

export default BonkRewardsScreen;
