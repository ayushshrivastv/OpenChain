import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import LendingScreenShadcn from './src/screens/LendingScreenShadcn';
import BorrowingScreen from './src/screens/BorrowingScreen';
import BonkRewardsScreen from './src/screens/BonkRewardsScreen';

// Theme
import { theme } from './src/theme/shadcn-inspired';

// Wallet Provider
import SolanaWalletProvider from './src/components/SolanaWalletProvider';

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <SolanaWalletProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;

                if (route.name === 'Home') {
                  iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Lend') {
                  iconName = focused ? 'cash' : 'cash-outline';
                } else if (route.name === 'Borrow') {
                  iconName = focused ? 'trending-up' : 'trending-up-outline';
                } else if (route.name === 'BONK') {
                  iconName = focused ? 'bonfire' : 'bonfire-outline';
                }

                return <Icon name={iconName as string} size={size} color={color} />;
              },
              tabBarActiveTintColor: theme.colors.primary.DEFAULT,
              tabBarInactiveTintColor: theme.colors.foreground.secondary,
              tabBarStyle: {
                backgroundColor: theme.colors.background.primary,
                borderTopColor: theme.colors.border.primary,
                paddingTop: theme.spacing.xs,
                paddingBottom: theme.spacing.sm,
                height: 60,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '600',
              },
              headerStyle: {
                backgroundColor: theme.colors.background.primary,
                borderBottomColor: theme.colors.border.primary,
                borderBottomWidth: 1,
              },
              headerTitleStyle: {
                color: theme.colors.foreground.primary,
                fontWeight: 'bold',
              },
            })}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Lend" component={LendingScreenShadcn} />
            <Tab.Screen name="Borrow" component={BorrowingScreen} />
            <Tab.Screen name="BONK" component={BonkRewardsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </SolanaWalletProvider>
    </SafeAreaProvider>
  );
};

export default App;
