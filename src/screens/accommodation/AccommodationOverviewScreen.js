import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { HomeIcon, BarChartIcon, CalendarIcon, StarIcon, LocationIcon, ShieldCheckIcon } from './AccomIcons';

const ACCENT = '#10b981';
const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

async function apiGet(path) {
  const token = await SecureStore.getItemAsync('accom_token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const STATUS = {
  approved: { bg: '#22c55e18', border: '#22c55e40', text: '#22c55e', label: 'Approved' },
  active:   { bg: '#22c55e18', border: '#22c55e40', text: '#22c55e', label: 'Active' },
  pending_review: { bg: '#f59e0b18', border: '#f59e0b40', text: '#f59e0b', label: 'Under Review' },
  pending:  { bg: '#f59e0b18', border: '#f59e0b40', text: '#f59e0b', label: 'Pending' },
  rejected: { bg: '#ef444418', border: '#ef444440', text: '#ef4444', label: 'Rejected' },
};

function getStatus(s) {
  return STATUS[(s || 'pending').toLowerCase()] || STATUS.pending;
}

function StatCard({ Icon, label, value, color, colors }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: color + '30' }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
        <Icon color={color} size={16} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value ?? '—'}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function PropertyCard({ item, colors }) {
  const st = getStatus(item.status);
  const img = item.primaryImage || item.images?.[0] || null;
  return (
    <View style={[styles.propCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      {img ? (
        <Image source={{ uri: img }} style={styles.propImage} resizeMode="cover" />
      ) : (
        <View style={[styles.propImagePlaceholder, { backgroundColor: ACCENT + '15' }]}>
          <HomeIcon color={ACCENT} size={28} />
        </View>
      )}
      <View style={styles.propBody}>
        <View style={styles.propTitleRow}>
          <Text style={[styles.propName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
            {(item.status === 'approved' || item.status === 'active') && <ShieldCheckIcon color={st.text} size={10} />}
            <Text style={[styles.statusText, { color: st.text }]}> {st.label}</Text>
          </View>
        </View>
        {(item.location?.town || item.location?.county) && (
          <View style={styles.locationRow}>
            <LocationIcon color={colors.textMuted} size={12} />
            <Text style={[styles.locationText, { color: colors.textMuted }]}>
              {' '}{[item.location?.town, item.location?.county].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}
        <View style={styles.propMeta}>
          {item.averageRating > 0 && (
            <View style={styles.ratingRow}>
              <StarIcon color={ACCENT} size={11} filled />
              <Text style={[styles.ratingText, { color: colors.textMuted }]}> {item.averageRating?.toFixed(1)}</Text>
            </View>
          )}
          {item.roomTypes?.length > 0 && (
            <Text style={[styles.roomTypeText, { color: colors.textMuted }]}>
              {item.roomTypes.length} room type{item.roomTypes.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

export default function AccommodationOverviewScreen({ user }) {
  const { colors } = useTheme();
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await apiGet('/accommodations/my-accommodations/all');
      setAccommodations(res.accommodations || res.data || []);
    } catch (err) {
      console.error('Accommodation load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const displayName = user?.name?.split(' ')[0] || 'Host';
  const approved = accommodations.filter(a => a.status === 'approved' || a.status === 'active').length;
  const pending = accommodations.filter(a => a.status === 'pending_review' || a.status === 'pending').length;
  const totalRooms = accommodations.reduce((s, a) => s + (a.roomTypes?.length || 0), 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>{greeting()},</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
        </View>
        {(user?.profileImage || user?.avatar) ? (
          <Image source={{ uri: user.profileImage || user.avatar }}
            style={[styles.avatar, { borderWidth: 2, borderColor: ACCENT }]} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: ACCENT }]}>
            <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={ACCENT} colors={[ACCENT]} />}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading your dashboard...</Text>
          </View>
        ) : (
          <>
            {/* Stats */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: ACCENT }]}>OVERVIEW</Text>
              <View style={styles.statsGrid}>
                <StatCard Icon={HomeIcon} label="Properties" value={accommodations.length} color={ACCENT} colors={colors} />
                <StatCard Icon={ShieldCheckIcon} label="Approved" value={approved} color="#22c55e" colors={colors} />
                <StatCard Icon={CalendarIcon} label="Pending" value={pending} color="#f59e0b" colors={colors} />
                <StatCard Icon={BarChartIcon} label="Room Types" value={totalRooms} color="#3b82f6" colors={colors} />
              </View>
            </View>

            {/* Properties list */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: ACCENT }]}>MY PROPERTIES</Text>
              {accommodations.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <View style={[styles.emptyIcon, { backgroundColor: ACCENT + '18' }]}>
                    <HomeIcon color={ACCENT} size={30} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Properties Yet</Text>
                  <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                    Register your accommodation at{'\n'}axxspace.com/accommodation
                  </Text>
                </View>
              ) : (
                accommodations.map(item => (
                  <PropertyCard key={item._id} item={item} colors={colors} />
                ))
              )}
            </View>
          </>
        )}
        <View style={{ height: Spacing.six }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: 14, borderBottomWidth: 1 },
  greeting: { fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.3 },
  userName: { fontSize: FontSize.xl, fontWeight: '900', letterSpacing: -0.3 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 18, fontWeight: '900' },
  loadingWrap: { paddingTop: 100, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: FontSize.base },
  section: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: Spacing.two },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  statCard: { flex: 1, minWidth: '44%', borderWidth: 1, borderRadius: BorderRadius.lg, padding: 12, alignItems: 'center', gap: 6 },
  statIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: FontSize.lg, fontWeight: '900', letterSpacing: -0.3 },
  statLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  propCard: { borderWidth: 1, borderRadius: BorderRadius.xl, marginBottom: 12, overflow: 'hidden' },
  propImage: { width: '100%', height: 160 },
  propImagePlaceholder: { width: '100%', height: 100, justifyContent: 'center', alignItems: 'center' },
  propBody: { padding: Spacing.three },
  propTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  propName: { flex: 1, fontSize: FontSize.md, fontWeight: '800', letterSpacing: -0.2, marginRight: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  locationText: { fontSize: FontSize.sm },
  propMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: FontSize.sm },
  roomTypeText: { fontSize: FontSize.sm },
  emptyCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.four, alignItems: 'center', gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '800' },
  emptyBody: { fontSize: FontSize.base, textAlign: 'center', lineHeight: 22 },
});
