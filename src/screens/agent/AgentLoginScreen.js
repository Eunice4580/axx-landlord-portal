import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { EyeIcon, EyeOffIcon, ArrowLeftIcon, AlertIcon, CheckIcon } from './AgentIcons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';

const ACCENT = '#e11d48';  // amber — agent brand color
const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

export default function AgentLoginScreen({ onLoginSuccess, onBack, onCreateAccount }) {
  const { colors } = useTheme();
  const [mode, setMode]             = useState('login'); // 'login' | 'forgot'
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [forgotEmail, setForgotEmail]     = useState('');
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
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 35000);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Login failed');
      if (data.user?.role !== 'agent') {
        throw new Error('This login is for agents only. Please use the appropriate portal.');
      }
      await SecureStore.setItemAsync('agent_token', data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      setMsg({
        text: err.name === 'AbortError'
          ? 'Request timed out. The server may be waking up — please try again.'
          : err.message || 'Login failed. Please try again.',
        ok: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!forgotEmail.trim()) { setMsg({ text: 'Enter your email address.', ok: false }); return; }
    setForgotLoading(true);
    setMsg({ text: '', ok: false });
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim(), role: 'agent' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email.');
      setMsg({ text: 'Reset link sent. Check your inbox.', ok: true });
    } catch (err) {
      setMsg({ text: err.message || 'Failed to send reset email.', ok: false });
    } finally {
      setForgotLoading(false);
    }
  };

  const s = getStyles(colors);

  // ── Forgot Password view ──
  if (mode === 'forgot') {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={s.backBtn} onPress={() => { setMode('login'); setMsg({ text: '', ok: false }); }}>
              <ArrowLeftIcon color={ACCENT} size={16} />
              <Text style={s.backText}>  Back to Sign In</Text>
            </TouchableOpacity>
            <View style={s.brand}>
              <Image source={require('../../../assets/axx-logo.jpg')} style={s.logoImage} resizeMode="contain" />
              <Text style={[s.brandName, { color: colors.text }]}>Reset Password</Text>
              <Text style={s.tagline}>Enter your email for a reset link</Text>
            </View>
            {msg.text ? (
              <View style={[s.msgBox, msg.ok ? s.msgOk : s.msgErr]}>
                {msg.ok ? <CheckIcon color="#1e3a5f" size={14} /> : <AlertIcon color="#ef4444" size={14} />}
                <Text style={s.msgText}> {msg.text}</Text>
              </View>
            ) : null}
            <Text style={s.label}>Email Address</Text>
            <TextInput style={s.input} placeholder="you@example.com" placeholderTextColor={colors.textMuted}
              value={forgotEmail} onChangeText={setForgotEmail} autoCapitalize="none" keyboardType="email-address" />
            <TouchableOpacity style={[s.btn, forgotLoading && s.btnDisabled]} onPress={handleForgot} disabled={forgotLoading}>
              {forgotLoading ? <ActivityIndicator color="#1f2937" size="small" /> : <Text style={s.btnText}>Send Reset Link</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Login view ──
  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={onBack}>
            <ArrowLeftIcon color={ACCENT} size={16} />
            <Text style={s.backText}>  All Portals</Text>
          </TouchableOpacity>

          {/* Brand */}
          <View style={s.brand}>
            <Image source={require('../../../assets/axx-logo.jpg')} style={s.logoImage} resizeMode="contain" />
            <Text style={[s.brandName, { color: colors.text }]}>Agent Portal</Text>
            <Text style={s.tagline}>Property Sales & Lettings</Text>
            <View style={[s.pill, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '35' }]}>
              <Text style={[s.pillText, { color: ACCENT }]}>Access your agent dashboard</Text>
            </View>
          </View>

          {/* Inline message */}
          {msg.text ? (
            <View style={[s.msgBox, msg.ok ? s.msgOk : s.msgErr]}>
              {msg.ok ? <CheckIcon color="#1e3a5f" size={14} /> : <AlertIcon color="#ef4444" size={14} />}
              <Text style={s.msgText}> {msg.text}</Text>
            </View>
          ) : null}

          {/* Email */}
          <Text style={s.label}>Email Address</Text>
          <TextInput
            style={s.input}
            placeholder="your@email.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          {/* Password */}
          <Text style={s.label}>Password</Text>
          <View style={s.pwRow}>
            <TextInput
              style={[s.input, s.pwInput]}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPw}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            <TouchableOpacity style={s.pwToggle} onPress={() => setShowPw(v => !v)}>
              {showPw ? <EyeOffIcon color={ACCENT} size={17} /> : <EyeIcon color={ACCENT} size={17} />}
            </TouchableOpacity>
          </View>

          {/* Forgot */}
          <TouchableOpacity style={s.forgotLink} onPress={() => { setMode('forgot'); setMsg({ text: '', ok: false }); }}>
            <Text style={[s.forgotText, { color: ACCENT }]}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#1f2937" size="small" /> : <Text style={s.btnText}>Sign In</Text>}
          </TouchableOpacity>

          {/* Create account */}
          {onCreateAccount && (
            <TouchableOpacity
              style={[s.note, { borderColor: ACCENT + '50', backgroundColor: ACCENT + '11' }]}
              onPress={onCreateAccount}
              activeOpacity={0.8}
            >
              <Text style={[s.noteText, { color: colors.textMuted }]}>
                Don't have an account?{'\n'}
                <Text style={{ color: ACCENT, fontWeight: '800' }}>Create Account →</Text>
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[s.footer, { color: colors.textMuted }]}>AxxSpaces — Agent Portal</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.four, paddingBottom: Spacing.four },

  backBtn: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.three, marginBottom: Spacing.two },
  backText: { fontSize: FontSize.sm, fontWeight: '700', color: ACCENT },

  brand: { alignItems: 'center', marginBottom: Spacing.four },
  logoImage: { width: 88, height: 88, borderRadius: 20, marginBottom: Spacing.two, backgroundColor: '#fff',
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  brandName: { fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  tagline: { fontSize: FontSize.sm, color: '#94a3b8', marginTop: 4, fontWeight: '600', letterSpacing: 0.3 },
  pill: { marginTop: 10, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  msgBox: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, padding: Spacing.two, marginBottom: Spacing.two, borderWidth: 1 },
  msgOk: { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)' },
  msgErr: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' },
  msgText: { fontSize: FontSize.sm, color: colors.text, flex: 1 },

  label: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: Spacing.two },
  input: { backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.md, padding: Spacing.three, fontSize: FontSize.md, color: colors.text },
  pwRow: { position: 'relative', justifyContent: 'center' },
  pwInput: { paddingRight: 48 },
  pwToggle: { position: 'absolute', right: 14 },

  forgotLink: { alignItems: 'flex-end', marginTop: 8, marginBottom: Spacing.two },
  forgotText: { fontSize: 13, fontWeight: '700' },

  btn: { backgroundColor: ACCENT, borderRadius: BorderRadius.md, padding: Spacing.three, alignItems: 'center', marginTop: Spacing.two,
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#1f2937', fontSize: FontSize.md, fontWeight: '800', letterSpacing: 0.3 },

  note: { marginTop: Spacing.four, borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.three, alignItems: 'center' },
  noteText: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  footer: { textAlign: 'center', fontSize: 11, marginTop: Spacing.four, letterSpacing: 0.5 },
});
