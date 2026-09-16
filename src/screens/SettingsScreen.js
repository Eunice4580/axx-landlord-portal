import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import InviteCaretakerScreen from './InviteCaretakerScreen';
import MyCaretakersScreen from './MyCaretakersScreen';

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

export default function SettingsScreen({ user, onLogout }) {
  const [showInvite, setShowInvite] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = getStyles(colors);

  if (showInvite) {
    return <InviteCaretakerScreen onBack={() => setShowInvite(false)} />;
  }

  if (showManage) {
    return <MyCaretakersScreen onBack={() => setShowManage(false)} />;
  }

  const initials = (user?.name || 'L')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Profile header */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Landlord'}</Text>
            <Text style={styles.profileRole}>
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Landlord'}
            </Text>
          </View>
        </View>

        {/* Account details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <Row label="Full Name" value={user?.name} colors={colors} />
          <Row label="Email" value={user?.email} colors={colors} />
          <Row label="Phone" value={user?.phone} colors={colors} />
          <Row label="Role" value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''} colors={colors} />
        </View>

        {/* Actions */}
        {user?.role === 'landlord' && (
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

        {/* App info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={[styles.menuRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.menuRowText}>{isDark ? '🌙  Dark Mode' : '☀️  Light Mode'}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={'#fff'}
            />
          </View>
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
    marginBottom: Spacing.three,
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
