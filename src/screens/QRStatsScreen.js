import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { qrStatsAPI } from '../services/api';
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function QRStatsScreen({ propertyId, propertyTitle, onBack }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  useEffect(() => {
    qrStatsAPI
      .getStats(propertyId)
      .then((res) => setStats(res.data))
      .catch((err) => console.error('Failed to load QR stats:', err.message))
      .finally(() => setLoading(false));
  }, [propertyId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>QR Stats</Text>
      <Text style={styles.subtitle}>{propertyTitle}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalScans ?? 0}</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalInquiries ?? 0}</Text>
          <Text style={styles.statLabel}>Inquiries</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.conversionRate ?? '0.0'}%</Text>
          <Text style={styles.statLabel}>Conversion</Text>
        </View>
      </View>

      {stats?.sourceBreakdown?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Scan Sources</Text>
          {stats.sourceBreakdown.map((item, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.rowLabel}>{item.source || 'Unknown'}</Text>
              <Text style={styles.rowValue}>{item.count}</Text>
            </View>
          ))}
        </>
      )}

      {stats?.inquiryTypeBreakdown?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Inquiry Types</Text>
          {stats.inquiryTypeBreakdown.map((item, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.rowLabel}>{item.type || 'Unknown'}</Text>
              <Text style={styles.rowValue}>{item.count}</Text>
            </View>
          ))}
        </>
      )}

      {(!stats || stats.totalScans === 0) && (
        <Text style={styles.emptyText}>
          No QR scans yet. Share your property's QR code to start tracking.
        </Text>
      )}
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.four },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backLink: { color: colors.primary, fontSize: 15, marginBottom: Spacing.three },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: Spacing.four },
  statsRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.four },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundElement,
    borderRadius: 10,
    padding: Spacing.three,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: Spacing.three, marginBottom: Spacing.two },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundElement,
    borderRadius: 8,
    padding: Spacing.three,
    marginBottom: Spacing.one,
  },
  rowLabel: { fontSize: 14, color: colors.text, textTransform: 'capitalize' },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.primary },
  emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: Spacing.five },
});
