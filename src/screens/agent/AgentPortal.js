import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import Svg, { Path, Circle } from 'react-native-svg';

const C = {
  rootBg:      '#f8f4f0',
  white:       '#ffffff',
  tabBorder:   '#e5e7eb',
  tabActive:   '#fbbf24',
  tabInactive: '#6b7280',
  logoAccent:  '#fbbf24',
};

const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

const HomeIcon = ({ color, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Path d="M9 22V12h6v10" />
  </Svg>
);
const UserIcon = ({ color, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

import AgentLoginScreen           from './AgentLoginScreen';
import AgentRegisterScreen        from './AgentRegisterScreen';
import AgentOverviewScreen        from './AgentOverviewScreen';
import AgentUploadScreen          from './AgentUploadScreen';
import AgentAccountScreen         from './AgentAccountScreen';
import AgentNotificationsScreen   from './AgentNotificationsScreen';
import AgentPackageScreen         from './AgentPackageScreen';

const TABS = [
  { key: 'overview', label: 'Dashboard', Icon: HomeIcon },
  { key: 'account',  label: 'Account',   Icon: UserIcon },
];

export default function AgentPortal({ onBackToPortalSelector }) {
  const insets = useSafeAreaInsets();
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser]           = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  // 'login' | 'register' | 'main' | 'upload' | 'notifications' | 'package'
  const [screen, setScreen]       = useState('login');

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('agent_token');
        if (token) {
          const res  = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            const u = data.user || data;
            if (u.role === 'agent') { setUser(u); setScreen('main'); }
            else await SecureStore.deleteItemAsync('agent_token');
          } else {
            await SecureStore.deleteItemAsync('agent_token');
          }
        }
      } catch {
        await SecureStore.deleteItemAsync('agent_token');
      } finally {
        setCheckingSession(false);
      }
    })();
  }, []);

  const handleLoginSuccess   = (u) => { setUser(u); setActiveTab('overview'); setScreen('main'); };
  const handleRegisterSuccess = (u) => { setUser(u); setActiveTab('overview'); setScreen('main'); };
  const handleLogout         = async () => {
    await SecureStore.deleteItemAsync('agent_token');
    setUser(null);
    setScreen('login');
  };
  const handleProfileUpdated = (fields) => setUser(prev => ({ ...prev, ...fields }));

  if (checkingSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.rootBg }}>
        <ActivityIndicator size="large" color={C.logoAccent} />
      </View>
    );
  }

  /* ── Auth screens (no tab bar) ─────────────────────────── */
  if (screen === 'login') {
    return (
      <AgentLoginScreen
        onLoginSuccess={handleLoginSuccess}
        onBack={onBackToPortalSelector}
        onCreateAccount={() => setScreen('register')}
      />
    );
  }

  if (screen === 'register') {
    return (
      <AgentRegisterScreen
        onRegisterSuccess={handleRegisterSuccess}
        onBack={() => setScreen('login')}
      />
    );
  }

  /* ── Upload screen (no tab bar) ─────────────────────────── */
  if (screen === 'upload') {
    return (
      <AgentUploadScreen
        onBack={() => setScreen('main')}
        onSuccess={() => setScreen('main')}
      />
    );
  }

  /* ── Notifications screen (no tab bar) ──────────────────── */
  if (screen === 'notifications') {
    return (
      <AgentNotificationsScreen
        onBack={() => setScreen('main')}
      />
    );
  }

  /* ── Package upgrade screen (no tab bar) ──────────────── */
  if (screen === 'package') {
    return (
      <AgentPackageScreen
        user={user}
        onBack={() => setScreen('main')}
      />
    );
  }

  /* ── Main app with tab bar ─────────────────────────────── */
  return (
    <View style={{ flex: 1, backgroundColor: C.rootBg }}>
      {activeTab === 'overview' && (
        <AgentOverviewScreen
          user={user}
          onUpload={() => setScreen('upload')}
          onNotifications={() => setScreen('notifications')}
        />
      )}
      {activeTab === 'account' && (
        <AgentAccountScreen
          user={user}
          onLogout={handleLogout}
          onProfileUpdated={handleProfileUpdated}
          onUpgradePackage={() => setScreen('package')}
        />
      )}

      {/* Bottom tab bar */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          const { Icon } = tab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Icon color={active ? C.tabActive : C.tabInactive} size={22} />
              <Text style={[styles.tabLabel, { color: active ? C.tabActive : C.tabInactive }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.tabBorder,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 3, paddingBottom: 4,
    borderTopWidth: 3, borderTopColor: 'transparent', marginTop: -1,
  },
  tabItemActive: { borderTopColor: C.tabActive },
  tabLabel:      { fontSize: 11, fontWeight: '600' },
});
