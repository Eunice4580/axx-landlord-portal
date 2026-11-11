import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { conversationsAPI } from '../services/api';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const POLL_MS = 20000;

const fmtTime = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const mins = Math.floor((now - d) / 60000);
  if (mins < 1) return 'Now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
};

const initialsOf = (name) =>
  (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function ChatInboxScreen({
  navigation,
  user,
  tokenKey = 'token',
  onOpenThread,
  onOpenAlerts,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [conversations, setConversations] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await conversationsAPI.list(tokenKey);
      setConversations(Array.isArray(res?.conversations) ? res.conversations : []);
      setTotalUnread(Number(res?.totalUnread) || 0);
      setError('');
    } catch (e) {
      setError(e.message || 'Could not load messages.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tokenKey]);

  useEffect(() => {
    load();
    timerRef.current = setInterval(() => load(), POLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [load]);

  const openThread = (conversation) => {
    if (onOpenThread) {
      onOpenThread(conversation);
      return;
    }
    navigation.navigate('ChatThread', {
      id: conversation._id,
      peerName: conversation.peer?.name || 'Conversation',
      contextTitle: conversation.contextTitle,
      myId: user?._id || user?.id,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>
            {totalUnread > 0
              ? `${totalUnread} unread · chats about your listings`
              : 'Chats about your listings'}
          </Text>
        </View>
        {(onOpenAlerts || navigation) && (
          <TouchableOpacity
            style={styles.alertsBtn}
            onPress={() => {
              if (onOpenAlerts) onOpenAlerts();
              else navigation.navigate('Alerts');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.alertsBtnText}>Alerts</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
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
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !error ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No conversations yet</Text>
                <Text style={styles.emptyText}>
                  When someone messages you about one of your listings, the chat
                  appears here.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => openThread(item)}
              activeOpacity={0.85}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {initialsOf(item.peer?.name)}
                </Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.topRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.peer?.name || 'User'}
                  </Text>
                  <Text style={styles.time}>{fmtTime(item.lastMessageAt)}</Text>
                </View>
                {!!item.contextTitle && (
                  <Text style={styles.context} numberOfLines={1}>
                    {item.contextTitle}
                  </Text>
                )}
                <View style={styles.bottomRow}>
                  <Text
                    style={[
                      styles.preview,
                      item.unreadCount > 0 && { color: colors.text, fontWeight: '600' },
                    ]}
                    numberOfLines={1}
                  >
                    {item.lastMessage || 'No messages yet'}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {item.unreadCount > 99 ? '99+' : item.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
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
    alertsBtn: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    alertsBtnText: {
      fontSize: FontSize.sm,
      fontWeight: '700',
      color: colors.textSecondary,
    },
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
    retryText: {
      fontSize: FontSize.sm,
      fontWeight: '700',
      color: colors.primary,
    },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyTitle: {
      fontSize: FontSize.lg,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: FontSize.sm,
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: 270,
      lineHeight: 18,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.backgroundElement,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.three,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: colors.primary + '44',
      backgroundColor: colors.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    avatarText: {
      fontSize: FontSize.base,
      fontWeight: '800',
      color: colors.primary,
    },
    cardBody: { flex: 1, minWidth: 0 },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 2,
    },
    name: {
      flex: 1,
      fontSize: FontSize.md,
      fontWeight: '700',
      color: colors.text,
    },
    time: { fontSize: 10, color: colors.textMuted },
    context: {
      fontSize: FontSize.xs,
      color: colors.primary,
      marginBottom: 3,
    },
    bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    preview: { flex: 1, fontSize: FontSize.sm, color: colors.textSecondary },
    badge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 5,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  });
