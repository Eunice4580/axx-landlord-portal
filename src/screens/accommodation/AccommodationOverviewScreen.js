import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, Animated, Linking, Share } from 'react-native';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Image, Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import {
  HomeIcon, BarChartIcon, CalendarIcon, StarIcon,
  LocationIcon, ShieldCheckIcon, PlusIcon, EditIcon, TrashIcon,
  EyeIcon,
} from './AccomIcons';
import RegisterAccommodationScreen from './RegisterAccommodationScreen';
import BoostModal from './BoostModal';
import PlansModal from './PlansModal';

const ACCENT = '#e11d48';
const GOLD = '#fbbf24';
const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';
const PUBLIC_SITE = 'https://axxspace.com';

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'views', label: 'Most Views' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'name', label: 'Alphabetical' },
];

async function apiGet(path) {
  const token = await SecureStore.getItemAsync('accom_token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Resolve location object to a readable string
function resolveLocation(loc) {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    const parts = [loc.town, loc.county, loc.city, loc.area].filter(Boolean);
    return parts.join(', ');
  }
  return '';
}

const STATUS_CONFIG = {
  approved: { bg: '#10b98118', border: '#10b98140', text: '#10b981', label: 'Live' },
  active:   { bg: '#10b98118', border: '#10b98140', text: '#10b981', label: 'Live' },
  pending_review: { bg: '#f59e0b18', border: '#f59e0b40', text: '#f59e0b', label: 'Under Review' },
  pending:  { bg: '#f59e0b18', border: '#f59e0b40', text: '#f59e0b', label: 'Under Review' },
  rejected: { bg: '#ef444418', border: '#ef444440', text: '#ef4444', label: 'Needs Action' },
  inactive: { bg: '#ef444418', border: '#ef444440', text: '#ef4444', label: 'Needs Action' },
};

function getStatus(s) {
  return STATUS_CONFIG[(s || 'pending').toLowerCase()] || STATUS_CONFIG.pending;
}

// ── Toast ──
function Toast({ message, visible }) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, message]);
  if (!message) return null;
  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <ShieldCheckIcon color="#10b981" size={14} />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

// ── Stat Card ──
function StatCard({ Icon, label, value, color, colors, active, onPress, sub }) {
  return (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: colors.backgroundElement, borderColor: active ? color : colors.border, borderWidth: active ? 1.5 : 1 }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
        <Icon color={color} size={16} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value ?? '—'}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      {sub ? <Text style={[styles.statSub, { color: colors.textMuted }]}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}

// ── Property Card ──
function getListingPrice(item) {
  return Number(item.pricing?.basePrice || item.basePrice || item.price || 0);
}

function resolveImageUri(img) {
  if (!img) return null;
  if (typeof img === 'string') return img;
  return img.imageUrl || img.url || null;
}

function PropertyCard({ item, colors, onEdit, onDelete, onBoost, onShare, onView }) {
  const st = getStatus(item.status);
  const img = resolveImageUri(item.primaryImage) || resolveImageUri(item.images?.[0]) || resolveImageUri(item.thumbnail) || null;
  const price = getListingPrice(item);
  const photosCount = item.images?.length || 0;
  const videosCount = item.videos?.length || 0;
  const viewsCount = item.views || 0;
  const isPending = item.status === 'pending' || item.status === 'pending_review';
  const isRejected = item.status === 'rejected' || item.status === 'inactive';
  const isApproved = item.status === 'approved' || item.status === 'active';
  const locationStr = resolveLocation(item.location) || item.town || item.county || '';
  const category = item.category || item.type || '';

  return (
    <View style={[styles.propCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      <View style={styles.cardMediaWrap}>
        {img ? (
          <Image source={{ uri: img }} style={styles.propImage} resizeMode="cover" />
        ) : (
          <View style={[styles.propImagePlaceholder, { backgroundColor: ACCENT + '15' }]}>
            <Text style={{ fontSize: 36 }}>🏨</Text>
          </View>
        )}

        {/* Badges over image */}
        <View style={styles.badgeOverlay}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexShrink: 1 }}>
            {category ? <View style={styles.categoryBadge}><Text style={styles.categoryBadgeText}>{category}</Text></View> : null}
            {item.isFeatured ? (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>⭐ Featured</Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.statusBadgeImg, { backgroundColor: st.bg, borderColor: st.border }]}>
            {isApproved && <ShieldCheckIcon color={st.text} size={9} />}
            <Text style={[styles.statusBadgeImgText, { color: st.text }]}> {st.label}</Text>
          </View>
        </View>

        {/* Views + media overlay */}
        <View style={styles.imageBottomOverlay}>
          <View style={styles.viewsPill}>
            <EyeIcon color="#fff" size={11} />
            <Text style={styles.viewsPillText}> {viewsCount.toLocaleString()} views</Text>
          </View>
          <Text style={styles.photosPillText}>
            {photosCount} 📷{videosCount > 0 ? ` · ${videosCount} 🎥` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.propBody}>
        {/* Title */}
        <Text style={[styles.propName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>

        {/* Location */}
        {locationStr ? (
          <View style={styles.locationRow}>
            <LocationIcon color={GOLD} size={12} />
            <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}> {locationStr}</Text>
          </View>
        ) : null}

        {/* Price + Rating */}
        <View style={styles.propMeta}>
          {price > 0 ? (
            <Text style={[styles.priceText, { color: ACCENT }]}>
              KSh {price.toLocaleString()}<Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '400' }}> / night</Text>
            </Text>
          ) : null}
          {item.averageRating > 0 && (
            <View style={styles.ratingRow}>
              <StarIcon color={GOLD} size={11} filled />
              <Text style={[styles.ratingText, { color: colors.textMuted }]}> {item.averageRating?.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Status callouts */}
        {isPending && (
          <View style={[styles.callout, { backgroundColor: '#f59e0b12', borderColor: '#f59e0b40' }]}>
            <CalendarIcon color="#f59e0b" size={12} />
            <Text style={[styles.calloutText, { color: '#f59e0b' }]}> Under review — usually within 24 hours.</Text>
          </View>
        )}
        {isRejected && (
          <View style={[styles.callout, { backgroundColor: '#ef444412', borderColor: '#ef444440' }]}>
            <Text style={[styles.calloutText, { color: '#ef4444' }]}>⚠ Revision requested. Edit and resubmit.</Text>
          </View>
        )}

        {/* Primary actions */}
        <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: ACCENT + '40', backgroundColor: ACCENT + '12' }]} onPress={() => onEdit(item)}>
            <EditIcon color={ACCENT} size={13} />
            <Text style={[styles.actionBtnText, { color: ACCENT }]}> Edit & Media</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.deleteBtn, { borderColor: '#ef444440', backgroundColor: '#ef444410' }]} onPress={() => onDelete(item)}>
            <TrashIcon color="#ef4444" size={13} />
            <Text style={[styles.deleteBtnText, { color: '#ef4444' }]}> Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Promote / share actions */}
        <View style={styles.secondaryActions}>
          {isApproved && (
            <TouchableOpacity style={[styles.miniBtn, { borderColor: GOLD + '50', backgroundColor: GOLD + '12' }]} onPress={() => onBoost(item)}>
              <Text style={[styles.miniBtnText, { color: GOLD }]}>⚡ {item.isFeatured ? 'Re-boost' : 'Boost'}</Text>
            </TouchableOpacity>
          )}
          {isApproved && (
            <TouchableOpacity style={[styles.miniBtn, { borderColor: colors.border, backgroundColor: colors.background }]} onPress={() => onView(item)}>
              <Text style={[styles.miniBtnText, { color: colors.text }]}>↗ Live</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.miniBtn, { borderColor: colors.border, backgroundColor: colors.background }]} onPress={() => onShare(item)}>
            <Text style={[styles.miniBtnText, { color: colors.text }]}>🔗 Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Compact property row (list view) ──
function PropertyRow({ item, colors, onEdit, onDelete, onBoost, onShare, onView }) {
  const st = getStatus(item.status);
  const img = resolveImageUri(item.primaryImage) || resolveImageUri(item.images?.[0]) || resolveImageUri(item.thumbnail) || null;
  const price = getListingPrice(item);
  const locationStr = resolveLocation(item.location) || item.town || item.county || '';
  const isApproved = item.status === 'approved' || item.status === 'active';

  return (
    <View style={[styles.rowCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      {img ? (
        <Image source={{ uri: img }} style={styles.rowImage} resizeMode="cover" />
      ) : (
        <View style={[styles.rowImage, styles.rowImagePlaceholder, { backgroundColor: ACCENT + '15' }]}>
          <Text style={{ fontSize: 22 }}>🏨</Text>
        </View>
      )}
      <View style={styles.rowInfo}>
        <View style={styles.rowTitleLine}>
          <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.rowStatus, { backgroundColor: st.bg, borderColor: st.border }]}>
            <Text style={[styles.rowStatusText, { color: st.text }]}>{st.label}</Text>
          </View>
        </View>
        <Text style={[styles.rowMeta, { color: colors.textMuted }]} numberOfLines={1}>
          {[item.category || item.type, locationStr, `${item.views || 0} views`].filter(Boolean).join(' · ')}
        </Text>
        <View style={styles.rowBottom}>
          <Text style={[styles.rowPrice, { color: ACCENT }]}>
            {price > 0 ? `KSh ${price.toLocaleString()}` : 'No price'}<Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '400' }}> / night</Text>
          </Text>
          <View style={styles.rowActions}>
            <TouchableOpacity onPress={() => onEdit(item)} style={styles.rowActionBtn}>
              <Text style={[styles.rowActionText, { color: ACCENT }]}>Edit</Text>
            </TouchableOpacity>
            {isApproved && (
              <TouchableOpacity onPress={() => onBoost(item)} style={styles.rowActionBtn}>
                <Text style={[styles.rowActionText, { color: GOLD }]}>⚡ Boost</Text>
              </TouchableOpacity>
            )}
            {isApproved && (
              <TouchableOpacity onPress={() => onView(item)} style={styles.rowActionBtn}>
                <Text style={[styles.rowActionText, { color: colors.text }]}>View</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => onShare(item)} style={styles.rowActionBtn}>
              <Text style={[styles.rowActionText, { color: colors.text }]}>🔗</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item)} style={styles.rowActionBtn}>
              <Text style={[styles.rowActionText, { color: '#ef4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Agent Request Card ──
function AgentRequestCard({ req, colors, onAccept, onReject, actionLoading }) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [note, setNote] = useState('');
  const initials = (req.agent?.name || 'A').charAt(0).toUpperCase();
  const statusColor = req.status === 'accepted' ? '#10b981' : req.status === 'rejected' ? '#ef4444' : '#f59e0b';

  return (
    <View style={[styles.agentCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      <View style={styles.agentCardTop}>
        <View style={[styles.agentAvatar, { backgroundColor: ACCENT }]}>
          <Text style={styles.agentAvatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.agentName, { color: colors.text }]}>{req.agent?.name || 'Agent'}</Text>
          <Text style={[styles.agentMeta, { color: colors.textMuted }]}>{req.agent?.email}</Text>
          {req.agent?.phone && <Text style={[styles.agentMeta, { color: colors.textMuted }]}>📞 {req.agent.phone}</Text>}
        </View>
        <View style={[styles.agentStatusPill, { backgroundColor: statusColor + '20', borderColor: statusColor + '50' }]}>
          <Text style={[styles.agentStatusText, { color: statusColor }]}>{(req.status || '').toUpperCase()}</Text>
        </View>
      </View>

      {req.agent?.agentProfile?.county && (
        <Text style={[styles.agentCounty, { color: colors.textMuted }]}>📍 County: <Text style={{ fontWeight: '700' }}>{req.agent.agentProfile.county}</Text></Text>
      )}

      {req.agentMessage && (
        <View style={[styles.agentMessage, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.agentMessageText, { color: colors.text }]}>
            <Text style={{ fontWeight: '700', color: colors.textMuted }}>Pitch: </Text>{req.agentMessage}
          </Text>
        </View>
      )}

      {req.status === 'pending' && !showRejectForm && (
        <View style={styles.agentActions}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(req._id)} disabled={actionLoading}>
            <Text style={styles.acceptBtnText}>✓ Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rejectBtn, { borderColor: '#ef444440' }]} onPress={() => setShowRejectForm(true)}>
            <Text style={styles.rejectBtnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {showRejectForm && (
        <View style={styles.rejectForm}>
          <TextInput
            style={[styles.rejectInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholder="Optional note for agent..."
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
          />
          <View style={styles.rejectFormActions}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => { setShowRejectForm(false); setNote(''); }}>
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmRejectBtn} onPress={() => { onReject(req._id, note); setShowRejectForm(false); }} disabled={actionLoading}>
              <Text style={styles.confirmRejectBtnText}>Confirm Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function AccommodationOverviewScreen({ user, onOpenAccount }) {
  const { colors } = useTheme();

  // Listings state
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Agent requests state
  const [agentRequests, setAgentRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');

  // Monetization
  const [showPlans, setShowPlans] = useState(false);
  const [boostTarget, setBoostTarget] = useState(null);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastKey, setToastKey] = useState(0);

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastKey(k => k + 1);
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await apiGet('/accommodations/my-accommodations/all');
      setAccommodations(res.accommodations || res.data || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Accommodation load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadAgentRequests = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('accom_token');
      const res = await fetch(`${API_BASE}/agent-requests/provider`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAgentRequests(data);
      }
    } catch (e) {
      console.error('Agent requests error:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadAgentRequests();
    // Refresh when app comes back to foreground; no polling timer
    const appStateSub = AppState.addEventListener('change', s => {
      if (s === 'active') { loadData(); loadAgentRequests(); }
    });
    return () => { appStateSub.remove(); };
  }, [loadData, loadAgentRequests]);

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Accommodation',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('accom_token');
              const res = await fetch(`${API_BASE}/accommodations/${item._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete property');
              }
              setAccommodations(prev => prev.filter(a => a._id !== item._id));
              showToast('Property deleted successfully.');
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not delete property.');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsRegistering(true);
  };

  const handleAcceptRequest = async (requestId) => {
    setActionLoading(true);
    try {
      const token = await SecureStore.getItemAsync('accom_token');
      const res = await fetch(`${API_BASE}/agent-requests/${requestId}/accept`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Agent collaboration approved!');
        loadAgentRequests();
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  };

  const handleRejectRequest = async (requestId, note) => {
    setActionLoading(true);
    try {
      const token = await SecureStore.getItemAsync('accom_token');
      const res = await fetch(`${API_BASE}/agent-requests/${requestId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ response: note }),
      });
      if (res.ok) {
        showToast('Agent request declined.');
        loadAgentRequests();
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(true), loadAgentRequests()]);
    showToast('Dashboard synced.');
    setRefreshing(false);
  };

  const handleShare = async (item) => {
    const url = `${PUBLIC_SITE}/accommodation/${item._id}`;
    try {
      await Share.share({ message: `${item.name} — ${url}` });
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  const handleViewLive = (item) => {
    Linking.openURL(`${PUBLIC_SITE}/accommodation/${item._id}`).catch(() => {
      Alert.alert('Unable to open', 'Could not open the live listing in your browser.');
    });
  };

  const handleBoostSuccess = () => {
    showToast('M-Pesa prompt sent — boost activates after payment.');
  };

  // Derived stats
  const total = accommodations.length;
  const liveCount = accommodations.filter(a => a.status === 'approved' || a.status === 'active').length;
  const pendingCount = accommodations.filter(a => a.status === 'pending' || a.status === 'pending_review').length;
  const rejectedCount = accommodations.filter(a => a.status === 'rejected' || a.status === 'inactive').length;
  const totalViews = accommodations.reduce((s, a) => s + (a.views || 0), 0);
  const pendingRequests = agentRequests.filter(r => r.status === 'pending');

  // Categories available in this portfolio
  const categories = useMemo(() => {
    const seen = new Set();
    accommodations.forEach(a => {
      const c = a.category || a.type;
      if (c) seen.add(c);
    });
    return ['All', ...Array.from(seen)];
  }, [accommodations]);

  // Filtered listings
  const filteredListings = useMemo(() => {
    let result = [...accommodations];
    if (statusFilter !== 'all') {
      result = result.filter(l => {
        const s = (l.status || '').toLowerCase();
        if (statusFilter === 'approved') return s === 'approved' || s === 'active';
        if (statusFilter === 'pending') return s === 'pending' || s === 'pending_review';
        if (statusFilter === 'rejected') return s === 'rejected' || s === 'inactive';
        return true;
      });
    }
    if (categoryFilter !== 'All') {
      result = result.filter(l => (l.category || l.type || '').toLowerCase() === categoryFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(l =>
        (l.name || '').toLowerCase().includes(q) ||
        resolveLocation(l.location).toLowerCase().includes(q) ||
        (l.category || '').toLowerCase().includes(q)
      );
    }
    const priceOf = (l) => getListingPrice(l);
    result.sort((a, b) => {
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      if (sortBy === 'price_desc') return priceOf(b) - priceOf(a);
      if (sortBy === 'price_asc') return priceOf(a) - priceOf(b);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    return result;
  }, [accommodations, statusFilter, categoryFilter, searchQuery, sortBy]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const displayName = user?.name ? user.name.split(' ')[0] : 'Host';

  if (isRegistering) {
    return (
      <RegisterAccommodationScreen
        itemToEdit={editingItem}
        onBack={() => { setIsRegistering(false); setEditingItem(null); }}
        onSuccess={() => { setIsRegistering(false); setEditingItem(null); loadData(); }}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Toast */}
      <Toast message={toastMsg} visible={!!toastMsg} key={toastKey} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.greetingRow}>
            <Text style={[styles.greeting, { color: colors.textMuted }]}>{greeting()},</Text>
            <View style={[styles.hostPortalPill, { borderColor: ACCENT + '50', backgroundColor: ACCENT + '12' }]}>
              <Text style={[styles.hostPortalPillText, { color: ACCENT }]}>HOST PORTAL</Text>
            </View>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Sync button */}
          <TouchableOpacity style={[styles.syncBtn, { borderColor: colors.border, backgroundColor: colors.background }]} onPress={handleManualRefresh}>
            <BarChartIcon color={colors.textMuted} size={14} />
            <Text style={[styles.syncBtnText, { color: colors.textMuted }]}>Sync</Text>
          </TouchableOpacity>

          {/* Add button */}
          <TouchableOpacity
            style={styles.addHeaderBtn}
            onPress={() => { setEditingItem(null); setIsRegistering(true); }}
          >
            <PlusIcon color="#fff" size={14} />
            <Text style={styles.addHeaderBtnText}> Add</Text>
          </TouchableOpacity>

          {/* Avatar */}
          {(user?.profileImage || user?.avatar) ? (
            <Image source={{ uri: user.profileImage || user.avatar }} style={[styles.avatar, { borderWidth: 2, borderColor: ACCENT }]} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: ACCENT }]}>
              <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleManualRefresh} tintColor={ACCENT} colors={[ACCENT]} />}
      >
        {/* Host badge */}
        <View style={[styles.hostBadgeRow, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={styles.verifiedPill}>
            <View style={styles.verifiedDot} />
            <Text style={styles.verifiedText}>Verified Host Partner</Text>
          </View>
          <Text style={[styles.networkPill, { color: colors.textMuted }]}>Kenya Hospitality Network</Text>
        </View>

        {/* Hero description */}
        <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
          Hospitality Command Center · Oversee your safari camps, beach villas, city apartments, and
          hotel properties. Track guest engagement, partner with certified agents, and manage room
          inventory in real-time.
        </Text>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => Linking.openURL(`${PUBLIC_SITE}/accommodation`)}
            activeOpacity={0.8}
          >
            <Text style={[styles.quickBtnText, { color: colors.text }]}>🌍 Browse Stays</Text>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => onOpenAccount?.()}
            activeOpacity={0.8}
          >
            <Text style={[styles.quickBtnText, { color: colors.text }]}>👤 Member Hub</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => setShowPlans(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.quickBtnText, { color: colors.text }]}>💎 Plans</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Syncing your accommodation portfolio…</Text>
          </View>
        ) : (
          <>
            {/* ── Agent Requests Banner ── */}
            {pendingRequests.length > 0 && (
              <View style={[styles.agentBanner, { backgroundColor: '#f59e0b12', borderColor: '#f59e0b40' }]}>
                <View style={styles.agentBannerLeft}>
                  <View style={[styles.agentBannerIcon, { backgroundColor: '#f59e0b20' }]}>
                    <Text style={{ fontSize: 18 }}>🔔</Text>
                  </View>
                  <View>
                    <Text style={[styles.agentBannerHeading, { color: colors.text }]}>
                      {pendingRequests.length} Pending Agent Request{pendingRequests.length > 1 ? 's' : ''}
                    </Text>
                    <Text style={[styles.agentBannerSub, { color: colors.textMuted }]}>
                      Agents want to promote your properties.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.agentBannerBtn, { borderColor: '#f59e0b60', backgroundColor: '#f59e0b18' }]}
                  onPress={() => setShowRequests(!showRequests)}
                >
                  <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '800' }}>
                    {showRequests ? 'Hide' : 'Review →'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Agent Requests Drawer ── */}
            {showRequests && (
              <View style={[styles.agentDrawer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <View style={styles.agentDrawerHead}>
                  <Text style={[styles.agentDrawerTitle, { color: colors.text }]}>Agent Collaboration Inquiries</Text>
                  <TouchableOpacity onPress={() => setShowRequests(false)}>
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>✕ Close</Text>
                  </TouchableOpacity>
                </View>
                {agentRequests.length === 0 ? (
                  <Text style={[styles.agentEmpty, { color: colors.textMuted }]}>No incoming agent requests at this time.</Text>
                ) : (
                  agentRequests.map(req => (
                    <AgentRequestCard
                      key={req._id}
                      req={req}
                      colors={colors}
                      onAccept={handleAcceptRequest}
                      onReject={handleRejectRequest}
                      actionLoading={actionLoading}
                    />
                  ))
                )}
              </View>
            )}

            {/* ── Stats Grid ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: ACCENT }]}>OVERVIEW</Text>
              <View style={styles.statsGrid}>
                <StatCard Icon={HomeIcon} label="Total Properties" sub="Entire property portfolio" value={total} color="#60a5fa" colors={colors} active={statusFilter === 'all'} onPress={() => setStatusFilter('all')} />
                <StatCard Icon={ShieldCheckIcon} label="Active & Live" sub="Visible for booking inquiries" value={liveCount} color="#10b981" colors={colors} active={statusFilter === 'approved'} onPress={() => setStatusFilter('approved')} />
                <StatCard Icon={CalendarIcon} label="Under Review" sub="Verification within 24h" value={pendingCount} color="#f59e0b" colors={colors} active={statusFilter === 'pending'} onPress={() => setStatusFilter('pending')} />
                <StatCard Icon={HomeIcon} label="Needs Action" sub={rejectedCount > 0 ? 'Edit & resubmit listing' : '0 revision needed'} value={rejectedCount} color="#ef4444" colors={colors} active={statusFilter === 'rejected'} onPress={() => setStatusFilter('rejected')} />
                <StatCard Icon={BarChartIcon} label="Guest Views" sub="Total guest impressions" value={totalViews.toLocaleString()} color="#38bdf8" colors={colors} active={false} onPress={() => {}} />
              </View>
            </View>

            {/* ── Properties Section ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionLabel, { color: ACCENT, marginBottom: 2 }]}>MY PROPERTIES</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                    Showing {filteredListings.length} of {total} listed accommodation stays
                  </Text>
                </View>
                <View style={styles.sectionHeaderActions}>
                  <View style={[styles.viewToggle, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
                    <TouchableOpacity
                      style={[styles.viewToggleBtn, viewMode === 'grid' && { backgroundColor: ACCENT }]}
                      onPress={() => setViewMode('grid')}
                    >
                      <Text style={[styles.viewToggleText, { color: viewMode === 'grid' ? '#fff' : colors.textMuted }]}>▦</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.viewToggleBtn, viewMode === 'list' && { backgroundColor: ACCENT }]}
                      onPress={() => setViewMode('list')}
                    >
                      <Text style={[styles.viewToggleText, { color: viewMode === 'list' ? '#fff' : colors.textMuted }]}>☰</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.addHeaderBtn}
                    onPress={() => { setEditingItem(null); setIsRegistering(true); }}
                  >
                    <PlusIcon color="#fff" size={13} />
                    <Text style={styles.addHeaderBtnText}> List New</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search + filter */}
              <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <LocationIcon color={colors.textMuted} size={14} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search by property name, town, county..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Status filter pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                {[
                  { id: 'all', label: `All (${total})` },
                  { id: 'approved', label: `Live (${liveCount})` },
                  { id: 'pending', label: `In Review (${pendingCount})` },
                  { id: 'rejected', label: `Needs Action (${rejectedCount})` },
                ].map(tab => (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.filterPill,
                      { backgroundColor: statusFilter === tab.id ? ACCENT : colors.backgroundElement, borderColor: statusFilter === tab.id ? ACCENT : colors.border },
                    ]}
                    onPress={() => setStatusFilter(tab.id)}
                  >
                    <Text style={[styles.filterPillText, { color: statusFilter === tab.id ? '#fff' : colors.textMuted }]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Category filter pills */}
              {categories.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                  {categories.map(cat => {
                    const active = categoryFilter === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryPill,
                          { backgroundColor: active ? ACCENT + '18' : colors.backgroundElement, borderColor: active ? ACCENT : colors.border },
                        ]}
                        onPress={() => setCategoryFilter(cat)}
                      >
                        <Text style={[styles.categoryPillText, { color: active ? ACCENT : colors.textMuted }]}>
                          {cat === 'All' ? 'All Categories' : cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Sort pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                {SORT_OPTIONS.map(opt => {
                  const active = sortBy === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.sortPill,
                        { backgroundColor: active ? colors.backgroundElement : 'transparent', borderColor: active ? colors.textMuted : colors.border },
                      ]}
                      onPress={() => setSortBy(opt.id)}
                    >
                      <Text style={[styles.sortPillText, { color: active ? colors.text : colors.textMuted, fontWeight: active ? '800' : '600' }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Listing cards */}
              {accommodations.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 48, marginBottom: 14 }}>🏨</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Properties Listed Yet</Text>
                  <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                    Start listing your resort, lodge, cottage, or hotel to reach thousands of guests.
                  </Text>
                  <TouchableOpacity style={styles.emptyActionBtn} onPress={() => { setEditingItem(null); setIsRegistering(true); }}>
                    <PlusIcon color="#fff" size={16} />
                    <Text style={styles.emptyActionBtnText}> List Your First Property</Text>
                  </TouchableOpacity>
                </View>
              ) : filteredListings.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 40, marginBottom: 14 }}>🔍</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Matching Properties</Text>
                  <Text style={[styles.emptyBody, { color: colors.textMuted }]}>No properties match the current filters.</Text>
                  <TouchableOpacity
                    style={[styles.emptyActionBtn, { backgroundColor: colors.border }]}
                    onPress={() => { setSearchQuery(''); setStatusFilter('all'); setCategoryFilter('All'); setSortBy('newest'); }}
                  >
                    <Text style={[styles.emptyActionBtnText]}>Reset Filters</Text>
                  </TouchableOpacity>
                </View>
              ) : viewMode === 'grid' ? (
                filteredListings.map(item => (
                  <PropertyCard
                    key={item._id}
                    item={item}
                    colors={colors}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onBoost={setBoostTarget}
                    onShare={handleShare}
                    onView={handleViewLive}
                  />
                ))
              ) : (
                filteredListings.map(item => (
                  <PropertyRow
                    key={item._id}
                    item={item}
                    colors={colors}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onBoost={setBoostTarget}
                    onShare={handleShare}
                    onView={handleViewLive}
                  />
                ))
              )}
            </View>

            {/* ── Host Growth Toolkit ── */}
            <View style={styles.section}>
              <View style={[styles.toolkitHeader, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <Text style={[styles.toolkitTitle, { color: colors.text }]}>AXX Host Growth Toolkit</Text>
                <Text style={[styles.toolkitSubtitle, { color: colors.textMuted }]}>
                  Pro-tips to maximize booking revenue and search ranking
                </Text>
              </View>
              {[
                {  title: '4K Photography & Video', desc: 'Listings with 8+ professional photos get 3.4× more inquiries. Showcase bedrooms, balconies, and scenic views.' },
                { title: 'Certified Agent Partnerships', desc: 'Accept agents who market your spaces to corporate retreats, safari tourists, and diplomatic delegations.' },
                { title: '24-Hour Express Verification', desc: 'New properties are verified within 24 hours. Keep pricing and WhatsApp contact up to date for instant responses.' },
              ].map((tip, i) => (
                <View key={i} style={[styles.toolkitCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toolkitCardTitle, { color: colors.text }]}>{tip.title}</Text>
                    <Text style={[styles.toolkitCardDesc, { color: colors.textMuted }]}>{tip.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
        <View style={{ height: Spacing.six }} />
      </ScrollView>

      <BoostModal
        visible={!!boostTarget}
        listing={boostTarget}
        onClose={() => setBoostTarget(null)}
        onSuccess={handleBoostSuccess}
      />
      <PlansModal
        visible={showPlans}
        onClose={() => setShowPlans(false)}
        onSuccess={() => showToast('M-Pesa prompt sent — plan activates after payment.')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  toast: {
    position: 'absolute', bottom: 90, left: 20, right: 20, zIndex: 9999,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0f172a', borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)',
    borderRadius: 12, padding: 12, paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, elevation: 20,
  },
  toastText: { color: '#f8fafc', fontSize: 13, fontWeight: '700', flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingVertical: 14, borderBottomWidth: 1,
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greeting: { fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.3 },
  hostPortalPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  hostPortalPillText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  userName: { fontSize: FontSize.xl, fontWeight: '900', letterSpacing: -0.3 },
  heroSubtitle: { paddingHorizontal: Spacing.three, marginTop: 10, fontSize: 12, lineHeight: 18 },
  subGreeting: { fontSize: 10, fontWeight: '500', marginTop: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 16, fontWeight: '900' },
  syncBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  syncBtnText: { fontSize: 11, fontWeight: '700' },
  addHeaderBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: ACCENT,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.md,
  },
  addHeaderBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  hostBadgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: Spacing.three, marginTop: Spacing.two,
    padding: 10, borderRadius: BorderRadius.lg, borderWidth: 1,
  },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fbbf2418', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#fbbf2430' },
  verifiedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fbbf24' },
  verifiedText: { fontSize: 10, fontWeight: '800', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 0.5 },
  networkPill: { fontSize: 10, fontWeight: '700' },
  loadingWrap: { paddingTop: 80, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: FontSize.base },
  agentBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: Spacing.three, marginBottom: 0, borderWidth: 1, borderRadius: BorderRadius.lg, padding: 12, gap: 10 },
  agentBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  agentBannerIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  agentBannerHeading: { fontSize: 12, fontWeight: '800' },
  agentBannerSub: { fontSize: 11, marginTop: 2 },
  agentBannerBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  agentDrawer: { margin: Spacing.three, marginBottom: 0, borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.three },
  agentDrawerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.two },
  agentDrawerTitle: { fontSize: 14, fontWeight: '800' },
  agentEmpty: { fontSize: 13, paddingVertical: 10 },
  agentCard: { borderWidth: 1, borderRadius: BorderRadius.lg, padding: 12, marginBottom: 10 },
  agentCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  agentAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  agentAvatarText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  agentName: { fontSize: 13, fontWeight: '800' },
  agentMeta: { fontSize: 11, marginTop: 2 },
  agentStatusPill: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  agentStatusText: { fontSize: 9, fontWeight: '800' },
  agentCounty: { fontSize: 11, marginBottom: 6 },
  agentMessage: { borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 8 },
  agentMessageText: { fontSize: 12, lineHeight: 18 },
  agentActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { flex: 1, backgroundColor: '#10b98120', borderWidth: 1, borderColor: '#10b98140', borderRadius: 8, padding: 8, alignItems: 'center' },
  acceptBtnText: { color: '#10b981', fontSize: 12, fontWeight: '800' },
  rejectBtn: { flex: 1, backgroundColor: '#ef444410', borderWidth: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
  rejectBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '800' },
  rejectForm: { marginTop: 8 },
  rejectInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 12, minHeight: 60, marginBottom: 8 },
  rejectFormActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  cancelBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  cancelBtnText: { fontSize: 12, fontWeight: '700' },
  confirmRejectBtn: { backgroundColor: '#ef4444', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  confirmRejectBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  section: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  sectionSubtitle: { fontSize: 11, fontWeight: '500' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.two },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  statCard: { flex: 1, minWidth: '28%', borderWidth: 1, borderRadius: BorderRadius.lg, padding: 10, alignItems: 'center', gap: 5 },
  statIcon: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: FontSize.lg, fontWeight: '900', letterSpacing: -0.3 },
  statLabel: { fontSize: 8.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center' },
  statSub: { fontSize: 7.5, fontWeight: '500', textAlign: 'center', lineHeight: 10, marginTop: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '500', padding: 0 },
  filterRow: { marginBottom: 12, flexDirection: 'row' },
  filterPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  filterPillText: { fontSize: 11, fontWeight: '700' },
  quickActions: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.three, marginTop: Spacing.two },
  quickBtn: { flex: 1, flexDirection: 'row', gap: 5, borderWidth: 1, borderRadius: BorderRadius.md, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  quickBtnText: { fontSize: 11, fontWeight: '800' },
  newBadge: { backgroundColor: '#10b981', borderRadius: 999, paddingHorizontal: 5, paddingVertical: 1 },
  newBadgeText: { color: '#fff', fontSize: 7, fontWeight: '900', letterSpacing: 0.4 },
  sectionHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewToggle: { flexDirection: 'row', borderWidth: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
  viewToggleBtn: { paddingHorizontal: 9, paddingVertical: 7 },
  viewToggleText: { fontSize: 13, fontWeight: '900' },
  categoryPill: { borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 },
  categoryPillText: { fontSize: 11, fontWeight: '700' },
  sortPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginRight: 8 },
  sortPillText: { fontSize: 10.5 },
  featuredBadge: { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  featuredBadgeText: { color: GOLD, fontSize: 9.5, fontWeight: '800' },
  secondaryActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  miniBtn: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.md, paddingVertical: 8, alignItems: 'center' },
  miniBtnText: { fontSize: 11, fontWeight: '800' },
  rowCard: { flexDirection: 'row', borderWidth: 1, borderRadius: BorderRadius.lg, marginBottom: 10, overflow: 'hidden' },
  rowImage: { width: 92, height: 96 },
  rowImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, padding: 10, justifyContent: 'space-between' },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { flex: 1, fontSize: 13, fontWeight: '800' },
  rowStatus: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  rowStatusText: { fontSize: 8.5, fontWeight: '800' },
  rowMeta: { fontSize: 10.5, marginTop: 3 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  rowPrice: { fontSize: 12, fontWeight: '800' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowActionBtn: { paddingVertical: 2 },
  rowActionText: { fontSize: 10.5, fontWeight: '800' },
  propCard: { borderWidth: 1, borderRadius: BorderRadius.xl, marginBottom: 14, overflow: 'hidden' },
  cardMediaWrap: { position: 'relative' },
  propImage: { width: '100%', height: 170 },
  propImagePlaceholder: { width: '100%', height: 110, justifyContent: 'center', alignItems: 'center' },
  badgeOverlay: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between' },
  categoryBadge: { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  categoryBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  statusBadgeImg: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  statusBadgeImgText: { fontSize: 9.5, fontWeight: '800' },
  imageBottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 34, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, backgroundColor: 'rgba(0,0,0,0.45)' },
  viewsPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewsPillText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  photosPillText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  propBody: { padding: Spacing.three },
  propName: { fontSize: FontSize.md, fontWeight: '800', letterSpacing: -0.2, marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  locationText: { fontSize: FontSize.sm, flex: 1 },
  propMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  priceText: { fontSize: 14, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: FontSize.sm },
  callout: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 8 },
  calloutText: { fontSize: 11, fontWeight: '600', flex: 1 },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  actionBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: BorderRadius.md, borderWidth: 1 },
  actionBtnText: { fontSize: 12, fontWeight: '800' },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: BorderRadius.md, borderWidth: 1 },
  deleteBtnText: { fontSize: 12, fontWeight: '800' },
  emptyCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: 28, alignItems: 'center', marginTop: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  emptyBody: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  emptyActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: ACCENT, paddingHorizontal: 20, paddingVertical: 12, borderRadius: BorderRadius.lg },
  emptyActionBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  toolkitHeader: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: 16, marginBottom: 10 },
  toolkitTitle: { fontSize: 15, fontWeight: '900', marginBottom: 4 },
  toolkitSubtitle: { fontSize: 12, lineHeight: 18 },
  toolkitCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderWidth: 1, borderRadius: BorderRadius.lg, padding: 14, marginBottom: 8 },
  toolkitCardTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  toolkitCardDesc: { fontSize: 12, lineHeight: 17 },
});
