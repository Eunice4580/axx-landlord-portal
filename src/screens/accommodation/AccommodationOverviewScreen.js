import React, { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import {
  HomeIcon, BarChartIcon, CalendarIcon, StarIcon,
  LocationIcon, ShieldCheckIcon, PlusIcon, EditIcon, TrashIcon,
} from './AccomIcons';
import RegisterAccommodationScreen from './RegisterAccommodationScreen';

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
  approved: { bg: '#22c55e18', border: '#22c55e40', text: '#22c55e', label: 'Live' },
  active:   { bg: '#22c55e18', border: '#22c55e40', text: '#22c55e', label: 'Live' },
  pending_review: { bg: '#f59e0b18', border: '#f59e0b40', text: '#f59e0b', label: 'Under Review' },
  pending:  { bg: '#f59e0b18', border: '#f59e0b40', text: '#f59e0b', label: 'Under Review' },
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

function PropertyCard({ item, colors, onEdit, onDelete }) {
  const st = getStatus(item.status);
  // Images come back as AccommodationImage objects { imageUrl, ... } or plain strings
  const resolveImgUri = (img) => {
    if (!img) return null;
    if (typeof img === 'string') return img;
    return img.imageUrl || img.url || null;
  };
  const img = resolveImgUri(item.primaryImage) || resolveImgUri(item.images?.[0]) || null;
  const price = item.pricing?.basePrice || item.basePrice;
  const photosCount = item.images?.length || 0;
  const viewsCount = item.views || 0;
  const isPending = item.status === 'pending' || item.status === 'pending_review';
  const isRejected = item.status === 'rejected';

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

        {(item.category || item.type || item.location?.town || item.location?.county || item.town || item.county) && (
          <View style={styles.locationRow}>
            {item.category || item.type ? (
              <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                {item.category || item.type} ·{' '}
              </Text>
            ) : null}
            <LocationIcon color={colors.textMuted} size={12} />
            <Text style={[styles.locationText, { color: colors.textMuted }]}>
              {' '}{[item.location?.town || item.town, item.location?.county || item.county].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.propMeta}>
          {price ? (
            <Text style={[styles.priceText, { color: ACCENT }]}>
              KSh {Number(price).toLocaleString()} <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '400' }}>/ night</Text>
            </Text>
          ) : null}

          {item.averageRating > 0 && (
            <View style={styles.ratingRow}>
              <StarIcon color={ACCENT} size={11} filled />
              <Text style={[styles.ratingText, { color: colors.textMuted }]}> {item.averageRating?.toFixed(1)}</Text>
            </View>
          )}

          <Text style={[styles.roomTypeText, { color: colors.textMuted }]}>
            {photosCount} photo{photosCount !== 1 ? 's' : ''} · {viewsCount} view{viewsCount !== 1 ? 's' : ''}
          </Text>
        </View>

        {isPending && (
          <Text style={[styles.statusNote, { color: '#d97706' }]}>
            Under review — usually within 24 hours.
          </Text>
        )}

        {isRejected && (
          <Text style={[styles.statusNote, { color: '#dc2626' }]}>
            Not approved — edit and resubmit for review.
          </Text>
        )}

        {/* Action buttons: Edit & upload media & Delete */}
        <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: ACCENT + '40', backgroundColor: ACCENT + '12' }]} onPress={() => onEdit(item)}>
            <EditIcon color={ACCENT} size={14} />
            <Text style={[styles.actionBtnText, { color: ACCENT }]}> Edit & upload media</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.deleteBtn, { borderColor: '#ef444440', backgroundColor: '#ef444410' }]} onPress={() => onDelete(item)}>
            <TrashIcon color="#ef4444" size={14} />
            <Text style={[styles.deleteBtnText, { color: '#ef4444' }]}> Delete</Text>
          </TouchableOpacity>
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
  const [editingItem, setEditingItem] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await apiGet('/accommodations/my-accommodations/all');
      setAccommodations(res.accommodations || res.data || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Accommodation load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-sync: deleted/updated items on the website reflect here automatically
  useEffect(() => {
    loadData();
    const appStateSub = AppState.addEventListener('change', s => {
      if (s === 'active') loadData();
    });
    const poll = setInterval(() => loadData(), 60000);
    return () => { appStateSub.remove(); clearInterval(poll); };
  }, [loadData]);

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Accommodation',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('accom_token');
              const res = await fetch(`${API_BASE}/accommodations/${item._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete property');
              }
              setAccommodations(prev => prev.filter(a => a._id !== item._id));
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not delete property.');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsRegistering(true);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const displayName = user?.name ? user.name.split(' ')[0] : 'Host';
  const approved = accommodations.filter(a => a.status === 'approved' || a.status === 'active').length;
  const pending = accommodations.filter(a => a.status === 'pending_review' || a.status === 'pending').length;
  const totalViews = accommodations.reduce((s, a) => s + (a.views || 0), 0);

  if (isRegistering) {
    return (
      <RegisterAccommodationScreen
        itemToEdit={editingItem}
        onBack={() => {
          setIsRegistering(false);
          setEditingItem(null);
        }}
        onSuccess={() => {
          setIsRegistering(false);
          setEditingItem(null);
          loadData();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>{greeting()},</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={styles.addHeaderBtn}
            onPress={() => {
              setEditingItem(null);
              setIsRegistering(true);
            }}
          >
            <PlusIcon color="#fff" size={14} />
            <Text style={styles.addHeaderBtnText}> Add</Text>
          </TouchableOpacity>

          {(user?.profileImage || user?.avatar) ? (
            <Image
              source={{ uri: user.profileImage || user.avatar }}
              style={[styles.avatar, { borderWidth: 2, borderColor: ACCENT }]}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: ACCENT }]}>
              <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
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
                <StatCard Icon={HomeIcon} label="Total Properties" value={accommodations.length} color={ACCENT} colors={colors} />
                <StatCard Icon={ShieldCheckIcon} label="Live" value={approved} color="#16a34a" colors={colors} />
                <StatCard Icon={CalendarIcon} label="Under Review" value={pending} color="#d97706" colors={colors} />
                <StatCard Icon={BarChartIcon} label="Total Views" value={totalViews} color="#0ea5e9" colors={colors} />
              </View>
            </View>

            {/* Properties list */}
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two }}>
                <Text style={[styles.sectionLabel, { color: ACCENT, marginBottom: 0 }]}>MY PROPERTIES</Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => {
                    setEditingItem(null);
                    setIsRegistering(true);
                  }}
                >
                  <PlusIcon color={ACCENT} size={14} />
                  <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '800' }}> Add</Text>
                </TouchableOpacity>
              </View>

              {accommodations.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <View style={[styles.emptyIcon, { backgroundColor: ACCENT + '18' }]}>
                    <HomeIcon color={ACCENT} size={32} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No properties submitted yet.</Text>
                  <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                    You haven't listed any accommodation properties yet. Add your property directly from the app.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={() => {
                      setEditingItem(null);
                      setIsRegistering(true);
                    }}
                  >
                    <PlusIcon color="#fff" size={16} />
                    <Text style={styles.emptyActionBtnText}> Add Property</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                accommodations.map(item => (
                  <PropertyCard
                    key={item._id}
                    item={item}
                    colors={colors}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingVertical: 14, borderBottomWidth: 1,
  },
  greeting: { fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.3 },
  userName: { fontSize: FontSize.xl, fontWeight: '900', letterSpacing: -0.3 },
  subGreeting: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 18, fontWeight: '900' },
  addHeaderBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: ACCENT,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.md,
  },
  addHeaderBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  loadingWrap: { paddingTop: 100, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: FontSize.base },
  section: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: Spacing.two },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  statCard: {
    flex: 1, minWidth: '44%', borderWidth: 1, borderRadius: BorderRadius.lg,
    padding: 12, alignItems: 'center', gap: 6,
  },
  statIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: FontSize.lg, fontWeight: '900', letterSpacing: -0.3 },
  statLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  propCard: { borderWidth: 1, borderRadius: BorderRadius.xl, marginBottom: 14, overflow: 'hidden' },
  propImage: { width: '100%', height: 160 },
  propImagePlaceholder: { width: '100%', height: 100, justifyContent: 'center', alignItems: 'center' },
  propBody: { padding: Spacing.three },
  propTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  propName: { flex: 1, fontSize: FontSize.md, fontWeight: '800', letterSpacing: -0.2, marginRight: 8 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  statusText: { fontSize: 10, fontWeight: '800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' },
  categoryText: { fontSize: FontSize.sm, fontWeight: '700' },
  locationText: { fontSize: FontSize.sm },
  propMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, flexWrap: 'wrap' },
  priceText: { fontSize: 14, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: FontSize.sm },
  roomTypeText: { fontSize: FontSize.sm },
  statusNote: { fontSize: 11, fontWeight: '600', marginTop: 8 },
  cardActions: {
    flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 10, borderTopWidth: 1,
  },
  actionBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '800' },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  deleteBtnText: { fontSize: 12, fontWeight: '800' },
  emptyCard: {
    borderWidth: 1, borderRadius: BorderRadius.xl, padding: 28,
    alignItems: 'center', marginTop: 8,
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20, justifyContent: 'center',
    alignItems: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  emptyBody: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  emptyActionBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: ACCENT,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: BorderRadius.lg,
  },
  emptyActionBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
