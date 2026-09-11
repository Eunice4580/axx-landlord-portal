import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { paymentAPI } from '../services/api';
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

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

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Payments</Text>
      <FlatList
        data={payments}
        keyExtractor={(item, index) => item.transactionId || item._id || String(index)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No payment history yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.amount}>KSh {Number(item.amount || 0).toLocaleString()}</Text>
            <Text style={styles.detail}>{item.plan || item.subscriptionType || 'Payment'}</Text>
            <Text style={[styles.status, item.status === 'success' && styles.statusSuccess]}>
              {(item.status || 'pending').toUpperCase()}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: Spacing.three },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: Spacing.three },
  card: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 10,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  amount: { fontSize: 16, fontWeight: '700', color: colors.text },
  detail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  status: { fontSize: 12, fontWeight: '600', color: colors.danger, marginTop: 4 },
  statusSuccess: { color: colors.success },
  emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: Spacing.five },
});
