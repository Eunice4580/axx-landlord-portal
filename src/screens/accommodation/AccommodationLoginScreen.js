import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, CheckIcon, AlertIcon, HomeIcon } from './AccomIcons';

const ACCENT = '#10b981';   // emerald green for accommodation
const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export default function AccommodationLoginScreen({ onLoginSuccess, onBack, onCreateAccount }) {
  const { colors } = useTheme();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: false });

  const handleLogin = async () => {
    setMsg({ text: '', ok: false });
    if (!email.trim() || !password) {
      setMsg({ text: 'Please enter your email and password.', ok: false });
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost('/auth/login', { email: email.trim(), password, role: 'host' });
      if (!data.token || !data.user) throw new Error('Invalid response. Please try again.');
      if (data.user.role !== 'host' && data.user.role !== 'landlord') {
        throw new Error('This portal is for accommodation hosts. Please sign in with your host account or register at axxspace.com/accommodation/register.');
      }
      await SecureStore.setItemAsync('accom_token', data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      setMsg({ text: err.message || 'Check your credentials and try again.', ok: false });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!forgotEmail.trim()) { setMsg({ text: 'Enter your email address.', ok: false }); return; }
    setForgotLoading(true);
    setMsg({ text: '', ok: false });
    try {
      await apiPost('/auth/forgot-password', { email: forgotEmail.trim(), role: 'host' });
      setMsg({ text: 'Reset link sent. Check your inbox.', ok: true });
    } catch (err) {
      setMsg({ text: err.message || 'Failed to send reset email.', ok: false });
    } finally {
      setForgotLoading(false);
    }
  };

  const s = getStyles(colors);

  if (mode === 'forgot') {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={s.backBtn} onPress={() => { setMode('login'); setMsg({ text: '', ok: false }); }}>
              <ArrowLeftIcon color={ACCENT} size={16} />
              <Text style={[s.backText, { color: ACCENT }]}>  Back to Sign In</Text>
            </TouchableOpacity>
            <View style={s.brand}>
              <View style={[s.logoMark, { backgroundColor: ACCENT }]}>
                <HomeIcon color="#fff" size={28} />
              </View>
              <Text style={[s.brandName, { color: colors.text }]}>Reset Password</Text>
              <Text style={s.tagline}>Enter your email for a reset link</Text>
            </View>
            {msg.text ? (
              <View style={[s.msgBox, msg.ok ? s.msgOk : s.msgErr]}>
                {msg.ok ? <CheckIcon color="#22c55e" size={14} /> : <AlertIcon color="#ef4444" size={14} />}
                <Text style={s.msgText}> {msg.text}</Text>
              </View>
            ) : null}
            <Text style={s.label}>Email Address</Text>
            <TextInput style={s.input} placeholder="you@example.com" placeholderTextColor={colors.textMuted}
              value={forgotEmail} onChangeText={setForgotEmail} autoCapitalize="none" keyboardType="email-address" />
            <TouchableOpacity style={[s.btn, forgotLoading && s.btnDisabled]} onPress={handleForgot} disabled={forgotLoading}>
              {forgotLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Send Reset Link</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={s.backBtn} onPress={onBack}>
            <ArrowLeftIcon color={ACCENT} size={16} />
            <Text style={[s.backText, { color: ACCENT }]}>  All Portals</Text>
          </TouchableOpacity>

          <View style={s.brand}>
            <View style={[s.logoMark, { backgroundColor: ACCENT }]}>
              <HomeIcon color="#fff" size={30} />
            </View>
            <Text style={[s.brandName, { color: colors.text }]}>Accommodation</Text>
            <Text style={s.tagline}>Provider & Host Portal</Text>
            <View style={[s.pill, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '35' }]}>
              <Text style={[s.pillText, { color: ACCENT }]}>Access your accommodation property dashboard</Text>
            </View>
          </View>

          {msg.text ? (
            <View style={[s.msgBox, msg.ok ? s.msgOk : s.msgErr]}>
              {msg.ok ? <CheckIcon color="#22c55e" size={14} /> : <AlertIcon color="#ef4444" size={14} />}
              <Text style={s.msgText}> {msg.text}</Text>
            </View>
          ) : null}

          <Text style={s.label}>Email Address</Text>
          <TextInput style={s.input} placeholder="your@email.com" placeholderTextColor={colors.textMuted}
            value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

          <Text style={s.label}>Password</Text>
          <View style={s.pwRow}>
            <TextInput style={[s.input, s.pwInput]} placeholder="Enter your password"
              placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword}
              secureTextEntry={!showPw} />
            <TouchableOpacity style={s.pwToggle} onPress={() => setShowPw(p => !p)}>
              {showPw ? <EyeOffIcon color={ACCENT} size={17} /> : <EyeIcon color={ACCENT} size={17} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.forgotLink} onPress={() => { setMode('forgot'); setMsg({ text: '', ok: false }); }}>
            <Text style={[s.forgotText, { color: ACCENT }]}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Login</Text>}
          </TouchableOpacity>

          {/* Create account — in-app */}
          <TouchableOpacity
            style={[s.note, { borderColor: ACCENT + '50', backgroundColor: 'rgba(16,185,129,0.07)' }]}
            onPress={onCreateAccount}
            activeOpacity={0.8}
          >
            <Text style={[s.noteText, { color: colors.textMuted }]}>
              Don't have an account?{'\n'}
              <Text style={{ color: ACCENT, fontWeight: '800' }}>Create Account →</Text>
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
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.four, paddingBottom: Spacing.four },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.three, marginBottom: Spacing.two },
  backText: { fontSize: FontSize.sm, fontWeight: '700' },
  brand: { alignItems: 'center', marginBottom: Spacing.four },
  logoMark: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.two, shadowColor: ACCENT, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  brandName: { fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  tagline: { fontSize: FontSize.sm, color: '#94a3b8', marginTop: 4, fontWeight: '600', letterSpacing: 0.3 },
  pill: { marginTop: 10, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  label: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: Spacing.two },
  input: { backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.md, padding: Spacing.three, fontSize: FontSize.md, color: colors.text },
  pwRow: { position: 'relative', justifyContent: 'center' },
  pwInput: { paddingRight: 48 },
  pwToggle: { position: 'absolute', right: 14 },
  forgotLink: { alignItems: 'flex-end', marginTop: 8, marginBottom: Spacing.two },
  forgotText: { fontSize: 13, fontWeight: '700' },
  btn: { backgroundColor: ACCENT, borderRadius: BorderRadius.md, padding: Spacing.three, alignItems: 'center', marginTop: Spacing.two },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800' },
  msgBox: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, padding: Spacing.two, marginBottom: Spacing.two, borderWidth: 1 },
  msgOk: { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)' },
  msgErr: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' },
  msgText: { fontSize: FontSize.sm, color: '#f1f5f9', flex: 1 },
  note: { marginTop: Spacing.four, borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.three, alignItems: 'center' },
  noteText: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  footer: { textAlign: 'center', fontSize: FontSize.xs, marginTop: Spacing.four },
});
