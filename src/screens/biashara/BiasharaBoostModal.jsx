import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { biasharaPaymentAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { CheckIcon, ClockIcon, AlertIcon, ShieldCheckIcon } from './Icons';

const ACCENT = '#e11d48';
const { height: SCREEN_H } = Dimensions.get('window');

const PLANS = {
  'boost-3days': { name: 'Quick Boost', hint: 'Category search priority', price: 100, duration: '3 Days' },
  'boost-7days': { name: 'Super Boost', hint: 'Homepage spotlight', price: 250, duration: '7 Days' },
};

const CloseIcon = ({ color = '#94a3b8', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

const normalizePhone = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
};

const isValidPhone = (raw) => {
  const normalized = normalizePhone(raw);
  return /^254(7|1)\d{8}$/.test(normalized);
};

export default function BiasharaBoostModal({ visible, business, defaultPhone, onClose, onSuccess }) {
  const { colors } = useTheme();

  const [plan, setPlan] = useState('boost-3days');
  const [method, setMethod] = useState('mpesa');
  const [phone, setPhone] = useState('');
  const [bankMessage, setBankMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState({ text: '', error: false });

  useEffect(() => {
    if (!visible) return;
    setPlan('boost-3days');
    setMethod('mpesa');
    setPhone(defaultPhone || '');
    setBankMessage('');
    setLoading(false);
    setCompleted(false);
    setMessage({ text: '', error: false });
  }, [visible, defaultPhone]);

  if (!visible || !business) return null;

  const selected = PLANS[plan];

  const payMpesa = async () => {
    if (!isValidPhone(phone)) {
      setMessage({ text: 'Enter a valid M-Pesa number, e.g. 0712 345 678.', error: true });
      return;
    }
    setLoading(true);
    setMessage({ text: '', error: false });
    try {
      const res = await biasharaPaymentAPI.initiateMpesa({
        phone: normalizePhone(phone),
        amount: selected.price,
        plan,
        businessId: business._id,
      });
      if (res?.success) {
        setCompleted(true);
        setMessage({ text: 'Payment prompt sent. Enter your M-Pesa PIN on your phone to activate the boost.', error: false });
        onSuccess?.();
      } else {
        setMessage({ text: res?.error || 'Could not start the M-Pesa payment.', error: true });
      }
    } catch (err) {
      setMessage({ text: err.message || 'Could not start the M-Pesa payment.', error: true });
    } finally {
      setLoading(false);
    }
  };

  const payBank = async () => {
    const trimmed = bankMessage.trim();
    if (trimmed.length < 10) {
      setMessage({ text: 'Paste the full M-Pesa confirmation message.', error: true });
      return;
    }
    const codeMatch = trimmed.match(/([A-Z0-9]{10,12})\s+confirmed/i);
    const transactionRef = codeMatch ? codeMatch[1] : trimmed.slice(0, 30);

    setLoading(true);
    setMessage({ text: '', error: false });
    try {
      const res = await biasharaPaymentAPI.submitBankTransfer({
        amount: selected.price,
        plan,
        transactionRef,
        bankMessage: trimmed,
        businessId: business._id,
      });
      if (res?.success) {
        setCompleted(true);
        setMessage({ text: 'Payment submitted for manual review. Admin will verify and activate the boost shortly.', error: false });
        onSuccess?.();
      } else {
        setMessage({ text: res?.error || 'Could not submit the payment.', error: true });
      }
    } catch (err) {
      setMessage({ text: err.message || 'Could not submit the payment.', error: true });
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    color: colors.text,
    backgroundColor: colors.backgroundElement,
    borderColor: colors.border,
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[s.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[s.handle, { backgroundColor: colors.border }]} />

            <View style={[s.header, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.title, { color: colors.text }]}>Boost Business</Text>
                <Text style={[s.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
                  {business.name}
                </Text>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={10}>
                <CloseIcon color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.content}
            >
              {completed ? (
                <View style={s.successWrap}>
                  <View style={[s.successIcon, { backgroundColor: '#1e3a5f18' }]}>
                    <CheckIcon color="#1e3a5f" size={30} />
                  </View>
                  <Text style={[s.successTitle, { color: colors.text }]}>
                    {method === 'mpesa' ? 'Payment Initiated' : 'Submitted for Review'}
                  </Text>
                  <Text style={[s.successBody, { color: colors.textMuted }]}>{message.text}</Text>
                  <TouchableOpacity style={s.payBtn} onPress={onClose}>
                    <Text style={s.payBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={[s.sectionLabel, { color: ACCENT }]}>SELECT PACKAGE</Text>
                  {Object.entries(PLANS).map(([key, p]) => {
                    const active = plan === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[s.planCard, {
                          borderColor: active ? ACCENT : colors.border,
                          backgroundColor: active ? ACCENT + '0d' : colors.backgroundElement,
                        }]}
                        onPress={() => setPlan(key)}
                        activeOpacity={0.8}
                      >
                        <View style={[s.radio, { borderColor: active ? ACCENT : colors.border }]}>
                          {active && <View style={[s.radioDot, { backgroundColor: ACCENT }]} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.planName, { color: colors.text }]}>{p.name}</Text>
                          <Text style={[s.planHint, { color: colors.textMuted }]}>{p.hint}</Text>
                          <View style={s.planMetaRow}>
                            <ClockIcon color={colors.textMuted} size={11} />
                            <Text style={[s.planMeta, { color: colors.textMuted }]}> {p.duration}</Text>
                          </View>
                        </View>
                        <Text style={[s.planPrice, { color: ACCENT }]}>KSh {p.price}</Text>
                      </TouchableOpacity>
                    );
                  })}

                  <View style={[s.segment, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                    {[
                      { key: 'mpesa', label: 'M-Pesa' },
                      { key: 'bank', label: 'Paybill Transfer' },
                    ].map(opt => {
                      const active = method === opt.key;
                      return (
                        <TouchableOpacity
                          key={opt.key}
                          style={[s.segmentBtn, active && { backgroundColor: ACCENT }]}
                          onPress={() => { setMethod(opt.key); setMessage({ text: '', error: false }); }}
                        >
                          <Text style={[s.segmentText, { color: active ? '#0f172a' : colors.textMuted }]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {method === 'mpesa' ? (
                    <>
                      <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>M-PESA PHONE NUMBER</Text>
                      <TextInput
                        style={[s.input, fieldStyle]}
                        placeholder="e.g. 0712 345 678"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                      />
                      <Text style={[s.hint, { color: colors.textMuted }]}>
                        You will receive an STK prompt on this number. Enter your PIN to complete the payment.
                      </Text>

                      {!!message.text && (
                        <View style={[s.msgBox, { borderColor: '#ef444440', backgroundColor: '#ef444412' }]}>
                          <AlertIcon color="#ef4444" size={13} />
                          <Text style={[s.msgText, { color: '#ef4444' }]}> {message.text}</Text>
                        </View>
                      )}

                      <TouchableOpacity style={[s.payBtn, loading && s.payBtnDisabled]} onPress={payMpesa} disabled={loading}>
                        {loading
                          ? <ActivityIndicator color="#0f172a" size="small" />
                          : <Text style={s.payBtnText}>Pay KSh {selected.price}</Text>}
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <View style={[s.bankBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                        <Text style={[s.bankTitle, { color: colors.text }]}>Step 1 — Send payment</Text>
                        {[
                          ['Paybill Number', '542542'],
                          ['Account Number', '03507214611250'],
                          ['Amount', `KSh ${selected.price}`],
                        ].map(([label, value]) => (
                          <View key={label} style={s.bankRow}>
                            <Text style={[s.bankLabel, { color: colors.textMuted }]}>{label}</Text>
                            <Text style={[s.bankValue, { color: colors.text }]}>{value}</Text>
                          </View>
                        ))}
                      </View>

                      <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>PASTE M-PESA CONFIRMATION MESSAGE</Text>
                      <TextInput
                        style={[s.input, s.textarea, fieldStyle]}
                        placeholder="e.g. RBA12345XY confirmed. Ksh100 sent to I&M BANK 542542..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        textAlignVertical="top"
                        value={bankMessage}
                        onChangeText={setBankMessage}
                      />
                      <Text style={[s.hint, { color: colors.textMuted }]}>
                        Copy the full message exactly as received. Admin verifies and activates the boost.
                      </Text>

                      {!!message.text && (
                        <View style={[s.msgBox, { borderColor: '#ef444440', backgroundColor: '#ef444412' }]}>
                          <AlertIcon color="#ef4444" size={13} />
                          <Text style={[s.msgText, { color: '#ef4444' }]}> {message.text}</Text>
                        </View>
                      )}

                      <TouchableOpacity style={[s.payBtn, loading && s.payBtnDisabled]} onPress={payBank} disabled={loading}>
                        {loading
                          ? <ActivityIndicator color="#0f172a" size="small" />
                          : <Text style={s.payBtnText}>Submit for Verification</Text>}
                      </TouchableOpacity>
                    </>
                  )}

                  <View style={s.secureRow}>
                    <ShieldCheckIcon color={colors.textMuted} size={12} />
                    <Text style={[s.secureText, { color: colors.textMuted }]}>
                      {' '}Payments are processed securely through Safaricom M-Pesa.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.72)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    borderWidth: 1, maxHeight: SCREEN_H * 0.88,
  },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingVertical: 14, borderBottomWidth: 1,
  },
  title: { fontSize: FontSize.xl, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: FontSize.sm, marginTop: 2 },
  closeBtn: { padding: 6, marginLeft: 8 },
  content: { padding: Spacing.three, paddingBottom: Spacing.five },

  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },

  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: BorderRadius.lg, padding: 12, marginBottom: 8,
  },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 5 },
  planName: { fontSize: FontSize.base, fontWeight: '800' },
  planHint: { fontSize: FontSize.sm, marginTop: 1 },
  planMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  planMeta: { fontSize: 10, fontWeight: '600' },
  planPrice: { fontSize: FontSize.lg, fontWeight: '900' },

  segment: {
    flexDirection: 'row', borderWidth: 1, borderRadius: BorderRadius.lg,
    padding: 3, marginTop: 14, marginBottom: 16,
  },
  segmentBtn: { flex: 1, borderRadius: BorderRadius.md, paddingVertical: 9, alignItems: 'center' },
  segmentText: { fontSize: FontSize.sm, fontWeight: '800' },

  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.three, fontSize: FontSize.base },
  textarea: { minHeight: 96, paddingTop: Spacing.two },
  hint: { fontSize: FontSize.xs, lineHeight: 16, marginTop: 6 },

  msgBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: BorderRadius.md,
    padding: Spacing.two, marginTop: 12,
  },
  msgText: { fontSize: FontSize.sm, flex: 1 },

  payBtn: {
    backgroundColor: ACCENT, borderRadius: BorderRadius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: 16,
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: '#0f172a', fontSize: FontSize.base, fontWeight: '900' },

  bankBox: { borderWidth: 1, borderRadius: BorderRadius.lg, padding: 14, gap: 8, marginBottom: 14 },
  bankTitle: { fontSize: FontSize.sm, fontWeight: '800', marginBottom: 2 },
  bankRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bankLabel: { fontSize: FontSize.sm },
  bankValue: { fontSize: FontSize.sm, fontWeight: '800', letterSpacing: 0.3 },

  successWrap: { alignItems: 'center', paddingVertical: Spacing.four },
  successIcon: { width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  successTitle: { fontSize: FontSize.xl, fontWeight: '900', marginBottom: 6 },
  successBody: { fontSize: FontSize.base, textAlign: 'center', lineHeight: 21, marginBottom: 6 },

  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  secureText: { fontSize: 10 },
});
