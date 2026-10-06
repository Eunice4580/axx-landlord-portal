import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { EyeIcon, EyeOffIcon } from './AgentIcons';

/* ── Exact colors from AgentLogin.jsx on the website ─────────────── */
const C = {
  bgGradientStart: '#fef9c3',
  bgGradientEnd:   '#fde68a',
  white:           '#ffffff',
  logoAccent:      '#fbbf24',
  logoWord:        '#1f2937',
  title:           '#1f2937',
  subtitle:        '#6b7280',
  label:           '#374151',
  inputBorder:     '#e5e7eb',
  inputFocusBorder:'#fbbf24',
  btnBg:           '#fbbf24',
  btnText:         '#1f2937',
  errorBg:         '#fee2e2',
  errorText:       '#dc2626',
  linkText:        '#fbbf24',
  linkGray:        '#6b7280',
};

const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

export default function AgentLoginScreen({ onLoginSuccess, onBack, onCreateAccount }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused]   = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please fill in all fields');
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
        throw new Error('This login is for agents only. Please use the appropriate login page.');
      }
      await SecureStore.setItemAsync('agent_token', data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.name === 'AbortError'
        ? 'Request timed out. The server may be waking up — please try again.'
        : err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Yellow gradient background — exact match to website */
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* White card — matches website container */}
            <View style={styles.container}>

              {/* Logo — AXX in yellow, SPACE in dark */}
              <View style={styles.logo}>
                <Text style={styles.logoAccent}>AXX</Text>
                <Text style={styles.logoWord}>SPACE</Text>
              </View>

              <Text style={styles.title}>Agent Login</Text>
              <Text style={styles.subtitle}>Access your agent dashboard</Text>

              {/* Error banner */}
              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Email field */}
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, emailFocused && styles.inputFocused]}
                  placeholder="your@email.com"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  editable={!loading}
                />
              </View>

              {/* Password field */}
              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.pwWrap}>
                  <TextInput
                    style={[styles.input, styles.pwInput, passFocused && styles.inputFocused]}
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPw}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPw(v => !v)}
                    activeOpacity={0.7}
                  >
                    {showPw
                      ? <EyeOffIcon color="#9ca3af" size={18} />
                      : <EyeIcon color="#9ca3af" size={18} />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color={C.btnText} />
                  : <Text style={styles.buttonText}>Log In</Text>
                }
              </TouchableOpacity>

              {/* Back link */}
              <View style={styles.link}>
                <TouchableOpacity onPress={onBack}>
                  <Text style={styles.linkText}>← Back to Portal Selector</Text>
                </TouchableOpacity>
              </View>

              {/* Create account */}
              <View style={styles.link}>
                <Text style={styles.linkGray}>Don't have an account? </Text>
                <TouchableOpacity onPress={onCreateAccount}>
                  <Text style={styles.linkText}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Yellow gradient — matches website: linear-gradient(135deg, #fef9c3 0%, #fde68a 100%) */
  root: {
    flex: 1,
    backgroundColor: C.bgGradientEnd,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },

  /* White rounded card — matches website container */
  container: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 8,
  },

  /* Logo */
  logo: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoAccent: {
    fontSize: 28,
    fontWeight: '800',
    color: C.logoAccent,
  },
  logoWord: {
    fontSize: 28,
    fontWeight: '800',
    color: C.logoWord,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: C.title,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: C.subtitle,
    textAlign: 'center',
    marginBottom: 32,
  },

  /* Error */
  errorBox: {
    backgroundColor: C.errorBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: C.errorText,
    fontSize: 13,
  },

  /* Form fields */
  field: { marginBottom: 20 },
  label: {
    display: 'flex',
    fontSize: 13,
    fontWeight: '700',
    color: C.label,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 2,
    borderColor: C.inputBorder,
    borderRadius: 10,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: C.white,
  },
  inputFocused: {
    borderColor: C.inputFocusBorder,
  },

  /* Password wrapper with eye toggle */
  pwWrap: {
    position: 'relative',
  },
  pwInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },


  /* Button */
  button: {
    backgroundColor: C.btnBg,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: C.btnText,
    fontSize: 16,
    fontWeight: '800',
  },

  /* Links */
  link: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: C.linkText,
    fontSize: 13,
    fontWeight: '600',
  },
  linkGray: {
    color: C.linkGray,
    fontSize: 13,
  },
});
