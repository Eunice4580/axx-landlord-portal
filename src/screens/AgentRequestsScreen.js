import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { agentRequestsAPI } from '../services/api';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const GOLD = '#fbbf24';

const fmtDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function AgentRequestsScreen({ onBack }) {
  const { colors } = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await agentRequestsAPI.getProviderRequests();
      setRequests(Array.isArray(data) ? data : (data?.requests || []));
    } catch (err) {
      console.error('Agent requests load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleAccept = async (request) => {
    if (busyId) return;
    setBusyId(request._id);
    try {
      await agentRequestsAPI.accept(request._id);
      await load();
    } catch (err) {
      Alert.alert('Could not accept', err.message || 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (request) => {
    if (busyId) return;
    setBusyId(request._id);
    try {
      await agentRequestsAPI.reject(request._id, rejectReason.trim());
      setRejectingId(null);
      setRejectReason('');
      await load();
    } catch (err) {
      Alert.alert('Could not reject', err.message || 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onBack}>
            <Text style={[styles.backLink, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={[styles.backLink, { color: colors.primary }]}>↻ Refresh</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Agent Requests</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Agents asking to manage your rental listings. Accept to let them represent your property.
        </Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : requests.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No agent requests yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              When an agent asks to manage one of your listings, it will appear here.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.countText, { color: colors.textSecondary }]}>
              {requests.length} request{requests.length === 1 ? '' : 's'} · {pendingCount} pending
            </Text>

            {requests.map(request => {
              const agent = request.agent || {};
              const initial = (agent.name || 'A').charAt(0).toUpperCase();
              const pending = request.status === 'pending';
              return (
                <View
                  key={request._id}
                  style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                >
                  <View style={styles.agentRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.agentName, { color: colors.text }]} numberOfLines={1}>{agent.name || 'Agent'}</Text>
                      <Text style={[styles.agentMeta, { color: colors.textSecondary }]} numberOfLines={1}>{agent.email}</Text>
                      {agent.phone ? (
                        <Text style={[styles.agentMeta, { color: colors.textSecondary }]}>Tel: {agent.phone}</Text>
                      ) : null}
                      {agent.agentProfile?.county ? (
                        <Text style={[styles.agentMeta, { color: colors.textMuted }]}>County: {agent.agentProfile.county}</Text>
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        request.status === 'accepted'
                          ? { backgroundColor: '#10b98122', borderColor: '#10b981' }
                          : request.status === 'rejected'
                            ? { backgroundColor: colors.danger + '22', borderColor: colors.danger }
                            : { backgroundColor: GOLD + '22', borderColor: GOLD },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              request.status === 'accepted'
                                ? '#10b981'
                                : request.status === 'rejected'
                                  ? colors.danger
                                  : '#92400e',
                          },
                        ]}
                      >
                        {String(request.status || 'pending').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {request.agentMessage ? (
                    <View style={[styles.messageBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[styles.messageLabel, { color: colors.textMuted }]}>MESSAGE</Text>
                      <Text style={[styles.messageText, { color: colors.text }]}>{request.agentMessage}</Text>
                    </View>
                  ) : null}

                  {request.providerResponse ? (
                    <Text style={[styles.responseText, { color: colors.textMuted }]}>
                      Your response: {request.providerResponse}
                    </Text>
                  ) : null}

                  {pending ? (
                    rejectingId === request._id ? (
                      <View style={{ marginTop: Spacing.two }}>
                        <TextInput
                          style={[styles.reasonInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                          placeholder="Optional reason for rejection…"
                          placeholderTextColor={colors.textMuted}
                          value={rejectReason}
                          onChangeText={setRejectReason}
                          multiline
                        />
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.danger, opacity: busyId ? 0.6 : 1 }]}
                            onPress={() => handleReject(request)}
                            disabled={!!busyId}
                          >
                            {busyId === request._id ? (
                              <ActivityIndicator color="#fff" size="small" />
                            ) : (
                              <Text style={styles.actionBtnText}>Confirm Reject</Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtnOutline, { borderColor: colors.border }]}
                            onPress={() => { setRejectingId(null); setRejectReason(''); }}
                          >
                            <Text style={[styles.actionBtnOutlineText, { color: colors.textSecondary }]}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: busyId ? 0.6 : 1 }]}
                          onPress={() => handleAccept(request)}
                          disabled={!!busyId}
                        >
                          {busyId === request._id ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={styles.actionBtnText}>Accept</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtnOutline, { borderColor: colors.border }]}
                          onPress={() => { setRejectingId(request._id); setRejectReason(''); }}
                        >
                          <Text style={[styles.actionBtnOutlineText, { color: colors.textSecondary }]}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )
                  ) : (
                    <Text style={[styles.dateText, { color: colors.textMuted }]}>
                      Responded {fmtDate(request.respondedAt)}
                    </Text>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.two, marginBottom: Spacing.two },
  backLink: { fontSize: FontSize.base, fontWeight: '600' },
  title: { fontSize: FontSize['2xl'], fontWeight: '700' },
  subtitle: { fontSize: FontSize.sm, lineHeight: 20, marginTop: 4, marginBottom: Spacing.three },
  loadingBox: { paddingVertical: Spacing.six, alignItems: 'center' },
  emptyBox: { borderWidth: 1, borderStyle: 'dashed', borderRadius: BorderRadius.lg, padding: Spacing.four, alignItems: 'center' },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.two },
  emptyText: { fontSize: FontSize.sm, lineHeight: 20, textAlign: 'center' },
  countText: { fontSize: FontSize.xs, fontWeight: '600', marginBottom: Spacing.two },
  card: { borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.three, marginBottom: Spacing.two },
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#1f2937', fontWeight: '700', fontSize: FontSize.md },
  agentName: { fontSize: FontSize.md, fontWeight: '700' },
  agentMeta: { fontSize: FontSize.xs, marginTop: 1 },
  statusPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 9, fontWeight: '800' },
  messageBox: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.two, marginTop: Spacing.two },
  messageLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 3 },
  messageText: { fontSize: FontSize.sm, lineHeight: 19 },
  responseText: { fontSize: FontSize.xs, marginTop: Spacing.two },
  reasonInput: {
    borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.two,
    fontSize: FontSize.sm, minHeight: 64, textAlignVertical: 'top',
  },
  actionsRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  actionBtn: { flex: 1, borderRadius: BorderRadius.md, paddingVertical: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  actionBtnOutline: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.md, paddingVertical: 10, alignItems: 'center' },
  actionBtnOutlineText: { fontSize: FontSize.sm, fontWeight: '700' },
  dateText: { fontSize: FontSize.xs, marginTop: Spacing.two },
});
