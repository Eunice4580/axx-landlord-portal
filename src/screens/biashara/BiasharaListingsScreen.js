import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { biasharaBusinessAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { StarIcon, RefreshIcon, AlertIcon } from './Icons';
import Svg, { Path, Circle, Line, Polyline, Polygon } from 'react-native-svg';

const ACCENT = '#fbbf24';

/* ── Icons ─────────────────────────────────────────────────────── */
const StoreIcon = ({ color = '#94a3b8', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 3h20l-2 7H4L2 3z" />
    <Path d="M4 10v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V10" />
    <Path d="M9 21V13h6v8" />
  </Svg>
);
const EyeIcon = ({ color = '#94a3b8', size = 13 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Circle cx="12" cy="12" r="3" />
  </Svg>
);
const MessageIcon = ({ color = '#94a3b8', size = 13 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);
const LocationIcon = ({ color = '#94a3b8', size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx="12" cy="10" r="3" />
  </Svg>
);
const EditIcon = ({ color = '#94a3b8', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);
const TrashIcon = ({ color = '#94a3b8', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </Svg>
);
const ZapIcon = ({ color = '#94a3b8', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Svg>
);
const TrendingIcon = ({ color = '#94a3b8', size = 13 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><Polyline points="17 6 23 6 23 12" />
  </Svg>
);

/* ── Status helpers ─────────────────────────────────────────────── */
const STATUS_MAP = {
  active:   { bg: '#22c55e18', border: '#22c55e40', text: '#22c55e', label: 'Live' },
  approved: { bg: '#22c55e18', border: '#22c55e40', text: '#22c55e', label: 'Live' },
  pending:  { bg: ACCENT + '18', border: ACCENT + '40', text: ACCENT, label: 'Pending Review' },
  rejected: { bg: '#ef444418', border: '#ef444440', text: '#ef4444', label: 'Rejected' },
  archived: { bg: '#64748b18', border: '#64748b40', text: '#64748b', label: 'Archived' },
};
const getStatus = s => STATUS_MAP[(s || 'pending').toLowerCase()] || STATUS_MAP.pending;

/* ── Business Card ─────────────────────────────────────────────── */
function BusinessCard({ biz, colors, onEdit, onDelete, onBoost }) {
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const st = getStatus(biz.status);
  const isApproved = biz.status === 'approved' || biz.status === 'active';

  const loadAnalytics = async () => {
    if (analytics || loadingAnalytics) return;
    setLoadingAnalytics(true);
    try {
      const res = await biasharaBusinessAPI.getBusinessAnalytics(biz._id);
      setAnalytics(res?.analytics || res || {});
    } catch (_) {
      setAnalytics({});
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const toggle = () => {
    if (!expanded) loadAnalytics();
    setExpanded(e => !e);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Business',
      `Are you sure you want to delete "${biz.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await onDelete(biz._id);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete business.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.bizCard, { backgroundColor: colors.backgroundElement, borderColor: expanded ? ACCENT + '50' : colors.border }]}>
      {/* Card header row */}
      <TouchableOpacity onPress={toggle} activeOpacity={0.8}>
        <View style={styles.bizHeader}>
          {biz.logo
            ? <Image source={{ uri: biz.logo }} style={styles.bizLogo} />
            : <View style={[styles.bizLogoPlaceholder, { backgroundColor: ACCENT + '18' }]}>
                <StoreIcon color={ACCENT} size={18} />
              </View>
          }
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.bizName, { color: colors.text }]} numberOfLines={1}>{biz.name}</Text>
            {(biz.location?.town || biz.location?.county) && (
              <View style={styles.locationRow}>
                <LocationIcon color={colors.textMuted} size={11} />
                <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}>
                  {' '}{[biz.location?.town, biz.location?.county].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
            <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
          </View>
        </View>

        {/* Description */}
        {biz.description ? (
          <Text style={[styles.bizDesc, { color: colors.textMuted }]} numberOfLines={expanded ? 4 : 2}>
            {biz.description}
          </Text>
        ) : null}

        {/* Categories */}
        {biz.categories?.length > 0 && (
          <View style={styles.catsRow}>
            {biz.categories.slice(0, 4).map(c => (
              <View key={c} style={[styles.catChip, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '30' }]}>
                <Text style={[styles.catText, { color: ACCENT }]}>{c}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Analytics strip — shown expanded */}
      {expanded && (
        <View style={styles.analyticsRow}>
          {loadingAnalytics
            ? <ActivityIndicator color={ACCENT} size="small" style={{ paddingVertical: 6 }} />
            : <>
                <View style={styles.analyticItem}>
                  <EyeIcon color="#3b82f6" size={13} />
                  <Text style={[styles.analyticVal, { color: colors.text }]}> {analytics?.views || 0}</Text>
                  <Text style={[styles.analyticLab, { color: colors.textMuted }]}> views</Text>
                </View>
                <View style={styles.analyticItem}>
                  <TrendingIcon color="#22c55e" size={13} />
                  <Text style={[styles.analyticVal, { color: colors.text }]}> {(analytics?.contactClicks || 0) + (analytics?.websiteClicks || 0)}</Text>
                  <Text style={[styles.analyticLab, { color: colors.textMuted }]}> clicks</Text>
                </View>
                <View style={styles.analyticItem}>
                  <StarIcon color={ACCENT} size={13} />
                  <Text style={[styles.analyticVal, { color: colors.text }]}> {analytics?.reviewCount || 0}</Text>
                  <Text style={[styles.analyticLab, { color: colors.textMuted }]}> reviews</Text>
                </View>
                <View style={styles.analyticItem}>
                  <MessageIcon color="#a78bfa" size={13} />
                  <Text style={[styles.analyticVal, { color: colors.text }]}> {analytics?.inquiryCount || 0}</Text>
                  <Text style={[styles.analyticLab, { color: colors.textMuted }]}> inquiries</Text>
                </View>
              </>
          }
        </View>
      )}

      {/* Action buttons — always visible */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border }]}
          onPress={() => onEdit(biz)}
        >
          <EditIcon color={ACCENT} size={14} />
          <Text style={[styles.actionBtnText, { color: colors.text }]}> Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: '#ef444430' }]}
          onPress={confirmDelete}
          disabled={deleting}
        >
          {deleting
            ? <ActivityIndicator color="#ef4444" size="small" />
            : <>
                <TrashIcon color="#ef4444" size={14} />
                <Text style={[styles.actionBtnText, { color: '#ef4444' }]}> Delete</Text>
              </>
          }
        </TouchableOpacity>

        {isApproved && (
          <TouchableOpacity
            style={[styles.boostBtn, { backgroundColor: ACCENT }]}
            onPress={() => onBoost(biz)}
          >
            <ZapIcon color="#0f172a" size={13} />
            <Text style={styles.boostBtnText}> Boost</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/* ── Main Screen ─────────────────────────────────────────────────── */
export default function BiasharaListingsScreen({
  user, businesses, businessesLoading,
  onRegisterBusiness, onEditBusiness, onDeleteBusiness, onRefresh,
}) {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  }, [onRefresh]);

  const handleBoost = (biz) => {
    Alert.alert(
      'Boost Business',
      `Boosting "${biz.name}" gives it a prominent placement in the directory.\n\nPay via M-Pesa on axxspace.com/axxbiashara to activate a boost for this listing.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Businesses</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            {businesses.length} listing{businesses.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.registerBtn, { backgroundColor: ACCENT }]}
            onPress={onRegisterBusiness}
          >
            <Text style={styles.registerBtnText}>+ Register</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
            <RefreshIcon color={ACCENT} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {businessesLoading && businesses.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading your businesses...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={ACCENT}
              colors={[ACCENT]}
            />
          }
        >
          {businesses.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: ACCENT + '15' }]}>
                <StoreIcon color={ACCENT} size={34} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Businesses Yet</Text>
              <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                Register your first business to appear in the AxxBiashara directory.
              </Text>
              <TouchableOpacity
                style={[styles.emptyRegBtn, { backgroundColor: ACCENT }]}
                onPress={onRegisterBusiness}
              >
                <Text style={styles.emptyRegText}>Register a Business</Text>
              </TouchableOpacity>
            </View>
          ) : (
            businesses.map(biz => (
              <BusinessCard
                key={biz._id}
                biz={biz}
                colors={colors}
                onEdit={onEditBusiness}
                onDelete={onDeleteBusiness}
                onBoost={handleBoost}
              />
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '900' },
  headerSub: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  registerBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  registerBtnText: { color: '#0f172a', fontSize: 12, fontWeight: '800' },
  refreshBtn: { padding: 6 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: FontSize.base },
  listContent: { padding: Spacing.three, gap: 12 },

  bizCard: { borderWidth: 1.5, borderRadius: BorderRadius.xl, padding: Spacing.three },
  bizHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bizLogo: { width: 46, height: 46, borderRadius: 10 },
  bizLogoPlaceholder: { width: 46, height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  bizName: { fontSize: FontSize.md, fontWeight: '800', letterSpacing: -0.2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  locationText: { fontSize: 11 },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '800' },
  bizDesc: { fontSize: FontSize.sm, lineHeight: 18, marginBottom: 8 },
  catsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  catChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  catText: { fontSize: 10, fontWeight: '700' },

  divider: { height: 1, marginVertical: 10, opacity: 0.4 },

  analyticsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 10 },
  analyticItem: { flexDirection: 'row', alignItems: 'center' },
  analyticVal: { fontSize: 12, fontWeight: '800' },
  analyticLab: { fontSize: 11 },

  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  boostBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  boostBtnText: { color: '#0f172a', fontSize: 12, fontWeight: '800' },

  emptyCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.five, alignItems: 'center', gap: 14 },
  emptyIcon: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '800' },
  emptyBody: { fontSize: FontSize.base, textAlign: 'center', lineHeight: 22 },
  emptyRegBtn: { borderRadius: BorderRadius.lg, paddingVertical: 13, paddingHorizontal: 28 },
  emptyRegText: { color: '#0f172a', fontWeight: '900', fontSize: FontSize.base },
});
