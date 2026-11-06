import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppState,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notificationsAPI } from '../services/api';
import { getReadNotificationIds, markNotificationsRead } from '../utils/notificationReads';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const CHAT_GROUPS = [
  { key: 'waitlist', name: 'Waitlist', description: 'New waitlist requests', types: ['waitlist_request'] },
  { key: 'bookings', name: 'Bookings', description: 'Property and tourism bookings', types: ['property_booking', 'tourism_booking'] },
  { key: 'payments', name: 'Payments', description: 'Receipts and package payments', types: ['material_purchase', 'package_approved', 'package_rejected'] },
  { key: 'plans', name: 'Plans & Boosts', description: 'Subscriptions and listing boosts', types: ['subscription', 'boost'] },
  {
    key: 'account',
    name: 'Account Updates',
    description: 'Listing approvals and verification',
    types: [
      'accommodation_approved', 'accommodation_rejected', 'accommodation_upload',
      'kyc_approved', 'kyc_rejected', 'item_request',
    ],
  },
  { key: 'other', name: 'Axxspace', description: 'Other platform updates', types: [] },
];

const chatKeyFor = (type) => {
  const group = CHAT_GROUPS.find(g => g.types.includes(type));
  return group ? group.key : 'other';
};

const fmtTime = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
};

const mapNotification = (n, readIds) => {
  const id = n._id || n.id;
  let message = n.message;
  if (!message && n.amount) {
    message = `KSh ${Number(n.amount).toLocaleString()} · ${n.status || 'pending'}`;
  }
  return {
    id,
    type: n.type || 'general',
    message: message || 'You have a new update on your account.',
    createdAt: n.createdAt || new Date().toISOString(),
    read: Boolean(n.read || readIds.includes(id)),
  };
};

export default function MessagesScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all');
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const ids = await getReadNotificationIds();
      const res = await notificationsAPI.getMy();
      const list = Array.isArray(res?.notifications) ? res.notifications : [];
      setMessages(list.map(n => mapNotification(n, ids)));
      setError('');
    } catch (e) {
      setError(e.message || 'Could not load messages.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') load(true);
    });
    return () => sub.remove();
  }, [load]);

  const accentFor = (type) => {
    if (type === 'waitlist_request' || type === 'boost') return '#f59e0b';
    if (type === 'subscription') return '#8b5cf6';
    if (type === 'accommodation_rejected' || type === 'package_rejected' || type === 'kyc_rejected') {
      return colors.danger;
    }
    if (type === 'accommodation_approved' || type === 'package_approved' || type === 'kyc_approved') {
      return colors.success;
    }
    if (type === 'property_booking' || type === 'tourism_booking') {
      return colors.info;
    }
    return colors.textSecondary;
  };

  const conversations = useMemo(() => {
    const groups = new Map();
    messages.forEach(m => {
      const key = chatKeyFor(m.type);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(m);
    });

    return CHAT_GROUPS
      .filter(group => groups.has(group.key))
      .map(group => {
        const items = groups.get(group.key);
        const newestFirst = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return {
          key: group.key,
          name: group.name,
          description: group.description,
          latest: newestFirst[0],
          unread: items.filter(m => !m.read).length,
          count: items.length,
          items: [...items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
        };
      })
      .sort((a, b) => new Date(b.latest.createdAt) - new Date(a.latest.createdAt));
  }, [messages]);

  const unreadCount = messages.filter(m => !m.read).length;

  const markRead = (ids) => {
    if (ids.length === 0) return;
    setMessages(prev => prev.map(m => (ids.includes(m.id) ? { ...m, read: true } : m)));
    markNotificationsRead(ids);
    ids.forEach(id => notificationsAPI.markRead(id).catch(() => {}));
  };

  const markAllRead = () => {
    markRead(messages.filter(m => !m.read).map(m => m.id));
  };

  const openChat = (conversation) => {
    setActiveChat(conversation.key);
    markRead(conversation.items.filter(m => !m.read).map(m => m.id));
  };

  const filterChats = (list) =>
    filter === 'unread' ? list.filter(c => c.unread > 0) : list;

  // ── Chat view ───────────────────────────────────────────────────────────────
  if (activeChat) {
    const chat = conversations.find(c => c.key === activeChat);
    if (chat) {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.chatHeader}>
            <TouchableOpacity
              style={styles.chatBackBtn}
              onPress={() => setActiveChat(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.chatBack}>← Back</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.chatTitle}>{chat.name}</Text>
              <Text style={styles.chatSub}>{chat.description}</Text>
            </View>
          </View>

          <FlatList
            inverted
            data={chat.items}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => load(true)}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => {
              const accent = accentFor(item.type);
              return (
                <View style={styles.bubbleRow}>
                  <View style={[styles.bubble, { borderLeftColor: accent }]}>
                    <Text style={styles.bubbleText}>{item.message}</Text>
                    <Text style={styles.bubbleTime}>{fmtTime(item.createdAt)}</Text>
                  </View>
                </View>
              );
            }}
          />
        </SafeAreaView>
      );
    }
  }

  // ── Conversation list ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0
              ? `${unreadCount} unread · inquiry alerts, payments and account updates`
              : 'Inquiry alerts, payments and account updates'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {[{ key: 'all', label: 'All' }, { key: 'unread', label: 'Unread' }].map(f => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterTab, active && styles.filterTabActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {f.label}{f.key === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filterChats(conversations)}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => load(true)} activeOpacity={0.7}>
                  <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !error ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptyText}>
                  Waitlist requests, inquiry alerts and account updates will appear here as chats.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const accent = accentFor(item.latest.type);
            const initials = item.name
              .split(' ')
              .map(w => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return (
              <TouchableOpacity
                style={styles.convCard}
                onPress={() => openChat(item)}
                activeOpacity={0.85}
              >
                <View style={[styles.convAvatar, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
                  <Text style={[styles.convAvatarText, { color: accent }]}>{initials}</Text>
                </View>
                <View style={styles.convBody}>
                  <View style={styles.convTopRow}>
                    <Text style={styles.convName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.convTime}>{fmtTime(item.latest.createdAt)}</Text>
                  </View>
                  <View style={styles.convBottomRow}>
                    <Text
                      style={[styles.convPreview, item.unread > 0 && { color: colors.text, fontWeight: '600' }]}
                      numberOfLines={1}
                    >
                      {item.latest.message}
                    </Text>
                    {item.unread > 0 && (
                      <View style={[styles.unreadBadge, { backgroundColor: colors.danger }]}>
                        <Text style={styles.unreadBadgeText}>{item.unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    gap: 10,
  },
  title: { fontSize: FontSize['3xl'], fontWeight: '700', color: colors.text },
  subtitle: { fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 3 },
  markAll: { fontSize: FontSize.sm, fontWeight: '700', color: colors.primary },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: FontSize.sm, fontWeight: '600', color: colors.textSecondary },
  filterTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.three, paddingBottom: Spacing.six, gap: 10 },
  errorBox: {
    borderWidth: 1,
    borderColor: colors.danger + '55',
    backgroundColor: colors.danger + '12',
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    marginBottom: 4,
    gap: 6,
  },
  errorText: { fontSize: FontSize.sm, color: colors.danger },
  retryText: { fontSize: FontSize.sm, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptyText: {
    fontSize: FontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundElement,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.three,
  },
  convAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  convAvatarText: { fontSize: FontSize.base, fontWeight: '800' },
  convBody: { flex: 1, minWidth: 0 },
  convTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 3,
  },
  convName: { flex: 1, fontSize: FontSize.md, fontWeight: '700', color: colors.text },
  convTime: { fontSize: 10, color: colors.textMuted },
  convBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  convPreview: { flex: 1, fontSize: FontSize.sm, color: colors.textSecondary },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatBackBtn: { paddingVertical: 4 },
  chatBack: { fontSize: FontSize.base, fontWeight: '600', color: colors.primary },
  chatTitle: { fontSize: FontSize.xl, fontWeight: '700', color: colors.text },
  chatSub: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 1 },
  chatList: { padding: Spacing.three, paddingBottom: Spacing.six, gap: 10 },
  bubbleRow: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '88%',
    backgroundColor: colors.backgroundElement,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    padding: Spacing.three,
    gap: 5,
  },
  bubbleText: { fontSize: FontSize.base, color: colors.text, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: colors.textMuted, alignSelf: 'flex-end' },
});
