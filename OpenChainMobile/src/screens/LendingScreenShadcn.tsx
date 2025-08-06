import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

// UI Components
import Button from '../../components/ui/Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../components/ui/Card';

// Theme and Config
import { theme } from '../../theme/shadcn-inspired';
import { getTokens, getTokenPrices, PriceData, Token } from '../../services/BackendConfig';

// API
import { createDepositTx } from '../../services/api';

const LendingScreenShadcn: React.FC = () => {
  const { connected, publicKey, signTransaction } = useWallet();
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<PriceData>({});
  const [tokens, setTokens] = useState<Token[]>([]);

  const fetchTokenData = useCallback(async () => {
    try {
      const fetchedTokens = await getTokens();
      setTokens(fetchedTokens);
      const fetchedPrices = await getTokenPrices(fetchedTokens.map(t => t.coingeckoId));
      setPrices(fetchedPrices);
    } catch (error) {
      console.error('Failed to fetch token data:', error);
      Alert.alert('Error', 'Failed to load token data. Please try again later.');
    }
  }, []);

  useEffect(() => {
    fetchTokenData();
  }, [fetchTokenData]);

  const handleLend = async () => {
    if (!connected || !publicKey || !signTransaction) {
      Alert.alert('Wallet Not Connected', 'Please connect your wallet to continue.');
      return;
    }

    if (!selectedToken || !amount) {
      Alert.alert('Invalid Input', 'Please select a token and enter an amount.');
      return;
    }

    setLoading(true);
    try {
      const amountInSmallestUnit = parseFloat(amount) * (10 ** selectedToken.decimals);

      const base64Tx = await createDepositTx(publicKey.toBase58(), selectedToken.mint, amountInSmallestUnit);
      const tx = Transaction.from(Buffer.from(base64Tx, 'base64'));

      const connection = new Connection(process.env.EXPO_PUBLIC_SOLANA_RPC_URL!, 'confirmed');
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;

      const signedTx = await signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      Alert.alert('Success', `Successfully lent ${amount} ${selectedToken.symbol}.`);
      setAmount('');
      setSelectedToken(null);
    } catch (error: any) {
      console.error('Lending failed:', error);
      Alert.alert('Lending Failed', error.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const renderTokenCard = ({ item }: { item: Token }) => {
    const isSelected = selectedToken?.mint === item.mint;
    const price = prices[item.coingeckoId]?.usd?.toFixed(2) || 'N/A';

    const cardStyle = StyleSheet.flatten([
      styles.tokenCard,
      isSelected && styles.selectedTokenCard,
    ]);

    return (
      <TouchableOpacity onPress={() => setSelectedToken(item)} style={cardStyle}>
        <View style={styles.tokenInfoContainer}>
          <Image source={{ uri: item.logo }} style={styles.tokenLogo} />
          <View>
            <Text style={styles.tokenSymbol}>{item.symbol}</Text>
            <Text style={styles.tokenName}>{item.name}</Text>
          </View>
        </View>
        <View style={styles.tokenDetailsContainer}>
          <Text style={styles.tokenPrice}>${price}</Text>
          <Text style={styles.tokenApy}>{item.apy}% APY</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Card style={styles.mainCard}>
        <CardHeader>
          <CardTitle>Lend Your Assets</CardTitle>
          <CardDescription>Select a token and enter an amount to start earning interest.</CardDescription>
        </CardHeader>
        <CardContent>
          <Text style={styles.label}>Select a Token</Text>
          <FlatList
            data={tokens}
            renderItem={renderTokenCard}
            keyExtractor={(item) => item.mint}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tokenList}
          />

          {selectedToken && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Amount to Lend</Text>
              <View style={styles.amountInputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={`0.00 ${selectedToken.symbol}`}
                  placeholderTextColor={theme.colors.foreground.tertiary}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
                <Image source={{ uri: selectedToken.logo }} style={styles.inputTokenLogo} />
              </View>
            </View>
          )}
        </CardContent>
        <CardFooter>
          <Button
            title={connected ? 'Lend Now' : 'Connect Wallet'}
            onPress={connected ? handleLend : () => Alert.alert('Connect Wallet', 'Please connect your wallet from the Home screen.')}
            loading={loading}
            disabled={!connected || loading || !selectedToken || !amount}
            style={styles.lendButton}
          />
        </CardFooter>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.md,
  },
  mainCard: {
    flex: 1,
  },
  label: {
    ...theme.typography.small,
    color: theme.colors.foreground.secondary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  tokenList: {
    paddingVertical: theme.spacing.sm,
  },
  tokenCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
    width: 180,
    justifyContent: 'space-between',
  },
  selectedTokenCard: {
    borderColor: theme.colors.primary.DEFAULT,
    borderWidth: 2,
  },
  tokenInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  tokenLogo: {
    width: 40,
    height: 40,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  tokenSymbol: {
    ...theme.typography.h4,
    color: theme.colors.foreground.primary,
  },
  tokenName: {
    ...theme.typography.small,
    color: theme.colors.foreground.secondary,
  },
  tokenDetailsContainer: {
    alignItems: 'flex-start',
  },
  tokenPrice: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.foreground.primary,
  },
  tokenApy: {
    ...theme.typography.small,
    color: theme.colors.success.DEFAULT,
    marginTop: theme.spacing.xs,
  },
  inputContainer: {
    marginTop: theme.spacing.lg,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.foreground.primary,
    padding: theme.spacing.md,
    fontSize: 18,
  },
  inputTokenLogo: {
    width: 24,
    height: 24,
    marginRight: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  lendButton: {
    flex: 1,
  },
});

export default LendingScreenShadcn;
