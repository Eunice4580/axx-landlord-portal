import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { biasharaBusinessAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { StarIcon, CheckIcon, AlertIcon, RefreshIcon } from './Icons';
import Svg, { Path, Circle, Line, Polyline, Polygon } from 'react-native-svg';

const ACCENT = '#fbbf24';

/* ── Icons ────────────────────────────────────────────────────────── */
const EyeIcon = ({ color = '#94a3b8', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Circle cx="12" cy="12" r="3" />
  </Svg>
);
const MessageIcon = ({ color = '#94a3b8', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);
const LocationIcon = ({ color = '#94a3b8', size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx="12" cy="10" r="3" />
  </Svg>
);
const SendIcon = ({ color = '#fff', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="22" y1="2" x2="11" y2="13" /><Polygon points="22 2 15 22 11 13 2 9 22 2" />
  </Svg>
);
const TrendingIcon = ({ color = '#94a3b8', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><Polyline points="17 6 23 6 23 12" />
  </Svg>
);
const StoreIcon = ({ color = '#94a3b8', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 3h20l-2 7H4L2 3z" /><Path d="M4 10v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V10" />
    <Path d="M9 21V13h6v8" />
  </Svg>
);
const PhoneIcon = ({ color = '#94a3b8', size = 13 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.4h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.09 6.09l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);
const GlobeIcon = ({ color = '#94a3b8', size = 13 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="2" y1="12" x2="22" y2="12" />
    <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Svg>
);

/* ── Helpers ──────────────────────────────────────────────────────── */
const STATUS_MAP = {
  active:   { bg: '#22c55e18', border: '#22c55e40', text: '#22c55e', label: 'Live' },
  approved: { bg: '#22c55e18', border: '#22c55e40', text: '#22c55e', label: 'Live' },
  pending:  { bg: ACCENT + '18', border: ACCENT + '40', text: ACCENT, label: 'Pending Review' },
  rejected: { bg: '#ef444418', border: '#ef444440', text: '#ef4444', label: 'Rejected' },
  archived: { bg: '#64748b18', border: '#64748b40', text: '#64748b', label: 'Archived' },
};
const getStatus = s => STATUS_MAP[(s || 'pending').toLowerCase()] || STATUS_MAP.pending;

/* ── Inquiry Reply Modal ─────────────────────────────────────────── */
function ReplyModal({ inquiry, colors, onClose, onSent }) {
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: false });

  const handleSend = async () => {
    if (!reply.trim()) { setMsg({ text: 'Please type a reply.', ok: false }); return; }
    setLoading(true);
    try {
      await biasharaBusinessAPI.respondToInquiry(inquiry._id, reply.trim());
      setMsg({ text: 'Reply sent successfully.', ok: true });
      setTimeout(() => { onSent(); onClose(); }, 1200);
    } catch (err) {
      setMsg({ text: err.message || 'Failed to send reply.', ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.modalOverlay]}>
          <View style={[styles.modalCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Reply to Inquiry</Text>
            <Text style={[styles.modalSender, { color: colors.textMuted }]}>
              From: {inquiry.name || inquiry.senderName || 'Customer'}
              {inquiry.email ? `  ·  ${inquiry.email}` : ''}
            </Text>
            <View style={[styles.msgPreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.msgPreviewText, { color: colors.textSecondary }]} numberOfLines={3}>
                {inquiry.message || inquiry.inquiry || ''}
              </Text>
            </View>
            {msg.text ? (
              <View style={[styles.msgBanner, msg.ok ? styles.msgOk : styles.msgErr]}>
                <Text style={{ color: msg.ok ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: '600' }}>
                  {msg.text}
                </Text>
              </View>
            ) : null}
            <TextInput
              style={[styles.replyInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholderTextColor={colors.textMuted}
              placeholder="Type your reply..."
              value={reply}
              onChangeText={setReply}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: colors.border }]} onPress={onClose}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSendBtn, loading && { opacity: 0.6 }]}
                onPress={handleSend} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#0f172a" size="small" />
                  : <>
                      <SendIcon color="#0f172a" size={14} />
                      <Text style={styles.modalSendText}> Send Reply</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ── Business Detail Card ──────────────────────────────────────────── */
function BusinessCard({ biz, colors, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [bizReviews, setBizReviews] = useState([]);
  const [bizInquiries, setBizInquiries] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);

  const st = getStatus(biz.status);

  const loadDetails = async () => {
    if (detailLoading) return;
    setDetailLoading(true);
    try {
      const [aRes, rRes, iRes] = await Promise.allSettled([
        biasharaBusinessAPI.getBusinessAnalytics(biz._id),
        biasharaBusinessAPI.getBusinessReviews(biz._id),
        biasharaBusinessAPI.getBusinessInquiries(biz._id),
      ]);
      if (aRes.status === 'fulfilled') setAnalytics(aRes.value?.analytics || aRes.value || {});
      if (rRes.status === 'fulfilled') setBizReviews(rRes.value?.reviews || rRes.value || []);
      if (iRes.status === 'fulfilled') setBizInquiries(iRes.value?.inquiries || iRes.value || []);
    } catch (_) {}
    setDetailLoading(false);
  };

  const toggle = () => {
    if (!expanded && !analytics) loadDetails();
    setExpanded(e => !e);
  };

  const avgRating = bizReviews.length
    ? bizReviews.reduce((s, r) => s + r.rating, 0) / bizReviews.length : 0;
  const pendingInq = bizInquiries.filter(i => !i.response).length;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.bizCard, { backgroundColor: colors.backgroundElement, borderColor: expanded ? ACCENT + '50' : colors.border }]}
        onPress={toggle}
      >
        {/* Header row */}
        <View style={styles.bizHeader}>
          {biz.logo
            ? <Image source={{ uri: biz.logo }} style={styles.bizLogo} />
            : <View style={[styles.bizLogoPlaceholder, { backgroundColor: ACCENT + '18' }]}>
                <StoreIcon color={ACCENT} size={18} />
              </View>
          }
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.bizName, { color: colors.text }]} numberOfLines={1}>{biz.name}</Text>
            {(biz.location?.town || biz.location?.county) && (
              <View style={styles.locationRow}>
                <LocationIcon color={colors.textMuted} size={11} />
                <Text style={[styles.locationText, { color: colors.textMuted }]}>
                  {' '}{[biz.location?.town, biz.location?.county].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
              <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
            </View>
            {pendingInq > 0 && (
              <View style={[styles.inqDot, { backgroundColor: '#a78bfa' }]}>
                <Text style={styles.inqDotText}>{pendingInq} new</Text>
              </View>
            )}
          </View>
        </View>

        {biz.description ? (
          <Text style={[styles.bizDesc, { color: colors.textMuted }]} numberOfLines={expanded ? undefined : 2}>
            {biz.description}
          </Text>
        ) : null}

        {/* Categories */}
        {biz.categories?.length > 0 && (
          <View style={styles.catsRow}>
            {biz.categories.slice(0, 4).map(c => (
              <View key={c} style={[styles.catChip, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '30' }]}>
                <Text style={[styles.catText, { color: ACCENT }]}>{c}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Expand arrow */}
        <Text style={[styles.expandHint, { color: colors.textMuted }]}>
          {expanded ? 'Tap to collapse' : 'Tap to see analytics, reviews & inquiries'}
        </Text>
      </TouchableOpacity>

      {/* Expanded detail section */}
      {expanded && (
        <View style={[styles.detailPanel, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {detailLoading ? (
            <ActivityIndicator color={ACCENT} style={{ paddingVertical: 16 }} />
          ) : (
            <>
              {/* Analytics */}
              <Text style={[styles.panelLabel, { color: ACCENT }]}>ANALYTICS</Text>
              <View style={styles.analyticsGrid}>
                {[
                  { label: 'Views', val: analytics?.views || 0, Icon: EyeIcon, color: '#3b82f6' },
                  { label: 'Contact', val: analytics?.contactClicks || 0, Icon: PhoneIcon, color: '#22c55e' },
                  { label: 'Website', val: analytics?.websiteClicks || 0, Icon: GlobeIcon, color: '#8b5cf6' },
                  { label: 'Directions', val: analytics?.mapClicks || 0, Icon: LocationIcon, color: '#f59e0b' },
                ].map(({ label, val, Icon, color }) => (
                  <View key={label} style={[styles.analyticsBlock, { backgroundColor: color + '12', borderColor: color + '25' }]}>
                    <Icon color={color} size={14} />
                    <Text style={[styles.analyticsVal, { color }]}>{val}</Text>
                    <Text style={[styles.analyticsLab, { color: colors.textMuted }]}>{label}</Text>
                  </View>
                ))}
              </View>

              {/* Contact info */}
              {(biz.contact?.phone || biz.contact?.email || biz.contact?.website) && (
                <>
                  <Text style={[styles.panelLabel, { color: ACCENT }]}>CONTACT</Text>
                  {biz.contact?.phone && (
                    <View style={styles.contactRow}>
                      <PhoneIcon color={colors.textMuted} size={13} />
                      <Text style={[styles.contactText, { color: colors.textSecondary }]}> {biz.contact.phone}</Text>
                    </View>
                  )}
                  {biz.contact?.website && (
                    <View style={styles.contactRow}>
                      <GlobeIcon color={colors.textMuted} size={13} />
                      <Text style={[styles.contactText, { color: colors.textSecondary }]} numberOfLines={1}> {biz.contact.website}</Text>
                    </View>
                  )}
                </>
              )}

              {/* Reviews */}
              <Text style={[styles.panelLabel, { color: ACCENT }]}>
                REVIEWS {bizReviews.length > 0 ? `(${bizReviews.length} · ${avgRating.toFixed(1)} avg)` : ''}
              </Text>
              {bizReviews.length === 0 ? (
                <Text style={[styles.emptySmall, { color: colors.textMuted }]}>No reviews yet.</Text>
              ) : (
                bizReviews.slice(0, 3).map((r, i) => (
                  <View key={r._id || i} style={[styles.reviewRow, { borderBottomColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reviewerName, { color: colors.text }]}>
                        {r.reviewer?.name || r.author?.name || 'Anonymous'}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                        {[1,2,3,4,5].map(star => (
                          <StarIcon key={star} color={star <= r.rating ? ACCENT : colors.border} size={10} />
                        ))}
                      </View>
                      {r.comment && (
                        <Text style={[styles.reviewComment, { color: colors.textMuted }]} numberOfLines={2}>
                          {r.comment}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.reviewDate, { color: colors.textMuted }]}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : ''}
                    </Text>
                  </View>
                ))
              )}

              {/* Inquiries */}
              <Text style={[styles.panelLabel, { color: ACCENT }]}>
                INQUIRIES {bizInquiries.length > 0 ? `(${bizInquiries.length})` : ''}
              </Text>
              {bizInquiries.length === 0 ? (
                <Text style={[styles.emptySmall, { color: colors.textMuted }]}>No inquiries yet.</Text>
              ) : (
                bizInquiries.slice(0, 5).map((inq, i) => (
                  <View key={inq._id || i} style={[styles.inqRow, { borderBottomColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.inqTopRow}>
                        <Text style={[styles.inqSender, { color: colors.text }]}>
                          {inq.name || inq.senderName || 'Customer'}
                        </Text>
                        <View style={[styles.inqStatus, {
                          backgroundColor: inq.response ? '#22c55e18' : '#a78bfa18',
                          borderColor: inq.response ? '#22c55e40' : '#a78bfa40',
                        }]}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: inq.response ? '#22c55e' : '#a78bfa' }}>
                            {inq.response ? 'REPLIED' : 'PENDING'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.inqMsg, { color: colors.textMuted }]} numberOfLines={2}>
                        {inq.message || inq.inquiry || ''}
                      </Text>
                      {inq.response && (
                        <View style={[styles.replyPreview, { backgroundColor: ACCENT + '10', borderColor: ACCENT + '20' }]}>
                          <Text style={[styles.replyPreviewText, { color: colors.textSecondary }]} numberOfLines={1}>
                            Your reply: {inq.response}
                          </Text>
                        </View>
                      )}
                    </View>
                    {!inq.response && (
                      <TouchableOpacity
                        style={[styles.replyBtn, { backgroundColor: ACCENT }]}
                        onPress={() => setReplyTarget(inq)}
                      >
                        <MessageIcon color="#0f172a" size={13} />
                        <Text style={styles.replyBtnText}> Reply</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}

              {/* Boost note */}
              {(biz.status === 'approved' || biz.status === 'active') && (
                <View style={[styles.boostNote, { backgroundColor: ACCENT + '10', borderColor: ACCENT + '25' }]}>
                  <Text style={[styles.boostText, { color: ACCENT }]}>
                    Boost this listing on axxspace.com/axxbiashara
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Reply modal */}
      {replyTarget && (
        <ReplyModal
          inquiry={replyTarget}
          colors={colors}
          onClose={() => setReplyTarget(null)}
          onSent={() => { loadDetails(); onRefresh(); }}
        />
      )}
    </>
  );
}

/* ── Main Screen ────────────────────────────────────────────────────── */
export default function BiasharaListingsScreen({ user, onRegisterBusiness }) {
  const { colors } = useTheme();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await biasharaBusinessAPI.getMyBusiness();
      setBusinesses(res?.businesses || res?.data || []);
    } catch (err) {
      console.error('Listings load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Businesses</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={[styles.regBtn, { backgroundColor: ACCENT }]}
            onPress={onRegisterBusiness}
          >
            <Text style={styles.regBtnText}>+ Register</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => loadData(true)} style={styles.refreshBtn}>
            <RefreshIcon color={ACCENT} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading your businesses...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={ACCENT} colors={[ACCENT]} />}
        >
          {businesses.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <StoreIcon color={colors.border} size={40} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Businesses Listed</Text>
              <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                Register your first business to get started.
              </Text>
              <TouchableOpacity
                style={[styles.emptyRegBtn, { backgroundColor: ACCENT }]}
                onPress={onRegisterBusiness}
              >
                <Text style={styles.emptyRegText}>Register a Business</Text>
              </TouchableOpacity>
            </View>
          ) : (
            businesses.map(biz => (
              <BusinessCard
                key={biz._id}
                biz={biz}
                colors={colors}
                onRefresh={() => loadData(true)}
              />
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '900' },
  refreshBtn: { padding: 6 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: FontSize.base },
  listContent: { padding: Spacing.three },

  bizCard: { borderWidth: 1.5, borderRadius: BorderRadius.xl, padding: Spacing.three, marginBottom: 0 },
  bizHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bizLogo: { width: 44, height: 44, borderRadius: 10 },
  bizLogoPlaceholder: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  bizName: { fontSize: FontSize.md, fontWeight: '800', letterSpacing: -0.2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  locationText: { fontSize: 11 },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '800' },
  inqDot: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  inqDotText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  bizDesc: { fontSize: FontSize.sm, lineHeight: 18, marginBottom: 8 },
  catsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  catChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  catText: { fontSize: 10, fontWeight: '700' },
  expandHint: { fontSize: 10, fontWeight: '600', textAlign: 'center', marginTop: 4 },

  detailPanel: { borderWidth: 1, borderTopWidth: 0, borderRadius: BorderRadius.xl, borderTopLeftRadius: 0, borderTopRightRadius: 0, padding: Spacing.three, marginBottom: 14, marginTop: -2 },
  panelLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginTop: 12, marginBottom: 8 },

  analyticsGrid: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  analyticsBlock: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 8, alignItems: 'center', gap: 3 },
  analyticsVal: { fontSize: 16, fontWeight: '900' },
  analyticsLab: { fontSize: 9, fontWeight: '700' },

  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  contactText: { fontSize: FontSize.sm },

  reviewRow: { borderBottomWidth: 1, paddingVertical: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  reviewerName: { fontSize: 12, fontWeight: '700' },
  reviewComment: { fontSize: 11, marginTop: 4, lineHeight: 16 },
  reviewDate: { fontSize: 10, marginTop: 2 },

  inqRow: { borderBottomWidth: 1, paddingVertical: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  inqTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  inqSender: { fontSize: 12, fontWeight: '700' },
  inqStatus: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  inqMsg: { fontSize: 11, lineHeight: 16 },
  replyPreview: { borderWidth: 1, borderRadius: 6, padding: 6, marginTop: 4 },
  replyPreviewText: { fontSize: 11 },
  replyBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start', marginTop: 4 },
  replyBtnText: { color: '#0f172a', fontSize: 11, fontWeight: '800' },

  boostNote: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 12 },
  boostText: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  emptySmall: { fontSize: FontSize.sm, paddingVertical: 8 },

  emptyCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.five, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '800' },
  emptyBody: { fontSize: FontSize.base, textAlign: 'center', lineHeight: 22 },
  emptyRegBtn: { borderRadius: BorderRadius.lg, paddingVertical: 12, paddingHorizontal: 24, marginTop: 4 },
  emptyRegText: { color: '#0f172a', fontWeight: '900', fontSize: FontSize.base },
  regBtn: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  regBtnText: { color: '#0f172a', fontSize: 11, fontWeight: '800' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { borderWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.four },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '900', marginBottom: 4 },
  modalSender: { fontSize: FontSize.sm, marginBottom: 10 },
  msgPreview: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 10 },
  msgPreviewText: { fontSize: FontSize.sm, lineHeight: 18 },
  msgBanner: { borderRadius: 8, padding: 8, marginBottom: 8, borderWidth: 1 },
  msgOk: { backgroundColor: '#22c55e18', borderColor: '#22c55e40' },
  msgErr: { backgroundColor: '#ef444418', borderColor: '#ef444440' },
  replyInput: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 100, textAlignVertical: 'top', fontSize: FontSize.md, marginBottom: 12 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  modalCancelText: { fontWeight: '700', fontSize: FontSize.base },
  modalSendBtn: { flex: 1, backgroundColor: ACCENT, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  modalSendText: { color: '#0f172a', fontWeight: '800', fontSize: FontSize.base },
});
