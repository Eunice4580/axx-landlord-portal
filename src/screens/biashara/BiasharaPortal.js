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
import BiasharaAccountScreen from './BiasharaAccountScreen';
import RegisterBusinessScreen from './RegisterBusinessScreen';
import { GridIcon, StoreIcon, UserIcon } from './Icons';

const ACCENT = '#fbbf24';

const TABS = [
  { key: 'overview',  label: 'Overview',      Icon: GridIcon  },
  { key: 'listings',  label: 'My Businesses', Icon: StoreIcon },
  { key: 'account',   label: 'Account',       Icon: UserIcon  },
];

function BottomTabBar({ activeTab, setActiveTab, colors, insets }) {
  return (
    <View style={[
      styles.tabBar,
      {
        backgroundColor: colors.backgroundElement,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 10),
      },
    ]}>
      {TABS.map(tab => {
        const active = activeTab === tab.key;
        const { Icon } = tab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.tabIconWrap,
              { backgroundColor: active ? ACCENT + '20' : 'transparent' },
            ]}>
              <Icon color={active ? ACCENT : colors.textMuted} size={20} />
            </View>
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
  const [displayUser, setDisplayUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showRegister, setShowRegister] = useState(false);

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
    setDisplayUser(loggedInUser);
    setActiveTab('overview');
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('biashara_token');
    setUser(null);
    setDisplayUser(null);
  };

  // Called immediately with the local avatar URI so all tabs update without
  // waiting for the server. Background server fetch follows to get the CDN URL.
  const handleProfileUpdated = (updatedFields, localAvatarUri) => {
    if (updatedFields || localAvatarUri) {
      setDisplayUser(prev => ({
        ...(prev || user),
        ...(updatedFields || {}),
        ...(localAvatarUri ? { profileImage: localAvatarUri, avatar: localAvatarUri } : {}),
      }));
    }
    // Background server refresh — updates to real CDN URL
    biasharaAuthAPI.getMe().then(response => {
      if (response && (response.user || response._id)) {
        const fresh = response.user || response;
        setUser(fresh);
        setDisplayUser(fresh);
      }
    }).catch(() => {});
  };

  // Sync displayUser when user state changes (e.g. after server refresh)
  useEffect(() => {
    if (user) setDisplayUser(prev => ({ ...user, ...(prev?.profileImage && !user.profileImage ? { profileImage: prev.profileImage, avatar: prev.avatar } : {}) }));
  }, [user]);

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

  const shownUser = displayUser || user;

  // Register Business — full-screen overlay (hides tab bar)
  if (showRegister) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <RegisterBusinessScreen
          user={shownUser}
          onBack={() => setShowRegister(false)}
          onDone={() => {
            setShowRegister(false);
            setActiveTab('listings');
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Keep all tabs mounted but hide inactive ones to preserve state */}
      <View style={{ flex: 1, display: activeTab === 'overview' ? 'flex' : 'none' }}>
        <BiasharaOverviewScreen
          user={shownUser}
          onLogout={handleLogout}
          onRegisterBusiness={() => setShowRegister(true)}
        />
      </View>
      <View style={{ flex: 1, display: activeTab === 'listings' ? 'flex' : 'none' }}>
        <BiasharaListingsScreen
          user={shownUser}
          onRegisterBusiness={() => setShowRegister(true)}
        />
      </View>
      <View style={{ flex: 1, display: activeTab === 'account' ? 'flex' : 'none' }}>
        <BiasharaAccountScreen
          user={shownUser}
          onLogout={handleLogout}
          onProfileUpdated={handleProfileUpdated}
        />
      </View>

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
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
    gap: 4,
  },
  tabIconWrap: {
    width: 44,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
});
