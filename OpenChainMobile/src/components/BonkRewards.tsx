import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../theme/colors';
import { SharedStyles } from '../theme/styles';
import { priceService } from '../services/PriceService';

interface BonkRewardsProps {
  bonkBalance: string;
  bonkPrice: number;
  onStakeSuccess?: (amount: string) => void;
}

const BonkRewards: React.FC<BonkRewardsProps> = ({ bonkBalance, bonkPrice, onStakeSuccess }) => {
  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<'7' | '30' | '90'>('30');
  const [loading, setLoading] = useState(false);

  // Staking APY rates based on duration
  const apyRates = {
    '7': 18.5,   // 18.5% for 7-day staking
    '30': 24.2,  // 24.2% for 30-day staking
    '90': 32.7,  // 32.7% for 90-day staking
  };

  // Calculate estimated rewards
  const calculateRewards = (): string => {
    if (!stakeAmount || isNaN(parseFloat(stakeAmount))) {
      return '0';
    }
    
    const amount = parseFloat(stakeAmount);
    const apy = apyRates[selectedDuration];
    const days = parseInt(selectedDuration);
    
    // Calculate rewards for the staking period (APY * days / 365)
    const rewardRate = (apy / 100) * (days / 365);
    const rewardAmount = amount * rewardRate;
    
    return rewardAmount.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  // Calculate USD value
  const calculateUsdValue = (amount: string): string => {
    if (!amount || isNaN(parseFloat(amount))) {
      return '$0.00';
    }
    
    const bonkAmount = parseFloat(amount);
    const usdValue = bonkAmount * bonkPrice;
    
    return priceService.formatPrice(usdValue);
  };

  // Handle staking
  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid BONK amount to stake.');
      return;
    }
    
    if (parseFloat(stakeAmount) > parseFloat(bonkBalance.replace(/,/g, ''))) {
      Alert.alert('Insufficient Balance', 'You don\'t have enough BONK tokens.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Simulate staking transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Staking Successful',
        `You've staked ${parseInt(stakeAmount).toLocaleString()} BONK for ${selectedDuration} days!`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              setStakeAmount('');
              if (onStakeSuccess) {
                onStakeSuccess(stakeAmount);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Staking Failed', 'There was an error processing your staking request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="rocket" size={18} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>BONK Rewards Program</Text>
      </View>

      <Text style={styles.description}>
        Stake your BONK tokens to earn rewards. The longer you stake, the higher your returns!
      </Text>
      
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Available Balance:</Text>
        <Text style={styles.balanceValue}>{bonkBalance} BONK</Text>
        <Text style={styles.balanceUsd}>{calculateUsdValue(bonkBalance)}</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Stake Amount:</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={stakeAmount}
            onChangeText={setStakeAmount}
            placeholder="0"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity 
            style={styles.maxButton}
            onPress={() => setStakeAmount(bonkBalance.replace(/,/g, ''))}
          >
            <Text style={styles.maxButtonText}>MAX</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.valueText}>≈ {calculateUsdValue(stakeAmount)}</Text>
      </View>
      
      <View style={styles.durationContainer}>
        <Text style={styles.durationLabel}>Staking Duration:</Text>
        <View style={styles.durationOptions}>
          <TouchableOpacity
            style={[
              styles.durationOption,
              selectedDuration === '7' && styles.selectedDuration
            ]}
            onPress={() => setSelectedDuration('7')}
          >
            <Text style={[
              styles.durationText,
              selectedDuration === '7' && styles.selectedDurationText
            ]}>7 Days</Text>
            <Text style={[
              styles.apyText,
              selectedDuration === '7' && styles.selectedApyText
            ]}>{apyRates['7']}% APY</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.durationOption,
              selectedDuration === '30' && styles.selectedDuration
            ]}
            onPress={() => setSelectedDuration('30')}
          >
            <Text style={[
              styles.durationText,
              selectedDuration === '30' && styles.selectedDurationText
            ]}>30 Days</Text>
            <Text style={[
              styles.apyText,
              selectedDuration === '30' && styles.selectedApyText
            ]}>{apyRates['30']}% APY</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.durationOption,
              selectedDuration === '90' && styles.selectedDuration
            ]}
            onPress={() => setSelectedDuration('90')}
          >
            <Text style={[
              styles.durationText,
              selectedDuration === '90' && styles.selectedDurationText
            ]}>90 Days</Text>
            <Text style={[
              styles.apyText,
              selectedDuration === '90' && styles.selectedApyText
            ]}>{apyRates['90']}% APY</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.rewardsContainer}>
        <Text style={styles.rewardsLabel}>Estimated Rewards:</Text>
        <Text style={styles.rewardsValue}>{calculateRewards()} BONK</Text>
        <Text style={styles.rewardsUsd}>{calculateUsdValue(calculateRewards())}</Text>
      </View>
      
      <TouchableOpacity
        style={styles.stakeButton}
        onPress={handleStake}
        disabled={loading || !stakeAmount || parseFloat(stakeAmount) <= 0}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.stakeButtonText}>Stake BONK</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.text.secondary} />
        <Text style={styles.infoText}>
          Staked BONK tokens will be locked for the selected duration. Early unstaking will incur a 5% penalty fee.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.button.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  balanceContainer: {
    marginBottom: Spacing.md,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs / 2,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  balanceUsd: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    color: Colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  maxButton: {
    backgroundColor: Colors.button.secondary,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: Spacing.xs,
  },
  maxButtonText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  valueText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: Spacing.xs / 2,
  },
  durationContainer: {
    marginBottom: Spacing.md,
  },
  durationLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  durationOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationOption: {
    flex: 1,
    backgroundColor: Colors.background.overlay,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedDuration: {
    backgroundColor: Colors.button.primary,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  selectedDurationText: {
    color: '#FFFFFF',
  },
  apyText: {
    fontSize: 12,
    color: Colors.status.success,
    marginTop: 4,
  },
  selectedApyText: {
    color: '#FFFFFF',
  },
  rewardsContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  rewardsLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs / 2,
  },
  rewardsValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.status.success,
  },
  rewardsUsd: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  stakeButton: {
    backgroundColor: Colors.button.primary,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  stakeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  }
});

export default BonkRewards;
