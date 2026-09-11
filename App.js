import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CaretakerDashboardScreen from './src/screens/CaretakerDashboardScreen';
import InviteCaretakerScreen from './src/screens/InviteCaretakerScreen';
import AddPropertyScreen from './src/screens/AddPropertyScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const Tab = createBottomTabNavigator();

function LandlordTabs({ user, onLogout }) {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard">
        {() => <DashboardScreen user={user} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Upload" component={AddPropertyScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Settings">
        {() => <SettingsScreen user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    setUser(null);
  };

  if (!user) {
    return (
      <>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        <StatusBar style="auto" />
      </>
    );
  }

  if (user.role === 'caretaker') {
    return (
      <>
        <CaretakerDashboardScreen user={user} onLogout={handleLogout} />
        <StatusBar style="auto" />
      </>
    );
  }

  return (
    <NavigationContainer>
      <LandlordTabs user={user} onLogout={handleLogout} />
      <StatusBar style="auto" />
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
