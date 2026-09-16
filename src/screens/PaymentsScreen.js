import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { paymentAPI } from '../services/api';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

export default function PaymentsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await paymentAPI.getHistory();
      setPayments(Array.isArray(data) ? data : data.paymentHistory || []);
    } catch (error) {
      console.error('Failed to load payments:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const totalPaid = payments
    .filter(p => p.status === 'success' || p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={payments}
        keyExtractor={(item, index) => item.transactionId || item._id || String(index)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={styles.pageTitle}>Payments</Text>

            {/* Summary card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Payments Received</Text>
              <Text style={styles.summaryAmount}>KSh {totalPaid.toLocaleString()}</Text>
              <Text style={styles.summaryCount}>{payments.length} transaction{payments.length !== 1 ? 's' : ''}</Text>
            </View>

            {payments.length > 0 && (
              <Text style={styles.sectionTitle}>Transaction History</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyText}>Payment records will appear here once tenants pay.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isSuccess = item.status === 'success' || item.status === 'completed';
          return (
            <View style={styles.txCard}>
              <View style={styles.txLeft}>
                <View style={[styles.txDot, { backgroundColor: isSuccess ? colors.success : colors.warning }]} />
              </View>
              <View style={styles.txBody}>
                <Text style={styles.txType}>{item.plan || item.subscriptionType || 'Payment'}</Text>
                {item.propertyTitle && (
                  <Text style={styles.txProperty}>{item.propertyTitle}</Text>
                )}
                {item.createdAt && (
                  <Text style={styles.txDate}>{formatDate(item.createdAt)}</Text>
                )}
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>KSh {Number(item.amount || 0).toLocaleString()}</Text>
                <View style={[
                  styles.txStatus,
                  { backgroundColor: (isSuccess ? colors.success : colors.warning) + '22' },
                ]}>
                  <Text style={[styles.txStatusText, { color: isSuccess ? colors.success : colors.warning }]}>
                    {(item.status || 'pending').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  listContent: { padding: Spacing.three, paddingBottom: Spacing.six },
  pageTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: '700',
    color: colors.text,
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: FontSize['3xl'] + 4,
    fontWeight: '800',
    color: '#fff',
  },
  summaryCount: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: Spacing.two,
  },
  txCard: {
    backgroundColor: colors.backgroundElement,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  txLeft: {
    marginRight: Spacing.three,
  },
  txDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  txBody: { flex: 1 },
  txType: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  txProperty: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  txDate: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  txRight: { alignItems: 'flex-end' },
  txAmount: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  txStatus: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  txStatusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: Spacing.six,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: Spacing.two,
  },
  emptyText: {
    fontSize: FontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
