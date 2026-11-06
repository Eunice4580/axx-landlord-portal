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
import { propertyAPI, qrStatsAPI } from '../services/api';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const SOURCE_LABELS = {
  generic: 'General / Digital Link',
  gate: 'Gate Poster',
  building_outside: 'Building Exterior',
  noticeboard: 'Noticeboard',
  shop_nearby: 'Local Shop/Kiosk',
  office: 'Landlord Office',
  vacancy_sign: 'Vacancy Signboard',
};

const topSource = (breakdown = []) => {
  let best = null;
  breakdown.forEach(s => {
    if (!best || (s.count || 0) > (best.count || 0)) best = s;
  });
  if (!best) return 'N/A';
  return SOURCE_LABELS[best.source] || best.source || 'N/A';
};

export default function EnquiriesScreen({ onBack }) {
  const { colors } = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const properties = await propertyAPI.getMyProperties();
      const list = Array.isArray(properties) ? properties : (properties?.properties || []);
      const results = await Promise.all(
        list.map(async p => {
          try {
            const res = await qrStatsAPI.getStats(p._id);
            const stats = res?.data || res || {};
            return {
              propertyId: p._id,
              title: p.title,
              totalScans: Number(stats.totalScans || 0),
              totalInquiries: Number(stats.totalInquiries || 0),
              conversionRate: Number(stats.conversionRate || 0),
              sources: stats.sourceBreakdown || [],
            };
          } catch {
            return {
              propertyId: p._id,
              title: p.title,
              totalScans: 0,
              totalInquiries: 0,
              conversionRate: 0,
              sources: [],
            };
          }
        })
      );
      setRows(results);
    } catch (err) {
      console.error('Enquiries load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const totalScans = rows.reduce((sum, r) => sum + r.totalScans, 0);
  const totalInquiries = rows.reduce((sum, r) => sum + r.totalInquiries, 0);
  const rate = totalScans > 0 ? ((totalInquiries / totalScans) * 100).toFixed(1) : '0.0';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onBack}>
            <Text style={[styles.backLink, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={[styles.backLink, { color: colors.primary }]}>↻ Refresh</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Offline Inquiry Leads</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Monitor potential tenant inquiries generated through physical poster QR scans.
        </Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Aggregating scan reports…</Text>
          </View>
        ) : rows.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No QR scans yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Deploy posters to begin collecting conversions. Scans and inquiries will appear here.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{totalScans.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Aggregate Poster Scans</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{totalInquiries.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Digital Inquiries</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{rate}%</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Scan-to-Inquiry Rate</Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>QR Scan Channels Breakdown</Text>
            {rows.map(row => (
              <View
                key={row.propertyId}
                style={[styles.leadCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
              >
                <Text style={[styles.leadTitle, { color: colors.text }]} numberOfLines={1}>{row.title}</Text>

                <View style={styles.leadGrid}>
                  <View style={styles.leadCell}>
                    <Text style={[styles.leadValue, { color: colors.text }]}>{row.totalScans}</Text>
                    <Text style={[styles.leadLabel, { color: colors.textMuted }]}>Scans</Text>
                  </View>
                  <View style={styles.leadCell}>
                    <Text style={[styles.leadValue, { color: colors.text }]}>{row.totalInquiries}</Text>
                    <Text style={[styles.leadLabel, { color: colors.textMuted }]}>Inquiries</Text>
                  </View>
                  <View style={styles.leadCell}>
                    <Text style={[styles.leadValue, { color: colors.primary }]}>{row.conversionRate.toFixed(1)}%</Text>
                    <Text style={[styles.leadLabel, { color: colors.textMuted }]}>Conversion</Text>
                  </View>
                </View>

                <View style={[styles.sourceRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.sourceLabel, { color: colors.textMuted }]}>Top Placement Source</Text>
                  <Text style={[styles.sourceValue, { color: colors.text }]}>{topSource(row.sources)}</Text>
                </View>
              </View>
            ))}

            <View style={[styles.noteCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <Text style={[styles.noteTitle, { color: colors.text }]}>Recent QR Prospects & Channels</Text>
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                When prospective tenants scan your printed gate or noticeboard posters, their channel interactions appear here in real time.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.two, marginBottom: Spacing.two },
  backLink: { fontSize: FontSize.base, fontWeight: '600' },
  title: { fontSize: FontSize['2xl'], fontWeight: '700' },
  subtitle: { fontSize: FontSize.sm, lineHeight: 20, marginTop: 4, marginBottom: Spacing.three },
  loadingBox: { paddingVertical: Spacing.six, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: FontSize.sm },
  emptyBox: { borderWidth: 1, borderStyle: 'dashed', borderRadius: BorderRadius.lg, padding: Spacing.four, alignItems: 'center' },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.two },
  emptyText: { fontSize: FontSize.sm, lineHeight: 20, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  statCard: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.three, alignItems: 'center' },
  statValue: { fontSize: FontSize.lg, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.two },
  leadCard: { borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.three, marginBottom: Spacing.two },
  leadTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.two },
  leadGrid: { flexDirection: 'row', gap: Spacing.two },
  leadCell: { flex: 1 },
  leadValue: { fontSize: FontSize.md, fontWeight: '700' },
  leadLabel: { fontSize: 10, marginTop: 2 },
  sourceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, marginTop: Spacing.two, paddingTop: Spacing.two },
  sourceLabel: { fontSize: FontSize.xs },
  sourceValue: { fontSize: FontSize.xs, fontWeight: '600' },
  noteCard: { borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.three, marginTop: Spacing.two },
  noteTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: 6 },
  noteText: { fontSize: FontSize.xs, lineHeight: 18 },
});
