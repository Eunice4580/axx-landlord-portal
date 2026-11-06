import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import InviteCaretakerScreen from './InviteCaretakerScreen';
import MyCaretakersScreen from './MyCaretakersScreen';
import ChangePasswordScreen from './ChangePasswordScreen';
import ChangeEmailScreen from './ChangeEmailScreen';
import ChangeContactScreen from './ChangeContactScreen';
import HelpCenterScreen from './support/HelpCenterScreen';

const Row = ({ label, value, colors }) => (
  <View style={{ paddingVertical: Spacing.two, borderBottomWidth: 1, borderBottomColor: colors.border }}>
    <Text style={{ fontSize: FontSize.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
      {label}
    </Text>
    <Text style={{ fontSize: FontSize.md, color: colors.text, fontWeight: '600' }}>
      {value || '—'}
    </Text>
  </View>
);

export default function SettingsScreen({ user, onLogout, navigation }) {
  const [showInvite, setShowInvite] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangeContact, setShowChangeContact] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [localUser, setLocalUser] = useState(user);
  const [payoutNumber, setPayoutNumber] = useState('');
  const [payoutSaved, setPayoutSaved] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    scanAlerts: true,
    weeklySummary: true,
    agentRequests: true,
  });
  const [defaultFilter, setDefaultFilter] = useState('all');
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = getStyles(colors);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedPayout, storedPrefs, storedFilter] = await Promise.all([
          SecureStore.getItemAsync('landlord_payout_number'),
          SecureStore.getItemAsync('landlord_notification_prefs'),
          SecureStore.getItemAsync('landlord_default_filter'),
        ]);
        if (cancelled) return;
        setPayoutNumber(storedPayout || user?.phone || '');
        if (storedPrefs) setNotifPrefs(prev => ({ ...prev, ...JSON.parse(storedPrefs) }));
        if (storedFilter) setDefaultFilter(storedFilter);
      } catch {
        // Fall back to defaults when device storage is unavailable.
      }
    })();
    return () => { cancelled = true; };
  }, [user?.phone]);

  const savePayout = async () => {
    const clean = payoutNumber.replace(/\s+/g, '');
    if (clean && !/^(?:\+?254|0)\d{9}$/.test(clean)) {
      Alert.alert('Check the number', 'Enter a valid M-Pesa number, e.g. 0712345678.');
      return;
    }
    try {
      await SecureStore.setItemAsync('landlord_payout_number', clean);
      setPayoutNumber(clean);
      setPayoutSaved(true);
      setTimeout(() => setPayoutSaved(false), 2500);
    } catch {
      Alert.alert('Save failed', 'Could not save payout details on this device.');
    }
  };

  const updateNotifPref = async (key, value) => {
    const next = { ...notifPrefs, [key]: value };
    setNotifPrefs(next);
    try {
      await SecureStore.setItemAsync('landlord_notification_prefs', JSON.stringify(next));
    } catch {
      // Keep the toggle responsive even if persistence fails.
    }
  };

  const changeDefaultFilter = async (key) => {
    setDefaultFilter(key);
    try {
      await SecureStore.setItemAsync('landlord_default_filter', key);
    } catch {
      // Preference applies for this session only.
    }
  };

  if (showInvite) {
    return <InviteCaretakerScreen onBack={() => setShowInvite(false)} />;
  }

  if (showManage) {
    return <MyCaretakersScreen onBack={() => setShowManage(false)} />;
  }

  if (showChangePassword) {
    return <ChangePasswordScreen onBack={() => setShowChangePassword(false)} />;
  }

  if (showChangeEmail) {
    return (
      <ChangeEmailScreen
        onBack={() => setShowChangeEmail(false)}
        onEmailChanged={(updated) => setLocalUser(updated)}
      />
    );
  }

  if (showChangeContact) {
    return (
      <ChangeContactScreen
        user={localUser}
        onBack={() => setShowChangeContact(false)}
        onUpdated={(updated) => setLocalUser(updated)}
      />
    );
  }

  if (showHelpCenter) {
    return <HelpCenterScreen navigation={{ goBack: () => setShowHelpCenter(false), navigate: () => {} }} />;
  }

  const initials = (localUser?.name || 'L')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Settings</Text>
        <Text style={styles.pageSubtitle}>
          Manage notifications, payout account settings, and workspace preferences.
        </Text>

        {/* Profile header */}
        <View style={styles.profileCard}>
          {localUser?.profileImage ? (
            <Image source={{ uri: localUser.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{localUser?.name || 'Landlord'}</Text>
            <Text style={styles.profileRole}>
              {localUser?.role ? localUser.role.charAt(0).toUpperCase() + localUser.role.slice(1) : 'Landlord'}
            </Text>
          </View>
        </View>

        {/* Account details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <Row label="Full Name" value={localUser?.name} colors={colors} />
          <Row label="Email" value={localUser?.email} colors={colors} />
          <Row label="Phone" value={localUser?.phone} colors={colors} />
          <Row label="Role" value={localUser?.role ? localUser.role.charAt(0).toUpperCase() + localUser.role.slice(1) : ''} colors={colors} />
        </View>

        {/* Actions */}
        {localUser?.role === 'landlord' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team</Text>
            <TouchableOpacity style={styles.menuRow} onPress={() => setShowInvite(true)}>
              <Text style={styles.menuRowText}>Invite Caretaker</Text>
              <Text style={styles.menuRowChevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={() => setShowManage(true)}>
              <Text style={styles.menuRowText}>Manage Caretakers</Text>
              <Text style={styles.menuRowChevron}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Account actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.menuRow} onPress={() => setShowChangeContact(true)}>
            <Text style={styles.menuRowText}>Change Contact Info</Text>
            <Text style={styles.menuRowChevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} onPress={() => setShowChangeEmail(true)}>
            <Text style={styles.menuRowText}>Change Email</Text>
            <Text style={styles.menuRowChevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={() => setShowChangePassword(true)}>
            <Text style={styles.menuRowText}>Change Password</Text>
            <Text style={styles.menuRowChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Payout account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout Account</Text>
          <Text style={styles.sectionHint}>Define where your rental deposits are wired.</Text>
          <Text style={styles.fieldLabel}>M-Pesa Paybill / Number</Text>
          <TextInput
            style={styles.input}
            value={payoutNumber}
            onChangeText={(text) => { setPayoutNumber(text); setPayoutSaved(false); }}
            placeholder="e.g. 0712345678"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={savePayout} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>{payoutSaved ? 'Saved' : 'Save Details'}</Text>
          </TouchableOpacity>
        </View>

        {/* Notification preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Text style={styles.sectionHint}>Control the alerts sent when prospects scan posters.</Text>
          <View style={styles.prefRow}>
            <View style={styles.prefTextWrap}>
              <Text style={styles.prefLabel}>New QR scan alerts</Text>
              <Text style={styles.prefHint}>Send an email for every new QR scan</Text>
            </View>
            <Switch
              value={notifPrefs.scanAlerts}
              onValueChange={(v) => updateNotifPref('scanAlerts', v)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={'#fff'}
            />
          </View>
          <View style={styles.prefRow}>
            <View style={styles.prefTextWrap}>
              <Text style={styles.prefLabel}>Weekly performance summary</Text>
              <Text style={styles.prefHint}>Views, inquiries and revenue each week</Text>
            </View>
            <Switch
              value={notifPrefs.weeklySummary}
              onValueChange={(v) => updateNotifPref('weeklySummary', v)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={'#fff'}
            />
          </View>
          <View style={[styles.prefRow, { borderBottomWidth: 0 }]}>
            <View style={styles.prefTextWrap}>
              <Text style={styles.prefLabel}>Agent request alerts</Text>
              <Text style={styles.prefHint}>When an agent asks to manage your listings</Text>
            </View>
            <Switch
              value={notifPrefs.agentRequests}
              onValueChange={(v) => updateNotifPref('agentRequests', v)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={'#fff'}
            />
          </View>
        </View>

        {/* Workspace preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workspace Preferences</Text>
          <View style={styles.prefRow}>
            <View style={styles.prefTextWrap}>
              <Text style={styles.prefLabel}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
              <Text style={styles.prefHint}>Appearance across the whole app</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={'#fff'}
            />
          </View>
          <Text style={[styles.fieldLabel, { marginTop: Spacing.two }]}>Default dashboard filter</Text>
          <View style={styles.chipRow}>
            {[
              { key: 'all', label: 'All' },
              { key: 'approved', label: 'Approved' },
              { key: 'pending', label: 'Pending' },
              { key: 'booked', label: 'Booked' },
            ].map(option => {
              const active = defaultFilter === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => changeDefaultFilter(option.key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={() => setShowHelpCenter(true)}>
            <Text style={styles.menuRowText}>Help Center</Text>
            <Text style={styles.menuRowChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.menuRow}>
            <Text style={styles.menuRowText}>App Version</Text>
            <Text style={styles.menuRowValue}>1.0.0</Text>
          </View>
          <View style={[styles.menuRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.menuRowText}>Platform</Text>
            <Text style={styles.menuRowValue}>AXX Spaces</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  pageTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: '700',
    color: colors.text,
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  pageSubtitle: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginBottom: Spacing.three,
    lineHeight: 18,
  },
  profileCard: {
    backgroundColor: colors.backgroundElement,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  avatarText: {
    color: '#fff',
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  profileRole: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginTop: 3,
  },
  section: {
    backgroundColor: colors.backgroundElement,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.two,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuRowText: {
    fontSize: FontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  menuRowChevron: {
    fontSize: 22,
    color: colors.textMuted,
  },
  menuRowValue: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
  },
  sectionHint: {
    fontSize: FontSize.sm,
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: Spacing.two,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.background,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FontSize.base,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  prefTextWrap: { flex: 1 },
  prefLabel: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  prefHint: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: { color: '#fff' },
  logoutBtn: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  logoutBtnText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
});
