import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { EyeIcon, EyeOffIcon, ArrowLeftIcon, CheckIcon, AlertIcon } from './Icons';
import { useTheme } from '../../context/ThemeContext';

/* ── Exact colors from BusinessRegister.jsx (dark theme) ──────────── */
const C = {
  bg:           '#0f172a',
  card:         'rgba(30, 41, 59, 0.95)',
  cardBorder:   'rgba(255,255,255,0.1)',
  accent:       '#60a5fa',
  accentText:   '#0f172a',
  title:        '#60a5fa',
  subtitle:     '#94a3b8',
  label:        '#cbd5e1',
  inputBg:      'rgba(15, 23, 42, 0.7)',
  inputBorder:  'rgba(255,255,255,0.1)',
  inputFocus:   '#60a5fa',
  inputText:    '#f1f5f9',
  hint:         '#94a3b8',
  errorBg:      'rgba(239, 68, 68, 0.15)',
  errorBorder:  '#ef4444',
  errorText:    '#ef4444',
  successBg:    'rgba(34, 197, 94, 0.15)',
  successBorder:'#22c55e',
  successText:  '#22c55e',
  divider:      'rgba(255,255,255,0.1)',
  linkText:     '#60a5fa',
};

const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

export default function BiasharaRegisterScreen({ onRegisterSuccess, onBack }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [focused, setFocused]       = useState({});

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const validate = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() ||
        !form.password || !form.confirmPassword) {
      return 'Please fill in all fields';
    }
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      return 'Password must contain a mixture of both letters and numbers';
    }
    return null;
  };

  const handleRegister = async () => {
    setError(''); setSuccess('');
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);

    try {
      // Register
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          role: 'user',
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
        await SecureStore.setItemAsync('biashara_token', loginData.token);
        setSuccess('Account created! Taking you to your dashboard...');
        setTimeout(() => onRegisterSuccess(loginData.user), 1500);
      } else {
        setSuccess('Account created! Please log in.');
        setTimeout(() => onBack(), 2000);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pwStrong = form.password.length >= 6 &&
    /[a-zA-Z]/.test(form.password) && /[0-9]/.test(form.password);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {/* Back button */}
            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
              <ArrowLeftIcon color={C.accent} size={20} />
              <Text style={styles.backText}>Back to Login</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              {/* Title */}
              <Text style={styles.title}>Business Registration</Text>
              <Text style={styles.subtitle}>Add your business account on AxxBiashara</Text>

              {/* Messages */}
              {!!error && (
                <View style={styles.errorBox}>
                  <AlertIcon color={C.errorText} size={14} />
                  <Text style={styles.errorText}> {error}</Text>
                </View>
              )}
              {!!success && (
                <View style={styles.successBox}>
                  <CheckIcon color={C.successText} size={14} />
                  <Text style={styles.successText}> {success}</Text>
                </View>
              )}

              {/* Full Name */}
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, focused.name && styles.inputFocused]}
                placeholder="Your full name"
                placeholderTextColor={C.hint}
                value={form.name}
                onChangeText={v => set('name', v)}
                onFocus={() => setFocused(f => ({ ...f, name: true }))}
                onBlur={() => setFocused(f => ({ ...f, name: false }))}
              />

              {/* Email */}
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, focused.email && styles.inputFocused]}
                placeholder="your@email.com"
                placeholderTextColor={C.hint}
                autoCapitalize="none"
                keyboardType="email-address"
                value={form.email}
                onChangeText={v => set('email', v)}
                onFocus={() => setFocused(f => ({ ...f, email: true }))}
                onBlur={() => setFocused(f => ({ ...f, email: false }))}
              />

              {/* Phone */}
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, focused.phone && styles.inputFocused]}
                placeholder="e.g. 0712 345 678"
                placeholderTextColor={C.hint}
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={v => set('phone', v)}
                onFocus={() => setFocused(f => ({ ...f, phone: true }))}
                onBlur={() => setFocused(f => ({ ...f, phone: false }))}
              />

              {/* Password */}
              <Text style={styles.label}>Password</Text>
              <View style={styles.pwWrap}>
                <TextInput
                  style={[styles.input, styles.pwInput, focused.password && styles.inputFocused]}
                  placeholder="Min 6 chars, letters &amp; numbers"
                  placeholderTextColor={C.hint}
                  secureTextEntry={!showPw}
                  value={form.password}
                  onChangeText={v => set('password', v)}
                  onFocus={() => setFocused(f => ({ ...f, password: true }))}
                  onBlur={() => setFocused(f => ({ ...f, password: false }))}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(v => !v)} activeOpacity={0.7}>
                  {showPw ? <EyeOffIcon color={C.hint} size={18} /> : <EyeIcon color={C.hint} size={18} />}
                </TouchableOpacity>
              </View>
              {form.password.length > 0 && !pwStrong && (
                <Text style={styles.hint}>Password must contain both letters and numbers</Text>
              )}

              {/* Confirm Password */}
              <Text style={[styles.label, { marginTop: 8 }]}>Confirm Password</Text>
              <View style={styles.pwWrap}>
                <TextInput
                  style={[styles.input, styles.pwInput, focused.confirm && styles.inputFocused]}
                  placeholder="••••••••"
                  placeholderTextColor={C.hint}
                  secureTextEntry={!showConfirm}
                  value={form.confirmPassword}
                  onChangeText={v => set('confirmPassword', v)}
                  onFocus={() => setFocused(f => ({ ...f, confirm: true }))}
                  onBlur={() => setFocused(f => ({ ...f, confirm: false }))}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(v => !v)} activeOpacity={0.7}>
                  {showConfirm ? <EyeOffIcon color={C.hint} size={18} /> : <EyeIcon color={C.hint} size={18} />}
                </TouchableOpacity>
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.5 }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color={C.accentText} />
                  : <Text style={styles.buttonText}>Create Account</Text>
                }
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Back to login link */}
              <TouchableOpacity style={{ alignItems: 'center' }} onPress={onBack} activeOpacity={0.7}>
                <Text style={styles.linkText}>
                  Already have a business account? <Text style={{ fontWeight: '700' }}>Sign in here</Text>
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, padding: 20, paddingTop: 10, paddingBottom: 40 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20, alignSelf: 'flex-start' },
  backText: { color: C.accent, fontSize: 14, fontWeight: '600' },

  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 20,
    padding: 30,
  },

  title:    { fontSize: 28, fontWeight: '800', color: C.title, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: C.subtitle, textAlign: 'center', marginBottom: 28 },

  errorBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.errorBorder, borderRadius: 10, padding: 12, marginBottom: 18 },
  errorText:  { color: C.errorText, fontSize: 13, flex: 1 },
  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.successBg, borderWidth: 1, borderColor: C.successBorder, borderRadius: 10, padding: 12, marginBottom: 18 },
  successText:{ color: C.successText, fontSize: 13, flex: 1 },

  label: { fontSize: 14, fontWeight: '600', color: C.label, marginBottom: 8 },
  hint:  { fontSize: 11, color: '#fca5a5', marginTop: -10, marginBottom: 14 },

  input: {
    width: '100%',
    padding: 14,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: 10,
    color: C.inputText,
    fontSize: 15,
    marginBottom: 18,
  },
  inputFocused: { borderColor: C.inputFocus },

  pwWrap:  { position: 'relative' },
  pwInput: { paddingRight: 48 },
  eyeBtn:  { position: 'absolute', right: 14, top: 0, bottom: 18, justifyContent: 'center', alignItems: 'center' },

  button:     { backgroundColor: C.accent, borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 6 },
  buttonText: { color: C.accentText, fontSize: 17, fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  dividerLine:{ flex: 1, height: 1, backgroundColor: C.divider },
  dividerText:{ color: C.hint, fontSize: 14, paddingHorizontal: 10 },

  linkText: { color: C.linkText, fontSize: 14, textAlign: 'center' },
});
