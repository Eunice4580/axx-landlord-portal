import React, { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, RefreshControl, Alert, Linking, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

/* ── Exact colors from AgentDashboard.jsx ──────────────────────────── */
const C = {
  rootBg:            '#f8f4f0',
  white:             '#ffffff',
  headerBorder:      '#e5e7eb',
  logoAccent:        '#fbbf24',
  logoWord:          '#1f2937',
  title:             '#1f2937',
  subtitle:          '#6b7280',
  cardBorder:        '#e5e7eb',
  // Tabs
  tabActive:         '#fbbf24',
  tabInactive:       '#6b7280',
  // Section
  sectionTitle:      '#1f2937',
  // Stats bar
  statValueColor:    '#1f2937',
  statLabelColor:    '#6b7280',
  // House card
  houseTitle:        '#1f2937',
  houseLocation:     '#6b7280',
  housePrice:        '#059669',
  houseInfoBg:       '#f9fafb',
  houseInfoText:     '#4b5563',
  houseViewsBg:      '#eff6ff',
  houseViewsText:    '#2563eb',
  // Action buttons
  liveBtn:           { bg: '#f3f4f6', text: '#1f2937', border: '#d1d5db' },
  qrBtn:             { bg: '#fffbeb', text: '#d97706', border: '#fbbf24' },
  editBtn:           { bg: '#ffffff', text: '#1f2937', border: '#d1d5db' },
  delBtn:            { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  // Upload btn (green — exact from website)
  uploadBtnBg:       '#10b981',
  uploadBtnText:     '#ffffff',
  // QR poster header btn
  qrHeaderBg:        '#d9383a',
  qrHeaderText:      '#ffffff',
  // Status pills
  statusLiveBg:      '#dcfce7',
  statusLiveText:    '#166534',
  statusRejBg:       '#fee2e2',
  statusRejText:     '#dc2626',
  statusPendBg:      '#fef3c7',
  statusPendText:    '#92400e',
  // Empty
  emptyBorder:       '#cbd5e1',
  emptyTitle:        '#1f2937',
  emptyText:         '#6b7280',
  // Provider avatar
  avatarBg:          '#fbbf24',
  avatarText:        '#1f2937',
  // Request status
  reqAcceptBg:       '#dcfce7',
  reqAcceptText:     '#166534',
  reqPendBg:         '#fef3c7',
  reqPendText:       '#92400e',
  reqRejBg:          '#fee2e2',
  reqRejText:        '#dc2626',
};

const API_BASE    = 'https://axx-spaces-backend-1.onrender.com/api';
const API_ORIGIN  = API_BASE.replace(/\/api\/?$/, '');
const AXXSPACE_WEB = 'https://axxspace.co.ke';

function resolveMediaUrl(url) {
  if (!url) return '';
  if (String(url).startsWith('http')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
}

/* ── Inline SVG icons ──────────────────────────────────────────────── */
const EyeIcon = ({ size = 14, color = '#2563eb' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);
const QRIcon = ({ size = 14, color = '#d97706' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="7" height="7" /><Rect x="14" y="3" width="7" height="7" />
    <Rect x="3" y="14" width="7" height="7" />
    <Line x1="14" y1="14" x2="14" y2="14.01" /><Line x1="17" y1="14" x2="21" y2="14" />
    <Line x1="14" y1="17" x2="14" y2="21" /><Line x1="17" y1="17" x2="21" y2="21" />
    <Line x1="17" y1="20" x2="21" y2="20" />
  </Svg>
);
const LocationIcon = ({ size = 13, color = '#6b7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);
const RefreshIcon = ({ size = 20, color = '#fbbf24' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 4v6h-6M1 20v-6h6" />
    <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </Svg>
);
const BellIcon = ({ size = 20, color = '#fbbf24' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);
const HomeIcon = ({ size = 40, color = '#94a3b8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Path d="M9 22V12h6v10" />
  </Svg>
);

/* ── Stat Card (4-grid, yellow top border) ─────────────────────────── */
function StatCard({ value, label }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ── House Card — 4 action buttons exactly as website ──────────────── */
function HouseCard({ house, onDelete, deleting }) {
  const thumb = (() => {
    const f = house.images?.[0];
    if (!f) return null;
    return typeof f === 'object' ? (f.imageUrl || f.url || null) : f;
  })();

  const isApproved = house.status === 'approved' || house.status === 'active';
  const isRejected = house.status === 'rejected';

  const statusLabel = isApproved ? '✓ LIVE' : isRejected ? 'REJECTED' : 'PENDING REVIEW';
  const statusStyle = isApproved
    ? { bg: C.statusLiveBg, text: C.statusLiveText }
    : isRejected
      ? { bg: C.statusRejBg, text: C.statusRejText }
      : { bg: C.statusPendBg, text: C.statusPendText };

  const openListing = () => {
    const url = `${AXXSPACE_WEB}/listings?property=${house._id}`;
    Linking.openURL(url).catch(() => Alert.alert('Cannot open link'));
  };

  const openQR = () => {
    const url = `${AXXSPACE_WEB}/property/${house._id}`;
    Linking.openURL(url).catch(() => Alert.alert('Cannot open QR page'));
  };

  const openEdit = () => {
    const url = `${AXXSPACE_WEB}/property/edit/${house._id}`;
    Linking.openURL(url).catch(() => Alert.alert('Cannot open edit page'));
  };

  return (
    <View style={styles.houseCard}>
      {/* Image */}
      <View style={styles.houseImgWrap}>
        {thumb ? (
          <Image source={{ uri: resolveMediaUrl(thumb) }} style={styles.houseImg} resizeMode="cover" />
        ) : (
          <View style={styles.houseImgFallback}>
            <HomeIcon size={36} color="#94a3b8" />
          </View>
        )}
        {/* Type pill */}
        <View style={styles.houseTypePill}>
          <Text style={styles.houseTypePillText}>{house.propertyType || 'Rental'}</Text>
        </View>
        {/* Status pill */}
        <View style={[styles.houseStatusPill, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.houseStatusPillText, { color: statusStyle.text }]}>{statusLabel}</Text>
        </View>
        {/* Featured badge */}
        {(house.isBoosted || house.featured) && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>⭐ FEATURED</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.houseContent}>
        <Text style={styles.houseTitle} numberOfLines={1}>{house.title}</Text>
        <View style={styles.houseLocationRow}>
          <LocationIcon size={13} color={C.houseLocation} />
          <Text style={styles.houseLocationText} numberOfLines={1}>
            {house.location || house.county || 'Kenya'}
          </Text>
        </View>
        <Text style={styles.housePrice}>
          KES {Number(house.price || 0).toLocaleString()}
          <Text style={styles.housePriceSub}> / {house.leaseType || 'month'}</Text>
        </Text>

        {/* Info row 1: units */}
        <View style={styles.houseInfoRow}>
          <Text style={styles.houseInfoText}>
            <Text style={{ fontWeight: '700' }}>{house.totalUnits || 1}</Text> total units
          </Text>
          <Text style={styles.houseInfoText}>
            <Text style={{ fontWeight: '700' }}>{house.bookedUnits || 0}</Text> booked
          </Text>
        </View>

        {/* Info row 2: views & QR scans — blue bg */}
        <View style={[styles.houseInfoRow, styles.houseInfoRowBlue]}>
          <View style={styles.houseInfoCell}>
            <EyeIcon size={13} color={C.houseViewsText} />
            <Text style={styles.houseViewsText}>
              <Text style={{ fontWeight: '700' }}>{house.views || 0}</Text> Views
            </Text>
          </View>
          <View style={styles.houseInfoCell}>
            <QRIcon size={13} color={C.houseViewsText} />
            <Text style={styles.houseViewsText}>
              <Text style={{ fontWeight: '700' }}>{house.qrScans || 0}</Text> QR Scans
            </Text>
          </View>
        </View>

        {/* 4 action buttons — exact match to website */}
        <View style={styles.houseActions}>
          {isApproved && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.liveBtn.bg, borderColor: C.liveBtn.border }]} onPress={openListing} activeOpacity={0.8}>
              <Text style={[styles.actionBtnText, { color: C.liveBtn.text }]}>Live ↗</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.qrBtn.bg, borderColor: C.qrBtn.border }]} onPress={openQR} activeOpacity={0.8}>
            <Text style={[styles.actionBtnText, { color: C.qrBtn.text }]}>QR Poster</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.editBtn.bg, borderColor: C.editBtn.border }]} onPress={openEdit} activeOpacity={0.8}>
            <Text style={[styles.actionBtnText, { color: C.editBtn.text }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.delBtn.bg, borderColor: C.delBtn.border }]}
            onPress={() => onDelete(house._id)}
            disabled={deleting === house._id}
            activeOpacity={0.8}
          >
            {deleting === house._id
              ? <ActivityIndicator size="small" color={C.delBtn.text} />
              : <Text style={[styles.actionBtnText, { color: C.delBtn.text }]}>Delete</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* ── Provider Card ──────────────────────────────────────────────────── */
function ProviderCard({ provider, existingReq, onSendRequest, sending }) {
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const reqStatus = existingReq?.status;

  const statusStyle = reqStatus === 'accepted'
    ? { bg: C.reqAcceptBg, text: C.reqAcceptText }
    : reqStatus === 'rejected'
      ? { bg: C.reqRejBg, text: C.reqRejText }
      : { bg: C.reqPendBg, text: C.reqPendText };

  return (
    <View style={styles.providerCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{provider.name?.[0]?.toUpperCase() || 'P'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{provider.name}</Text>
          <Text style={styles.cardEmail}>
            {provider.role === 'host' ? '🏨 Accommodation Host' : '🏠 Landlord'}
          </Text>
          {provider.county && <Text style={styles.cardCounty}>📍 {provider.county}</Text>}
        </View>
      </View>

      {reqStatus ? (
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{reqStatus}</Text>
        </View>
      ) : showForm ? (
        <View style={{ marginTop: 8 }}>
          <TextInput
            style={styles.msgInput}
            value={msg}
            onChangeText={setMsg}
            placeholder="Write a message to this provider..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: '#e5e7eb' }]}
              onPress={() => { setShowForm(false); setMsg(''); }}
            >
              <Text style={{ color: '#4b5563', fontWeight: '600', fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: C.logoAccent }]}
              onPress={() => { onSendRequest(provider, msg); setShowForm(false); setMsg(''); }}
              disabled={sending || !msg.trim()}
            >
              {sending
                ? <ActivityIndicator size="small" color={C.logoWord} />
                : <Text style={{ color: C.logoWord, fontWeight: '700', fontSize: 13 }}>Send</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.requestBtn} onPress={() => setShowForm(true)} activeOpacity={0.8}>
          <Text style={styles.requestBtnText}>Send Request</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ── Request Card ───────────────────────────────────────────────────── */
function RequestCard({ req }) {
  const sc = req.status === 'accepted'
    ? { bg: C.reqAcceptBg, text: C.reqAcceptText }
    : req.status === 'rejected'
      ? { bg: C.reqRejBg, text: C.reqRejText }
      : { bg: C.reqPendBg, text: C.reqPendText };

  return (
    <View style={styles.providerCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{req.provider?.name?.[0]?.toUpperCase() || 'P'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{req.provider?.name || 'Provider'}</Text>
          <Text style={styles.cardEmail}>
            {req.provider?.role === 'host' ? '🏨 Accommodation Host' : '🏠 Landlord'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusBadgeText, { color: sc.text }]}>{req.status || 'pending'}</Text>
        </View>
      </View>
      {req.message && (
        <Text style={styles.cardBio} numberOfLines={2}>"{req.message}"</Text>
      )}
    </View>
  );
}

/* ── Main Screen ────────────────────────────────────────────────────── */
export default function AgentOverviewScreen({ user, onUpload, onNotifications }) {
  const [myHouses, setMyHouses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast]       = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('agent_token');
      const h = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_BASE}/properties/my-properties/all`, { headers: h });
      if (res.ok) setMyHouses(await res.json().then(d => Array.isArray(d) ? d : []));
    } catch (err) { console.error('Load error:', err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  // Auto-sync: refresh when app comes back to foreground OR every 60s
  // This means if a listing is deleted on the website, it disappears here automatically
  useEffect(() => {
    loadData();

    // Refresh when user switches back to the app
    const appStateSub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') loadData(true);
    });

    // Poll every 60 seconds silently in the background
    const pollInterval = setInterval(() => loadData(true), 60000);

    return () => {
      appStateSub.remove();
      clearInterval(pollInterval);
    };
  }, []);

  const handleDelete = (id) => {
    Alert.alert('Delete Listing', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setDeleting(id);
          try {
            const token = await SecureStore.getItemAsync('agent_token');
            const res = await fetch(`${API_BASE}/properties/${id}`, {
              method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              setMyHouses(prev => prev.filter(h => h._id !== id));
              showToast('House deleted successfully');
            } else {
              const d = await res.json().catch(() => ({}));
              showToast(d.error || 'Failed to delete listing', false);
            }
          } catch { showToast('Network error while deleting', false); }
          finally { setDeleting(null); }
        }
      }
    ]);
  };

  const totalViews = myHouses.reduce((s, h) => s + (h.views || 0), 0);
  const totalScans = myHouses.reduce((s, h) => s + (h.qrScans || 0), 0);


  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.logoAccent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Toast */}
      {toast && (
        <View style={[styles.toast, { backgroundColor: toast.ok ? '#10b981' : '#dc2626' }]}>
          <Text style={styles.toastText}>{toast.msg}</Text>
        </View>
      )}

      {/* Header — white bar */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoAccent}>AXX</Text>
          <Text style={styles.logoWord}>SPACE</Text>
        </View>
        {/* Header action buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={onUpload}
            activeOpacity={0.8}
          >
            <Text style={styles.uploadBtnText}>+ Upload House</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.qrHeaderBtn}
            onPress={() => Linking.openURL(`${AXXSPACE_WEB}/agent/dashboard`)}
            activeOpacity={0.8}
          >
            <Text style={styles.qrHeaderBtnText}>My QR Poster</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setRefreshing(true); loadData(true); }} style={{ padding: 4 }}>
            <RefreshIcon size={18} color={C.logoAccent} />
          </TouchableOpacity>
          {onNotifications && (
            <TouchableOpacity onPress={onNotifications} style={{ padding: 4 }} activeOpacity={0.7}>
              <BellIcon size={20} color={C.logoAccent} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(true); }}
            tintColor={C.logoAccent}
          />
        }
      >
        {/* Profile section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImgWrap}>
            {user?.profileImage ? (
              <Image
                source={{ uri: resolveMediaUrl(user.profileImage) }}
                style={styles.profileImg}
              />
            ) : (
              <View style={[styles.profileImg, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.profileImgText}>
                  {user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'AG'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Agent'}</Text>
            <Text style={styles.profileDetail}>{user?.email || 'No email'}</Text>
            <Text style={styles.profileDetail}>{user?.phone || user?.agentProfile?.phone || 'No phone'}</Text>
            <Text style={styles.profileDetail}>{user?.county || user?.agentProfile?.county || 'Kenya'}</Text>
          </View>
        </View>

        {/* Stats overview bar (4 cards) — white with yellow top border */}
        <View style={styles.statsGrid}>
          <StatCard value={myHouses.length} label="Total Listings" />
          <StatCard value={totalViews}       label="Total Views" />
          <StatCard value={totalScans}       label="QR Scans" />
        </View>

        {/* ── My Houses ── */}
        <View>
            {/* Section heading + upload button — exact from website */}
            <View style={styles.tabs}>
              <View style={[styles.tab, styles.tabActive]}>
                <Text style={[styles.tabText, styles.tabTextActive]}>My Houses ({myHouses.length})</Text>
              </View>
            </View>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>My Uploaded Houses & Properties</Text>
                <Text style={styles.sectionSubtitle}>
                  Upload, manage, and track your property listings directly on AXXSpace
                </Text>
              </View>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={onUpload}
                activeOpacity={0.8}
              >
                <Text style={styles.uploadBtnText}>+ Upload New House</Text>
              </TouchableOpacity>
            </View>

            {myHouses.length === 0 ? (
              /* Empty state — exact text from website */
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Houses Uploaded Yet</Text>
                <Text style={styles.emptyText}>
                  As an agent on AXXSpace, you can upload and manage your rental houses, apartments,
                  hostels, and commercial units to get direct inquiries from tenants.
                </Text>
                <TouchableOpacity
                  style={[styles.uploadBtn, { marginTop: 20, alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 10 }]}
                  onPress={onUpload}
                  activeOpacity={0.8}
                >
                  <Text style={styles.uploadBtnText}>+ Upload Your First House</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myHouses.map(house => (
                <HouseCard
                  key={house._id}
                  house={house}
                  onDelete={handleDelete}
                  deleting={deleting}
                />
              ))
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.rootBg },

  toast: {
    position: 'absolute', top: 60, left: 16, right: 16, zIndex: 9999,
    padding: 14, borderRadius: 8,
  },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  /* ── Header ── */
  header: {
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.headerBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo:        { flexDirection: 'row', alignItems: 'center' },
  logoAccent:  { fontSize: 18, fontWeight: '900', color: C.logoAccent },
  logoWord:    { fontSize: 18, fontWeight: '900', color: C.logoWord },
  headerActions:{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' },

  /* Upload btn — green, exact from website */
  uploadBtn: {
    backgroundColor: C.uploadBtnBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uploadBtnText: { color: C.uploadBtnText, fontSize: 12, fontWeight: '700' },

  /* QR Poster header btn — red gradient from website */
  qrHeaderBtn: {
    backgroundColor: C.qrHeaderBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  qrHeaderBtnText: { color: C.qrHeaderText, fontSize: 12, fontWeight: '700' },

  /* ── Container ── */
  container: { padding: 24, paddingBottom: 40 },

  /* ── Profile section ── */
  profileSection: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  profileImgWrap: {},
  profileImg: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.logoAccent,
    borderWidth: 4, borderColor: C.white,
  },
  profileImgText: { color: C.white, fontSize: 26, fontWeight: '700' },
  profileInfo:    { flex: 1 },
  profileName:    { fontSize: 20, fontWeight: '800', color: C.title, marginBottom: 4 },
  profileDetail:  { fontSize: 14, color: C.subtitle, marginBottom: 2 },

  /* ── Stats grid (4 cards) ── */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderTopWidth: 3,
    borderTopColor: C.logoAccent,
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: C.statValueColor, marginBottom: 4 },
  statLabel: { fontSize: 11, fontWeight: '600', color: C.statLabelColor },

  /* ── Tabs ── */
  tabsScroll: { marginBottom: 0 },
  tabs: {
    borderBottomWidth: 2,
    borderBottomColor: C.cardBorder,
    flexDirection: 'row',
    gap: 4,
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    minHeight: 44,
    justifyContent: 'center',
  },
  tabActive:     { borderBottomColor: C.tabActive },
  tabText:       { fontSize: 13, fontWeight: '600', color: C.tabInactive, whiteSpace: 'nowrap' },
  tabTextActive: { color: C.tabActive },

  /* ── Section header ── */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
    flexWrap: 'wrap',
  },
  sectionTitle:    { fontSize: 20, fontWeight: '800', color: C.sectionTitle, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: C.subtitle, lineHeight: 18 },

  /* ── House card ── */
  houseCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  houseImgWrap:    { width: '100%', height: 175, backgroundColor: '#f1f5f9', position: 'relative' },
  houseImg:        { width: '100%', height: '100%' },
  houseImgFallback:{ flex: 1, justifyContent: 'center', alignItems: 'center' },
  houseTypePill:   {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(15,23,42,0.8)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  houseTypePillText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  houseStatusPill:  {
    position: 'absolute', top: 10, right: 10,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  houseStatusPillText: { fontSize: 11, fontWeight: '700' },
  featuredBadge: {
    position: 'absolute', top: 42, right: 10,
    backgroundColor: C.logoAccent,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  featuredBadgeText: { color: C.logoWord, fontSize: 10, fontWeight: '800' },

  houseContent:  { padding: 16, gap: 8 },
  houseTitle:    { fontSize: 16, fontWeight: '700', color: C.houseTitle },
  houseLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  houseLocationText:{ fontSize: 13, color: C.houseLocation, flex: 1 },
  housePrice:    { fontSize: 17, fontWeight: '800', color: C.housePrice },
  housePriceSub: { fontSize: 12, fontWeight: '500', color: C.subtitle },

  houseInfoRow: {
    backgroundColor: C.houseInfoBg,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  houseInfoText:   { fontSize: 12, color: C.houseInfoText },
  houseInfoRowBlue:{ backgroundColor: C.houseViewsBg },
  houseInfoCell:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  houseViewsText:  { fontSize: 12, color: C.houseViewsText },

  /* 4 action buttons */
  houseActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 12, fontWeight: '600' },

  /* ── Provider / Request cards ── */
  providerCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  avatar:     {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.avatarBg,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText:  { fontSize: 18, fontWeight: '700', color: C.avatarText },
  cardName:    { fontSize: 16, fontWeight: '700', color: C.title },
  cardEmail:   { fontSize: 12, color: C.subtitle },
  cardCounty:  { fontSize: 12, color: C.subtitle, marginTop: 2 },
  cardBio:     { fontSize: 13, color: '#4b5563', lineHeight: 20, marginTop: 8 },

  requestBtn:  {
    width: '100%', paddingVertical: 10,
    backgroundColor: C.logoAccent, borderRadius: 8,
    alignItems: 'center', marginTop: 12,
  },
  requestBtnText: { color: C.logoWord, fontSize: 13, fontWeight: '700' },

  statusBadge:    {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, alignSelf: 'flex-start', marginTop: 8,
  },
  statusBadgeText:{ fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  msgInput: {
    padding: 12,
    borderWidth: 2,
    borderColor: C.cardBorder,
    borderRadius: 8,
    fontSize: 14,
    color: C.title,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalBtn: {
    flex: 1, paddingVertical: 10,
    borderRadius: 8, alignItems: 'center',
  },

  /* ── Empty card ── */
  emptyCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.emptyBorder,
    borderStyle: 'dashed',
    padding: 40,
    marginVertical: 16,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.emptyTitle, marginBottom: 8, textAlign: 'center' },
  emptyText:  { fontSize: 14, color: C.emptyText, textAlign: 'center', lineHeight: 22 },
});
