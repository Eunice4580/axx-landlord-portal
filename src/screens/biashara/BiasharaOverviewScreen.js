import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Linking, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { biasharaBusinessAPI, biasharaMaterialsAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import {
  PhoneIcon, MessageIcon, GlobeIcon, StarIcon, LocationIcon,
  ShieldCheckIcon, BarChartIcon, UserIcon, StoreIcon,
} from './Icons';

const ACCENT = '#fbbf24';

function StatCard({ Icon, label, value, color }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: color + '28' }]}>
      <Icon color={color} size={18} />
      <Text style={[styles.statValue, { color }]}>{value ?? '—'}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function ReviewCard({ review, colors }) {
  return (
    <View style={[styles.reviewCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={styles.reviewHeader}>
        <View style={[styles.reviewerAvatar, { backgroundColor: ACCENT + '20' }]}>
          <UserIcon color={ACCENT} size={14} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.reviewerName, { color: colors.text }]}>{review.userName || 'Anonymous'}</Text>
          <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
            {[1,2,3,4,5].map(i => (
              <StarIcon key={i} color={ACCENT} size={11} filled={i <= (review.rating || 0)} />
            ))}
          </View>
        </View>
        <Text style={[styles.reviewDate, { color: colors.textMuted }]}>
          {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : ''}
        </Text>
      </View>
      {review.comment ? (
        <Text style={[styles.reviewComment, { color: colors.textSecondary }]} numberOfLines={3}>
          {review.comment}
        </Text>
      ) : null}
    </View>
  );
}

export default function BiasharaOverviewScreen({ user, onLogout }) {
  const { colors } = useTheme();
  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, liveItems: 0, pendingReview: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [bizRes, revRes, matRes] = await Promise.allSettled([
        biasharaBusinessAPI.getMyBusiness(),
        biasharaBusinessAPI.getMyReviews(),
        biasharaMaterialsAPI.getMyListings(),
      ]);
      if (bizRes.status === 'fulfilled') setBusiness(bizRes.value.business || bizRes.value || null);
      if (revRes.status === 'fulfilled') setReviews(revRes.value.reviews || revRes.value || []);
      if (matRes.status === 'fulfilled') {
        const materials = matRes.value.materials || matRes.value.data || matRes.value || [];
        const resolveStatus = (m) => (m.status || 'pending').toLowerCase();
        const liveItems = materials.filter(m => resolveStatus(m) === 'active' || resolveStatus(m) === 'approved').length;
        const pendingReview = materials.filter(m => resolveStatus(m) === 'pending').length;
        const totalViews = materials.reduce((sum, m) => sum + (m.views || 0), 0);
        const revenue = materials
          .filter(m => resolveStatus(m) === 'sold')
          .reduce((sum, m) => sum + (Number(m.price) || 0), 0);
        setStats({ revenue, liveItems, pendingReview, totalViews });
      }
    } catch (err) {
      console.error('Overview load error:', err);
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
  const displayName = user?.name?.split(' ')[0] || 'Owner';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>{greeting()},</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
        </View>
        {/* Profile avatar: show photo if available, else initial letter */}
        {(user?.profileImage || user?.avatar)
          ? <Image
              source={{ uri: user.profileImage || user.avatar }}
              style={[styles.avatar, { borderWidth: 2, borderColor: ACCENT }]}
            />
          : <View style={[styles.avatar, { backgroundColor: ACCENT }]}>
              <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
        }
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={ACCENT} colors={[ACCENT]} />}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading your dashboard…</Text>
          </View>
        ) : business ? (
          <>
            {/* Business card */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: ACCENT }]}>MY BUSINESS</Text>
              <View style={[styles.bizCard, { backgroundColor: colors.backgroundElement, borderColor: ACCENT + '30' }]}>
                <View style={styles.bizCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bizName, { color: colors.text }]} numberOfLines={1}>{business.name}</Text>
                    <Text style={[styles.bizCategory, { color: colors.textMuted }]}>
                      {business.categories?.[0] || business.category || 'Business'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor: business.verified ? '#22c55e18' : '#f59e0b18',
                    borderColor: business.verified ? '#22c55e40' : '#f59e0b40',
                  }]}>
                    {business.verified && <ShieldCheckIcon color="#22c55e" size={12} />}
                    <Text style={[styles.statusText, { color: business.verified ? '#22c55e' : '#f59e0b' }]}>
                      {' '}{business.verified ? 'Verified' : 'Pending Verification'}
                    </Text>
                  </View>
                </View>

                {/* Location */}
                {(business.location?.town || business.location?.county) && (
                  <View style={styles.locationRow}>
                    <LocationIcon color={colors.textMuted} size={13} />
                    <Text style={[styles.locationText, { color: colors.textMuted }]}>
                      {' '}{[business.location?.town, business.location?.county].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                )}

                {/* Stats grid — matches website: Revenue, Live, Pending, Views */}
                <View style={styles.statsGrid}>
                  <StatCard Icon={BarChartIcon} label="Revenue" value={`KES ${stats.revenue.toLocaleString()}`} color="#22c55e" />
                  <StatCard Icon={ShieldCheckIcon} label="Live Listings" value={stats.liveItems} color={ACCENT} />
                  <StatCard Icon={StarIcon} label="Pending" value={stats.pendingReview} color="#f59e0b" />
                  <StatCard Icon={UserIcon} label="Total Views" value={stats.totalViews} color="#3b82f6" />
                </View>

                {/* Quick contact actions */}
                <View style={styles.contactActions}>
                  {business.contact?.phone && (
                    <TouchableOpacity style={[styles.contactBtn, { borderColor: '#22c55e40', backgroundColor: '#22c55e12' }]}
                      onPress={() => Linking.openURL(`tel:${business.contact.phone}`)}>
                      <PhoneIcon color="#22c55e" size={14} />
                      <Text style={[styles.contactBtnText, { color: '#22c55e' }]}> Call</Text>
                    </TouchableOpacity>
                  )}
                  {(business.socialMedia?.whatsapp || business.contact?.phone) && (
                    <TouchableOpacity style={[styles.contactBtn, { borderColor: '#22c55e40', backgroundColor: '#22c55e12' }]}
                      onPress={() => Linking.openURL(`https://wa.me/${(business.socialMedia?.whatsapp || business.contact?.phone).replace(/[^0-9]/g, '')}`)}>
                      <MessageIcon color="#22c55e" size={14} />
                      <Text style={[styles.contactBtnText, { color: '#22c55e' }]}> WhatsApp</Text>
                    </TouchableOpacity>
                  )}
                  {business.contact?.website && (
                    <TouchableOpacity style={[styles.contactBtn, { borderColor: '#3b82f640', backgroundColor: '#3b82f612' }]}
                      onPress={() => Linking.openURL(business.contact.website.startsWith('http') ? business.contact.website : `https://${business.contact.website}`)}>
                      <GlobeIcon color="#3b82f6" size={14} />
                      <Text style={[styles.contactBtnText, { color: '#3b82f6' }]}> Website</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Reviews */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: ACCENT }]}>RECENT REVIEWS</Text>
              {reviews.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <StarIcon color={colors.border} size={32} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No reviews yet</Text>
                  <Text style={[styles.emptyBody, { color: colors.textMuted }]}>Customer reviews will appear here.</Text>
                </View>
              ) : (
                reviews.slice(0, 10).map((r, i) => (
                  <ReviewCard key={r._id || i} review={r} colors={colors} />
                ))
              )}
            </View>
          </>
        ) : (
          /* No business listed */
          <View style={styles.section}>
            <View style={[styles.noBizCard, { backgroundColor: colors.backgroundElement, borderColor: ACCENT + '30' }]}>
              <StoreIcon color={ACCENT} size={40} />
              <Text style={[styles.noBizTitle, { color: colors.text }]}>No Business Found</Text>
              <Text style={[styles.noBizBody, { color: colors.textMuted }]}>
                Your account is not linked to any business listing yet.{'\n\n'}
                Contact AxxBiashara support or visit the website to add your business, then come back and sign in to manage it here.
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: Spacing.six }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, borderBottomWidth: 1 },
  greeting: { fontSize: FontSize.sm, fontWeight: '600' },
  userName: { fontSize: FontSize.xl, fontWeight: '800' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#0f172a', fontSize: 18, fontWeight: '900' },
  loadingWrap: { paddingTop: 100, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: FontSize.base },
  section: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: Spacing.two },
  bizCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.three },
  bizCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  bizName: { fontSize: FontSize.xl, fontWeight: '800', marginBottom: 2 },
  bizCategory: { fontSize: FontSize.sm },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  locationText: { fontSize: FontSize.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statCard: { flex: 1, minWidth: '45%', borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.two, alignItems: 'center', gap: 4 },
  statValue: { fontSize: FontSize.xl, fontWeight: '900' },
  statLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  contactActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.sm, paddingHorizontal: 12, paddingVertical: 7 },
  contactBtnText: { fontSize: 12, fontWeight: '700' },
  reviewCard: { borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.three, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewerAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  reviewerName: { fontSize: FontSize.sm, fontWeight: '700' },
  reviewDate: { fontSize: 11 },
  reviewComment: { fontSize: FontSize.sm, lineHeight: 18 },
  emptyCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.four, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '800' },
  emptyBody: { fontSize: FontSize.sm, textAlign: 'center', color: '#94a3b8' },
  noBizCard: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: BorderRadius.xl, padding: Spacing.four, alignItems: 'center', gap: 12 },
  noBizTitle: { fontSize: FontSize.xl, fontWeight: '800' },
  noBizBody: { fontSize: FontSize.base, textAlign: 'center', lineHeight: 22 },
  noBizBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, paddingHorizontal: 20, paddingVertical: 12, gap: 6 },
  noBizBtnText: { color: '#0f172a', fontWeight: '800', fontSize: FontSize.base },
});
