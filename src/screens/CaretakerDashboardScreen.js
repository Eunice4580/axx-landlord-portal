import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { caretakerAPI, updateBookedUnits } from '../services/api';
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function CaretakerDashboardScreen({ user, onLogout }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors, isDark, toggleTheme } = useTheme();
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

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProperties();
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Welcome, {user?.name || 'Caretaker'}</Text>
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subheader}>Your assigned properties</Text>

      <View style={styles.themeRow}>
        <Text style={styles.themeLabel}>Dark Mode</Text>
        <Switch value={isDark} onValueChange={toggleTheme} />
      </View>

      <FlatList
        data={properties}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No properties assigned to you yet. Contact your landlord.
          </Text>
        }
        renderItem={({ item }) => {
          const total = item.totalUnits || 1;
          const booked = item.bookedUnits || 0;
          const available = Math.max(0, total - booked);
          const fullyBooked = booked >= total;

          return (
            <View style={styles.propertyCard}>
              {item.images && item.images.length > 0 && (
                <Image source={{ uri: item.images[0] }} style={styles.propertyImage} />
              )}
              <Text style={styles.propertyTitle}>{item.title}</Text>
              <Text style={styles.propertyLocation}>{item.location}</Text>

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

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: fullyBooked ? '#94a3b8' : colors.success },
                  ]}
                  onPress={() => handleUnitChange(item._id, 1)}
                  disabled={fullyBooked}
                >
                  <Text style={styles.actionBtnText}>Occupied</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: booked === 0 ? '#94a3b8' : colors.danger },
                  ]}
                  onPress={() => handleUnitChange(item._id, -1)}
                  disabled={booked === 0}
                >
                  <Text style={styles.actionBtnText}>Free Unit</Text>
                </TouchableOpacity>
              </View>
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
  subheader: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: Spacing.three,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundElement,
    borderRadius: 10,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  themeLabel: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
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
