import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { biasharaAuthAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, CheckIcon, AlertIcon, StoreIcon } from './Icons';

const ACCENT = '#fbbf24';

export default function BiasharaLoginScreen({ onLoginSuccess, onBack, onCreateAccount }) {
  const { colors } = useTheme();
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', isSuccess: false });

  const handleLogin = async () => {
    setMsg({ text: '', isSuccess: false });
    if (!email.trim() || !password) {
      setMsg({ text: 'Please enter your email and password.', isSuccess: false });
      return;
    }
    setLoading(true);
    try {
      const response = await biasharaAuthAPI.login(email.trim(), password);
      if (!response.token || !response.user) {
        throw new Error('Invalid response. Please try again.');
      }
      await SecureStore.setItemAsync('biashara_token', response.token);
      onLoginSuccess(response.user);
    } catch (error) {
      setMsg({ text: error.message || 'Please check your credentials and try again.', isSuccess: false });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setMsg({ text: 'Please enter your email address.', isSuccess: false });
      return;
    }
    setForgotLoading(true);
    setMsg({ text: '', isSuccess: false });
    try {
      await biasharaAuthAPI.forgotPassword(forgotEmail.trim());
      setMsg({ text: 'Reset link sent. Check your inbox.', isSuccess: true });
    } catch (err) {
      setMsg({ text: err.message || 'Failed to send reset email. Try again.', isSuccess: false });
    } finally {
      setForgotLoading(false);
    }
  };

  const s = getStyles(colors);

  // ── Forgot Password ──
  if (mode === 'forgot') {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={s.backBtn} onPress={() => { setMode('login'); setMsg({ text: '', isSuccess: false }); }}>
              <ArrowLeftIcon color={ACCENT} size={16} />
              <Text style={[s.backText, { color: ACCENT }]}>  Back to Sign In</Text>
            </TouchableOpacity>
            <View style={s.brandBlock}>
              <Image source={require('../../../assets/marketplace-logo.png')} style={styles2.marketplaceLogo} resizeMode="contain" />
              <Text style={[s.brandName, { color: colors.text }]}>Reset Password</Text>
              <Text style={s.tagline}>Enter your email for a reset link</Text>
            </View>
            {msg.text ? (
              <View style={[s.msgBox, msg.isSuccess ? s.msgSuccess : s.msgError]}>
                {msg.isSuccess ? <CheckIcon color="#22c55e" size={15} /> : <AlertIcon color="#ef4444" size={15} />}
                <Text style={s.msgText}> {msg.text}</Text>
              </View>
            ) : null}
            <View style={s.form}>
              <Text style={s.label}>Email Address</Text>
              <TextInput style={s.input} placeholder="you@example.com" placeholderTextColor={colors.textMuted}
                value={forgotEmail} onChangeText={setForgotEmail} autoCapitalize="none" keyboardType="email-address" />
              <TouchableOpacity style={[s.button, forgotLoading && s.buttonDisabled]} onPress={handleForgotPassword} disabled={forgotLoading}>
                {forgotLoading ? <ActivityIndicator color="#0f172a" size="small" /> : <Text style={s.buttonText}>Send Reset Link</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Login ──
  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={s.backBtn} onPress={onBack}>
            <ArrowLeftIcon color={ACCENT} size={16} />
            <Text style={[s.backText, { color: ACCENT }]}>  All Portals</Text>
          </TouchableOpacity>

          <View style={s.brandBlock}>
            <Image source={require('../../../assets/marketplace-logo.png')} style={styles2.marketplaceLogo} resizeMode="contain" />
            <Text style={[s.brandName, { color: colors.text }]}>AxxBiashara</Text>
            <Text style={s.tagline}>Business Owner Portal</Text>
            <View style={[s.taglinePill, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '30' }]}>
              <Text style={[s.taglinePillText, { color: ACCENT }]}>Sign in to manage your business</Text>
            </View>
          </View>

          {msg.text ? (
            <View style={[s.msgBox, msg.isSuccess ? s.msgSuccess : s.msgError]}>
              {msg.isSuccess ? <CheckIcon color="#22c55e" size={15} /> : <AlertIcon color="#ef4444" size={15} />}
              <Text style={s.msgText}> {msg.text}</Text>
            </View>
          ) : null}

          <View style={s.form}>
            <Text style={s.label}>Email Address</Text>
            <TextInput style={s.input} placeholder="you@example.com" placeholderTextColor={colors.textMuted}
              value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

            <Text style={s.label}>Password</Text>
            <View style={s.passwordRow}>
              <TextInput style={[s.input, s.passwordInput]} placeholder="Enter your password"
                placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword}
                secureTextEntry={!showPassword} />
              <TouchableOpacity style={s.showToggle} onPress={() => setShowPassword(p => !p)}>
                {showPassword ? <EyeOffIcon color={ACCENT} size={17} /> : <EyeIcon color={ACCENT} size={17} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.forgotLink} onPress={() => { setMode('forgot'); setMsg({ text: '', isSuccess: false }); }}>
              <Text style={[s.forgotText, { color: ACCENT }]}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[s.button, loading && s.buttonDisabled]} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#0f172a" size="small" /> : <Text style={s.buttonText}>Sign In</Text>}
            </TouchableOpacity>
          </View>

          {/* Create account — in-app */}
          <TouchableOpacity
            style={[s.registerNote, { borderColor: ACCENT + '50', backgroundColor: 'rgba(251,191,36,0.07)' }]}
            onPress={onCreateAccount}
            activeOpacity={0.8}
          >
            <Text style={[s.registerNoteText, { color: colors.textMuted }]}>
              Don't have an account yet?{'\n'}
              <Text style={{ color: ACCENT, fontWeight: '800' }}>Create Account →</Text>
            </Text>
          </TouchableOpacity>

          <Text style={[s.footer, { color: colors.textMuted }]}>AxxBiashara — Manage your business anytime, anywhere.</Text>
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
  brandBlock: { alignItems: 'center', marginBottom: Spacing.four },
  logoMark: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.two, shadowColor: ACCENT, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  brandName: { fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  tagline: { fontSize: FontSize.sm, color: '#94a3b8', marginTop: 4, fontWeight: '600', letterSpacing: 0.3 },
  taglinePill: { marginTop: 10, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  taglinePillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  form: {},
  label: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: Spacing.two },
  input: { backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.md, padding: Spacing.three, fontSize: FontSize.md, color: colors.text },
  passwordRow: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 48 },
  showToggle: { position: 'absolute', right: 14 },
  forgotLink: { alignItems: 'flex-end', marginTop: 8, marginBottom: Spacing.two },
  forgotText: { fontSize: 13, fontWeight: '700' },
  button: { backgroundColor: ACCENT, borderRadius: BorderRadius.md, padding: Spacing.three, alignItems: 'center', marginTop: Spacing.two },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#0f172a', fontSize: FontSize.md, fontWeight: '800' },
  msgBox: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, padding: Spacing.two, marginBottom: Spacing.two, borderWidth: 1 },
  msgSuccess: { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)' },
  msgError: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' },
  msgText: { fontSize: FontSize.sm, color: '#f1f5f9', flex: 1 },
  registerNote: { marginTop: Spacing.four, borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.three, alignItems: 'center' },
  registerNoteText: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  footer: { textAlign: 'center', fontSize: FontSize.xs, marginTop: Spacing.four },
});

const styles2 = StyleSheet.create({
  marketplaceLogo: {
    width: 90,
    height: 90,
    borderRadius: 20,
    marginBottom: Spacing.two,
    backgroundColor: '#fff',
  },
});
