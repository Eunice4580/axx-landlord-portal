import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { caretakerAPI, updateBookedUnits } from '../services/api';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function CaretakerDashboardScreen({ user, onLogout }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const loadProperties = useCallback(async () => {
    try {
      const data = await caretakerAPI.getMyAssignedProperties();
      setProperties(Array.isArray(data.properties) ? data.properties : []);
    } catch (error) {
      console.error('Failed to load assigned properties:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadProperties(); }, [loadProperties]);

  const onRefresh = () => { setRefreshing(true); loadProperties(); };

  const handleUnitChange = async (propertyId, change) => {
    try {
      await updateBookedUnits(propertyId, change);
      loadProperties();
    } catch (error) {
      Alert.alert('Failed', error.message || 'Could not update unit status.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalUnitsAssigned = properties.reduce((sum, p) => sum + (p.totalUnits || 1), 0);
  const totalAvailable = properties.reduce((sum, p) => sum + Math.max(0, (p.totalUnits || 1) - (p.bookedUnits || 0)), 0);

  const initials = (user?.name || 'C')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const renderProperty = ({ item }) => {
    const total = item.totalUnits || 1;
    const booked = item.bookedUnits || 0;
    const available = Math.max(0, total - booked);
    const fullyBooked = booked >= total;
    const occupancyPct = Math.min(100, Math.round((booked / total) * 100));

    return (
      <View style={styles.card}>
        {item.images && item.images.length > 0 && (
          <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardLocation}>{item.location}</Text>

          <View style={styles.occupancyRow}>
            <Text style={[styles.occupancyText, { color: fullyBooked ? colors.danger : colors.success }]}>
              {fullyBooked ? 'Fully Booked' : `${available}/${total} units available`}
            </Text>
            <Text style={styles.occupancyPct}>{occupancyPct}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[
              styles.progressFill,
              { width: `${occupancyPct}%`, backgroundColor: fullyBooked ? colors.danger : colors.primary },
            ]} />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { opacity: fullyBooked ? 0.4 : 1 }]}
              onPress={() => handleUnitChange(item._id, 1)}
              disabled={fullyBooked}
            >
              <Text style={styles.actionBtnText}>Mark Occupied</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtnOutline, { opacity: booked === 0 ? 0.4 : 1 }]}
              onPress={() => handleUnitChange(item._id, -1)}
              disabled={booked === 0}
            >
              <Text style={styles.actionBtnOutlineText}>Free Unit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={properties}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>Caretaker</Text>
                </View>
                <Text style={styles.userName}>{user?.name || 'Caretaker'}</Text>
              </View>
              <View style={styles.headerRight}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                  <Text style={styles.logoutBtnText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{properties.length}</Text>
                <Text style={styles.statLabel}>Assigned</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.success }]}>{totalAvailable}</Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.warning }]}>{totalUnitsAssigned - totalAvailable}</Text>
                <Text style={styles.statLabel}>Occupied</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Assigned Properties</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No properties assigned</Text>
            <Text style={styles.emptyText}>Contact your landlord to get properties assigned to you.</Text>
          </View>
        }
        renderItem={renderProperty}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  listContent: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  roleBadge: {
    backgroundColor: colors.primary + '22',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  roleBadgeText: { color: colors.primary, fontSize: FontSize.xs, fontWeight: '700' },
  userName: { fontSize: FontSize['2xl'], fontWeight: '700', color: colors.text },
  headerRight: {
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  logoutBtn: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  logoutBtnText: {
    color: colors.danger,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundElement,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: Spacing.three,
  },
  card: {
    backgroundColor: colors.backgroundElement,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 150 },
  cardBody: { padding: Spacing.three },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '700', color: colors.text, marginBottom: 3 },
  cardLocation: { fontSize: FontSize.sm, color: colors.textSecondary, marginBottom: Spacing.two },
  occupancyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  occupancyText: { fontSize: FontSize.sm, fontWeight: '600' },
  occupancyPct: { fontSize: FontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  progressFill: { height: '100%', borderRadius: 2 },
  actionRow: { flexDirection: 'row', gap: Spacing.two },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: FontSize.sm },
  actionBtnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  actionBtnOutlineText: { color: colors.textSecondary, fontWeight: '600', fontSize: FontSize.sm },
  emptyBox: { alignItems: 'center', paddingTop: Spacing.six },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '600', color: colors.text, marginBottom: Spacing.two },
  emptyText: { fontSize: FontSize.base, color: colors.textSecondary, textAlign: 'center' },
});
