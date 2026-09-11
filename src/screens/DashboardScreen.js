import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { propertyAPI, updateBookedUnits } from '../services/api';
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const statusColor = (status) => {
  const map = {
    approved: { backgroundColor: '#22c55e' },
    pending: { backgroundColor: '#f59e0b' },
    rejected: { backgroundColor: '#ef4444' },
  };
  return map[status] || map.pending;
};

export default function DashboardScreen({ user, onLogout }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const loadProperties = useCallback(async () => {
    try {
      const data = await propertyAPI.getMyProperties();
      setProperties(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load properties:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProperties();
  };

  const totalProperties = properties.length;
  const availableUnits = properties.reduce((sum, p) => {
    const avail = Math.max(0, (p.totalUnits || 1) - (p.bookedUnits || 0));
    return sum + avail;
  }, 0);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>{getGreeting()}, {user?.name || 'Landlord'}</Text>
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalProperties}</Text>
          <Text style={styles.statLabel}>Properties</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{availableUnits}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Your Properties</Text>

      <FlatList
        data={properties}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No properties yet.</Text>
        }
        renderItem={({ item }) => {
          const total = item.totalUnits || 1;
          const booked = item.bookedUnits || 0;
          const available = Math.max(0, total - booked);
          const fullyBooked = booked >= total;

          const handleUnitChange = async (change) => {
            try {
              await updateBookedUnits(item._id, change);
              loadProperties();
            } catch (error) {
              Alert.alert('Failed', error.message || 'Could not update unit status.');
            }
          };

          return (
            <View style={styles.propertyCard}>
              {item.images && item.images.length > 0 && (
                <Image source={{ uri: item.images[0] }} style={styles.propertyImage} />
              )}

              <View style={styles.statusRow}>
                <Text style={[styles.statusBadge, statusColor(item.status)]}>
                  {(item.status || 'pending').toUpperCase()}
                </Text>
                {fullyBooked && (
                  <Text style={styles.fullyBookedBadge}>FULLY BOOKED</Text>
                )}
              </View>

              <Text style={styles.propertyTitle}>{item.title}</Text>
              <Text style={styles.propertyLocation}>{item.location}</Text>
              <Text style={styles.propertyPrice}>
                KSh {Number(item.price || 0).toLocaleString()} / month
              </Text>

              {(item.bedrooms || item.bathrooms) ? (
                <Text style={styles.propertyMeta}>
                  {item.bedrooms ? `${item.bedrooms} bed` : ''}
                  {item.bedrooms && item.bathrooms ? ' · ' : ''}
                  {item.bathrooms ? `${item.bathrooms} bath` : ''}
                </Text>
              ) : null}

              {item.description ? (
                <Text style={styles.propertyDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              <Text
                style={[
                  styles.propertyStatus,
                  { color: available === 0 ? colors.danger : colors.success },
                ]}
              >
                {available === 0
                  ? 'Fully Booked'
                  : `${available}/${total} units available`}
              </Text>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, (booked / total) * 100)}%`,
                      backgroundColor: fullyBooked ? colors.danger : colors.success,
                    },
                  ]}
                />
              </View>

              {item.status === 'approved' && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: fullyBooked ? '#94a3b8' : colors.success }]}
                    onPress={() => handleUnitChange(1)}
                    disabled={fullyBooked}
                  >
                    <Text style={styles.actionBtnText}>Occupied</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: booked === 0 ? '#94a3b8' : colors.danger }]}
                    onPress={() => handleUnitChange(-1)}
                    disabled={booked === 0}
                  >
                    <Text style={styles.actionBtnText}>Free Unit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: Spacing.three,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundElement,
    borderRadius: 10,
    padding: Spacing.three,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  inviteButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  inviteButtonSecondary: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  inviteButtonSecondaryText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: Spacing.two,
  },
  propertyCard: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 10,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  propertyImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: Spacing.two,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  propertyLocation: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  propertyStatus: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: Spacing.one,
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  statusBadge: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fullyBookedBadge: {
    backgroundColor: colors.danger,
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  propertyPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  propertyMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  propertyDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: Spacing.one,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginTop: Spacing.two,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: Spacing.five,
  },
});
