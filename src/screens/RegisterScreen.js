import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';
const PRIMARY  = '#e11d48';

const EyeIcon = ({ color, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);
const EyeOffIcon = ({ color, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
);

export default function RegisterScreen({ onRegisterSuccess, onBack }) {
  const { colors } = useTheme();
  const [selectedRole, setSelectedRole] = useState('landlord'); // 'landlord' | 'caretaker_info'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [focused, setFocused] = useState({});

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const validate = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password) {
      return 'Please fill in all fields';
    }
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      return 'Password must contain letters and numbers';
    }
    return null;
  };

  const handleRegister = async () => {
    setError(''); setSuccess('');
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Auto-login
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, role: selectedRole }),
      });
      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.token) {
        await SecureStore.setItemAsync('token', loginData.token);
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

  const s = getStyles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Brand */}
          <View style={s.brand}>
            <View style={[s.logoMark, { backgroundColor: PRIMARY }]}>
              <Text style={s.logoText}>AXX</Text>
            </View>
            <Text style={[s.brandName, { color: colors.text }]}>AXXSPACE</Text>
            <Text style={[s.brandSub, { color: colors.textMuted }]}>Create Account</Text>
          </View>

          {/* Role selector */}
          <View style={s.roleRow}>
            <TouchableOpacity
              style={[s.roleCard, selectedRole === 'landlord' && { borderColor: PRIMARY, backgroundColor: PRIMARY + '12' }]}
              onPress={() => { setSelectedRole('landlord'); setError(''); }}
              activeOpacity={0.8}
            >
              <Text style={[s.roleCardIcon]}>🏠</Text>
              <Text style={[s.roleCardTitle, { color: selectedRole === 'landlord' ? PRIMARY : colors.text }]}>Landlord</Text>
              <Text style={[s.roleCardSub, { color: colors.textMuted }]}>Own properties</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.roleCard, selectedRole === 'caretaker_info' && { borderColor: '#f59e0b', backgroundColor: '#f59e0b12' }]}
              onPress={() => { setSelectedRole('caretaker_info'); setError(''); }}
              activeOpacity={0.8}
            >
              <Text style={s.roleCardIcon}>🔑</Text>
              <Text style={[s.roleCardTitle, { color: selectedRole === 'caretaker_info' ? '#f59e0b' : colors.text }]}>Caretaker</Text>
              <Text style={[s.roleCardSub, { color: colors.textMuted }]}>Manage properties</Text>
            </TouchableOpacity>
          </View>

          {/* Caretaker info card — shown instead of form */}
          {selectedRole === 'caretaker_info' && (
            <View style={[s.infoCard, { backgroundColor: '#fffbeb', borderColor: '#f59e0b' }]}>
              <Text style={s.infoIcon}>ℹ️</Text>
              <Text style={s.infoTitle}>Caretaker Accounts</Text>
              <Text style={[s.infoBody, { color: colors.textSecondary }]}>
                Caretaker accounts are created by your landlord — not through self-registration.{`\n\n`}Ask your landlord to invite you from their dashboard. You will receive an email with your login credentials.
              </Text>
              <TouchableOpacity style={[s.btn, { backgroundColor: '#f59e0b', marginTop: 20 }]} onPress={onBack} activeOpacity={0.85}>
                <Text style={[s.btnText, { color: '#1f2937' }]}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Landlord registration form */}
          {selectedRole === 'landlord' && (
            <>
          {!!error   && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}
          {!!success && <View style={s.successBox}><Text style={s.successText}>{success}</Text></View>}

          {/* Form */}
          <View style={s.form}>
            {/* Name */}
            <Text style={[s.label, { color: colors.textSecondary }]}>Full Name</Text>
            <View style={[s.inputWrap, {
              borderColor: focused.name ? PRIMARY : colors.border,
              backgroundColor: colors.backgroundElement,
            }]}>
              <TextInput
                style={[s.input, { color: colors.text }]}
                placeholder="Your full name"
                placeholderTextColor={colors.textMuted}
                value={form.name}
                onChangeText={v => set('name', v)}
                onFocus={() => setFocused(f => ({ ...f, name: true }))}
                onBlur={() => setFocused(f => ({ ...f, name: false }))}
              />
            </View>

            {/* Email */}
            <Text style={[s.label, { color: colors.textSecondary }]}>Email Address</Text>
            <View style={[s.inputWrap, {
              borderColor: focused.email ? PRIMARY : colors.border,
              backgroundColor: colors.backgroundElement,
            }]}>
              <TextInput
                style={[s.input, { color: colors.text }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={form.email}
                onChangeText={v => set('email', v)}
                onFocus={() => setFocused(f => ({ ...f, email: true }))}
                onBlur={() => setFocused(f => ({ ...f, email: false }))}
              />
            </View>

            {/* Phone */}
            <Text style={[s.label, { color: colors.textSecondary }]}>Phone Number</Text>
            <View style={[s.inputWrap, {
              borderColor: focused.phone ? PRIMARY : colors.border,
              backgroundColor: colors.backgroundElement,
            }]}>
              <TextInput
                style={[s.input, { color: colors.text }]}
                placeholder="e.g. 0712 345 678"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={v => set('phone', v)}
                onFocus={() => setFocused(f => ({ ...f, phone: true }))}
                onBlur={() => setFocused(f => ({ ...f, phone: false }))}
              />
            </View>

            {/* Password */}
            <Text style={[s.label, { color: colors.textSecondary }]}>Password</Text>
            <View style={[s.inputWrap, {
              borderColor: focused.password ? PRIMARY : colors.border,
              backgroundColor: colors.backgroundElement,
            }]}>
              <TextInput
                style={[s.input, { color: colors.text }]}
                placeholder="Min. 6 chars with letters & numbers"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPw}
                value={form.password}
                onChangeText={v => set('password', v)}
                onFocus={() => setFocused(f => ({ ...f, password: true }))}
                onBlur={() => setFocused(f => ({ ...f, password: false }))}
              />
              <TouchableOpacity onPress={() => setShowPw(v => !v)} style={s.eyeBtn}>
                {showPw
                  ? <EyeOffIcon color={colors.textMuted} size={18} />
                  : <EyeIcon color={colors.textMuted} size={18} />}
              </TouchableOpacity>
            </View>

            {/* Register button */}
            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled, { backgroundColor: PRIMARY }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnText}>
                    Create Landlord Account
                  </Text>
              }
            </TouchableOpacity>
          </View>
            </>
          )}

          {/* Back to login */}
          <TouchableOpacity style={{ alignItems: 'center', marginTop: 20 }} onPress={onBack}>
            <Text style={{ color: PRIMARY, fontSize: 13, fontWeight: '700' }}>
              Already have an account? Log In
            </Text>
          </TouchableOpacity>

          <Text style={[s.footer, { color: colors.textMuted }]}>AXX Spaces Manager</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.four, paddingBottom: Spacing.four },

  brand: { alignItems: 'center', marginBottom: Spacing.five },
  logoMark: {
    width: 76, height: 76, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.two,
    shadowColor: '#e11d48', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45, shadowRadius: 22, elevation: 12,
  },
  logoText:  { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  brandName: { fontSize: 26, fontWeight: '900', letterSpacing: 4, marginBottom: 4 },
  brandSub:  { fontSize: FontSize.sm, fontWeight: '500', letterSpacing: 0.5 },

  roleRow: { flexDirection: 'row', gap: 12, marginBottom: Spacing.four },
  roleCard: {
    flex: 1, borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 4,
  },
  roleCardIcon:  { fontSize: 24, marginBottom: 2 },
  roleCardTitle: { fontSize: 14, fontWeight: '800' },
  roleCardSub:   { fontSize: 11, textAlign: 'center' },

  infoCard: {
    borderWidth: 2, borderRadius: 14, padding: 20,
    alignItems: 'center', marginBottom: Spacing.three,
  },
  infoIcon:  { fontSize: 28, marginBottom: 8 },
  infoTitle: { fontSize: 18, fontWeight: '800', color: '#92400e', marginBottom: 8 },
  infoBody:  { fontSize: 14, textAlign: 'center', lineHeight: 22 },

  errorBox:   { backgroundColor: '#fee2e2', borderRadius: 8, padding: 12, marginBottom: 14 },
  errorText:  { color: '#dc2626', fontSize: 13 },
  successBox: { backgroundColor: '#dcfce7', borderRadius: 8, padding: 12, marginBottom: 14 },
  successText:{ color: '#166534', fontSize: 13 },

  form:  {},
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7, marginTop: Spacing.two },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 14, height: 52, gap: 10,
  },
  input:   { flex: 1, fontSize: FontSize.md, paddingVertical: 0 },
  eyeBtn:  { padding: 4 },

  btn: {
    height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.three,
    shadowColor: '#e11d48', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontSize: FontSize.md, fontWeight: '800', letterSpacing: 0.3 },

  footer: { textAlign: 'center', fontSize: 11, marginTop: Spacing.five, letterSpacing: 0.5 },
});
