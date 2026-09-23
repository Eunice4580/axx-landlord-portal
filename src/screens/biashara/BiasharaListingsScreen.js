import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { biasharaMaterialsAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { BarChartIcon, CheckIcon, AlertIcon, RefreshIcon } from './Icons';

const ACCENT = '#fbbf24';

const STATUS_COLORS = {
  active:   { bg: '#22c55e18', border: '#22c55e40', text: '#22c55e', label: 'Live' },
  approved: { bg: '#22c55e18', border: '#22c55e40', text: '#22c55e', label: 'Live' },
  pending:  { bg: '#f59e0b18', border: '#f59e0b40', text: '#f59e0b', label: 'Pending Review' },
  sold:     { bg: '#3b82f618', border: '#3b82f640', text: '#3b82f6', label: 'Sold' },
  rejected: { bg: '#ef444418', border: '#ef444440', text: '#ef4444', label: 'Rejected' },
};

function getStatusConfig(status) {
  const raw = (status || 'pending').toLowerCase();
  return STATUS_COLORS[raw] || STATUS_COLORS.pending;
}

function ListingCard({ item, onMarkSold, onDelete, colors }) {
  const status = getStatusConfig(item.status);
  const price = item.price ? `KES ${Number(item.price).toLocaleString()}` : 'Price TBD';
  const imageUrl = item.images?.[0] || item.image;

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      {/* Image or placeholder */}
      <View style={[styles.cardImg, { backgroundColor: colors.background }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.img} resizeMode="cover" />
        ) : (
          <View style={styles.noImg}>
            <BarChartIcon color={colors.border} size={32} />
          </View>
        )}
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.border }]}>
          <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title || 'Untitled'}</Text>
        <Text style={[styles.cardPrice, { color: ACCENT }]}>{price}</Text>
        {item.category && (
          <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{item.category}</Text>
        )}
        <View style={styles.engRow}>
          {item.views > 0 && <Text style={[styles.engText, { color: colors.textMuted }]}>{item.views} views</Text>}
          {item.createdAt && (
            <Text style={[styles.engText, { color: colors.textMuted }]}>
              {item.views > 0 ? '  ·  ' : ''}{new Date(item.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: '2-digit' })}
            </Text>
          )}
        </View>

        {/* Actions */}
        {item.status !== 'sold' && item.status !== 'rejected' && (
          <View style={styles.cardBtns}>
            {item.status === 'active' || item.status === 'approved' ? (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#22c55e18', borderColor: '#22c55e40' }]}
                onPress={() => onMarkSold(item._id, item.title)}
              >
                <CheckIcon color="#22c55e" size={13} />
                <Text style={[styles.actionBtnText, { color: '#22c55e' }]}> Mark Sold</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#ef444418', borderColor: '#ef444440' }]}
              onPress={() => onDelete(item._id, item.title)}
            >
              <AlertIcon color="#ef4444" size={13} />
              <Text style={[styles.actionBtnText, { color: '#ef4444' }]}> Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export default function BiasharaListingsScreen({ user }) {
  const { colors } = useTheme();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'pending' | 'sold'
  const [actionLoading, setActionLoading] = useState(null);

  const loadListings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await biasharaMaterialsAPI.getMyListings();
      setListings(res.materials || res.data || res || []);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load listings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadListings(); }, [loadListings]);

  const handleMarkSold = (id, title) => {
    Alert.alert('Mark as Sold', `Mark "${title || 'this listing'}" as sold?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Sold',
        onPress: async () => {
          setActionLoading(id);
          try {
            await biasharaMaterialsAPI.markAsSold(id);
            setListings(prev => prev.map(l => l._id === id ? { ...l, status: 'sold' } : l));
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to mark as sold.');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleDelete = (id, title) => {
    Alert.alert('Delete Listing', `Delete "${title || 'this listing'}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(id);
          try {
            await biasharaMaterialsAPI.deleteListing(id);
            setListings(prev => prev.filter(l => l._id !== id));
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to delete listing.');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const filtered = listings.filter(l => {
    if (filter === 'all') return true;
    const raw = (l.status || '').toLowerCase();
    if (filter === 'active') return raw === 'active' || raw === 'approved';
    return raw === filter;
  });

  const FILTERS = [
    { key: 'all', label: `All (${listings.length})` },
    { key: 'active', label: `Live (${listings.filter(l => l.status === 'active' || l.status === 'approved').length})` },
    { key: 'pending', label: `Pending (${listings.filter(l => l.status === 'pending').length})` },
    { key: 'sold', label: `Sold (${listings.filter(l => l.status === 'sold').length})` },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Listings</Text>
        <TouchableOpacity onPress={() => loadListings(true)} style={styles.refreshBtn}>
          <RefreshIcon color={ACCENT} size={18} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      {!loading && (
        <View style={[styles.filterRow, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterTab, filter === f.key && { borderBottomColor: ACCENT }]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterTabText, { color: filter === f.key ? ACCENT : colors.textMuted }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading your listings…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <BarChartIcon color={colors.border} size={48} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No listings found</Text>
          <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
            {filter === 'all'
              ? 'You have no listings yet. Add them at axxspace.com/axxbiashara'
              : `No ${filter} listings.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadListings(true)} tintColor={ACCENT} colors={[ACCENT]} />}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              {actionLoading === item._id ? (
                <View style={[styles.card, styles.loadingCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <ActivityIndicator color={ACCENT} />
                </View>
              ) : (
                <ListingCard
                  item={item}
                  onMarkSold={handleMarkSold}
                  onDelete={handleDelete}
                  colors={colors}
                />
              )}
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, borderBottomWidth: 1 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800' },
  refreshBtn: { padding: 6 },
  filterRow: { flexDirection: 'row', borderBottomWidth: 1 },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterTabText: { fontSize: 11, fontWeight: '700' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: FontSize.base },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four, gap: 12 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '800' },
  emptyBody: { fontSize: FontSize.base, textAlign: 'center', lineHeight: 22 },
  row: { gap: 10 },
  listContent: { padding: Spacing.two, paddingBottom: Spacing.six },
  cardWrap: { flex: 1 },
  card: { borderWidth: 1, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  loadingCard: { height: 200, justifyContent: 'center', alignItems: 'center' },
  cardImg: { aspectRatio: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  img: { width: '100%', height: '100%' },
  noImg: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBadge: { position: 'absolute', top: 8, left: 8, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  statusText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: FontSize.sm, fontWeight: '700', marginBottom: 4 },
  cardPrice: { fontSize: FontSize.md, fontWeight: '800', marginBottom: 2 },
  cardMeta: { fontSize: 11, marginBottom: 4 },
  engRow: { flexDirection: 'row', marginBottom: 8 },
  engText: { fontSize: 11 },
  cardBtns: { flexDirection: 'row', gap: 6 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 6, paddingVertical: 6 },
  actionBtnText: { fontSize: 11, fontWeight: '700' },
});
