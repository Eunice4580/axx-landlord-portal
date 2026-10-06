import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing } from '../../constants/theme';

import AccommodationLoginScreen from './AccommodationLoginScreen';
import AccommodationOverviewScreen from './AccommodationOverviewScreen';
import AccommodationBookingsScreen from './AccommodationBookingsScreen';
import AccommodationAccountScreen from './AccommodationAccountScreen';
import AccommodationRegisterScreen from './AccommodationRegisterScreen';
import { HomeIcon, CalendarIcon, UserIcon } from './AccomIcons';

const ACCENT = '#10b981';
const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

const TABS = [
  { key: 'overview',  label: 'Dashboard', Icon: HomeIcon     },
  { key: 'bookings',  label: 'Bookings',  Icon: CalendarIcon },
  { key: 'account',   label: 'Account',   Icon: UserIcon     },
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
            <View style={[styles.tabIconWrap, { backgroundColor: active ? ACCENT + '20' : 'transparent' }]}>
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

export default function AccommodationPortal({ onBackToPortalSelector }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const token = await SecureStore.getItemAsync('accom_token');
        if (token) {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok && (data.user || data._id)) {
            const u = data.user || data;
            if (u.role === 'host' || u.role === 'landlord') {
              setUser(u);
            } else {
              await SecureStore.deleteItemAsync('accom_token');
            }
          } else {
            await SecureStore.deleteItemAsync('accom_token');
          }
        }
      } catch {
        await SecureStore.deleteItemAsync('accom_token');
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
    await SecureStore.deleteItemAsync('accom_token');
    setUser(null);
  };

  const handleProfileUpdated = (updatedFields, avatarUri) => {
    setUser(prev => ({
      ...prev,
      ...updatedFields,
      ...(avatarUri ? { profileImage: avatarUri, avatar: avatarUri } : {}),
    }));
  };

  if (checkingSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!user) {
    if (showRegister) {
      return (
        <AccommodationRegisterScreen
          onRegisterSuccess={(u) => { setShowRegister(false); handleLoginSuccess(u); }}
          onBack={() => setShowRegister(false)}
        />
      );
    }
    return (
      <AccommodationLoginScreen
        onLoginSuccess={handleLoginSuccess}
        onBack={onBackToPortalSelector}
        onCreateAccount={() => setShowRegister(true)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {activeTab === 'overview' && <AccommodationOverviewScreen user={user} />}
      {activeTab === 'bookings' && <AccommodationBookingsScreen user={user} />}
      {activeTab === 'account'  && (
        <AccommodationAccountScreen
          user={user}
          onLogout={handleLogout}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

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
  tabBar: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 2, gap: 4 },
  tabIconWrap: { width: 44, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
});
