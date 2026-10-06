import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import Svg, { Path, Circle, Polyline, Check } from 'react-native-svg';

const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

/* ── Colors — exact agent portal theme ───────────────────────── */
const C = {
  bg:      '#0f172a',
  card:    '#1e293b',
  border:  'rgba(255,255,255,0.08)',
  text:    '#f1f5f9',
  muted:   '#94a3b8',
  accent:  '#fbbf24',
  green:   '#10b981',
  red:     '#ef4444',
};

/* ── Package definitions (mirrors agentPackages.js) ─────────── */
const PACKAGES = [
  {
    key: 'basic',
    name: 'BASIC',
    price: 0,
    listings: 5,
    badge: 'Free',
    badgeColor: '#64748b',
    features: [
      'Agent profile',
      'Up to 5 active listings',
      'Standard Axxspace QR code',
      'Digital profile link',
    ],
  },
  {
    key: 'pro',
    name: 'PRO',
    price: 1500,
    listings: 30,
    badge: 'Popular',
    badgeColor: '#3b82f6',
    features: [
      'Up to 30 active listings',
      'Custom agent QR code',
      'Professional digital agent card',
      'Print-ready card design',
      'Print-ready poster design',
      'QR scan statistics',
    ],
  },
  {
    key: 'pro_plus',
    name: 'PRO+',
    price: 2500,
    listings: 50,
    badge: 'Best Value',
    badgeColor: C.accent,
    features: [
      'Up to 50 active listings',
      'Multiple QR designs',
      'Professional digital agent card',
      'Print-ready cards & posters',
      'Print-ready sticker designs',
      'QR scan statistics',
      'Enhanced agent profile',
    ],
  },
  {
    key: 'verified',
    name: 'VERIFIED AGENT',
    price: 5000,
    listings: 100,
    badge: 'Premium',
    badgeColor: '#8b5cf6',
    features: [
      'Everything in Pro+',
      'Physical verification by Axxspace',
      'Identity & document checks',
      'Verified Agent badge',
      'Individual custom QR code',
      'Priority placement & features',
    ],
  },
];

/* ── Icons ───────────────────────────────────────────────────── */
const CheckIcon = ({ size = 14, color = C.green }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

const ArrowLeft = ({ size = 20, color = C.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 12H5M12 5l-7 7 7 7" />
  </Svg>
);

/* ── Package Card ────────────────────────────────────────────── */
function PackageCard({ pkg, currentTier, pendingTier, onSelect }) {
  const isCurrent = currentTier === pkg.key;
  const isPending = pendingTier === pkg.key;
  const isActive  = isCurrent;

  return (
    <TouchableOpacity
      style={[
        s.card,
        isActive && { borderColor: C.accent, borderWidth: 2 },
        isPending && { borderColor: '#3b82f6', borderWidth: 2 },
      ]}
      onPress={() => !isCurrent && onSelect(pkg)}
      activeOpacity={isActive ? 1 : 0.85}
    >
      {/* Header row */}
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={s.pkgName}>{pkg.name}</Text>
            <View style={[s.badge, { backgroundColor: pkg.badgeColor + '25', borderColor: pkg.badgeColor + '60' }]}>
              <Text style={[s.badgeText, { color: pkg.badgeColor }]}>{pkg.badge}</Text>
            </View>
            {isCurrent && (
              <View style={[s.badge, { backgroundColor: C.accent + '25', borderColor: C.accent + '60' }]}>
                <Text style={[s.badgeText, { color: C.accent }]}>Current</Text>
              </View>
            )}
            {isPending && (
              <View style={[s.badge, { backgroundColor: '#3b82f630', borderColor: '#3b82f660' }]}>
                <Text style={[s.badgeText, { color: '#3b82f6' }]}>Pending</Text>
              </View>
            )}
          </View>
          <Text style={s.listings}>{pkg.listings} active listings</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {pkg.price === 0 ? (
            <Text style={[s.price, { color: C.green }]}>Free</Text>
          ) : (
            <>
              <Text style={s.price}>KSh {pkg.price.toLocaleString()}</Text>
              <Text style={[s.priceNote, { color: C.muted }]}>/month</Text>
            </>
          )}
        </View>
      </View>

      {/* Features */}
      <View style={s.featureList}>
        {pkg.features.map((f, i) => (
          <View key={i} style={s.featureRow}>
            <CheckIcon size={13} color={isActive ? C.accent : C.green} />
            <Text style={[s.featureText, isActive && { color: C.text }]}>{f}</Text>
          </View>
        ))}
      </View>

      {/* CTA button */}
      {!isCurrent && !isPending && (
        <TouchableOpacity
          style={[s.selectBtn, { backgroundColor: pkg.key === 'basic' ? C.green : C.accent }]}
          onPress={() => onSelect(pkg)}
          activeOpacity={0.85}
        >
          <Text style={[s.selectBtnText, { color: '#0f172a' }]}>
            {pkg.price === 0 ? 'Activate Free Plan' : `Upgrade to ${pkg.name}`}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

/* ── Payment Modal ───────────────────────────────────────────── */
function PaymentModal({ pkg, onCancel, onSubmit, loading }) {
  const [mpesaMsg, setMpesaMsg] = useState('');

  return (
    <View style={s.modalOverlay}>
      <View style={s.modal}>
        <Text style={s.modalTitle}>Upgrade to {pkg.name}</Text>
        <Text style={[s.modalSub, { color: C.muted }]}>
          Amount: KSh {pkg.price.toLocaleString()}
        </Text>

        {/* M-Pesa instructions */}
        <View style={[s.mpesaBox, { backgroundColor: '#064e3b', borderColor: C.green + '50' }]}>
          <Text style={[s.mpesaTitle, { color: C.green }]}>Pay via M-Pesa</Text>
          <Text style={[s.mpesaStep, { color: '#6ee7b7' }]}>1. Go to M-Pesa {'>'} Lipa na M-Pesa {'>'} Buy Goods</Text>
          <Text style={[s.mpesaStep, { color: '#6ee7b7' }]}>2. Till Number: <Text style={{ fontWeight: '900' }}>542542</Text></Text>
          <Text style={[s.mpesaStep, { color: '#6ee7b7' }]}>3. Amount: <Text style={{ fontWeight: '900' }}>KSh {pkg.price.toLocaleString()}</Text></Text>
          <Text style={[s.mpesaStep, { color: '#6ee7b7' }]}>4. Paste the M-Pesa confirmation message below</Text>
        </View>

        <Text style={[s.inputLabel, { color: C.muted }]}>M-Pesa Confirmation Message</Text>
        <TextInput
          style={[s.mpesaInput, { color: C.text, borderColor: C.border, backgroundColor: '#0f172a' }]}
          placeholder="Paste your M-Pesa SMS here..."
          placeholderTextColor={C.muted}
          value={mpesaMsg}
          onChangeText={setMpesaMsg}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={s.modalBtns}>
          <TouchableOpacity style={[s.modalBtn, { backgroundColor: '#1e293b', flex: 1 }]} onPress={onCancel}>
            <Text style={{ color: C.muted, fontWeight: '700' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.modalBtn, { backgroundColor: C.accent, flex: 1 }, (!mpesaMsg.trim() || loading) && { opacity: 0.5 }]}
            onPress={() => onSubmit(mpesaMsg)}
            disabled={!mpesaMsg.trim() || loading}
          >
            {loading
              ? <ActivityIndicator color="#0f172a" size="small" />
              : <Text style={{ color: '#0f172a', fontWeight: '800' }}>Submit</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* ── Main Screen ─────────────────────────────────────────────── */
export default function AgentPackageScreen({ user, onBack }) {
  const [agentData, setAgentData]       = useState(null);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [selectedPkg, setSelectedPkg]   = useState(null); // show modal
  const [toast, setToast]               = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync('agent_token');
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAgentData(data.user || data);
    } catch (e) {
      console.error('Profile fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const currentTier  = agentData?.agentProfile?.subscriptionTier || 'none';
  const pendingTier  = agentData?.agentProfile?.pendingPackagePurchase?.status === 'pending'
    ? agentData.agentProfile.pendingPackagePurchase.tier
    : null;
  const expiresAt    = agentData?.agentProfile?.subscriptionExpiresAt;

  const handleSelect = (pkg) => {
    if (pendingTier) {
      Alert.alert(
        'Pending Purchase',
        `You already have a pending ${pendingTier.toUpperCase()} package awaiting admin approval. Cancel it first to submit a new one.`,
        [{ text: 'OK' }]
      );
      return;
    }
    if (pkg.price === 0) {
      // Free plan — activate immediately
      handleSubmitPurchase(pkg, null);
    } else {
      setSelectedPkg(pkg);
    }
  };

  const handleSubmitPurchase = async (pkg, mpesaMsg) => {
    setSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync('agent_token');
      const body = { tier: pkg.key };
      if (mpesaMsg) body.paymentMessage = mpesaMsg;

      const res = await fetch(`${API_BASE}/agents/purchase-package`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Purchase failed');

      setSelectedPkg(null);
      if (pkg.price === 0) {
        showToast(`${pkg.name} plan activated successfully!`);
      } else {
        showToast('Payment submitted. Awaiting admin approval.');
      }
      await fetchProfile();
    } catch (err) {
      showToast(err.message || 'Failed to submit. Try again.', false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPending = async () => {
    Alert.alert('Cancel Pending Purchase', 'Are you sure you want to cancel your pending package purchase?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
          try {
            const token = await SecureStore.getItemAsync('agent_token');
            const res = await fetch(`${API_BASE}/agents/cancel-pending-purchase`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) { showToast('Pending purchase cancelled.'); fetchProfile(); }
            else showToast('Failed to cancel.', false);
          } catch { showToast('Network error.', false); }
        }
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={C.accent} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Toast */}
      {toast && (
        <View style={[s.toast, { backgroundColor: toast.ok ? '#064e3b' : '#450a0a' }]}>
          <Text style={[s.toastText, { color: toast.ok ? C.green : C.red }]}>{toast.msg}</Text>
        </View>
      )}

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }} activeOpacity={0.7}>
          <ArrowLeft />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>Agent Packages</Text>
          <Text style={[s.headerSub, { color: C.muted }]}>Choose a plan that fits your needs</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Current plan banner */}
        {currentTier && currentTier !== 'none' && (
          <View style={[s.currentBanner, { borderColor: C.accent + '40', backgroundColor: C.accent + '0a' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.currentLabel, { color: C.muted }]}>Current Plan</Text>
              <Text style={[s.currentTier, { color: C.accent }]}>{currentTier.toUpperCase().replace('_', '+')}</Text>
              {expiresAt && (
                <Text style={[s.currentExpiry, { color: C.muted }]}>
                  Expires: {new Date(expiresAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Pending purchase warning */}
        {pendingTier && (
          <View style={[s.pendingBanner, { borderColor: '#3b82f640', backgroundColor: '#3b82f60a' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.currentLabel, { color: '#60a5fa' }]}>Pending Approval</Text>
              <Text style={[s.currentTier, { color: '#60a5fa' }]}>{pendingTier.toUpperCase().replace('_', '+')} Package</Text>
              <Text style={[s.currentExpiry, { color: C.muted }]}>Awaiting admin review of your M-Pesa payment</Text>
            </View>
            <TouchableOpacity
              style={[s.cancelPendingBtn, { borderColor: C.red + '50' }]}
              onPress={handleCancelPending}
            >
              <Text style={{ color: C.red, fontSize: 12, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Package cards */}
        {PACKAGES.map(pkg => (
          <PackageCard
            key={pkg.key}
            pkg={pkg}
            currentTier={currentTier}
            pendingTier={pendingTier}
            onSelect={handleSelect}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Payment modal */}
      {selectedPkg && (
        <PaymentModal
          pkg={selectedPkg}
          onCancel={() => setSelectedPkg(null)}
          onSubmit={(msg) => handleSubmitPurchase(selectedPkg, msg)}
          loading={submitting}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, gap: 12 },

  toast: {
    position: 'absolute', top: 60, left: 16, right: 16, zIndex: 9999,
    padding: 14, borderRadius: 10,
  },
  toastText: { fontWeight: '700', fontSize: 14, textAlign: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { color: C.text, fontSize: 20, fontWeight: '800' },
  headerSub:   { fontSize: 12, marginTop: 1 },

  currentBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 4,
  },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 4,
  },
  currentLabel:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  currentTier:   { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  currentExpiry: { fontSize: 12, marginTop: 2 },
  cancelPendingBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },

  // Package card
  card: {
    backgroundColor: C.card, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: C.border,
  },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  pkgName:     { color: C.text, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  listings:    { color: C.muted, fontSize: 12, marginTop: 3 },
  badge:       { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText:   { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  price:       { color: C.accent, fontSize: 20, fontWeight: '900' },
  priceNote:   { fontSize: 11, marginTop: 1 },

  featureList: { gap: 6, marginBottom: 14 },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { color: C.muted, fontSize: 13, flex: 1 },

  selectBtn:     { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  selectBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },

  // Payment modal
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center',
    alignItems: 'center', padding: 20, zIndex: 999,
  },
  modal:      { backgroundColor: C.card, borderRadius: 20, padding: 24, width: '100%' },
  modalTitle: { color: C.text, fontSize: 20, fontWeight: '900', marginBottom: 4 },
  modalSub:   { fontSize: 14, marginBottom: 16 },

  mpesaBox:   { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16, gap: 4 },
  mpesaTitle: { fontWeight: '800', fontSize: 14, marginBottom: 4 },
  mpesaStep:  { fontSize: 13, lineHeight: 20 },

  inputLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  mpesaInput: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    fontSize: 13, minHeight: 90, marginBottom: 16,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtn:  { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
});
