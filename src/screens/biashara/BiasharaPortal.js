import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { biasharaAuthAPI, biasharaBusinessAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, Spacing } from '../../constants/theme';

import BiasharaLoginScreen from './BiasharaLoginScreen';
import BiasharaOverviewScreen from './BiasharaOverviewScreen';
import BiasharaListingsScreen from './BiasharaListingsScreen';
import BiasharaAccountScreen from './BiasharaAccountScreen';
import BiasharaAnalyticsScreen from './BiasharaAnalyticsScreen';
import RegisterBusinessScreen from './RegisterBusinessScreen';
import BiasharaRegisterScreen from './BiasharaRegisterScreen';
import { GridIcon, StoreIcon, UserIcon, BarChartIcon } from './Icons';

const ACCENT = '#fbbf24';

const TABS = [
  { key: 'overview',   label: 'Overview',    Icon: GridIcon       },
  { key: 'listings',   label: 'Businesses',  Icon: StoreIcon      },
  { key: 'analytics',  label: 'Analytics',   Icon: BarChartIcon   },
  { key: 'account',    label: 'Account',     Icon: UserIcon       },
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

  // Multi-business state — shared across all tabs
  const [businesses, setBusinesses] = useState([]);
  const [businessesLoading, setBusinessesLoading] = useState(false);

  // Register/Edit flow — null = closed, undefined = new, business object = edit
  const [editTarget, setEditTarget] = useState(null); // null = form hidden
  const [showForm, setShowForm] = useState(false);

  // Fetch all businesses owned by this user
  const refreshBusinesses = useCallback(async () => {
    setBusinessesLoading(true);
    try {
      const res = await biasharaBusinessAPI.getMyBusiness();
      setBusinesses(res?.businesses || []);
    } catch (err) {
      console.error('Failed to load businesses:', err.message);
    } finally {
      setBusinessesLoading(false);
    }
  }, []);

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

  // Once we have a user, load their businesses + auto-sync
  // Any business deleted on the website disappears here within 60s automatically
  useEffect(() => {
    if (!user) return;
    refreshBusinesses();

    const appStateSub = AppState.addEventListener('change', s => {
      if (s === 'active') refreshBusinesses();
    });
    const poll = setInterval(() => refreshBusinesses(), 60000);

    return () => { appStateSub.remove(); clearInterval(poll); };
  }, [user, refreshBusinesses]);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setDisplayUser(loggedInUser);
    setActiveTab('overview');
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('biashara_token');
    setUser(null);
    setDisplayUser(null);
    setBusinesses([]);
  };

  const handleProfileUpdated = (updatedFields, localAvatarUri) => {
    if (updatedFields || localAvatarUri) {
      setDisplayUser(prev => ({
        ...(prev || user),
        ...(updatedFields || {}),
        ...(localAvatarUri ? { profileImage: localAvatarUri, avatar: localAvatarUri } : {}),
      }));
    }
    // Background server refresh to get CDN URL
    biasharaAuthAPI.getMe().then(response => {
      if (response && (response.user || response._id)) {
        const fresh = response.user || response;
        setUser(fresh);
        setDisplayUser(fresh);
      }
    }).catch(() => {});
  };

  // Sync displayUser when user state changes
  useEffect(() => {
    if (user) setDisplayUser(prev => ({
      ...user,
      ...(prev?.profileImage && !user.profileImage
        ? { profileImage: prev.profileImage, avatar: prev.avatar }
        : {}),
    }));
  }, [user]);

  // ── Business form helpers ──────────────────────────────────────
  const openRegister = () => {
    setEditTarget(undefined); // undefined = new business
    setShowForm(true);
  };

  const openEdit = (business) => {
    setEditTarget(business); // pass existing business to edit
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  const handleFormDone = () => {
    closeForm();
    setActiveTab('listings');
    refreshBusinesses(); // reload the businesses list
  };

  // ── Delete business ──────────────────────────────────────────
  const handleDelete = useCallback(async (businessId) => {
    try {
      await biasharaBusinessAPI.deleteBusiness(businessId);
      setBusinesses(prev => prev.filter(b => b._id !== businessId));
    } catch (err) {
      throw err; // let the caller show the alert
    }
  }, []);

  // ── Loading / Auth gates ──────────────────────────────────────
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
        <BiasharaRegisterScreen
          onRegisterSuccess={(u) => { setShowRegister(false); handleLoginSuccess(u); }}
          onBack={() => setShowRegister(false)}
        />
      );
    }
    return (
      <BiasharaLoginScreen
        onLoginSuccess={handleLoginSuccess}
        onBack={onBackToPortalSelector}
        onCreateAccount={() => setShowRegister(true)}
      />
    );
  }

  const shownUser = displayUser || user;

  // Register/Edit form — full-screen overlay (hides tab bar)
  if (showForm) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <RegisterBusinessScreen
          user={shownUser}
          business={editTarget}       // undefined = create, object = edit
          onBack={closeForm}
          onDone={handleFormDone}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Keep all tabs mounted but hide inactive ones to preserve state */}
      <View style={{ flex: 1, display: activeTab === 'overview'  ? 'flex' : 'none' }}>
        <BiasharaOverviewScreen
          user={shownUser}
          businesses={businesses}
          businessesLoading={businessesLoading}
          onRegisterBusiness={openRegister}
          onRefreshBusinesses={refreshBusinesses}
        />
      </View>
      <View style={{ flex: 1, display: activeTab === 'listings'  ? 'flex' : 'none' }}>
        <BiasharaListingsScreen
          user={shownUser}
          businesses={businesses}
          businessesLoading={businessesLoading}
          onRegisterBusiness={openRegister}
          onEditBusiness={openEdit}
          onDeleteBusiness={handleDelete}
          onRefresh={refreshBusinesses}
        />
      </View>
      <View style={{ flex: 1, display: activeTab === 'analytics' ? 'flex' : 'none' }}>
        <BiasharaAnalyticsScreen
          businesses={businesses}
          onBack={() => setActiveTab('overview')}
        />
      </View>
      <View style={{ flex: 1, display: activeTab === 'account'   ? 'flex' : 'none' }}>
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
