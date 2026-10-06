import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, CheckIcon, AlertIcon } from './AccomIcons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, FontSize } from '../../constants/theme';

const ACCENT    = '#10b981';
const API_BASE  = 'https://axx-spaces-backend-1.onrender.com/api';

export default function AccommodationRegisterScreen({ onRegisterSuccess, onBack }) {
  const { colors } = useTheme();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState({ text: '', ok: false });
  const [focused, setFocused]       = useState({});

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const validate = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() ||
        !form.password || !form.confirmPassword)
      return 'Please fill in all fields';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password))
      return 'Password must contain both letters and numbers';
    return null;
  };

  const handleRegister = async () => {
    setMsg({ text: '', ok: false });
    const err = validate();
    if (err) { setMsg({ text: err, ok: false }); return; }
    setLoading(true);

    try {
      // Register as host
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     form.name.trim(),
          email:    form.email.trim(),
          phone:    form.phone.trim(),
          password: form.password,
          role:     'host',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Auto-login
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });
      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.token) {
        await SecureStore.setItemAsync('accom_token', loginData.token);
        setMsg({ text: 'Account created! Taking you to your dashboard...', ok: true });
        setTimeout(() => onRegisterSuccess(loginData.user), 1500);
      } else {
        setMsg({ text: 'Account created! Please log in.', ok: true });
        setTimeout(() => onBack(), 2000);
      }
    } catch (err) {
      setMsg({ text: err.message || 'Registration failed. Please try again.', ok: false });
    } finally {
      setLoading(false);
    }
  };

  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeftIcon color={ACCENT} size={20} />
            <Text style={[s.backText, { color: ACCENT }]}>Back to Login</Text>
          </TouchableOpacity>

          {/* Brand */}
          <View style={s.brand}>
            <View style={[s.logoMark, { backgroundColor: ACCENT }]}>
              <Text style={s.logoText}>AXX</Text>
            </View>
            <Text style={[s.brandName, { color: colors.text }]}>AXXSPACES</Text>
            <Text style={[s.tagline, { color: colors.textMuted }]}>Accommodation Host Registration</Text>
          </View>

          {/* Message banner */}
          {!!msg.text && (
            <View style={[s.msgBox, msg.ok ? s.msgOk : s.msgErr]}>
              {msg.ok
                ? <CheckIcon color="#10b981" size={14} />
                : <AlertIcon color="#ef4444" size={14} />}
              <Text style={[s.msgText, { color: msg.ok ? '#10b981' : '#ef4444' }]}> {msg.text}</Text>
            </View>
          )}

          {/* Form */}
          <Text style={[s.label, { color: colors.textSecondary }]}>Full Name</Text>
          <TextInput
            style={[s.input, { borderColor: focused.name ? ACCENT : colors.border, backgroundColor: colors.backgroundElement, color: colors.text }]}
            placeholder="Your full name"
            placeholderTextColor={colors.textMuted}
            value={form.name}
            onChangeText={v => set('name', v)}
            onFocus={() => setFocused(f => ({ ...f, name: true }))}
            onBlur={() => setFocused(f => ({ ...f, name: false }))}
          />

          <Text style={[s.label, { color: colors.textSecondary }]}>Email Address</Text>
          <TextInput
            style={[s.input, { borderColor: focused.email ? ACCENT : colors.border, backgroundColor: colors.backgroundElement, color: colors.text }]}
            placeholder="your@email.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={v => set('email', v)}
            onFocus={() => setFocused(f => ({ ...f, email: true }))}
            onBlur={() => setFocused(f => ({ ...f, email: false }))}
          />

          <Text style={[s.label, { color: colors.textSecondary }]}>Phone Number</Text>
          <TextInput
            style={[s.input, { borderColor: focused.phone ? ACCENT : colors.border, backgroundColor: colors.backgroundElement, color: colors.text }]}
            placeholder="e.g. 0712 345 678"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={v => set('phone', v)}
            onFocus={() => setFocused(f => ({ ...f, phone: true }))}
            onBlur={() => setFocused(f => ({ ...f, phone: false }))}
          />

          <Text style={[s.label, { color: colors.textSecondary }]}>Password</Text>
          <View style={s.pwRow}>
            <TextInput
              style={[s.input, s.pwInput, { borderColor: focused.password ? ACCENT : colors.border, backgroundColor: colors.backgroundElement, color: colors.text }]}
              placeholder="Min 6 chars, letters &amp; numbers"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPw}
              value={form.password}
              onChangeText={v => set('password', v)}
              onFocus={() => setFocused(f => ({ ...f, password: true }))}
              onBlur={() => setFocused(f => ({ ...f, password: false }))}
            />
            <TouchableOpacity style={s.pwToggle} onPress={() => setShowPw(v => !v)} activeOpacity={0.7}>
              {showPw ? <EyeOffIcon color={ACCENT} size={17} /> : <EyeIcon color={ACCENT} size={17} />}
            </TouchableOpacity>
          </View>
          {form.password.length > 0 &&
            (form.password.length < 6 || !/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) && (
            <Text style={s.hint}>Password must contain both letters and numbers</Text>
          )}

          <Text style={[s.label, { color: colors.textSecondary }]}>Confirm Password</Text>
          <View style={s.pwRow}>
            <TextInput
              style={[s.input, s.pwInput, { borderColor: focused.confirm ? ACCENT : colors.border, backgroundColor: colors.backgroundElement, color: colors.text }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showConfirm}
              value={form.confirmPassword}
              onChangeText={v => set('confirmPassword', v)}
              onFocus={() => setFocused(f => ({ ...f, confirm: true }))}
              onBlur={() => setFocused(f => ({ ...f, confirm: false }))}
            />
            <TouchableOpacity style={s.pwToggle} onPress={() => setShowConfirm(v => !v)} activeOpacity={0.7}>
              {showConfirm ? <EyeOffIcon color={ACCENT} size={17} /> : <EyeIcon color={ACCENT} size={17} />}
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[s.btn, { backgroundColor: ACCENT }, loading && s.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.btnText}>Create Host Account</Text>}
          </TouchableOpacity>

          {/* Back to login */}
          <TouchableOpacity style={{ alignItems: 'center', marginTop: Spacing.three }} onPress={onBack}>
            <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '700' }}>
              Already have an account? Log In
            </Text>
          </TouchableOpacity>

          <Text style={[s.footer, { color: colors.textMuted }]}>
            AxxSpaces — Accommodation Host Portal
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  scroll:  { flexGrow: 1, paddingHorizontal: Spacing.four, paddingBottom: Spacing.four },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.three, marginBottom: Spacing.two },
  backText:{ fontSize: FontSize.sm, fontWeight: '700' },

  brand:    { alignItems: 'center', marginBottom: Spacing.four },
  logoMark: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.two, shadowColor: '#10b981', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  logoText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  brandName:{ fontSize: 26, fontWeight: '900', letterSpacing: 3, marginBottom: 2 },
  tagline:  { fontSize: FontSize.sm, fontWeight: '600', letterSpacing: 0.3 },

  msgBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1 },
  msgOk:  { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' },
  msgErr: { backgroundColor: 'rgba(239,68,68,0.12)',  borderColor: 'rgba(239,68,68,0.3)' },
  msgText:{ fontSize: FontSize.sm, flex: 1 },
  hint:   { fontSize: 11, color: '#fca5a5', marginTop: -10, marginBottom: 14 },

  label:  { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: Spacing.two },
  input:  { borderWidth: 1.5, borderRadius: 12, padding: Spacing.three, fontSize: FontSize.md, marginBottom: Spacing.two },

  pwRow:    { position: 'relative', justifyContent: 'center' },
  pwInput:  { paddingRight: 48 },
  pwToggle: { position: 'absolute', right: 14 },

  btn:        { borderRadius: 12, padding: Spacing.three, alignItems: 'center', marginTop: Spacing.two },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { color: '#fff', fontSize: FontSize.md, fontWeight: '800' },

  footer: { textAlign: 'center', fontSize: 11, marginTop: Spacing.five },
});
