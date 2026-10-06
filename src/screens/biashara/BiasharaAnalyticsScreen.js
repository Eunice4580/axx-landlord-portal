import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { biasharaBusinessAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import Svg, { Path, Circle, Polyline, Rect, Line, G, Text as SvgText } from 'react-native-svg';

const ACCENT = '#fbbf24';
const { width: SCREEN_W } = Dimensions.get('window');

/* ── Icons ──────────────────────────────────────────────────── */
const EyeIcon         = ({ c = '#3b82f6',  s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Circle cx="12" cy="12" r="3" />
  </Svg>
);
const PhoneIcon       = ({ c = '#10b981', s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.59 3.47 2 2 0 0 1 3.56 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81A16 16 0 0 0 16 16.92l.81-.81a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 23.73 18z" />
  </Svg>
);
const GlobeIcon       = ({ c = '#8b5cf6', s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" /><Line x1="2" y1="12" x2="22" y2="12" /><Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Svg>
);
const MapIcon         = ({ c = '#f97316', s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx="12" cy="10" r="3" />
  </Svg>
);
const HeartIcon       = ({ c = '#ec4899', s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Svg>
);
const StarIcon        = ({ c = ACCENT, s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);
const MessageIcon     = ({ c = '#a78bfa', s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);
const ArrowLeft       = ({ c = ACCENT, s = 20 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 12H5M12 5l-7 7 7 7" />
  </Svg>
);
const ChevronDown     = ({ c = '#94a3b8', s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="6 9 12 15 18 9" />
  </Svg>
);

/* ── Mini bar chart ─────────────────────────────────────────── */
function BarChart({ data, color, height = 80 }) {
  if (!data || data.length === 0) return null;
  const W      = SCREEN_W - 64;
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const barW   = Math.max(4, (W / data.length) - 3);
  const last7  = data.slice(-14); // show last 14 data points

  return (
    <Svg width={W} height={height + 20}>
      {last7.map((d, i) => {
        const barH = Math.max(3, ((d.count / maxVal) * height));
        const x    = i * ((W / last7.length));
        const y    = height - barH;
        return (
          <G key={i}>
            <Rect
              x={x + 1} y={y} width={Math.max(barW, 8)}
              height={barH} rx="3"
              fill={color + 'cc'}
            />
          </G>
        );
      })}
    </Svg>
  );
}

/* ── Stat Card ──────────────────────────────────────────────── */
function StatCard({ icon, label, value, color, colors, sub }) {
  return (
    <View style={[s.statCard, { backgroundColor: colors.backgroundElement, borderColor: color + '28' }]}>
      <View style={[s.statIconWrap, { backgroundColor: color + '15' }]}>{icon}</View>
      <Text style={[s.statValue, { color }]}>{value ?? '—'}</Text>
      <Text style={[s.statLabel, { color: colors.textMuted }]}>{label}</Text>
      {sub !== undefined && (
        <Text style={[s.statSub, { color: color + 'bb' }]}>{sub}</Text>
      )}
    </View>
  );
}

/* ── Business selector chip ─────────────────────────────────── */
function BizChip({ biz, active, onPress, colors }) {
  return (
    <TouchableOpacity
      style={[s.bizChip, {
        backgroundColor: active ? ACCENT : colors.backgroundElement,
        borderColor: active ? ACCENT : colors.border,
      }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[s.bizChipText, { color: active ? '#0f172a' : colors.text }]} numberOfLines={1}>
        {biz.name}
      </Text>
    </TouchableOpacity>
  );
}

/* ── Period selector ────────────────────────────────────────── */
const PERIODS = [
  { label: '7d',  value: '7' },
  { label: '30d', value: '30' },
  { label: '90d', value: '90' },
];

/* ── Main Analytics Screen ──────────────────────────────────── */
export default function BiasharaAnalyticsScreen({ businesses, onBack }) {
  const { colors } = useTheme();
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [period, setPeriod]           = useState('30');
  const [analytics, setAnalytics]     = useState(null);
  const [inquiries, setInquiries]     = useState([]);
  const [reviews, setReviews]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);

  // Auto-select first business
  useEffect(() => {
    if (businesses?.length && !selectedBiz) {
      setSelectedBiz(businesses[0]);
    }
  }, [businesses]);

  const loadAnalytics = useCallback(async (biz, p, isRefresh = false) => {
    if (!biz) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [analyticsRes, inquiryRes, reviewRes] = await Promise.allSettled([
        biasharaBusinessAPI.getBusinessAnalytics(biz._id, p),
        biasharaBusinessAPI.getMyInquiries(),
        biasharaBusinessAPI.getMyReviews(),
      ]);

      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value?.analytics || analyticsRes.value || {});
      }
      if (inquiryRes.status === 'fulfilled') {
        const all = inquiryRes.value?.inquiries || inquiryRes.value || [];
        setInquiries(all.filter(i => i.business === biz._id || i.business?._id === biz._id));
      }
      if (reviewRes.status === 'fulfilled') {
        const all = reviewRes.value?.reviews || reviewRes.value || [];
        setReviews(all.filter(r => r.business === biz._id || r.business?._id === biz._id));
      }
    } catch (e) { console.error('Analytics load error:', e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    loadAnalytics(selectedBiz, period);
  }, [selectedBiz, period, loadAnalytics]);

  const a = analytics || {};
  const totalClicks  = (a.contactClicks || 0) + (a.websiteClicks || 0) + (a.mapClicks || 0);
  const avgRating    = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '—';
  const pendingInq   = inquiries.filter(i => !i.response).length;
  const dailyViews   = a.dailyViews || [];

  const periodLabel = PERIODS.find(p2 => p2.value === period)?.label || '30d';

  if (!businesses || businesses.length === 0) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
        <View style={[s.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <TouchableOpacity onPress={onBack} style={{ padding: 4 }}><ArrowLeft c={ACCENT} /></TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.text }]}>Analytics</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={s.center}>
          <Text style={[s.emptyText, { color: colors.textMuted }]}>No businesses registered yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }} activeOpacity={0.7}>
          <ArrowLeft c={ACCENT} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Analytics Dashboard</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAnalytics(selectedBiz, period, true)}
            tintColor={ACCENT} colors={[ACCENT]}
          />
        }
      >
        {/* ── Business selector ── */}
        {businesses.length > 1 && (
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: ACCENT }]}>SELECT BUSINESS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={s.bizChipRow}>
                {businesses.map(biz => (
                  <BizChip
                    key={biz._id}
                    biz={biz}
                    active={selectedBiz?._id === biz._id}
                    onPress={() => setSelectedBiz(biz)}
                    colors={colors}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── Period selector ── */}
        <View style={s.periodRow}>
          <Text style={[s.periodLabel, { color: colors.textMuted }]}>Period:</Text>
          {PERIODS.map(p2 => (
            <TouchableOpacity
              key={p2.value}
              style={[s.periodBtn, {
                backgroundColor: period === p2.value ? ACCENT : colors.backgroundElement,
                borderColor: period === p2.value ? ACCENT : colors.border,
              }]}
              onPress={() => setPeriod(p2.value)}
              activeOpacity={0.8}
            >
              <Text style={[s.periodBtnText, { color: period === p2.value ? '#0f172a' : colors.textMuted }]}>
                {p2.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={ACCENT} size="large" style={{ paddingVertical: 40 }} />
        ) : (
          <>
            {/* ── KPI Grid ── */}
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: ACCENT }]}>KEY METRICS ({periodLabel})</Text>
              <View style={s.statsGrid}>
                <StatCard
                  icon={<EyeIcon c="#3b82f6" />}
                  label="Profile Views"
                  value={(a.totalViews || 0).toLocaleString()}
                  color="#3b82f6"
                  colors={colors}
                  sub={`${dailyViews.length > 0 ? '+' + dailyViews.reduce((s, d) => s + d.count, 0) : 0} this period`}
                />
                <StatCard
                  icon={<PhoneIcon c="#10b981" />}
                  label="Contact Clicks"
                  value={(a.contactClicks || 0).toLocaleString()}
                  color="#10b981"
                  colors={colors}
                />
                <StatCard
                  icon={<GlobeIcon c="#8b5cf6" />}
                  label="Website Clicks"
                  value={(a.websiteClicks || 0).toLocaleString()}
                  color="#8b5cf6"
                  colors={colors}
                />
                <StatCard
                  icon={<MapIcon c="#f97316" />}
                  label="Map Clicks"
                  value={(a.mapClicks || 0).toLocaleString()}
                  color="#f97316"
                  colors={colors}
                />
                <StatCard
                  icon={<HeartIcon c="#ec4899" />}
                  label="Favourites"
                  value={(a.totalFavorites || 0).toLocaleString()}
                  color="#ec4899"
                  colors={colors}
                  sub={`+${a.periodFavorites || 0} this period`}
                />
                <StatCard
                  icon={<MessageIcon c="#a78bfa" />}
                  label="Inquiries"
                  value={(a.totalInquiries || 0).toLocaleString()}
                  color="#a78bfa"
                  colors={colors}
                  sub={`${pendingInq} pending`}
                />
                <StatCard
                  icon={<StarIcon c={ACCENT} />}
                  label="Avg Rating"
                  value={avgRating}
                  color={ACCENT}
                  colors={colors}
                  sub={`${a.reviewCount || reviews.length} reviews`}
                />
                <StatCard
                  icon={<EyeIcon c="#06b6d4" />}
                  label="Total Clicks"
                  value={totalClicks.toLocaleString()}
                  color="#06b6d4"
                  colors={colors}
                />
              </View>
            </View>

            {/* ── Daily Views Chart ── */}
            {dailyViews.length > 0 && (
              <View style={s.section}>
                <Text style={[s.sectionLabel, { color: ACCENT }]}>DAILY VIEWS TREND</Text>
                <View style={[s.chartCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <BarChart data={dailyViews} color="#3b82f6" height={90} />
                  <View style={s.chartLegend}>
                    <View style={[s.legendDot, { backgroundColor: '#3b82f6' }]} />
                    <Text style={[s.legendText, { color: colors.textMuted }]}>Profile views per day</Text>
                  </View>
                </View>
              </View>
            )}

            {/* ── Engagement Breakdown ── */}
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: ACCENT }]}>ENGAGEMENT BREAKDOWN</Text>
              <View style={[s.breakdownCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                {[
                  { label: 'Contact Clicks', value: a.contactClicks || 0, color: '#10b981', total: totalClicks },
                  { label: 'Website Clicks', value: a.websiteClicks || 0, color: '#8b5cf6', total: totalClicks },
                  { label: 'Map Clicks',     value: a.mapClicks || 0,     color: '#f97316', total: totalClicks },
                ].map(item => {
                  const pct = totalClicks > 0 ? Math.round((item.value / totalClicks) * 100) : 0;
                  return (
                    <View key={item.label} style={s.breakdownRow}>
                      <View style={s.breakdownMeta}>
                        <View style={[s.breakdownDot, { backgroundColor: item.color }]} />
                        <Text style={[s.breakdownLabel, { color: colors.text }]}>{item.label}</Text>
                        <Text style={[s.breakdownCount, { color: colors.textMuted }]}>{item.value}</Text>
                      </View>
                      <View style={[s.barBg, { backgroundColor: colors.border }]}>
                        <View style={[s.barFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                      </View>
                      <Text style={[s.breakdownPct, { color: item.color }]}>{pct}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ── Recent Inquiries ── */}
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: ACCENT }]}>RECENT INQUIRIES ({inquiries.length})</Text>
              {inquiries.length === 0 ? (
                <View style={[s.emptyCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <Text style={[s.emptyText, { color: colors.textMuted }]}>No inquiries yet for this business.</Text>
                </View>
              ) : (
                inquiries.slice(0, 5).map((inq, i) => (
                  <View key={inq._id || i} style={[s.inqCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                    <View style={s.inqHeader}>
                      <View style={[s.inqAvatar, { backgroundColor: ACCENT + '20' }]}>
                        <Text style={[s.inqAvatarText, { color: ACCENT }]}>
                          {(inq.senderName || inq.name || 'A').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.inqName, { color: colors.text }]}>
                          {inq.senderName || inq.name || 'Anonymous'}
                        </Text>
                        <Text style={[s.inqTime, { color: colors.textMuted }]}>
                          {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString('en-KE', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          }) : 'Unknown date'}
                        </Text>
                      </View>
                      <View style={[s.inqBadge, {
                        backgroundColor: inq.response ? '#22c55e18' : ACCENT + '18',
                        borderColor: inq.response ? '#22c55e40' : ACCENT + '40',
                      }]}>
                        <Text style={[s.inqBadgeText, { color: inq.response ? '#22c55e' : ACCENT }]}>
                          {inq.response ? 'Replied' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[s.inqMsg, { color: colors.textMuted }]} numberOfLines={2}>
                      {inq.message || inq.content || 'No message content'}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* ── Recent Reviews ── */}
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: ACCENT }]}>RECENT REVIEWS ({reviews.length})</Text>
              {reviews.length === 0 ? (
                <View style={[s.emptyCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <Text style={[s.emptyText, { color: colors.textMuted }]}>No reviews yet.</Text>
                </View>
              ) : (
                reviews.slice(0, 5).map((r, i) => (
                  <View key={r._id || i} style={[s.reviewCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                    <View style={s.reviewHeader}>
                      <View style={[s.reviewAvatar, { backgroundColor: ACCENT + '20' }]}>
                        <Text style={[s.reviewAvatarText, { color: ACCENT }]}>
                          {(r.reviewer?.name || r.author?.name || 'A').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.reviewName, { color: colors.text }]}>
                          {r.reviewer?.name || r.author?.name || 'Anonymous'}
                        </Text>
                        <View style={s.starsRow}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <StarIcon key={n} c={n <= (r.rating || 0) ? ACCENT : '#334155'} s={12} />
                          ))}
                          <Text style={[s.ratingNum, { color: colors.textMuted }]}> {r.rating}/5</Text>
                        </View>
                      </View>
                      <Text style={[s.reviewTime, { color: colors.textMuted }]}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : ''}
                      </Text>
                    </View>
                    {r.comment && (
                      <Text style={[s.reviewComment, { color: colors.textMuted }]} numberOfLines={3}>
                        "{r.comment}"
                      </Text>
                    )}
                  </View>
                ))
              )}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },

  section:      { paddingHorizontal: 16, marginTop: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },

  // Business chips
  bizChipRow: { flexDirection: 'row', gap: 8 },
  bizChip:    { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  bizChipText:{ fontSize: 13, fontWeight: '700', maxWidth: 150 },

  // Period buttons
  periodRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 16, gap: 8 },
  periodLabel:  { fontSize: 12, fontWeight: '600', marginRight: 4 },
  periodBtn:    { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  periodBtnText:{ fontSize: 12, fontWeight: '700' },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: (SCREEN_W - 52) / 2,
    borderWidth: 1, borderRadius: 14, padding: 14,
    alignItems: 'flex-start',
  },
  statIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue:    { fontSize: 24, fontWeight: '900', marginBottom: 2 },
  statLabel:    { fontSize: 11, fontWeight: '600' },
  statSub:      { fontSize: 10, marginTop: 3 },

  // Chart
  chartCard: {
    borderWidth: 1, borderRadius: 14, padding: 16,
    alignItems: 'flex-start',
  },
  chartLegend: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendText:  { fontSize: 11 },

  // Engagement breakdown
  breakdownCard: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 14 },
  breakdownRow:  { gap: 6 },
  breakdownMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownDot:  { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel:{ flex: 1, fontSize: 13, fontWeight: '600' },
  breakdownCount:{ fontSize: 13, fontWeight: '700' },
  barBg:         { height: 6, borderRadius: 3, flex: 1, overflow: 'hidden' },
  barFill:       { height: 6, borderRadius: 3 },
  breakdownPct:  { fontSize: 11, fontWeight: '800', width: 36, textAlign: 'right' },

  // Inquiries
  inqCard:    { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8 },
  inqHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  inqAvatar:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  inqAvatarText: { fontSize: 15, fontWeight: '800' },
  inqName:    { fontSize: 14, fontWeight: '700' },
  inqTime:    { fontSize: 11, marginTop: 1 },
  inqBadge:   { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  inqBadgeText: { fontSize: 10, fontWeight: '800' },
  inqMsg:     { fontSize: 13, lineHeight: 18 },

  // Reviews
  reviewCard:      { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8 },
  reviewHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText:{ fontSize: 15, fontWeight: '800' },
  reviewName:      { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  starsRow:        { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingNum:       { fontSize: 11, marginLeft: 2 },
  reviewTime:      { fontSize: 11 },
  reviewComment:   { fontSize: 13, lineHeight: 19, fontStyle: 'italic' },

  // Empty
  emptyCard: { borderWidth: 1, borderRadius: 12, padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
