import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { propertyAPI } from '../services/api';
import { Colors, Spacing } from '../constants/theme';

export default function DashboardScreen({ user, onNavigateInvite }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome, {user?.name || 'Landlord'}</Text>

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

      <TouchableOpacity style={styles.inviteButton} onPress={onNavigateInvite}>
        <Text style={styles.inviteButtonText}>+ Invite Caretaker</Text>
      </TouchableOpacity>

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
          const available = Math.max(0, (item.totalUnits || 1) - (item.bookedUnits || 0));
          return (
            <View style={styles.propertyCard}>
              <Text style={styles.propertyTitle}>{item.title}</Text>
              <Text style={styles.propertyLocation}>{item.location}</Text>
              <Text
                style={[
                  styles.propertyStatus,
                  { color: available === 0 ? Colors.danger : Colors.success },
                ]}
              >
                {available === 0
                  ? 'Fully Booked'
                  : `${available}/${item.totalUnits || 1} units available`}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.three,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.three,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundElement,
    borderRadius: 10,
    padding: Spacing.three,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  inviteButton: {
    backgroundColor: Colors.primary,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.two,
  },
  propertyCard: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: 10,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  propertyLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  propertyStatus: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: Spacing.one,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: Spacing.five,
  },
});
