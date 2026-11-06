import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyticsAPI } from '../services/api';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const PERIODS = [
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
];

function MetricCard({ label, value, hint, colors }) {
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      <Text style={[styles.metricValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.text }]}>{label}</Text>
      {hint ? <Text style={[styles.metricHint, { color: colors.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

function Bar({ label, value, max, color, colors }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <View style={{ marginBottom: Spacing.two }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.barValue, { color: colors.text }]}>{value.toLocaleString()}</Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function AnalyticsScreen({ onBack }) {
  const { colors } = useTheme();
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (p = period) => {
    setError('');
    try {
      const res = await analyticsAPI.getSummary('landlord', p);
      setData(res?.data || res || null);
    } catch (err) {
      setError(err.message || 'Could not load analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { setLoading(true); load(period); }, [period, load]);

  const onRefresh = () => { setRefreshing(true); load(period); };

  const views = Number(data?.views || 0);
  const inquiries = Number(data?.inquiries || 0);
  const bookings = Number(data?.bookings || 0);
  const max = Math.max(views, inquiries, bookings, 1);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <TouchableOpacity onPress={onBack}>
          <Text style={[styles.backLink, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>Performance Dashboard</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Real-time overview of listing views, engagement, and conversion tracking.
        </Text>

        <View style={styles.periodRow}>
          {PERIODS.map(p => {
            const active = period === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.periodBtn,
                  { borderColor: colors.border, backgroundColor: colors.backgroundElement },
                  active && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setPeriod(p.id)}
              >
                <Text style={[styles.periodText, { color: active ? '#fff' : colors.textSecondary }]}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error ? (
          <View style={[styles.errorBox, { borderColor: colors.danger }]}>
            <Text style={{ color: colors.danger, fontSize: FontSize.sm }}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading analytics…</Text>
          </View>
        ) : (
          <>
            <View style={styles.metricsGrid}>
              <MetricCard label="Total Views" value={views.toLocaleString()} colors={colors} />
              <MetricCard label="Inquiries" value={inquiries.toLocaleString()} colors={colors} />
              <MetricCard label="Bookings" value={bookings.toLocaleString()} colors={colors} />
              <MetricCard
                label="Revenue"
                value={`KSh ${Number(data?.revenue || 0).toLocaleString()}`}
                hint="From occupied units"
                colors={colors}
              />
              <MetricCard label="Conversion Rate" value={`${data?.conversionRate || '0.0'}%`} colors={colors} />
              <MetricCard label="QR Scans" value={Number(data?.qrScans || 0).toLocaleString()} colors={colors} />
              <MetricCard label="QR Inquiries" value={Number(data?.qrInquiries || 0).toLocaleString()} colors={colors} />
              <MetricCard
                label="Properties Listed"
                value={Number(data?.propertiesListed || 0).toLocaleString()}
                hint={`Avg response ${data?.averageResponseTime ?? 0}h`}
                colors={colors}
              />
            </View>

            <View style={[styles.sectionCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Engagement</Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                How guests move from views to inquiries to bookings.
              </Text>
              <Bar label="Views" value={views} max={max} color={colors.primary} colors={colors} />
              <Bar label="Inquiries" value={inquiries} max={max} color="#3b82f6" colors={colors} />
              <Bar label="Bookings" value={bookings} max={max} color="#10b981" colors={colors} />
            </View>

            {views === 0 && inquiries === 0 && bookings === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No engagement recorded for this period yet. Publish your listings and share QR posters to start tracking.
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  backLink: { fontSize: FontSize.base, fontWeight: '600', marginTop: Spacing.two, marginBottom: Spacing.two },
  title: { fontSize: FontSize['2xl'], fontWeight: '700' },
  subtitle: { fontSize: FontSize.sm, lineHeight: 20, marginTop: 4, marginBottom: Spacing.three },
  periodRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  periodBtn: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.md, paddingVertical: 8, alignItems: 'center' },
  periodText: { fontSize: FontSize.sm, fontWeight: '600' },
  errorBox: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.three, marginBottom: Spacing.three },
  loadingBox: { paddingVertical: Spacing.six, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: FontSize.sm },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.three },
  metricCard: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 100,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.three,
  },
  metricValue: { fontSize: FontSize.lg, fontWeight: '700' },
  metricLabel: { fontSize: FontSize.xs, fontWeight: '600', marginTop: 2 },
  metricHint: { fontSize: 10, marginTop: 3 },
  sectionCard: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.three, marginBottom: Spacing.three },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700' },
  sectionSub: { fontSize: FontSize.xs, marginTop: 2, marginBottom: Spacing.three },
  barLabel: { fontSize: FontSize.sm },
  barValue: { fontSize: FontSize.sm, fontWeight: '700' },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  emptyText: { textAlign: 'center', fontSize: FontSize.sm, lineHeight: 20, marginTop: Spacing.two },
});
