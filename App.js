import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Updates from 'expo-updates';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import PortalSelectorScreen from './src/screens/biashara/PortalSelectorScreen';
import BiasharaPortal from './src/screens/biashara/BiasharaPortal';
import AccommodationPortal from './src/screens/accommodation/AccommodationPortal';
import AgentPortal from './src/screens/agent/AgentPortal';
import DashboardScreen from './src/screens/DashboardScreen';
import CaretakerDashboardScreen from './src/screens/CaretakerDashboardScreen';
import AddPropertyScreen from './src/screens/AddPropertyScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ChatInboxScreen from './src/screens/ChatInboxScreen';
import ChatThreadScreen from './src/screens/ChatThreadScreen';
import AppUpdateBanner from './src/components/AppUpdateBanner';
import SettingsScreen from './src/screens/SettingsScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { userAPI, conversationsAPI } from './src/services/api';
import {
  registerForPushNotifications,
  unregisterPushNotifications,
  isRemotePushRegistered,
  notifyLocally,
} from './src/services/push';
import { View, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import AccommodationDetailScreen from './src/screens/accommodation/AccommodationDetailScreen';

const Tab = createBottomTabNavigator();
const AccomStack = createNativeStackNavigator();
const MessagesStack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

// Show message pushes as a banner even while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Simple SVG-free tab icons using Text (clean, no library needed)
const TabIcon = ({ label, focused, colors }) => (
  <React.Fragment>
  </React.Fragment>
);

function MessagesStackScreen({ user }) {
  const { colors } = useTheme();
  return (
    <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
      <MessagesStack.Screen name="Inbox">
        {(props) => <ChatInboxScreen {...props} user={user} />}
      </MessagesStack.Screen>
      <MessagesStack.Screen name="ChatThread" component={ChatThreadScreen} />
      <MessagesStack.Screen
        name="Alerts"
        component={MessagesScreen}
        options={{
          headerShown: true,
          title: 'Alerts',
          headerStyle: { backgroundColor: colors.backgroundElement },
          headerTintColor: colors.text,
        }}
      />
    </MessagesStack.Navigator>
  );
}

function LandlordTabs({ user, onLogout }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [chatUnread, setChatUnread] = useState(0);
  const unreadRef = useRef(0);
  const firstLoadRef = useRef(true);

  useEffect(() => {
    let active = true;
    const loadUnread = async () => {
      try {
        const res = await conversationsAPI.summary();
        const next = Number(res?.totalUnread) || 0;
        if (!active) return;
        setChatUnread(next);
        if (
          !firstLoadRef.current &&
          next > unreadRef.current &&
          !isRemotePushRegistered()
        ) {
          const added = next - unreadRef.current;
          notifyLocally({
            title: 'New message',
            body:
              added === 1
                ? 'You have a new message from a tenant or buyer.'
                : `You have ${added} new messages.`,
            data: { type: 'message' },
          });
        }
        firstLoadRef.current = false;
        unreadRef.current = next;
      } catch {
        // badge is best-effort; the inbox surfaces real errors
      }
    };
    loadUnread();
    const timer = setInterval(loadUnread, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.backgroundElement,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
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
        name="Messages"
        options={{
          tabBarLabel: 'Messages',
          tabBarBadge:
            chatUnread > 0 ? (chatUnread > 99 ? '99+' : chatUnread) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: '#fff' },
        }}
      >
        {() => <MessagesStackScreen user={user} />}
      </Tab.Screen>

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
  const [selectedPortal, setSelectedPortal] = useState(null); // null | 'landlord' | 'biashara'
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [resetToken, setResetToken] = useState(null);
  const [showLandlordRegister, setShowLandlordRegister] = useState(false);
  const { isDark, colors } = useTheme();
  const userRef = useRef(null);
  const pendingChatRef = useRef(null);
  userRef.current = user;

  const openChatFromNotification = useCallback((data) => {
    if (!data) return;
    const userId = userRef.current?._id || userRef.current?.id;
    if (!navigationRef.isReady() || !userId) {
      pendingChatRef.current = data;
      return;
    }
    pendingChatRef.current = null;
    if (data.conversationId) {
      navigationRef.navigate('Messages', {
        screen: 'ChatThread',
        params: {
          id: data.conversationId,
          peerName: data.senderName,
          contextTitle: data.contextTitle,
          myId: userId,
        },
      });
    } else {
      navigationRef.navigate('Messages', { screen: 'Inbox' });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    registerForPushNotifications();
  }, [user]);

  useEffect(() => {
    const handleResponse = (response) => {
      const data = response?.notification?.request?.content?.data || {};
      if (data.type !== 'message') return;
      openChatFromNotification(data);
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        handleResponse(response);
        return Notifications.clearLastNotificationResponseAsync();
      })
      .catch(() => {});

    return () => subscription.remove();
  }, [openChatFromNotification]);

  // Check for OTA updates on every cold launch
  useEffect(() => {
    async function checkForUpdate() {
      try {
        // Do not gate on isEmbeddedLaunch: it becomes false after the first OTA
        // update is applied, which would skip every later update check.
        if (!Updates.isEnabled || __DEV__) return; // skip in dev
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync(); // restart app with new bundle
        }
      } catch (e) {
        // silently ignore — don't crash if offline or update check fails
        console.log('OTA update check failed:', e.message);
      }
    }
    checkForUpdate();
  }, []);

  useEffect(() => {
    const handleUrl = (url) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      if (parsed.path && parsed.path.startsWith('reset-password')) {
        const token = parsed.path.split('/')[1] || parsed.queryParams?.token;
        if (token) setResetToken(token);
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', (event) => handleUrl(event.url));

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      // Only try to restore landlord session if landlord portal was selected
      if (selectedPortal !== 'landlord') {
        setCheckingSession(false);
        return;
      }
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
  }, [selectedPortal]);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await unregisterPushNotifications();
    await SecureStore.deleteItemAsync('token');
    setUser(null);
    // Return to portal selector after logout
    setSelectedPortal(null);
    setCheckingSession(true);
  };

  // When biashara portal returns to selector, reset landlord state
  const handleBackToSelector = () => {
    setSelectedPortal(null);
    setUser(null);
    setCheckingSession(true);
  };

  if (resetToken) {
    return (
      <>
        <ResetPasswordScreen token={resetToken} onDone={() => setResetToken(null)} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </>
    );
  }

  if (checkingSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors?.background || '#fff' }}>
        <ActivityIndicator size="large" color={colors?.primary || '#2563eb'} />
      </View>
    );
  }

  // ── Portal Selector (shown when no portal is chosen yet) ──
  if (!selectedPortal) {
    return (
      <>
        <PortalSelectorScreen onSelectPortal={setSelectedPortal} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </>
    );
  }

  // ── AxxBiashara Portal (self-contained) ──
  if (selectedPortal === 'biashara') {
    return (
      <>
        <BiasharaPortal onBackToPortalSelector={handleBackToSelector} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </>
    );
  }

  // ── Accommodation Portal (self-contained) ──
  if (selectedPortal === 'accommodation') {
    return (
      <NavigationContainer independent={true}>
        <AccomStack.Navigator screenOptions={{ headerShown: false }}>
          <AccomStack.Screen
            name="AccommodationPortal"
            options={{ headerShown: false }}
          >
            {props => (
              <AccommodationPortal
                {...props}
                onBackToPortalSelector={handleBackToSelector}
              />
            )}
          </AccomStack.Screen>
          <AccomStack.Screen
    name="AccommodationDetail"
    component={AccommodationDetailScreen}
    options={{ headerShown: true, title: 'Accommodation Detail' }}
  />
</AccomStack.Navigator>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </NavigationContainer>
    );
  }

  // ── Agent Portal (self-contained) ──
  if (selectedPortal === 'agent') {
    return (
      <>
        <AgentPortal onBackToPortalSelector={handleBackToSelector} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </>
    );
  }

  // ── Landlord Portal (unchanged logic below) ──
  if (!user) {
    if (showLandlordRegister) {
      return (
        <>
          <RegisterScreen
            onRegisterSuccess={(u) => { setShowLandlordRegister(false); handleLoginSuccess(u); }}
            onBack={() => setShowLandlordRegister(false)}
          />
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </>
      );
    }
    return (
      <>
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onBack={handleBackToSelector}
          onCreateAccount={() => setShowLandlordRegister(true)}
        />
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
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (pendingChatRef.current) {
          openChatFromNotification(pendingChatRef.current);
        }
      }}
    >
      <LandlordTabs user={user} onLogout={handleLogout} />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
        <AppUpdateBanner />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
