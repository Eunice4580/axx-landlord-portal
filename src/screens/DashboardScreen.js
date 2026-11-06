import React, { useEffect, useState, useCallback } from 'react';
import {
  AppState,
  Image,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { propertyAPI, updateBookedUnits, agentRequestsAPI, notificationsAPI } from '../services/api';
import { getReadNotificationIds, isNotificationRead } from '../utils/notificationReads';
import QRStatsScreen from './QRStatsScreen';
import QRGeneratorScreen from './QRGeneratorScreen';
import EditPropertyScreen from './EditPropertyScreen';
import PropertyDetailScreen from './PropertyDetailScreen';
import WaitlistScreen from './WaitlistScreen';
import AnalyticsScreen from './AnalyticsScreen';
import EnquiriesScreen from './EnquiriesScreen';
import AgentRequestsScreen from './AgentRequestsScreen';
import BoostModal from './accommodation/BoostModal';
import PlansModal from './accommodation/PlansModal';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const GOLD = '#fbbf24';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const STATUS_CONFIG = {
  approved: { color: '#1e3a5f', label: 'Approved' },
  pending:  { color: '#1e3a5f', label: 'Pending' },
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
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistPropertyId, setWaitlistPropertyId] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showEnquiries, setShowEnquiries] = useState(false);
  const [showAgentRequests, setShowAgentRequests] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [boostTarget, setBoostTarget] = useState(null);
  const [agentRequestCount, setAgentRequestCount] = useState(0);
  const [waitlistAlertCount, setWaitlistAlertCount] = useState(0);
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

  const loadAgentRequestCount = useCallback(async () => {
    try {
      const data = await agentRequestsAPI.getProviderRequests();
      const list = Array.isArray(data) ? data : [];
      setAgentRequestCount(list.filter(r => r.status === 'pending').length);
    } catch {
      // Non-critical: the dashboard still works without the badge.
    }
  }, []);

  const loadWaitlistAlertCount = useCallback(async () => {
    try {
      const [res, readIds] = await Promise.all([
        notificationsAPI.getMy(),
        getReadNotificationIds(),
      ]);
      const unread = (res?.notifications || []).filter(
        n => n.type === 'waitlist_request' && !isNotificationRead(n, readIds)
      );
      setWaitlistAlertCount(unread.length);
    } catch {
      // Non-critical badge: the dashboard still works without it.
    }
  }, []);

  // Auto-sync: properties deleted/changed on website update here automatically
  useEffect(() => {
    loadProperties();
    loadAgentRequestCount();
    loadWaitlistAlertCount();
    const appStateSub = AppState.addEventListener('change', s => {
      if (s === 'active') {
        loadProperties();
        loadWaitlistAlertCount();
      }
    });
    const poll = setInterval(() => loadProperties(), 60000);
    return () => { appStateSub.remove(); clearInterval(poll); };
  }, [loadProperties, loadAgentRequestCount, loadWaitlistAlertCount]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProperties();
    loadAgentRequestCount();
    loadWaitlistAlertCount();
  };

  // Apply the workspace preference saved in Settings each time the tab is opened.
  useFocusEffect(
    useCallback(() => {
      SecureStore.getItemAsync('landlord_default_filter')
        .then(value => { if (value) setFilter(value); })
        .catch(() => {});
      loadWaitlistAlertCount();
    }, [loadWaitlistAlertCount])
  );

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

  const counts = {
    all: properties.length,
    pending,
    approved,
    booked: properties.filter(p => (p.bookedUnits || 0) > 0).length,
    rejected: properties.filter(p => p.status === 'rejected').length,
  };

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'approved', label: 'Approved' },
    { key: 'pending', label: 'Pending' },
    { key: 'booked', label: 'Booked' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const filtered = filter === 'all'
    ? properties
    : filter === 'booked'
      ? properties.filter(p => (p.bookedUnits || 0) > 0)
      : properties.filter(p => p.status === filter);

  if (showAnalytics) {
    return <AnalyticsScreen onBack={() => setShowAnalytics(false)} />;
  }

  if (showEnquiries) {
    return <EnquiriesScreen onBack={() => setShowEnquiries(false)} />;
  }

  if (showAgentRequests) {
    return (
      <AgentRequestsScreen
        onBack={() => { setShowAgentRequests(false); loadAgentRequestCount(); }}
      />
    );
  }

  if (showWaitlist) {
    return (
      <WaitlistScreen
        onBack={() => { setShowWaitlist(false); setWaitlistPropertyId(null); loadWaitlistAlertCount(); }}
        mode="landlord"
        propertyId={waitlistPropertyId}
      />
    );
  }

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

          {/* Units available + occupancy */}
          <View style={styles.unitsRow}>
            <View style={styles.unitBox}>
              <Text style={[styles.unitNum, { color: available > 0 ? colors.success : colors.danger }]}>
                {available}
              </Text>
              <Text style={[styles.unitLbl, { color: colors.textSecondary }]}>Available Units</Text>
            </View>
            <Text style={[styles.occupancyPct, { color: colors.textMuted }]}>{occupancyPct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[
              styles.progressFill,
              {
                width: `${occupancyPct}%`,
                backgroundColor: fullyBooked ? colors.danger : colors.success,
              },
            ]} />
          </View>
          <Text style={styles.progressLabel}>
            {fullyBooked
              ? 'All units booked — hidden from searches'
              : `${available} of ${total} units active to rent`}
          </Text>

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
              <Text style={styles.promoteButtonText}>Poster / QR</Text>
            </TouchableOpacity>
          </View>

          {item.status === 'approved' && (
            <TouchableOpacity
              style={styles.boostButton}
              onPress={() => setBoostTarget(item)}
            >
              <Text style={styles.boostButtonText}>Boost Property</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditingProperty(item)}
          >
            <Text style={styles.editButtonText}>Edit Details &amp; Images</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.waitlistButton}
            onPress={() => { setWaitlistPropertyId(item._id); setShowWaitlist(true); }}
          >
            <Text style={styles.waitlistButtonText}>View Waitlist</Text>
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
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.greetingRow}>
                  <Text style={styles.greeting}>{getGreeting()},</Text>
                  <View style={[styles.portalPill, { borderColor: colors.primary + '50', backgroundColor: colors.primary + '12' }]}>
                    <Text style={[styles.portalPillText, { color: colors.primary }]}>LANDLORD PORTAL</Text>
                  </View>
                </View>
                <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Landlord'}</Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.plansButton, { borderColor: GOLD + '70', backgroundColor: GOLD + '15' }]}
                  onPress={() => setShowPlans(true)}
                >
                  <Text style={[styles.plansButtonText, { color: '#92400e' }]}>Plans</Text>
                </TouchableOpacity>
                {user?.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
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

            {/* Portfolio tools */}
            <View style={styles.toolsGrid}>
              <TouchableOpacity
                style={styles.toolCard}
                onPress={() => setShowAnalytics(true)}
                activeOpacity={0.75}
              >
                <Text style={styles.toolLabel}>Performance</Text>
                <Text style={styles.toolCaption}>Views, inquiries &amp; revenue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolCard}
                onPress={() => setShowEnquiries(true)}
                activeOpacity={0.75}
              >
                <Text style={styles.toolLabel}>Enquiries</Text>
                <Text style={styles.toolCaption}>Poster QR scan leads</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolCard}
                onPress={() => { setWaitlistPropertyId(null); setShowWaitlist(true); }}
                activeOpacity={0.75}
              >
                {waitlistAlertCount > 0 && (
                  <View style={[styles.alertDot, { backgroundColor: colors.danger }]} />
                )}
                <Text style={styles.toolLabel}>Waitlist</Text>
                <Text style={styles.toolCaption}>People waiting for units</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolCard}
                onPress={() => setShowAgentRequests(true)}
                activeOpacity={0.75}
              >
                <View style={styles.toolLabelRow}>
                  <Text style={styles.toolLabel}>Agent Requests</Text>
                  {agentRequestCount > 0 && (
                    <View style={[styles.toolBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.toolBadgeText}>{agentRequestCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.toolCaption}>
                  {agentRequestCount > 0 ? `${agentRequestCount} awaiting response` : 'Manage agent access'}
                </Text>
              </TouchableOpacity>
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
                    {f.label} ({counts[f.key] || 0})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Your Properties</Text>
            <Text style={styles.sectionSub}>
              Manage your listed rentals, monitor occupancy, and promote vacancies.
            </Text>
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

      <BoostModal
        visible={!!boostTarget}
        listing={boostTarget}
        tokenKey="token"
        listingType="Property"
        onClose={() => setBoostTarget(null)}
        onSuccess={() => {
          setBoostTarget(null);
          Alert.alert('M-Pesa prompt sent', 'Enter your M-Pesa PIN to activate the boost.');
        }}
      />

      <PlansModal
        visible={showPlans}
        tokenKey="token"
        role="landlord"
        onClose={() => setShowPlans(false)}
        onSuccess={() => Alert.alert('M-Pesa prompt sent', 'Your plan activates after payment.')}
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
    gap: 8,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 3,
  },
  greeting: {
    fontSize: FontSize.base,
    color: colors.textSecondary,
  },
  portalPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  portalPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  userName: {
    fontSize: FontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plansButton: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  plansButtonText: {
    fontSize: 11,
    fontWeight: '800',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  // Portfolio tools
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  toolCard: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: colors.backgroundElement,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.three,
  },
  toolLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  alertDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  toolLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  toolCaption: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  toolBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
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
  },
  sectionSub: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
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
  unitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.two,
    marginBottom: 5,
  },
  unitBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  unitNum: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  unitLbl: {
    fontSize: FontSize.xs,
  },
  occupancyPct: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: FontSize.xs,
    color: colors.textMuted,
    marginBottom: Spacing.three,
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
  boostButton: {
    backgroundColor: GOLD,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 8,
  },
  boostButtonText: {
    color: '#1f2937',
    fontWeight: '800',
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
  waitlistButton: {
    backgroundColor: '#1e3a8a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  waitlistButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
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
