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
import { SafeAreaView } from 'react-native-safe-area-context';
import { propertyAPI, updateBookedUnits } from '../services/api';
import QRStatsScreen from './QRStatsScreen';
import QRGeneratorScreen from './QRGeneratorScreen';
import EditPropertyScreen from './EditPropertyScreen';
import PropertyDetailScreen from './PropertyDetailScreen';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const STATUS_CONFIG = {
  approved: { color: '#22c55e', label: 'Approved' },
  pending:  { color: '#f59e0b', label: 'Pending' },
  rejected: { color: '#ef4444', label: 'Rejected' },
};

export default function DashboardScreen({ user, onLogout }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [qrPropertyId, setQrPropertyId] = useState(null);
  const [qrPropertyTitle, setQrPropertyTitle] = useState('');
  const [promotePropertyId, setPromotePropertyId] = useState(null);
  const [promotePropertyTitle, setPromotePropertyTitle] = useState('');
  const [editingProperty, setEditingProperty] = useState(null);
  const [viewingProperty, setViewingProperty] = useState(null);
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

  const totalProperties = properties.length;
  const approved = properties.filter(p => p.status === 'approved').length;
  const pending = properties.filter(p => p.status === 'pending').length;
  const totalAvailable = properties.reduce((sum, p) => {
    return sum + Math.max(0, (p.totalUnits || 1) - (p.bookedUnits || 0));
  }, 0);

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'approved', label: 'Approved' },
    { key: 'pending', label: 'Pending' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const filtered = filter === 'all'
    ? properties
    : properties.filter(p => p.status === filter);

  if (qrPropertyId) {
    return (
      <QRStatsScreen
        propertyId={qrPropertyId}
        propertyTitle={qrPropertyTitle}
        onBack={() => setQrPropertyId(null)}
      />
    );
  }

  if (promotePropertyId) {
    return (
      <QRGeneratorScreen
        propertyId={promotePropertyId}
        propertyTitle={promotePropertyTitle}
        onBack={() => setPromotePropertyId(null)}
      />
    );
  }

  if (editingProperty) {
    return (
      <EditPropertyScreen
        property={editingProperty}
        onBack={() => setEditingProperty(null)}
        onSuccess={() => {
          setEditingProperty(null);
          loadProperties();
        }}
      />
    );
  }

  if (viewingProperty) {
    return (
      <PropertyDetailScreen
        property={viewingProperty}
        onBack={() => setViewingProperty(null)}
      />
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initials = (user?.name || 'L')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const renderProperty = ({ item }) => {
    const total = item.totalUnits || 1;
    const booked = item.bookedUnits || 0;
    const available = Math.max(0, total - booked);
    const fullyBooked = booked >= total;
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const occupancyPct = Math.min(100, Math.round((booked / total) * 100));

    return (
      <View style={styles.card}>
        {item.images && item.images.length > 0 && (
          <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
        )}

        <View style={styles.cardBody}>
          {/* Status + Booked badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: status.color + '22', borderColor: status.color }]}>
              <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
            </View>
            {fullyBooked && (
              <View style={[styles.badge, { backgroundColor: colors.danger + '22', borderColor: colors.danger }]}>
                <Text style={[styles.badgeText, { color: colors.danger }]}>Fully Booked</Text>
              </View>
            )}
          </View>

          <TouchableOpacity onPress={() => setViewingProperty(item)}>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
          <Text style={styles.cardLocation}>{item.location}{item.county ? `, ${item.county}` : ''}</Text>
          <Text style={styles.cardPrice}>KSh {Number(item.price || 0).toLocaleString()} / mo</Text>

          {(item.bedrooms || item.bathrooms) ? (
            <Text style={styles.cardMeta}>
              {[item.bedrooms && `${item.bedrooms} bed`, item.bathrooms && `${item.bathrooms} bath`]
                .filter(Boolean).join('  ·  ')}
            </Text>
          ) : null}

          {/* Occupancy bar */}
          <View style={styles.occupancyRow}>
            <Text style={styles.occupancyLabel}>
              {available}/{total} units available
            </Text>
            <Text style={styles.occupancyPct}>{occupancyPct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[
              styles.progressFill,
              {
                width: `${occupancyPct}%`,
                backgroundColor: fullyBooked ? colors.danger : colors.primary,
              },
            ]} />
          </View>

          {/* Unit actions — only for approved */}
          {item.status === 'approved' && (
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
          )}

          <View style={styles.qrRow}>
            <TouchableOpacity
              style={[styles.qrButton, { flex: 1 }]}
              onPress={() => {
                setQrPropertyId(item._id);
                setQrPropertyTitle(item.title);
              }}
            >
              <Text style={styles.qrButtonText}>View QR Stats</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.qrButton, styles.promoteButton, { flex: 1 }]}
              onPress={() => {
                setPromotePropertyId(item._id);
                setPromotePropertyTitle(item.title);
              }}
            >
              <Text style={styles.promoteButtonText}>Promote</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditingProperty(item)}
          >
            <Text style={styles.editButtonText}>Edit Property</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>{getGreeting()},</Text>
                <Text style={styles.userName}>{user?.name || 'Landlord'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity onPress={onLogout}>
                  <Text style={styles.headerLogoutText}>Logout</Text>
                </TouchableOpacity>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              </View>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalProperties}</Text>
                <Text style={styles.statLabel}>Properties</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.success }]}>{approved}</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.warning }]}>{pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalAvailable}</Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
            </View>

            {/* Filter tabs */}
            <View style={styles.filterRow}>
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
                  onPress={() => setFilter(f.key)}
                >
                  <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Your Properties</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No properties yet</Text>
            <Text style={styles.emptyText}>Add your first property from the Upload tab.</Text>
          </View>
        }
        renderItem={renderProperty}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  greeting: {
    fontSize: FontSize.base,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: FontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoutText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  // Stats
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
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Filter tabs
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
    flexWrap: 'wrap',
  },
  filterTab: {
    paddingVertical: 5,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElement,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: Spacing.three,
  },
  // Property card
  card: {
    backgroundColor: colors.backgroundElement,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardBody: {
    padding: Spacing.three,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
    flexWrap: 'wrap',
  },
  badge: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  cardLocation: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: FontSize.sm,
    color: colors.textMuted,
    marginBottom: Spacing.two,
  },
  occupancyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    marginBottom: 5,
  },
  occupancyLabel: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
  },
  occupancyPct: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  qrRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  qrButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  promoteButton: {
    backgroundColor: colors.primary,
  },
  promoteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  editButton: {
    borderWidth: 1,
    borderColor: colors.textSecondary,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  qrButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  actionBtnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  actionBtnOutlineText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  // Empty state
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
