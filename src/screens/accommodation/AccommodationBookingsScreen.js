import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { CalendarIcon, UserIcon, HomeIcon, RefreshIcon } from './AccomIcons';

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

const STATUS_MAP = {
  confirmed:  { bg: '#22c55e18', border: '#22c55e40', text: '#22c55e', label: 'Confirmed' },
  pending:    { bg: '#f59e0b18', border: '#f59e0b40', text: '#f59e0b', label: 'Pending' },
  cancelled:  { bg: '#ef444418', border: '#ef444440', text: '#ef4444', label: 'Cancelled' },
  completed:  { bg: '#3b82f618', border: '#3b82f640', text: '#3b82f6', label: 'Completed' },
  checked_in: { bg: '#8b5cf618', border: '#8b5cf640', text: '#8b5cf6', label: 'Checked In' },
};

function getStatusStyle(s) {
  return STATUS_MAP[(s || 'pending').toLowerCase()] || STATUS_MAP.pending;
}

function BookingCard({ item, colors }) {
  const st = getStatusStyle(item.status);
  const checkIn = item.checkIn ? new Date(item.checkIn).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const checkOut = item.checkOut ? new Date(item.checkOut).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const nights = item.checkIn && item.checkOut
    ? Math.round((new Date(item.checkOut) - new Date(item.checkIn)) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      {/* Property name */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconWrap, { backgroundColor: ACCENT + '18' }]}>
          <HomeIcon color={ACCENT} size={16} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.propName, { color: colors.text }]} numberOfLines={1}>
            {item.accommodation?.name || 'Accommodation'}
          </Text>
          {item.roomType?.name ? (
            <Text style={[styles.roomType, { color: colors.textMuted }]}>{item.roomType.name}</Text>
          ) : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
          <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Guest info */}
      <View style={styles.infoRow}>
        <UserIcon color={colors.textMuted} size={13} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          {' '}{item.guest?.name || item.guestName || 'Guest'}
        </Text>
      </View>

      {/* Dates */}
      <View style={styles.datesRow}>
        <View style={styles.dateBlock}>
          <Text style={[styles.dateLabel, { color: colors.textMuted }]}>CHECK-IN</Text>
          <Text style={[styles.dateValue, { color: colors.text }]}>{checkIn}</Text>
        </View>
        <View style={[styles.dateArrow, { backgroundColor: colors.border }]} />
        <View style={styles.dateBlock}>
          <Text style={[styles.dateLabel, { color: colors.textMuted }]}>CHECK-OUT</Text>
          <Text style={[styles.dateValue, { color: colors.text }]}>{checkOut}</Text>
        </View>
        {nights !== null && (
          <View style={[styles.nightsPill, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '30' }]}>
            <Text style={[styles.nightsText, { color: ACCENT }]}>{nights}N</Text>
          </View>
        )}
      </View>

      {/* Amount */}
      {item.totalAmount != null && (
        <View style={[styles.amountRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.amountLabel, { color: colors.textMuted }]}>Total</Text>
          <Text style={[styles.amountValue, { color: ACCENT }]}>
            KES {Number(item.totalAmount).toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function AccommodationBookingsScreen({ user }) {
  const { colors } = useTheme();
  const [accommodations, setAccommodations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const accomRes = await apiGet('/accommodations/my-accommodations/all');
      const accomList = accomRes.accommodations || accomRes.data || [];
      setAccommodations(accomList);

      const allBookings = [];
      await Promise.allSettled(
        accomList.map(async (a) => {
          try {
            const bRes = await apiGet(`/accommodation-bookings/accommodation/${a._id}/bookings`);
            const list = bRes.bookings || bRes || [];
            list.forEach(b => {
              allBookings.push({ ...b, accommodation: a });
            });
          } catch (_) {}
        })
      );
      // Sort newest first
      allBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBookings(allBookings);
    } catch (err) {
      console.error('Bookings load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const FILTERS = ['all', 'confirmed', 'pending', 'completed', 'cancelled'];
  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => (b.status || '').toLowerCase() === filter);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Bookings</Text>
        <TouchableOpacity onPress={() => loadData(true)} style={styles.refreshBtn}>
          <RefreshIcon color={ACCENT} size={18} />
        </TouchableOpacity>
      </View>

      {/* Filter pills */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <FlatList
          data={FILTERS}
          keyExtractor={f => f}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[styles.filterPill, {
                backgroundColor: filter === f ? ACCENT : 'transparent',
                borderColor: filter === f ? ACCENT : colors.border,
              }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, { color: filter === f ? '#fff' : colors.textMuted }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading bookings...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <CalendarIcon color={colors.border} size={40} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Bookings</Text>
          <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
            {filter === 'all' ? 'No bookings yet for your properties.' : `No ${filter} bookings found.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item._id || String(i)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={ACCENT} colors={[ACCENT]} />
          }
          renderItem={({ item }) => <BookingCard item={item} colors={colors} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '900' },
  refreshBtn: { padding: 6 },
  filterBar: { borderBottomWidth: 1 },
  filterList: { paddingHorizontal: Spacing.three, paddingVertical: 10, gap: 8 },
  filterPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  filterText: { fontSize: 12, fontWeight: '700' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: FontSize.base },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four, gap: 12 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '800' },
  emptyBody: { fontSize: FontSize.base, textAlign: 'center', lineHeight: 22 },
  listContent: { padding: Spacing.three, paddingBottom: Spacing.six },
  card: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.three, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardIconWrap: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  propName: { fontSize: FontSize.md, fontWeight: '800' },
  roomType: { fontSize: FontSize.sm, marginTop: 2 },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '800' },
  divider: { height: 1, marginBottom: 12, opacity: 0.4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { fontSize: FontSize.sm, fontWeight: '500' },
  datesRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dateBlock: { flex: 1 },
  dateLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  dateValue: { fontSize: FontSize.sm, fontWeight: '700' },
  dateArrow: { width: 20, height: 1 },
  nightsPill: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  nightsText: { fontSize: 11, fontWeight: '900' },
  amountRow: { borderTopWidth: 1, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { fontSize: FontSize.sm, fontWeight: '600' },
  amountValue: { fontSize: FontSize.md, fontWeight: '900' },
});
