import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, ImageBackground, ActivityIndicator, Alert } from 'react-native';
import { useWallet } from '../components/SolanaWalletProvider';
import { Colors, Typography, Spacing } from '../theme/colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SharedStyles from '../theme/styles';
import { priceService, PriceData } from '../services/PriceService';
import { contractService, UserAccountData, LendingPosition } from '../services/ContractService';
import { getSupportedNetworks } from '../services/BackendConfig';

const HomeScreen = () => {
  const { publicKey, connected, connecting, connect, disconnect } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [prices, setPrices] = useState<PriceData>({});
  const [userAccountData, setUserAccountData] = useState<UserAccountData | null>(null);
  const [userPositions, setUserPositions] = useState<LendingPosition[]>([]);
  const [marketData, setMarketData] = useState({
    totalValueLocked: '$0',
    totalBorrowed: '$0',
    availableToLend: '$0',
    yourDeposits: '$0',
    yourBorrows: '$0',
  });

  useEffect(() => {
    const now = Date.now();
    setPrices({
      SOL: { price: 95.00, change24h: 2.5, lastUpdated: now, source: 'cache' as const },
      USDC: { price: 1.00, change24h: 0.1, lastUpdated: now, source: 'cache' as const },
      ETH: { price: 2400.00, change24h: 1.8, lastUpdated: now, source: 'cache' as const },
      MATIC: { price: 0.85, change24h: -0.5, lastUpdated: now, source: 'cache' as const },
      BONK: { price: 0.000025, change24h: 15.2, lastUpdated: now, source: 'cache' as const },
    });
  }, []);

  useEffect(() => {
    if (!connected && !demoMode) {
      setMarketData(prev => ({
        ...prev,
        yourDeposits: '$0',
        yourBorrows: '$0',
      }));
      return;
    }

    setMarketData(prev => ({
      ...prev,
      yourDeposits: demoMode ? '$1,250' : '$0',
      yourBorrows: demoMode ? '$800' : '$0',
    }));
    setLoading(false);
  }, [connected, publicKey, demoMode]);

  useEffect(() => {
    setMarketData(prev => ({
      ...prev,
      totalValueLocked: '$2.4M',
      totalBorrowed: '$1.8M',
      availableToLend: '$600K',
    }));
  }, []);

  const handleWalletAction = async () => {
    if (connected || demoMode) {
      if (demoMode) {
        setDemoMode(false);
      } else {
        disconnect();
      }
    } else {
      try {
        await connect();
      } catch (error) {
        Alert.alert(
          'Wallet Connection',
          'No Solana wallet found. Would you like to try Demo Mode?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Demo Mode', 
              onPress: () => setDemoMode(true)
            }
          ]
        );
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logoText}>Open<Text style={styles.logoTextAccent}>Chain</Text></Text>
            <Text style={styles.tagline}>Cross-chain DeFi</Text>
          </View>
          <TouchableOpacity
            style={[styles.walletButton, connected || demoMode ? styles.connectedButton : {}]}
            onPress={handleWalletAction}
            disabled={connecting}
          >
            {connecting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : connected || demoMode ? (
              <>
                <View style={styles.walletIndicator} />
                <Text style={styles.walletButtonText}>
                  {demoMode
                    ? 'Demo Mode'
                    : `${publicKey?.toBase58().slice(0, 4)}...${publicKey?.toBase58().slice(-4)}`}
                </Text>
                <Ionicons name="exit-outline" size={16} color="#FFFFFF" style={styles.walletIcon} />
              </>
            ) : (
              <>
                <Text style={styles.walletButtonText}>Connect</Text>
                <Ionicons name="wallet-outline" size={16} color="#FFFFFF" style={styles.walletIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.welcomeBanner}>
          <ImageBackground 
            source={require('../../assets/background-pattern.png')} 
            style={styles.welcomeBannerBg}
            imageStyle={{opacity: 0.2}}
          >
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>
                Solana DeFi, Reimagined
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Lend, borrow, and earn across multiple blockchains
              </Text>
            </View>
          </ImageBackground>
        </View>
        
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Market Overview</Text>
            <View style={styles.statsIndicator}>
              <View style={styles.indicatorDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          
          <View style={styles.statsWrapper}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Value Locked</Text>
                <Text style={styles.statValue}>{marketData.totalValueLocked}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Borrowed</Text>
                <Text style={styles.statValue}>{marketData.totalBorrowed}</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Available to Lend</Text>
                <Text style={styles.statValue}>{marketData.availableToLend}</Text>
              </View>
              {(connected || demoMode) && (
                <View style={[styles.statCard, styles.highlightCard]}>
                  <Text style={styles.statLabel}>Your Deposits</Text>
                  <Text style={styles.statValue}>{marketData.yourDeposits}</Text>
                </View>
              )}
            </View>
            {(connected || demoMode) && (
              <View style={styles.statsRow}>
                <View style={[styles.statCard, styles.highlightCard]}>
                  <Text style={styles.statLabel}>Your Borrows</Text>
                  <Text style={styles.statValue}>{marketData.yourBorrows}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>SOL Balance</Text>
                  <Text style={styles.statValue}>{balance.toFixed(2)} SOL</Text>
                </View>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.iconCircle, styles.lendIcon]}>
                <Ionicons name="trending-up" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.actionTitle}>Lend</Text>
              <Text style={styles.actionDescription}>Supply assets and earn interest</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.text.muted} style={styles.actionArrow} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.iconCircle, styles.borrowIcon]}>
                <Ionicons name="cash" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.actionTitle}>Borrow</Text>
              <Text style={styles.actionDescription}>Get liquidity without selling</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.text.muted} style={styles.actionArrow} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.iconCircle, styles.portfolioIcon]}>
                <Ionicons name="wallet" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.actionTitle}>Portfolio</Text>
              <Text style={styles.actionDescription}>View your positions</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.text.muted} style={styles.actionArrow} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.iconCircle, styles.bonkIcon]}>
                <Ionicons name="rocket" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.actionTitle}>BONK</Text>
              <Text style={styles.actionDescription}>Stake & earn rewards</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.text.muted} style={styles.actionArrow} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.networksContainer}>
          <Text style={styles.sectionTitle}>Supported Networks</Text>
          <View style={styles.networksGrid}>
            <View style={styles.networkCard}>
              <View style={[styles.networkIcon, { backgroundColor: Colors.network.solana }]}>
                <Ionicons name="logo-web-component" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.networkName}>Solana</Text>
            </View>
            
            <View style={styles.networkCard}>
              <View style={[styles.networkIcon, { backgroundColor: Colors.network.ethereum }]}>
                <MaterialCommunityIcons name="ethereum" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.networkName}>Ethereum</Text>
            </View>
            
            <View style={styles.networkCard}>
              <View style={[styles.networkIcon, { backgroundColor: Colors.network.polygon }]}>
                <Text style={styles.networkIconText}>P</Text>
              </View>
              <Text style={styles.networkName}>Polygon</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  logoText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: "700",
    color: Colors.text.primary,
  },
  logoTextAccent: {
    color: Colors.button.primary,
  },
  tagline: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.button.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  connectedButton: {
    backgroundColor: Colors.button.secondary,
  },
  walletIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  walletButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: "500",
  },
  walletIcon: {
    marginLeft: 6,
  },
  welcomeBanner: {
    margin: Spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
  },
  welcomeBannerBg: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
  },
  welcomeContent: {
    padding: Spacing.xl,
  },
  welcomeTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.lg,
  },
  sectionContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  statsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.status.success,
    marginRight: 4,
  },
  liveText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.status.success,
    fontWeight: "600",
  },
  statsWrapper: {
    gap: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: Spacing.md,
  },
  highlightCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.button.primary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  actionsContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  actionsGrid: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  actionCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  lendIcon: {
    backgroundColor: Colors.status.success,
  },
  borrowIcon: {
    backgroundColor: Colors.status.info,
  },
  portfolioIcon: {
    backgroundColor: Colors.status.warning,
  },
  bonkIcon: {
    backgroundColor: Colors.network.solana,
  },
  actionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    flex: 1,
  },
  actionArrow: {
    position: 'absolute',
    right: Spacing.md,
  },
  networksContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  networksGrid: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  networkCard: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
  },
  networkIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  networkIconText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  networkName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontWeight: "500",
  },
});

export default HomeScreen;
