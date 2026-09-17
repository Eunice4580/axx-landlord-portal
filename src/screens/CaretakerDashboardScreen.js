import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { caretakerAPI, updateBookedUnits } from '../services/api';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import ChangePasswordScreen from './ChangePasswordScreen';
import ChangeEmailScreen from './ChangeEmailScreen';
import ChangeContactScreen from './ChangeContactScreen';
import { Switch } from 'react-native';

export default function CaretakerDashboardScreen({ user, onLogout }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangeContact, setShowChangeContact] = useState(false);
  const [localUser, setLocalUser] = useState(user);
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = getStyles(colors);

  const loadProperties = useCallback(async () => {
    try {
      const data = await caretakerAPI.getMyAssignedProperties();
      setProperties(Array.isArray(data.properties) ? data.properties : []);
    } catch (error) {
      console.error('Failed to load assigned properties:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadProperties(); }, [loadProperties]);

  const onRefresh = () => { setRefreshing(true); loadProperties(); };

  const handleUnitChange = async (propertyId, change) => {
    try {
      await updateBookedUnits(propertyId, change);
      loadProperties();
    } catch (error) {
      Alert.alert('Failed', error.message || 'Could not update unit status.');
    }
  };

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

  if (showSettings) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={{ padding: Spacing.three }}>
          <TouchableOpacity onPress={() => setShowSettings(false)}>
            <Text style={{ color: colors.primary, fontSize: 15, marginBottom: Spacing.three }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: FontSize['2xl'], fontWeight: '700', color: colors.text, marginBottom: Spacing.four }}>Settings</Text>

          <View style={{ backgroundColor: colors.backgroundElement, borderRadius: BorderRadius.lg, padding: Spacing.three, marginBottom: Spacing.three, borderWidth: 1, borderColor: colors.border }}>
            <TouchableOpacity style={styles.settingsRow} onPress={() => setShowChangeContact(true)}>
              <Text style={styles.settingsRowText}>Change Contact Info</Text>
              <Text style={styles.settingsRowChevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsRow} onPress={() => setShowChangeEmail(true)}>
              <Text style={styles.settingsRowText}>Change Email</Text>
              <Text style={styles.settingsRowChevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingsRow, { borderBottomWidth: 0 }]} onPress={() => setShowChangePassword(true)}>
              <Text style={styles.settingsRowText}>Change Password</Text>
              <Text style={styles.settingsRowChevron}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: colors.backgroundElement, borderRadius: BorderRadius.lg, padding: Spacing.three, borderWidth: 1, borderColor: colors.border }}>
            <View style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.settingsRowText}>{isDark ? '🌙  Dark Mode' : '☀️  Light Mode'}</Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={'#fff'}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalUnitsAssigned = properties.reduce((sum, p) => sum + (p.totalUnits || 1), 0);
  const totalAvailable = properties.reduce((sum, p) => sum + Math.max(0, (p.totalUnits || 1) - (p.bookedUnits || 0)), 0);

  const initials = (user?.name || 'C')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const renderProperty = ({ item }) => {
    const total = item.totalUnits || 1;
    const booked = item.bookedUnits || 0;
    const available = Math.max(0, total - booked);
    const fullyBooked = booked >= total;
    const occupancyPct = Math.min(100, Math.round((booked / total) * 100));

    return (
      <View style={styles.card}>
        {item.images && item.images.length > 0 && (
          <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardLocation}>{item.location}</Text>

          <View style={styles.occupancyRow}>
            <Text style={[styles.occupancyText, { color: fullyBooked ? colors.danger : colors.success }]}>
              {fullyBooked ? 'Fully Booked' : `${available}/${total} units available`}
            </Text>
            <Text style={styles.occupancyPct}>{occupancyPct}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[
              styles.progressFill,
              { width: `${occupancyPct}%`, backgroundColor: fullyBooked ? colors.danger : colors.primary },
            ]} />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { opacity: fullyBooked ? 0.4 : 1 }]}
              onPress={() => handleUnitChange(item._id, 1)}
              disabled={fullyBooked}
            >
              <Text style={styles.actionBtnText}>Mark Occupied</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtnOutline, { opacity: booked === 0 ? 0.4 : 1 }]}
              onPress={() => handleUnitChange(item._id, -1)}
              disabled={booked === 0}
            >
              <Text style={styles.actionBtnOutlineText}>Free Unit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={properties}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>Caretaker</Text>
                </View>
                <Text style={styles.userName}>{user?.name || 'Caretaker'}</Text>
              </View>
              <View style={styles.headerRight}>
                {localUser?.profileImage ? (
                  <Image source={{ uri: localUser.profileImage }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
                <View>
                  <TouchableOpacity style={styles.dotsBtn} onPress={() => setShowMenu((m) => !m)}>
                    <Text style={styles.dotsBtnText}>⋮</Text>
                  </TouchableOpacity>
                  {showMenu && (
                    <View style={styles.dropdown}>
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => { setShowMenu(false); setShowSettings(true); }}
                      >
                        <Text style={styles.dropdownItemText}>Settings</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.dropdownItem, { borderBottomWidth: 0 }]}
                        onPress={() => { setShowMenu(false); onLogout(); }}
                      >
                        <Text style={[styles.dropdownItemText, { color: colors.danger }]}>Log Out</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{properties.length}</Text>
                <Text style={styles.statLabel}>Assigned</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.success }]}>{totalAvailable}</Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.warning }]}>{totalUnitsAssigned - totalAvailable}</Text>
                <Text style={styles.statLabel}>Occupied</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Assigned Properties</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No properties assigned</Text>
            <Text style={styles.emptyText}>Contact your landlord to get properties assigned to you.</Text>
          </View>
        }
        renderItem={renderProperty}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  listContent: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  roleBadge: {
    backgroundColor: colors.primary + '22',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  roleBadgeText: { color: colors.primary, fontSize: FontSize.xs, fontWeight: '700' },
  userName: { fontSize: FontSize['2xl'], fontWeight: '700', color: colors.text },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dotsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  dropdown: {
    position: 'absolute',
    top: 38,
    right: 0,
    backgroundColor: colors.backgroundElement,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 130,
    zIndex: 10,
    elevation: 10,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  settingsBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  settingsBtnText: {
    color: colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsRowText: {
    fontSize: FontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  settingsRowChevron: {
    fontSize: 22,
    color: colors.textMuted,
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  logoutBtnText: {
    color: colors.danger,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundElement,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: Spacing.three,
  },
  card: {
    backgroundColor: colors.backgroundElement,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 150 },
  cardBody: { padding: Spacing.three },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '700', color: colors.text, marginBottom: 3 },
  cardLocation: { fontSize: FontSize.sm, color: colors.textSecondary, marginBottom: Spacing.two },
  occupancyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  occupancyText: { fontSize: FontSize.sm, fontWeight: '600' },
  occupancyPct: { fontSize: FontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  progressFill: { height: '100%', borderRadius: 2 },
  actionRow: { flexDirection: 'row', gap: Spacing.two },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: FontSize.sm },
  actionBtnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  actionBtnOutlineText: { color: colors.textSecondary, fontWeight: '600', fontSize: FontSize.sm },
  emptyBox: { alignItems: 'center', paddingTop: Spacing.six },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '600', color: colors.text, marginBottom: Spacing.two },
  emptyText: { fontSize: FontSize.base, color: colors.textSecondary, textAlign: 'center' },
});
