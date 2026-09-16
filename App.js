import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CaretakerDashboardScreen from './src/screens/CaretakerDashboardScreen';
import AddPropertyScreen from './src/screens/AddPropertyScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { ThemeProvider, Colors, useTheme } from './src/context/ThemeContext';
import { userAPI } from './src/services/api';
import { View, ActivityIndicator } from 'react-native';

const Tab = createBottomTabNavigator();

// Simple SVG-free tab icons using Text (clean, no library needed)
const TabIcon = ({ label, focused, colors }) => (
  <React.Fragment>
  </React.Fragment>
);

function LandlordTabs({ user, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.backgroundElement,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        options={{ tabBarLabel: 'Dashboard' }}
      >
        {() => <DashboardScreen user={user} onLogout={onLogout} />}
      </Tab.Screen>

      <Tab.Screen
        name="Upload"
        component={AddPropertyScreen}
        options={{ tabBarLabel: 'Add Property' }}
      />

      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{ tabBarLabel: 'Payments' }}
      />

      <Tab.Screen
        name="Settings"
        options={{ tabBarLabel: 'Settings' }}
      >
        {() => <SettingsScreen user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const { isDark, colors } = useTheme();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const response = await userAPI.getProfile();
          if (response && (response.user || response._id)) {
            setUser(response.user || response);
          } else {
            await SecureStore.deleteItemAsync('token');
          }
        }
      } catch (error) {
        console.log('Session restore failed, showing login:', error.message);
        await SecureStore.deleteItemAsync('token');
      } finally {
        setCheckingSession(false);
      }
    };
    restoreSession();
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    setUser(null);
  };

  if (checkingSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors?.background || '#fff' }}>
        <ActivityIndicator size="large" color={colors?.primary || '#2563eb'} />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </>
    );
  }

  if (user.role === 'caretaker') {
    return (
      <>
        <CaretakerDashboardScreen user={user} onLogout={handleLogout} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </>
    );
  }

  return (
    <NavigationContainer>
      <LandlordTabs user={user} onLogout={handleLogout} />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
