import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';

const ACCENT = '#e11d48';
const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

export default function PlansModal({
  visible,
  onClose,
  onSuccess,
  tokenKey = 'accom_token',
  role = 'host',
  accent = ACCENT,
}) {
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [phone, setPhone] = useState('');
  const [submittingTier, setSubmittingTier] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setData(null);
    setLoadError('');
    setResult(null);

    (async () => {
      try {
        const token = await SecureStore.getItemAsync(tokenKey);
        const me = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .catch(() => ({}));
        const u = me.user || me;
        if (!cancelled && u?.phone) setPhone(u.phone);

        const res = await fetch(`${API_BASE}/payment/provider-packages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && payload?.packages) setData(payload);
        else setLoadError(payload?.error || 'Could not load plans.');
      } catch {
        if (!cancelled) setLoadError('Network error loading plans.');
      }
    })();

    return () => { cancelled = true; };
  }, [visible, tokenKey]);

  const handleSubscribe = async (tierKey) => {
    if (submittingTier) return;
    setSubmittingTier(tierKey);
    setResult(null);
    try {
      const token = await SecureStore.getItemAsync(tokenKey);
      const res = await fetch(`${API_BASE}/payment/subscribe-provider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tier: tierKey, phone: phone.replace(/\s+/g, '') }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.success) {
        setResult({ ok: true, message: payload.message || 'M-Pesa prompt sent. Enter your PIN to activate the plan.' });
        onSuccess?.(tierKey);
      } else {
        setResult({ ok: false, message: payload.error || 'Payment initiation failed.' });
      }
    } catch {
      setResult({ ok: false, message: 'Network error connecting to payment gateway.' });
    } finally {
      setSubmittingTier(null);
    }
  };

  const packages = data?.packages || {};
  const currentTier = data?.current?.tier || 'free';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
        >
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>Upgrade your {role} plan</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                More active {role === 'host' ? 'accommodation' : 'rental'} listings and priority placement in search.
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
            ) : !data ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={accent} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading plans…</Text>
              </View>
            ) : (
              <>
                <View style={[styles.currentRow, { backgroundColor: accent + '12', borderColor: accent + '30' }]}>
                  <Text style={[styles.currentLabel, { color: colors.textMuted }]}>CURRENT PLAN</Text>
                  <Text style={[styles.currentValue, { color: accent }]}>{String(currentTier).toUpperCase()}</Text>
                </View>

                {Object.entries(packages)
                  .filter(([, pkg]) => pkg.price > 0)
                  .map(([key, pkg]) => {
                    const isCurrent = currentTier === key;
                    return (
                      <View
                        key={key}
                        style={[
                          styles.planCard,
                          { backgroundColor: colors.background, borderColor: isCurrent ? '#10b981' : colors.border },
                        ]}
                      >
                        <View style={styles.planHeadRow}>
                          <Text style={[styles.planName, { color: colors.text }]}>{pkg.name}</Text>
                          <Text style={[styles.planPrice, { color: accent }]}>
                            KSh {Number(pkg.price).toLocaleString()}
                            <Text style={[styles.planPer, { color: colors.textMuted }]}>/month</Text>
                          </Text>
                        </View>
                        <Text style={[styles.planDesc, { color: colors.textMuted }]}>{pkg.description}</Text>
                        {(pkg.features || []).map((f, i) => (
                          <Text key={i} style={[styles.feature, { color: colors.textSecondary }]}>•  {f}</Text>
                        ))}
                        <TouchableOpacity
                          style={[
                            styles.upgradeBtn,
                            isCurrent
                              ? { backgroundColor: '#10b98115', borderColor: '#10b98140', borderWidth: 1 }
                              : { backgroundColor: accent },
                          ]}
                          disabled={isCurrent || submittingTier === key}
                          onPress={() => handleSubscribe(key)}
                        >
                          {submittingTier === key ? (
                            <ActivityIndicator color={isCurrent ? '#10b981' : '#fff'} size="small" />
                          ) : (
                            <Text style={[styles.upgradeBtnText, { color: isCurrent ? '#10b981' : '#fff' }]}>
                              {isCurrent ? 'Active plan' : `Upgrade — KSh ${Number(pkg.price).toLocaleString()}`}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}

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

                <Text style={[styles.note, { color: colors.textMuted }]}>
                  Free plan: limited active {role === 'host' ? 'accommodation' : 'rental'} listings. Subscriptions last 30 days and can be renewed any time.
                </Text>
              </>
            )}
          </ScrollView>
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
  subtitle: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  closeBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  loadingBox: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 12 },
  currentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.md, padding: 10, marginBottom: 12 },
  currentLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  currentValue: { fontSize: 12, fontWeight: '900' },
  planCard: { borderWidth: 1, borderRadius: BorderRadius.lg, padding: 14, marginBottom: 10 },
  planHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  planName: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  planPrice: { fontSize: 15, fontWeight: '900' },
  planPer: { fontSize: 10, fontWeight: '600' },
  planDesc: { fontSize: 12, marginTop: 4, marginBottom: 8, lineHeight: 16 },
  feature: { fontSize: 11.5, lineHeight: 17 },
  upgradeBtn: { borderRadius: BorderRadius.md, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  upgradeBtnText: { fontSize: 12, fontWeight: '900' },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginTop: 8, marginBottom: 8 },
  phoneInput: { borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontWeight: '600' },
  msgBox: { borderWidth: 1, borderRadius: BorderRadius.md, padding: 10, marginTop: 10 },
  note: { fontSize: 11, marginTop: 12, lineHeight: 15 },
});
