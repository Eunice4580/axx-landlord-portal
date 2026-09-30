import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Image, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { biasharaBusinessAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import {
  GridIcon, StoreIcon, UserIcon, ArrowLeftIcon,
  StarIcon, CheckIcon, AlertIcon, LogoutIcon,
} from './Icons';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';

const ACCENT = '#fbbf24';
const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

/* ── Inline icons ──────────────────────────────────────────────── */
const EyeIcon = ({ color = '#94a3b8', size = 15 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Circle cx="12" cy="12" r="3" />
  </Svg>
);
const MessageIcon = ({ color = '#94a3b8', size = 15 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

const LocationIcon = ({ color = '#94a3b8', size = 13 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx="12" cy="10" r="3" />
  </Svg>
);
const TrendingIcon = ({ color = '#94a3b8', size = 15 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><Polyline points="17 6 23 6 23 12" />
  </Svg>
);
const InboxIcon = ({ color = '#94a3b8', size = 15 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <Path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </Svg>
);

/* ── Status helpers ──────────────────────────────────────────────── */
const STATUS = {
  active:   { bg: '#22c55e18', border: '#22c55e40', text: '#22c55e', label: 'Live' },
  approved: { bg: '#22c55e18', border: '#22c55e40', text: '#22c55e', label: 'Live' },
  pending:  { bg: ACCENT + '18', border: ACCENT + '40', text: ACCENT, label: 'Pending' },
  rejected: { bg: '#ef444418', border: '#ef444440', text: '#ef4444', label: 'Rejected' },
  archived: { bg: '#ef444418', border: '#ef444440', text: '#ef4444', label: 'Archived' },
};
const getStatus = s => STATUS[(s || 'pending').toLowerCase()] || STATUS.pending;

function StatCard({ icon, label, value, color, colors }) {
  return (
    <View style={[s.statCard, { backgroundColor: colors.backgroundElement, borderColor: color + '28' }]}>
      <View style={[s.statIcon, { backgroundColor: color + '18' }]}>{icon}</View>
      <Text style={[s.statValue, { color }]}>{value ?? '—'}</Text>
      <Text style={[s.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}



function StarRow({ rating, count, colors }) {
  return (
    <View style={s.starRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <StarIcon key={i} color={i <= Math.round(rating) ? ACCENT : colors.border} size={12} />
      ))}
      <Text style={[s.starText, { color: colors.textMuted }]}>
        {' '}{rating?.toFixed(1) || '0.0'} ({count || 0})
      </Text>
    </View>
  );
}

export default function BiasharaOverviewScreen({ user, onLogout, onRegisterBusiness }) {
  const { colors } = useTheme();
  const [businesses, setBusinesses] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [inquiries, setInquiries] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [bizRes, reviewRes, inquiryRes] = await Promise.allSettled([
        biasharaBusinessAPI.getMyBusiness(),
        biasharaBusinessAPI.getMyReviews(),
        biasharaBusinessAPI.getMyInquiries(),
      ]);

      const bizList = bizRes.status === 'fulfilled'
        ? (bizRes.value?.businesses || bizRes.value?.data || []) : [];
      setBusinesses(bizList);

      if (reviewRes.status === 'fulfilled') {
        setReviews(reviewRes.value?.reviews || reviewRes.value || []);
      }
      if (inquiryRes.status === 'fulfilled') {
        setInquiries(inquiryRes.value?.inquiries || inquiryRes.value || []);
      }

      // Load analytics per business
      const analyticsMap = {};
      await Promise.allSettled(
        bizList.map(async (biz) => {
          try {
            const res = await biasharaBusinessAPI.getBusinessAnalytics(biz._id);
            analyticsMap[biz._id] = res?.analytics || res || {};
          } catch (_) {}
        })
      );
      setAnalytics(analyticsMap);
    } catch (err) {
      console.error('Overview load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const displayName = user?.name?.split(' ')[0] || 'Business Owner';
  const avatarUrl = user?.profileImage || user?.avatar;

  // Aggregated stats
  const totalViews = Object.values(analytics).reduce((sum, a) => sum + (a.views || 0), 0);
  const totalClicks = Object.values(analytics).reduce((sum, a) => sum + (a.contactClicks || 0) + (a.websiteClicks || 0), 0);
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '—';
  const pendingInquiries = inquiries.filter(i => i.status === 'pending' || !i.response).length;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <View>
          <Text style={[s.greeting, { color: colors.textMuted }]}>{greeting()},</Text>
          <Text style={[s.userName, { color: colors.text }]}>{displayName}</Text>
        </View>
        {avatarUrl
          ? <Image source={{ uri: avatarUrl }} style={[s.avatar, { borderWidth: 2, borderColor: ACCENT }]} />
          : <View style={[s.avatar, { backgroundColor: ACCENT }]}>
              <Text style={s.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
        }
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAll(true)} tintColor={ACCENT} colors={[ACCENT]} />}
      >
        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={[s.loadingText, { color: colors.textMuted }]}>Loading workspace...</Text>
          </View>
        ) : (
          <>
            {/* Stats Grid */}
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: ACCENT }]}>OVERVIEW</Text>
              <View style={s.statsGrid}>
                <StatCard icon={<StoreIcon color={ACCENT} size={15} />}
                  label="Businesses" value={businesses.length} color={ACCENT} colors={colors} />
                <StatCard icon={<EyeIcon color="#3b82f6" size={15} />}
                  label="Total Views" value={totalViews} color="#3b82f6" colors={colors} />
                <StatCard icon={<StarIcon color="#f59e0b" size={15} />}
                  label="Avg Rating" value={avgRating} color="#f59e0b" colors={colors} />
                <StatCard icon={<InboxIcon color="#a78bfa" size={15} />}
                  label="Inquiries" value={`${pendingInquiries} new`} color="#a78bfa" colors={colors} />
              </View>
            </View>

            {/* Business Cards */}
            <View style={s.section}>
              <View style={s.sectionRow}>
                <Text style={[s.sectionLabel, { color: ACCENT }]}>MY DIRECTORY LISTINGS</Text>
                <TouchableOpacity
                  style={[s.registerBtn, { backgroundColor: ACCENT }]}
                  onPress={onRegisterBusiness}
                >
                  <Text style={s.registerBtnText}>+ Register Business</Text>
                </TouchableOpacity>
              </View>
              {businesses.length === 0 ? (
                <View style={[s.emptyCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <View style={[s.emptyIcon, { backgroundColor: ACCENT + '15' }]}>
                    <StoreIcon color={ACCENT} size={28} />
                  </View>
                  <Text style={[s.emptyTitle, { color: colors.text }]}>No Businesses Listed</Text>
                  <Text style={[s.emptyBody, { color: colors.textMuted }]}>
                    Register your first business listing to get started.
                  </Text>
                  <TouchableOpacity
                    style={[s.emptyRegisterBtn, { backgroundColor: ACCENT }]}
                    onPress={onRegisterBusiness}
                  >
                    <Text style={s.emptyRegisterText}>Register a Business</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                businesses.map(biz => {
                  const st = getStatus(biz.status);
                  const a = analytics[biz._id] || {};
                  const bizReviews = reviews.filter(r =>
                    r.business === biz._id || r.business?._id === biz._id
                  );
                  const avgR = bizReviews.length
                    ? bizReviews.reduce((s, r) => s + r.rating, 0) / bizReviews.length : 0;

                  return (
                    <View key={biz._id} style={[s.bizCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                      {/* Card header */}
                      <View style={s.bizCardHeader}>
                        {biz.logo
                          ? <Image source={{ uri: biz.logo }} style={s.bizLogo} />
                          : <View style={[s.bizLogoPlaceholder, { backgroundColor: ACCENT + '20' }]}>
                              <StoreIcon color={ACCENT} size={18} />
                            </View>
                        }
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={[s.bizName, { color: colors.text }]} numberOfLines={1}>{biz.name}</Text>
                          {(biz.location?.town || biz.location?.county) && (
                            <View style={s.locationRow}>
                              <LocationIcon color={colors.textMuted} size={11} />
                              <Text style={[s.locationText, { color: colors.textMuted }]}>
                                {' '}{[biz.location?.town, biz.location?.county].filter(Boolean).join(', ')}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={[s.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
                          <Text style={[s.statusText, { color: st.text }]}>{st.label}</Text>
                        </View>
                      </View>

                      {biz.description ? (
                        <Text style={[s.bizDesc, { color: colors.textMuted }]} numberOfLines={2}>
                          {biz.description}
                        </Text>
                      ) : null}

                      {/* Categories */}
                      {biz.categories?.length > 0 && (
                        <View style={s.categoriesRow}>
                          {biz.categories.slice(0, 3).map(c => (
                            <View key={c} style={[s.catChip, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '30' }]}>
                              <Text style={[s.catText, { color: ACCENT }]}>{c}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={[s.divider, { backgroundColor: colors.border }]} />

                      {/* Analytics row */}
                      <View style={s.analyticsRow}>
                        <View style={s.analyticsItem}>
                          <EyeIcon color="#3b82f6" size={13} />
                          <Text style={[s.analyticsValue, { color: colors.text }]}> {a.views || 0}</Text>
                          <Text style={[s.analyticsLabel, { color: colors.textMuted }]}> views</Text>
                        </View>
                        <View style={s.analyticsItem}>
                          <TrendingIcon color="#22c55e" size={13} />
                          <Text style={[s.analyticsValue, { color: colors.text }]}> {(a.contactClicks || 0) + (a.websiteClicks || 0)}</Text>
                          <Text style={[s.analyticsLabel, { color: colors.textMuted }]}> clicks</Text>
                        </View>
                        <View style={s.analyticsItem}>
                          <MessageIcon color="#a78bfa" size={13} />
                          <Text style={[s.analyticsValue, { color: colors.text }]}>
                            {' '}{inquiries.filter(i => i.business === biz._id || i.business?._id === biz._id).length}
                          </Text>
                          <Text style={[s.analyticsLabel, { color: colors.textMuted }]}> inquiries</Text>
                        </View>
                        {bizReviews.length > 0 && (
                          <View style={s.analyticsItem}>
                            <StarIcon color={ACCENT} size={13} />
                            <Text style={[s.analyticsValue, { color: colors.text }]}>
                              {' '}{avgR.toFixed(1)}
                            </Text>
                            <Text style={[s.analyticsLabel, { color: colors.textMuted }]}> rating</Text>
                          </View>
                        )}
                      </View>

                      {/* Boost note for approved */}
                      {(biz.status === 'approved' || biz.status === 'active') && (
                        <View style={[s.boostNote, { backgroundColor: ACCENT + '10', borderColor: ACCENT + '25' }]}>
                          <Text style={[s.boostNoteText, { color: ACCENT }]}>
                            To boost this listing, visit axxspace.com/axxbiashara
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>

            {/* Recent Reviews */}
            {reviews.length > 0 && (
              <View style={s.section}>
                <Text style={[s.sectionLabel, { color: ACCENT }]}>RECENT REVIEWS</Text>
                {reviews.slice(0, 3).map((r, i) => (
                  <View key={r._id || i} style={[s.reviewCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                    <View style={s.reviewHeader}>
                      <View style={[s.reviewAvatar, { backgroundColor: ACCENT + '20' }]}>
                        <Text style={[s.reviewAvatarText, { color: ACCENT }]}>
                          {(r.reviewer?.name || r.author?.name || 'A').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={[s.reviewerName, { color: colors.text }]}>
                          {r.reviewer?.name || r.author?.name || 'Anonymous'}
                        </Text>
                        <StarRow rating={r.rating} count={null} colors={colors} />
                      </View>
                      <Text style={[s.reviewDate, { color: colors.textMuted }]}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : ''}
                      </Text>
                    </View>
                    {r.comment && (
                      <Text style={[s.reviewComment, { color: colors.textSecondary }]} numberOfLines={2}>
                        {r.comment}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Recent Inquiries */}
            {inquiries.length > 0 && (
              <View style={s.section}>
                <Text style={[s.sectionLabel, { color: ACCENT }]}>RECENT INQUIRIES</Text>
                {inquiries.slice(0, 3).map((inq, i) => (
                  <View key={inq._id || i} style={[s.inquiryCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                    <View style={s.inquiryHeader}>
                      <View style={[s.reviewAvatar, { backgroundColor: '#a78bfa20' }]}>
                        <Text style={[s.reviewAvatarText, { color: '#a78bfa' }]}>
                          {(inq.name || inq.senderName || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={[s.reviewerName, { color: colors.text }]}>
                          {inq.name || inq.senderName || 'Customer'}
                        </Text>
                        <Text style={[s.inquiryBusiness, { color: colors.textMuted }]}>
                          {inq.business?.name || ''}
                        </Text>
                      </View>
                      <View style={[s.inquiryStatus, {
                        backgroundColor: inq.response ? '#22c55e18' : ACCENT + '18',
                        borderColor: inq.response ? '#22c55e40' : ACCENT + '40',
                      }]}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: inq.response ? '#22c55e' : ACCENT }}>
                          {inq.response ? 'REPLIED' : 'NEW'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[s.inquiryMsg, { color: colors.textSecondary }]} numberOfLines={2}>
                      {inq.message || inq.inquiry || ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: Spacing.six }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingVertical: 14, borderBottomWidth: 1,
  },
  greeting: { fontSize: FontSize.xs, fontWeight: '600' },
  userName: { fontSize: FontSize.xl, fontWeight: '900', letterSpacing: -0.3 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#0f172a', fontSize: 18, fontWeight: '900' },
  loadingWrap: { paddingTop: 100, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: FontSize.base },

  section: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: Spacing.two },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { flex: 1, minWidth: '44%', borderWidth: 1, borderRadius: BorderRadius.lg, padding: 12, alignItems: 'center', gap: 5 },
  statIcon: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: FontSize.lg, fontWeight: '900', letterSpacing: -0.3 },
  statLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  bizCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.three, marginBottom: 12 },
  bizCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bizLogo: { width: 42, height: 42, borderRadius: 10 },
  bizLogoPlaceholder: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  bizName: { fontSize: FontSize.md, fontWeight: '800', letterSpacing: -0.2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  locationText: { fontSize: 11 },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '800' },
  bizDesc: { fontSize: FontSize.sm, lineHeight: 18, marginBottom: 8 },
  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  catChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  catText: { fontSize: 10, fontWeight: '700' },

  divider: { height: 1, marginVertical: 10, opacity: 0.4 },

  analyticsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  analyticsItem: { flexDirection: 'row', alignItems: 'center' },
  analyticsValue: { fontSize: 12, fontWeight: '800' },
  analyticsLabel: { fontSize: 11 },

  boostNote: { marginTop: 10, borderWidth: 1, borderRadius: 8, padding: 8 },
  boostNoteText: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  emptyCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.four, alignItems: 'center', gap: 12 },
  emptyIcon: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '800' },
  emptyBody: { fontSize: FontSize.base, textAlign: 'center', lineHeight: 22 },
  emptyRegisterBtn: { borderRadius: BorderRadius.lg, paddingVertical: 12, paddingHorizontal: 24, marginTop: 4 },
  emptyRegisterText: { color: '#0f172a', fontWeight: '900', fontSize: FontSize.base },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.two },
  registerBtn: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  registerBtnText: { color: '#0f172a', fontSize: 11, fontWeight: '800' },

  reviewCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.two + 4, marginBottom: 8 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  reviewAvatarText: { fontSize: 13, fontWeight: '800' },
  reviewerName: { fontSize: 13, fontWeight: '700' },
  starRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  starText: { fontSize: 11 },
  reviewDate: { fontSize: 10 },
  reviewComment: { fontSize: FontSize.sm, lineHeight: 18 },

  inquiryCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.two + 4, marginBottom: 8 },
  inquiryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  inquiryBusiness: { fontSize: 11, marginTop: 1 },
  inquiryStatus: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  inquiryMsg: { fontSize: FontSize.sm, lineHeight: 18 },
});
