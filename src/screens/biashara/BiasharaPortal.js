import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { biasharaAuthAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing } from '../../constants/theme';

import BiasharaLoginScreen from './BiasharaLoginScreen';
import BiasharaOverviewScreen from './BiasharaOverviewScreen';
import BiasharaListingsScreen from './BiasharaListingsScreen';
import BiasharaUploadScreen from './BiasharaUploadScreen';
import BiasharaAccountScreen from './BiasharaAccountScreen';

const ACCENT = '#fbbf24';

const TABS = [
  { key: 'overview',  label: 'Overview' },
  { key: 'listings',  label: 'My Listings' },
  { key: 'upload',    label: 'Upload' },
  { key: 'account',  label: 'Account' },
];

function BottomTabBar({ activeTab, setActiveTab, colors, insets }) {
  return (
    <View style={[
      styles.tabBar,
      {
        backgroundColor: colors.backgroundElement,
        borderTopColor: ACCENT + '30',
        paddingBottom: Math.max(insets.bottom, 8),
      },
    ]}>
      {TABS.map(tab => {
        const active = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.key)}
          >
            <View style={[styles.tabIndicator, { backgroundColor: active ? ACCENT : 'transparent' }]} />
            <Text style={[styles.tabLabel, { color: active ? ACCENT : colors.textMuted }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function BiasharaPortal({ onBackToPortalSelector }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const restore = async () => {
      try {
        const token = await SecureStore.getItemAsync('biashara_token');
        if (token) {
          const response = await biasharaAuthAPI.getMe();
          if (response && (response.user || response._id)) {
            setUser(response.user || response);
          } else {
            await SecureStore.deleteItemAsync('biashara_token');
          }
        }
      } catch {
        await SecureStore.deleteItemAsync('biashara_token');
      } finally {
        setCheckingSession(false);
      }
    };
    restore();
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setActiveTab('overview');
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('biashara_token');
    setUser(null);
  };

  // Re-fetch user from server after profile update so the new photo URL is reflected
  const refreshUser = async () => {
    try {
      const response = await biasharaAuthAPI.getMe();
      if (response && (response.user || response._id)) {
        setUser(response.user || response);
      }
    } catch {
      // Non-critical — silently ignore; the local state is still fine
    }
  };

  if (checkingSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!user) {
    return (
      <BiasharaLoginScreen
        onLoginSuccess={handleLoginSuccess}
        onBack={onBackToPortalSelector}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {activeTab === 'overview'  && <BiasharaOverviewScreen user={user} onLogout={handleLogout} />}
      {activeTab === 'listings'  && <BiasharaListingsScreen user={user} />}
      {activeTab === 'upload'    && <BiasharaUploadScreen onUploadSuccess={() => setActiveTab('listings')} />}
      {activeTab === 'account'   && <BiasharaAccountScreen user={user} onLogout={handleLogout} onProfileUpdated={refreshUser} />}

      <BottomTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        colors={colors}
        insets={insets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 4 },
  tabIndicator: { width: 22, height: 3, borderRadius: 2, marginBottom: 4 },
  tabLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
});
