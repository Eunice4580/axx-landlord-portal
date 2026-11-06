/**
 * WaitlistScreen — React Native
 * Shared screen used by both Landlord and Caretaker dashboards.
 *
 * Props:
 *  - onBack   : () => void
 *  - mode     : 'landlord' | 'caretaker'
 *               landlord  → can send notification + remove entries
 *               caretaker → read-only (view only)
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { waitlistAPI, notificationsAPI } from '../services/api';
import {
  getReadNotificationIds,
  markNotificationsRead,
  isNotificationRead,
} from '../utils/notificationReads';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  waiting:  { bg: '#dbeafe', text: '#1e3a5f', label: 'Waiting' },
  notified: { bg: '#dbeafe', text: '#1e3a5f', label: 'Notified' },
};

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtAlertTime(d) {
  return new Date(d).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function WaitlistScreen({ onBack, mode = 'landlord', propertyId = null }) {
  const { colors: themeColors, isDark } = useTheme();
  const colors = { ...themeColors, primary: isDark ? '#3b82f6' : '#1e3a8a' };
  const styles = getStyles(colors);

  const [entries, setEntries]       = useState([]);
  const [alerts, setAlerts]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected]     = useState(null);
  const [notifying, setNotifying]   = useState(false);
  const [result, setResult]         = useState(null); // notify result

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const [data, readIds, notifRes] = await Promise.all([
        waitlistAPI.getAllForLandlord(),
        getReadNotificationIds(),
        notificationsAPI.getMy().catch(() => ({ notifications: [] })),
      ]);
      const all = data.entries || [];
      setEntries(propertyId ? all.filter(e => (e.property?._id || e.property) === propertyId) : all);

      const notifications = Array.isArray(notifRes?.notifications) ? notifRes.notifications : [];
      setAlerts(
        notifications
          .filter(n => n.type === 'waitlist_request')
          .filter(n => !propertyId || String(n.propertyId) === String(propertyId))
          .filter(n => !isNotificationRead(n, readIds))
          .map(n => ({
            id: n._id || n.id,
            name: n.userName || 'Prospect',
            phone: n.userPhone || '',
            email: n.userEmail || '',
            message: n.message || 'New waitlist request.',
            createdAt: n.createdAt || new Date().toISOString(),
          }))
      );
    } catch (err) {
      console.error('WaitlistScreen load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const markAlertRead = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    markNotificationsRead([id]);
    notificationsAPI.markRead(id).catch(() => {});
  };

  const markAllAlertsRead = () => {
    if (alerts.length === 0) return;
    const ids = alerts.map(a => a.id);
    setAlerts([]);
    markNotificationsRead(ids);
    ids.forEach(id => notificationsAPI.markRead(id).catch(() => {}));
  };

  // ── Notify (landlord only) ─────────────────────────────────────────────────
  const handleNotify = async () => {
    if (!selected || notifying) return;
    setNotifying(true);
    setResult(null);
    try {
      const data = await waitlistAPI.notify(selected._id);
      setResult(data);
      load(); // refresh list so status badge updates
    } catch (err) {
      setResult({ emailSent: false, message: err.message });
    } finally {
      setNotifying(false);
    }
  };

  // ── Remove (landlord only) ─────────────────────────────────────────────────
  const handleRemove = () => {
    if (!selected) return;
    Alert.alert(
      'Remove from Waitlist',
      `Remove ${selected.name} from the waitlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await waitlistAPI.remove(selected._id);
              setEntries(prev => prev.filter(e => e._id !== selected._id));
              setSelected(null);
              setResult(null);
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not remove.');
            }
          },
        },
      ]
    );
  };

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────
  if (selected) {
    const s = STATUS_CONFIG[selected.status] || STATUS_CONFIG.waiting;
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scrollPad}>

          {/* Back */}
          <TouchableOpacity
            onPress={() => { setSelected(null); setResult(null); }}
            style={styles.backRow}
          >
            <Text style={styles.backLink}>← Back to Waitlist</Text>
          </TouchableOpacity>

          {/* Avatar card */}
          <View style={styles.avatarCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {selected.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailName}>{selected.name}</Text>
              <Text style={styles.detailSub}>Joined {fmtDate(selected.position)}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
              <Text style={[styles.statusPillText, { color: s.text }]}>{s.label}</Text>
            </View>
          </View>

          {/* Contact info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoSectionLabel}>Contact Information</Text>

            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => Linking.openURL(`mailto:${selected.email}`)}
            >
              <Text style={styles.infoIcon}>✉️</Text>
              <Text style={styles.infoLink}>{selected.email}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => Linking.openURL(`tel:${selected.phone}`)}
            >
              <Text style={styles.infoIcon}>📞</Text>
              <Text style={styles.infoLink}>{selected.phone}</Text>
            </TouchableOpacity>

            {selected.property && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🏠</Text>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {selected.property.title}
                </Text>
              </View>
            )}
          </View>

          {/* Applicant message */}
          {!!selected.message && (
            <View style={styles.infoCard}>
              <Text style={styles.infoSectionLabel}>Message from Applicant</Text>
              <Text style={styles.messageText}>{selected.message}</Text>
            </View>
          )}

          

          {/* Notification result (landlord) */}
          {result && (
            <View style={[
              styles.infoCard,
              { borderColor: result.emailSent ? '#bfdbfe' : '#bfdbfe' },
            ]}>
              <Text style={styles.resultTitle}>
                {result.emailSent ? '✅ Email Sent!' : '⚠️ Email Not Sent'}
              </Text>
              <Text style={styles.resultMsg}>{result.message}</Text>

              {result.whatsappUrl && (
                <TouchableOpacity
                  style={styles.waBtn}
                  onPress={() =>
                    Linking.openURL(result.whatsappUrl).catch(() =>
                      Alert.alert('Error', 'Could not open WhatsApp.')
                    )
                  }
                >
                  <Text style={styles.waBtnText}>💬  Send WhatsApp Message</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action buttons (landlord only) */}
          {(
            <View style={styles.actionGroup}>
              <TouchableOpacity
                style={[styles.notifyBtn, notifying && { opacity: 0.6 }]}
                onPress={handleNotify}
                disabled={notifying}
              >
                {notifying
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.notifyBtnText}>📤  Send Availability Notification</Text>
                }
              </TouchableOpacity>

              {mode === 'landlord' && (
                <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
                <Text style={styles.removeBtnText}>Remove from Waitlist</Text>
              </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Header bar */}
            <View style={styles.listHeader}>
              <TouchableOpacity onPress={onBack}>
                <Text style={styles.backLink}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setLoading(true); load(); }}>
                <Text style={styles.backLink}>↻ Refresh</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.screenTitle}>Waitlist</Text>
            <Text style={styles.screenSub}>
              {mode === 'landlord'
                ? 'People waiting for a fully-booked property — listed first-come, first-served.'
                : 'People waiting for the properties you manage — listed first-come, first-served.'}
            </Text>

            {alerts.length > 0 && (
              <View style={styles.alertsBox}>
                <View style={styles.alertsHead}>
                  <Text style={styles.alertsTitle}>WAITLIST ALERTS</Text>
                  <TouchableOpacity onPress={markAllAlertsRead} activeOpacity={0.7}>
                    <Text style={styles.alertsMarkAll}>Mark all read</Text>
                  </TouchableOpacity>
                </View>
                {alerts.map(alert => (
                  <TouchableOpacity
                    key={alert.id}
                    style={styles.alertCard}
                    onPress={() => markAlertRead(alert.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.alertTopRow}>
                      <View style={styles.alertDot} />
                      <Text style={styles.alertName} numberOfLines={1}>{alert.name}</Text>
                      <Text style={styles.alertTime}>{fmtAlertTime(alert.createdAt)}</Text>
                    </View>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    {(alert.phone || alert.email) && (
                      <Text style={styles.alertContact} numberOfLines={1}>
                        {[alert.phone, alert.email].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {loading && (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginTop: 40 }}
              />
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>No one on the waitlist</Text>
              <Text style={styles.emptyText}>
                When a fully-booked property receives a request on the website, it will appear here.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => {
          const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.waiting;
          const isFirst = index === 0;
          return (
            <TouchableOpacity
              style={[styles.entryCard, isFirst && styles.entryCardFirst]}
              onPress={() => { setSelected(item); setResult(null); }}
              activeOpacity={0.75}
            >
              {/* Position bubble */}
              <View style={[
                styles.posBubble,
                isFirst && styles.posBubbleFirst,
              ]}>
                <Text style={[
                  styles.posText,
                  isFirst && { color: '#fff' },
                ]}>
                  {index + 1}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.entryInfo}>
                <View style={styles.entryNameRow}>
                  <Text style={styles.entryName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {isFirst && (
                    <View style={styles.nextBadge}>
                      <Text style={styles.nextBadgeText}>NEXT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.entryProp} numberOfLines={1}>
                  {item.property?.title || '—'}
                </Text>
                <Text style={styles.entryDate}>{fmtDate(item.position)}</Text>
              </View>

              {/* Status pill */}
              <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                <Text style={[styles.statusPillText, { color: s.text }]}>
                  {s.label}
                </Text>
              </View>

              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const getStyles = (colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },

    // List
    listContent: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: Spacing.three,
      paddingBottom: Spacing.two,
    },
    backRow: { paddingTop: Spacing.three, paddingBottom: Spacing.three },
    backLink: {
      color: colors.primary,
      fontSize: FontSize.base,
      fontWeight: '600',
    },
    screenTitle: {
      fontSize: FontSize['2xl'],
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    screenSub: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: Spacing.three,
    },

    // Waitlist alerts
    alertsBox: {
      backgroundColor: colors.backgroundElement,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.danger + '55',
      padding: Spacing.three,
      marginBottom: Spacing.three,
      gap: 8,
    },
    alertsHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    alertsTitle: {
      fontSize: FontSize.xs,
      fontWeight: '800',
      color: colors.danger,
      letterSpacing: 1,
    },
    alertsMarkAll: {
      fontSize: FontSize.xs,
      fontWeight: '700',
      color: colors.primary,
    },
    alertCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.background,
      padding: 10,
      gap: 4,
    },
    alertTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    alertDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.danger,
    },
    alertName: {
      flex: 1,
      fontSize: FontSize.sm,
      fontWeight: '700',
      color: colors.text,
    },
    alertTime: { fontSize: 10, color: colors.textMuted },
    alertMessage: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
      lineHeight: 17,
    },
    alertContact: { fontSize: FontSize.xs, color: colors.textMuted },

    // Entry card
    entryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.backgroundElement,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.three,
      marginBottom: Spacing.two,
    },
    entryCardFirst: { borderColor: '#1e3a5f' },

    posBubble: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    posBubbleFirst: { backgroundColor: '#1e3a5f' },
    posText: { fontWeight: '700', fontSize: FontSize.sm, color: colors.textSecondary },

    entryInfo: { flex: 1, minWidth: 0 },
    entryNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    entryName: {
      fontWeight: '700',
      color: colors.text,
      fontSize: FontSize.md,
      flexShrink: 1,
    },
    entryProp: { fontSize: FontSize.xs, color: colors.textSecondary, marginBottom: 2 },
    entryDate: { fontSize: FontSize.xs, color: colors.textMuted },

    nextBadge: {
      backgroundColor: '#dbeafe',
      borderRadius: 20,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    nextBadgeText: { fontSize: 9, fontWeight: '700', color: '#1e3a5f' },

    statusPill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
    statusPillText: { fontSize: FontSize.xs, fontWeight: '700' },

    chevron: { fontSize: 22, color: colors.textMuted, flexShrink: 0 },

    // Empty
    emptyBox: {
      alignItems: 'center',
      paddingTop: Spacing.six,
      paddingHorizontal: Spacing.four,
    },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyTitle: {
      fontSize: FontSize.lg,
      fontWeight: '700',
      color: colors.text,
      marginBottom: Spacing.two,
    },
    emptyText: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },

    // Detail
    scrollPad: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },

    avatarCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.backgroundElement,
      borderRadius: BorderRadius.lg,
      padding: Spacing.three,
      marginBottom: Spacing.three,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: '#1e3a8a',
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    avatarInitial: { color: '#fff', fontWeight: '700', fontSize: 22 },
    detailName: { fontSize: FontSize.lg, fontWeight: '700', color: colors.text },
    detailSub: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },

    infoCard: {
      backgroundColor: colors.backgroundElement,
      borderRadius: BorderRadius.lg,
      padding: Spacing.three,
      marginBottom: Spacing.three,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoSectionLabel: {
      fontSize: FontSize.xs,
      color: colors.textMuted,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: Spacing.two,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: Spacing.two,
    },
    infoIcon: { fontSize: 16 },
    infoLink: { color: colors.primary, fontWeight: '500', fontSize: FontSize.md, flex: 1 },
    infoValue: { color: colors.text, fontSize: FontSize.md, flex: 1 },
    messageText: { color: colors.text, fontSize: FontSize.md, lineHeight: 22 },

    // Notify result
    resultTitle: {
      fontSize: FontSize.md,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    resultMsg: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
      marginBottom: Spacing.two,
      lineHeight: 20,
    },
    waBtn: {
      backgroundColor: '#25d366',
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.two,
      paddingHorizontal: Spacing.three,
      alignItems: 'center',
    },
    waBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },

    // Actions
    actionGroup: { gap: Spacing.two, marginTop: Spacing.two },
    notifyBtn: {
      backgroundColor: '#1e3a8a',
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.three,
      alignItems: 'center',
    },
    notifyBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
    removeBtn: {
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.two + 2,
      alignItems: 'center',
    },
    removeBtnText: { color: colors.danger, fontWeight: '600', fontSize: FontSize.sm },
  });
