import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';

const ACCENT = '#e11d48';
const GOLD = '#fbbf24';
const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

function PlanCard({ plan, groupLabel, active, onPress, colors }) {
  return (
    <TouchableOpacity
      style={[
        styles.planCard,
        { backgroundColor: colors.background, borderColor: active ? GOLD : colors.border },
        active && { backgroundColor: GOLD + '12' },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.planTopRow}>
        <Text style={[styles.planGroup, { color: colors.textMuted }]}>{groupLabel}</Text>
        {active && <Text style={[styles.planCheck, { color: GOLD }]}>✓</Text>}
      </View>
      <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
      <Text style={[styles.planPrice, { color: GOLD }]}>
        KSh {Number(plan.price).toLocaleString()}
        <Text style={[styles.planPer, { color: colors.textMuted }]}>
          {' '}/ {plan.durationDays} day{plan.durationDays > 1 ? 's' : ''}
        </Text>
      </Text>
      {plan.tagline ? <Text style={[styles.planTagline, { color: colors.textMuted }]}>{plan.tagline}</Text> : null}
    </TouchableOpacity>
  );
}

export default function BoostModal({
  visible,
  listing,
  onClose,
  onSuccess,
  tokenKey = 'accom_token',
  listingType = 'Accommodation',
}) {
  const { colors } = useTheme();
  const [catalog, setCatalog] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(null);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setCatalog(null);
    setLoadError('');
    setResult(null);
    setSelected(null);

    SecureStore.getItemAsync(tokenKey).then(t => {
      if (t) {
        fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
          .then(r => r.json())
          .then(d => {
            const u = d.user || d;
            if (!cancelled && u?.phone) setPhone(u.phone);
          })
          .catch(() => {});
      }
    });

    fetch(`${API_BASE}/payment/promotion-catalog`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data?.catalog) {
          setCatalog(data.catalog);
          const monthly = data.catalog.boosts?.find(b => b.id === 'boost-30days');
          setSelected(monthly ? monthly.id : data.catalog.boosts?.[0]?.id);
        } else {
          setLoadError('Could not load promotion plans.');
        }
      })
      .catch(() => !cancelled && setLoadError('Network error loading promotion plans.'));

    return () => { cancelled = true; };
  }, [visible, tokenKey]);

  const plans = catalog ? [...(catalog.boosts || []), ...(catalog.homepageFeatures || [])] : [];
  const plan = plans.find(p => p.id === selected) || null;
  const isActiveBoost = listing?.isFeatured && listing?.promotionTier && listing?.promotionTier !== 'none';

  const handleSubmit = async () => {
    if (!plan || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const token = await SecureStore.getItemAsync(tokenKey);
      const res = await fetch(`${API_BASE}/payment/initiate-listing-promotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          listingType,
          listingId: listing._id || listing.id,
          planId: plan.id,
          phone: phone.replace(/\s+/g, ''),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setResult({ ok: true, message: data.message || 'M-Pesa prompt sent. Enter your PIN to activate the boost.' });
        onSuccess?.(plan);
      } else {
        setResult({ ok: false, message: data.error || 'Payment initiation failed. Please try again.' });
      }
    } catch {
      setResult({ ok: false, message: 'Network error connecting to payment gateway.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
        >
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: GOLD }]}>Promote this listing</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {listing?.name || listing?.title || listingType}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={onClose}
            >
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {loadError ? (
              <View style={[styles.msgBox, { backgroundColor: '#ef444415', borderColor: '#ef444440' }]}>
                <Text style={{ color: '#ef4444', fontSize: 12 }}>{loadError}</Text>
              </View>
            ) : !catalog ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={GOLD} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading plans…</Text>
              </View>
            ) : (
              <>
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>BOOST PLACEMENT</Text>
                <View style={styles.planGrid}>
                  {(catalog.boosts || []).map(p => (
                    <PlanCard key={p.id} plan={p} groupLabel="Boost" active={selected === p.id} onPress={() => setSelected(p.id)} colors={colors} />
                  ))}
                </View>

                {(catalog.homepageFeatures || []).length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>HOMEPAGE FEATURE</Text>
                    <View style={styles.planGrid}>
                      {catalog.homepageFeatures.map(p => (
                        <PlanCard key={p.id} plan={p} groupLabel="Featured" active={selected === p.id} onPress={() => setSelected(p.id)} colors={colors} />
                      ))}
                    </View>
                  </>
                )}

                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>M-PESA PHONE NUMBER</Text>
                <TextInput
                  style={[styles.phoneInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="07XX XXX XXX"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />

                {result && (
                  <View style={[styles.msgBox, result.ok
                    ? { backgroundColor: '#10b98115', borderColor: '#10b98140' }
                    : { backgroundColor: '#ef444415', borderColor: '#ef444440' }]}>
                    <Text style={{ color: result.ok ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: '600' }}>{result.message}</Text>
                  </View>
                )}

                {isActiveBoost && (
                  <Text style={[styles.note, { color: colors.textMuted }]}>
                    This listing already has an active boost — paying again extends it from today.
                  </Text>
                )}
              </>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.payBtn, { opacity: !plan || submitting ? 0.55 : 1 }]}
            onPress={handleSubmit}
            disabled={!plan || submitting}
          >
            {submitting ? <ActivityIndicator color="#fff" size="small" /> : (
              <Text style={styles.payBtnText}>
                {plan ? `Pay KSh ${Number(plan.price).toLocaleString()} with M-Pesa` : 'Select a plan'}
              </Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.65)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '88%', borderTopLeftRadius: 22, borderTopRightRadius: 22,
    borderWidth: 1, padding: Spacing.three, paddingBottom: Spacing.four,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  title: { fontSize: FontSize.lg, fontWeight: '900' },
  subtitle: { fontSize: 12, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  loadingBox: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginTop: 12, marginBottom: 8 },
  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  planCard: { flexGrow: 1, flexBasis: '46%', borderWidth: 1, borderRadius: BorderRadius.lg, padding: 12 },
  planTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planGroup: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  planCheck: { fontSize: 13, fontWeight: '900' },
  planName: { fontSize: 13, fontWeight: '800', marginTop: 6 },
  planPrice: { fontSize: 14, fontWeight: '900', marginTop: 2 },
  planPer: { fontSize: 10, fontWeight: '600' },
  planTagline: { fontSize: 10, marginTop: 4, lineHeight: 14 },
  phoneInput: { borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontWeight: '600' },
  msgBox: { borderWidth: 1, borderRadius: BorderRadius.md, padding: 10, marginTop: 10 },
  note: { fontSize: 11, marginTop: 8, lineHeight: 15 },
  payBtn: { backgroundColor: ACCENT, borderRadius: BorderRadius.lg, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  payBtnText: { color: '#fff', fontSize: 13, fontWeight: '900' },
});
