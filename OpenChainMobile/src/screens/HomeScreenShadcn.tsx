import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWallet } from '../components/SolanaWalletProvider';
import { ShadcnColors, ShadcnTypography, ShadcnSpacing, ShadcnBorderRadius, ShadcnShadows } from '../theme/shadcn-inspired';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { priceService, PriceData } from '../services/PriceService';

const HomeScreenShadcn = () => {
  const { publicKey, connected, connecting, connect, disconnect } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [prices, setPrices] = useState<PriceData>({});
  const [marketData, setMarketData] = useState({
    totalValueLocked: '$2.4M',
    totalBorrowed: '$1.8M',
    availableToLend: '$600K',
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

  const StatCard = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
    <Card style={styles.statCard}>
      <CardContent style={styles.statCardContent}>
        <View style={styles.statHeader}>
          <Ionicons name={icon as any} size={20} color={ShadcnColors.foreground.secondary} />
          <Text style={styles.statLabel}>{label}</Text>
        </View>
        <Text style={styles.statValue}>{value}</Text>
      </CardContent>
    </Card>
  );

  const ActionCard = ({ title, description, icon, onPress, color }: {
    title: string;
    description: string;
    icon: string;
    onPress: () => void;
    color: string;
  }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.actionCard}>
        <CardContent style={styles.actionCardContent}>
          <View style={[styles.actionIcon, { backgroundColor: color }]}>
            <Ionicons name={icon as any} size={24} color={ShadcnColors.foreground.primary} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionDescription}>{description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={ShadcnColors.foreground.secondary} />
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={ShadcnColors.background.primary} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>
              Open<Text style={styles.logoAccent}>Chain</Text>
            </Text>
            <Text style={styles.tagline}>Cross-chain DeFi Protocol</Text>
          </View>
          
          <Button
            title={connecting ? '' : connected || demoMode ? 
              (demoMode ? 'Demo Mode' : `${publicKey?.toBase58().slice(0, 4)}...${publicKey?.toBase58().slice(-4)}`) 
              : 'Connect'}
            onPress={handleWalletAction}
            variant={connected || demoMode ? 'secondary' : 'primary'}
            loading={connecting}
            style={styles.walletButton}
          />
        </View>

        {/* Welcome Banner */}
        <Card style={styles.welcomeCard}>
          <LinearGradient
            colors={['#1a1a1a', '#0a0a0a']}
            style={styles.welcomeGradient}
          >
            <CardContent>
              <Text style={styles.welcomeTitle}>Solana DeFi, Reimagined</Text>
              <Text style={styles.welcomeSubtitle}>
                Lend, borrow, and earn across multiple blockchains with institutional-grade security
              </Text>
            </CardContent>
          </LinearGradient>
        </Card>

        {/* Market Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Market Overview</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <StatCard label="Total Value Locked" value={marketData.totalValueLocked} icon="trending-up" />
            <StatCard label="Total Borrowed" value={marketData.totalBorrowed} icon="cash" />
            <StatCard label="Available to Lend" value={marketData.availableToLend} icon="wallet" />
            {(connected || demoMode) && (
              <>
                <StatCard label="Your Deposits" value={marketData.yourDeposits} icon="arrow-up-circle" />
                <StatCard label="Your Borrows" value={marketData.yourBorrows} icon="arrow-down-circle" />
                <StatCard label="SOL Balance" value={`${balance.toFixed(2)} SOL`} icon="logo-web-component" />
              </>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <ActionCard
              title="Lend Assets"
              description="Supply assets and earn competitive interest rates"
              icon="trending-up"
              color={ShadcnColors.status.success}
              onPress={() => {}}
            />
            <ActionCard
              title="Borrow Assets"
              description="Get liquidity without selling your assets"
              icon="cash"
              color={ShadcnColors.status.info}
              onPress={() => {}}
            />
            <ActionCard
              title="Portfolio"
              description="View and manage your positions"
              icon="pie-chart"
              color={ShadcnColors.status.warning}
              onPress={() => {}}
            />
            <ActionCard
              title="BONK Rewards"
              description="Stake BONK tokens and earn rewards"
              icon="rocket"
              color={ShadcnColors.network.solana}
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Supported Networks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supported Networks</Text>
          <View style={styles.networksGrid}>
            <Card style={styles.networkCard}>
              <CardContent style={styles.networkCardContent}>
                <View style={[styles.networkIcon, { backgroundColor: ShadcnColors.network.solana }]}>
                  <Ionicons name="logo-web-component" size={24} color={ShadcnColors.foreground.primary} />
                </View>
                <Text style={styles.networkName}>Solana</Text>
              </CardContent>
            </Card>
            
            <Card style={styles.networkCard}>
              <CardContent style={styles.networkCardContent}>
                <View style={[styles.networkIcon, { backgroundColor: ShadcnColors.network.ethereum }]}>
                  <MaterialCommunityIcons name="ethereum" size={24} color={ShadcnColors.foreground.primary} />
                </View>
                <Text style={styles.networkName}>Ethereum</Text>
              </CardContent>
            </Card>
            
            <Card style={styles.networkCard}>
              <CardContent style={styles.networkCardContent}>
                <View style={[styles.networkIcon, { backgroundColor: ShadcnColors.network.polygon }]}>
                  <Text style={styles.networkIconText}>P</Text>
                </View>
                <Text style={styles.networkName}>Polygon</Text>
              </CardContent>
            </Card>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ShadcnSpacing.lg,
    paddingTop: ShadcnSpacing['2xl'],
    paddingBottom: ShadcnSpacing.lg,
  },
  logoText: {
    fontSize: ShadcnTypography.fontSize['3xl'],
    fontWeight: ShadcnTypography.fontWeight.extrabold,
    color: ShadcnColors.foreground.primary,
  },
  logoAccent: {
    color: ShadcnColors.status.info,
  },
  tagline: {
    fontSize: ShadcnTypography.fontSize.sm,
    color: ShadcnColors.foreground.secondary,
    marginTop: ShadcnSpacing.xs,
  },
  walletButton: {
    minWidth: 120,
  },
  welcomeCard: {
    marginHorizontal: ShadcnSpacing.lg,
    marginBottom: ShadcnSpacing.lg,
    overflow: 'hidden',
  },
  welcomeGradient: {
    borderRadius: ShadcnBorderRadius.lg,
  },
  welcomeTitle: {
    fontSize: ShadcnTypography.fontSize['2xl'],
    fontWeight: ShadcnTypography.fontWeight.bold,
    color: ShadcnColors.foreground.primary,
    marginBottom: ShadcnSpacing.sm,
  },
  welcomeSubtitle: {
    fontSize: ShadcnTypography.fontSize.base,
    color: ShadcnColors.foreground.secondary,
    lineHeight: ShadcnTypography.lineHeight.relaxed * ShadcnTypography.fontSize.base,
  },
  section: {
    paddingHorizontal: ShadcnSpacing.lg,
    marginBottom: ShadcnSpacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ShadcnSpacing.md,
  },
  sectionTitle: {
    fontSize: ShadcnTypography.fontSize.xl,
    fontWeight: ShadcnTypography.fontWeight.bold,
    color: ShadcnColors.foreground.primary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ShadcnColors.status.success,
    marginRight: ShadcnSpacing.xs,
  },
  liveText: {
    fontSize: ShadcnTypography.fontSize.xs,
    fontWeight: ShadcnTypography.fontWeight.semibold,
    color: ShadcnColors.status.success,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ShadcnSpacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
  },
  statCardContent: {
    padding: ShadcnSpacing.md,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ShadcnSpacing.xs,
  },
  statLabel: {
    fontSize: ShadcnTypography.fontSize.xs,
    color: ShadcnColors.foreground.secondary,
    marginLeft: ShadcnSpacing.xs,
  },
  statValue: {
    fontSize: ShadcnTypography.fontSize.lg,
    fontWeight: ShadcnTypography.fontWeight.bold,
    color: ShadcnColors.foreground.primary,
  },
  actionsContainer: {
    gap: ShadcnSpacing.sm,
  },
  actionCard: {
    marginBottom: ShadcnSpacing.sm,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ShadcnSpacing.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: ShadcnBorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ShadcnSpacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: ShadcnTypography.fontSize.base,
    fontWeight: ShadcnTypography.fontWeight.semibold,
    color: ShadcnColors.foreground.primary,
    marginBottom: ShadcnSpacing.xs / 2,
  },
  actionDescription: {
    fontSize: ShadcnTypography.fontSize.sm,
    color: ShadcnColors.foreground.secondary,
  },
  networksGrid: {
    flexDirection: 'row',
    gap: ShadcnSpacing.sm,
  },
  networkCard: {
    flex: 1,
  },
  networkCardContent: {
    alignItems: 'center',
    padding: ShadcnSpacing.md,
  },
  networkIcon: {
    width: 48,
    height: 48,
    borderRadius: ShadcnBorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ShadcnSpacing.sm,
  },
  networkIconText: {
    fontSize: ShadcnTypography.fontSize.lg,
    fontWeight: ShadcnTypography.fontWeight.bold,
    color: ShadcnColors.foreground.primary,
  },
  networkName: {
    fontSize: ShadcnTypography.fontSize.sm,
    fontWeight: ShadcnTypography.fontWeight.medium,
    color: ShadcnColors.foreground.primary,
  },
});

export default HomeScreenShadcn;
