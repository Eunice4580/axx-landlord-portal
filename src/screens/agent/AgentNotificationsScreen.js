import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, RefreshControl, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

/* ── Colors matching AgentLoginScreen / website agent theme ── */
const C = {
  bg:       '#0f172a',
  card:     '#1e293b',
  border:   'rgba(255,255,255,0.08)',
  text:     '#f1f5f9',
  muted:    '#94a3b8',
  accent:   '#dc2626',
};

/* ── Notification helpers (mirrors NotificationsPage.jsx) ──── */
function getTitle(n) {
  switch (n.type) {
    case 'property_booking':  return 'Property Booking';
    case 'material_purchase': return 'Material Purchase';
    case 'tourism_booking':   return 'Tourism Booking';
    case 'boost':             return 'Listing Boosted';
    case 'subscription':      return 'Subscription Update';
    case 'package_approved':  return 'Package Approved';
    case 'package_rejected':  return 'Package Rejected';
    default: return n.title || 'Notification';
  }
}

function getMessage(n) {
  if (n.type === 'package_approved' || n.type === 'package_rejected') {
    return n.message || 'Your payment has been processed';
  }
  if (n.amount) return `Payment of KES ${Number(n.amount).toLocaleString()} - ${n.status || 'pending'}`;
  return n.message || 'You have a new notification';
}

function getColor(type) {
  switch (type) {
    case 'package_approved':  return '#10b981'; // green
    case 'package_rejected':  return '#ef4444'; // red
    case 'property_booking':
    case 'booking':           return '#22c55e';
    case 'material_purchase':
    case 'payment':           return '#fbbf24';
    case 'tourism_booking':   return '#3b82f6';
    case 'boost':             return '#f97316';
    case 'subscription':      return '#8b5cf6';
    default:                  return '#64748b';
  }
}

function getLabel(type) {
  switch (type) {
    case 'package_approved':  return 'APPROVED';
    case 'package_rejected':  return 'REJECTED';
    case 'property_booking':  return 'BOOKING';
    case 'boost':             return 'BOOST';
    case 'subscription':      return 'SUBSCRIPTION';
    case 'payment':
    case 'material_purchase': return 'PAYMENT';
    default:                  return 'NOTICE';
  }
}

function mergeNotifications(existing, fromServer) {
  const ids = new Set(existing.map(n => n.id || n._id));
  const fresh = fromServer
    .filter(n => !ids.has(n._id))
    .map(n => ({
      id: n._id,
      type: n.type || 'general',
      title: getTitle(n),
      message: getMessage(n),
      read: n.read || false,
      timestamp: n.createdAt || new Date().toISOString(),
    }));
  return [...fresh, ...existing].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
}

export default function AgentNotificationsScreen({ onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [filter, setFilter]               = useState('all'); // 'all' | 'unread' | 'packages'

  const loadNotifications = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const token = await SecureStore.getItemAsync('agent_token');
      if (!token) return;

      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.notifications?.length) {
          setNotifications(prev => mergeNotifications(prev, data.notifications));
        }
      }
    } catch (err) {
      console.error('Notifications load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const appStateSub = AppState.addEventListener('change', s => {
      if (s === 'active') loadNotifications(true);
    });
    const poll = setInterval(() => loadNotifications(true), 30000); // 30s for notifications
    return () => { appStateSub.remove(); clearInterval(poll); };
  }, []);

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const FILTERS = [
    { key: 'all',      label: 'All' },
    { key: 'unread',   label: 'Unread' },
    { key: 'packages', label: 'Packages' },
  ];

  const filtered = notifications.filter(n => {
    if (filter === 'unread')   return !n.read;
    if (filter === 'packages') return n.type === 'package_approved' || n.type === 'package_rejected';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={s.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
            <Text style={s.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterBtn, filter === f.key && s.filterBtnActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotifications(true)}
              tintColor={C.accent}
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyText}>No notifications</Text>
              <Text style={s.emptySubText}>
                Package approvals, bookings, and other updates will appear here
              </Text>
            </View>
          ) : (
            filtered.map(n => {
              const color = getColor(n.type);
              const label = getLabel(n.type);
              return (
                <TouchableOpacity
                  key={n.id}
                  style={[s.card, !n.read && s.cardUnread, { borderLeftColor: color }]}
                  onPress={() => markRead(n.id)}
                  activeOpacity={0.85}
                >
                  <View style={s.cardTop}>
                    <View style={[s.badge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
                      <Text style={[s.badgeText, { color }]}>{label}</Text>
                    </View>
                    {!n.read && <View style={[s.dot, { backgroundColor: color }]} />}
                    <Text style={s.time}>
                      {new Date(n.timestamp).toLocaleDateString('en-KE', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={s.cardTitle}>{n.title}</Text>
                  <Text style={s.cardMsg}>{n.message}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn:     { paddingRight: 14 },
  backText:    { color: C.accent, fontSize: 14, fontWeight: '700' },
  headerTitle: { color: C.text, fontSize: 20, fontWeight: '800' },
  headerSub:   { color: C.muted, fontSize: 12, marginTop: 1 },
  markAll:     { color: C.accent, fontSize: 12, fontWeight: '700' },

  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  filterBtn:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  filterBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
  filterText:      { color: C.muted, fontSize: 13, fontWeight: '600' },
  filterTextActive:{ color: '#fff' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list:   { padding: 16, gap: 10 },

  empty:        { alignItems: 'center', paddingTop: 60 },
  emptyText:    { color: C.text, fontSize: 17, fontWeight: '700', marginBottom: 8 },
  emptySubText: { color: C.muted, fontSize: 13, textAlign: 'center', maxWidth: 260, lineHeight: 20 },

  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderLeftWidth: 3, borderLeftColor: '#64748b',
  },
  cardUnread: { backgroundColor: '#1e293bdd' },
  cardTop:    { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },

  badge:     { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  time:      { color: C.muted, fontSize: 11, marginLeft: 'auto' },

  cardTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardMsg:   { color: C.muted, fontSize: 13, lineHeight: 18 },
});
