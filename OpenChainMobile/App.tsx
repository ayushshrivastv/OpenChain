// Import polyfills first
import './src/polyfills';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

// Import screens
import { theme } from './src/theme/shadcn-inspired';
import HomeScreenShadcn from './src/screens/HomeScreenShadcn';
import LendingScreenShadcn from './src/screens/LendingScreenShadcn';
import BorrowingScreen from './src/screens/BorrowingScreen';
import PortfolioScreenShadcn from './src/screens/PortfolioScreenShadcn';
import BonkRewardsScreen from './src/screens/BonkRewardsScreen';

// Import Solana Mobile Wallet Provider
import { SolanaWalletProvider } from './src/components/SolanaWalletProvider';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SolanaWalletProvider>
      <NavigationContainer>
        <View style={styles.container}>
          <StatusBar style="light" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof Ionicons.glyphMap;

                if (route.name === 'Home') {
                  iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Lending') {
                  iconName = focused ? 'trending-up' : 'trending-up-outline';
                } else if (route.name === 'Borrowing') {
                  iconName = focused ? 'trending-down' : 'trending-down-outline';
                } else if (route.name === 'Portfolio') {
                  iconName = focused ? 'wallet' : 'wallet-outline';
                } else if (route.name === 'BONK') {
                  iconName = focused ? 'rocket' : 'rocket-outline';
                } else {
                  iconName = 'help-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: theme.colors.foreground.primary,
              tabBarInactiveTintColor: theme.colors.foreground.muted,
              tabBarStyle: {
                backgroundColor: theme.colors.background.card,
                borderTopColor: theme.colors.border.primary,
                borderTopWidth: 1,
                paddingBottom: 8,
                paddingTop: 8,
                height: 65,
              },
              headerStyle: {
                backgroundColor: theme.colors.background.card,
                borderBottomColor: theme.colors.border.primary,
                borderBottomWidth: 1,
              },
              headerTintColor: theme.colors.foreground.primary,
              headerTitleStyle: {
                fontWeight: '600',
                fontSize: 18,
              },
            })}
          >
            <Tab.Screen
              name="Home"
              component={HomeScreenShadcn}
              options={{ title: 'Home' }}
            />
            <Tab.Screen
              name="Lending"
              component={LendingScreenShadcn}
              options={{ title: 'Lend' }}
            />
            <Tab.Screen 
              name="Borrowing" 
              component={BorrowingScreen} 
              options={{ title: 'Borrow' }}
            />
            <Tab.Screen 
              name="Portfolio" 
              component={PortfolioScreenShadcn} 
              options={{ title: 'Portfolio' }}
            />
            <Tab.Screen 
              name="BONK" 
              component={BonkRewardsScreen} 
              options={{ title: 'BONK Rewards' }}
            />
          </Tab.Navigator>
        </View>
      </NavigationContainer>
    </SolanaWalletProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Pure black Shadcn/ui inspired background
  },
});
