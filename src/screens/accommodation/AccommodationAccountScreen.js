import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { UserIcon, LogoutIcon, CheckIcon, AlertIcon, EyeIcon, EyeOffIcon, HomeIcon } from './AccomIcons';

const ACCENT = '#10b981';
const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

async function apiCall(path, options = {}) {
  const token = await SecureStore.getItemAsync('accom_token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function MsgBanner({ msg }) {
  if (!msg.text) return null;
  return (
    <View style={[styles.msgBox, msg.ok ? styles.msgOk : styles.msgErr]}>
      {msg.ok ? <CheckIcon color="#22c55e" size={14} /> : <AlertIcon color="#ef4444" size={14} />}
      <Text style={styles.msgText}> {msg.text}</Text>
    </View>
  );
}

function SectionCard({ title, children, colors }) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value, colors }) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value || '—'}</Text>
    </View>
  );
}

function ChangePasswordSection({ colors, onDone }) {
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' });
  const [show, setShow] = useState({ current: false, newPw: false });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: false });

  const handleSave = async () => {
    setMsg({ text: '', ok: false });
    if (!form.current || !form.newPw || !form.confirm) {
      setMsg({ text: 'All fields are required.', ok: false }); return;
    }
    if (form.newPw !== form.confirm) {
      setMsg({ text: 'New passwords do not match.', ok: false }); return;
    }
    if (form.newPw.length < 8) {
      setMsg({ text: 'Password must be at least 8 characters.', ok: false }); return;
    }
    setLoading(true);
    try {
      await apiCall('/profile/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.newPw }),
      });
      setMsg({ text: 'Password changed successfully.', ok: true });
      setForm({ current: '', newPw: '', confirm: '' });
      setTimeout(onDone, 1500);
    } catch (err) {
      setMsg({ text: err.message || 'Failed to change password.', ok: false });
    } finally {
      setLoading(false);
    }
  };

  const inp = (val, setter, ph, extra = {}) => (
    <TextInput
      style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
      placeholderTextColor={colors.textMuted}
      value={val} onChangeText={setter} placeholder={ph} {...extra}
    />
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <MsgBanner msg={msg} />
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Current Password</Text>
      <View style={styles.pwRow}>
        {inp(form.current, v => setForm(p => ({ ...p, current: v })), 'Current password', { secureTextEntry: !show.current, style: [styles.input, styles.pwInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }] })}
        <TouchableOpacity style={styles.pwToggle} onPress={() => setShow(p => ({ ...p, current: !p.current }))}>
          {show.current ? <EyeOffIcon color={ACCENT} size={17} /> : <EyeIcon color={ACCENT} size={17} />}
        </TouchableOpacity>
      </View>
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>New Password</Text>
      <View style={styles.pwRow}>
        {inp(form.newPw, v => setForm(p => ({ ...p, newPw: v })), 'New password (min 8 chars)', { secureTextEntry: !show.newPw, style: [styles.input, styles.pwInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }] })}
        <TouchableOpacity style={styles.pwToggle} onPress={() => setShow(p => ({ ...p, newPw: !p.newPw }))}>
          {show.newPw ? <EyeOffIcon color={ACCENT} size={17} /> : <EyeIcon color={ACCENT} size={17} />}
        </TouchableOpacity>
      </View>
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Confirm New Password</Text>
      {inp(form.confirm, v => setForm(p => ({ ...p, confirm: v })), 'Re-enter new password', { secureTextEntry: true })}
      <View style={styles.formBtns}>
        <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onDone}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveBtn, loading && styles.saveBtnDisabled]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function AccommodationAccountScreen({ user, onLogout }) {
  const { colors } = useTheme();
  const [view, setView] = useState('main');

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: onLogout },
    ]);
  };

  if (view === 'password') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <TouchableOpacity onPress={() => setView('main')} style={styles.backBtn}>
            <Text style={[styles.backText, { color: ACCENT }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Change Password</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: Spacing.three }}>
          <ChangePasswordSection colors={colors} onDone={() => setView('main')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Account</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.three, gap: 16 }}>
        {/* Avatar + name */}
        <View style={[styles.avatarBlock, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: ACCENT }]}>
            <Text style={styles.avatarInitial}>{(user?.name || 'H').charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={[styles.avatarName, { color: colors.text }]}>{user?.name || 'Host'}</Text>
            <Text style={[styles.avatarRole, { color: ACCENT }]}>Accommodation Host</Text>
          </View>
        </View>

        {/* Profile info */}
        <SectionCard title="Profile" colors={colors}>
          <InfoRow label="Name" value={user?.name} colors={colors} />
          <InfoRow label="Email" value={user?.email} colors={colors} />
          <InfoRow label="Phone" value={user?.phone} colors={colors} />
        </SectionCard>

        {/* Security */}
        <SectionCard title="Security" colors={colors}>
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomColor: colors.border }]}
            onPress={() => setView('password')}
          >
            <View style={[styles.menuIcon, { backgroundColor: ACCENT + '15' }]}>
              <UserIcon color={ACCENT} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Change Password</Text>
              <Text style={[styles.menuSub, { color: colors.textMuted }]}>Update your login password</Text>
            </View>
          </TouchableOpacity>
        </SectionCard>

        {/* Register on website */}
        <View style={[styles.noteCard, { backgroundColor: ACCENT + '10', borderColor: ACCENT + '30' }]}>
          <HomeIcon color={ACCENT} size={16} />
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            {' '}To register or edit a property, visit{' '}
            <Text style={{ color: ACCENT, fontWeight: '700' }}>axxspace.com/accommodation</Text>
          </Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: '#ef444430', backgroundColor: '#ef444410' }]} onPress={confirmLogout}>
          <LogoutIcon color="#ef4444" size={18} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '900' },
  backBtn: { padding: 4 },
  backText: { fontSize: FontSize.sm, fontWeight: '700' },
  avatarBlock: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.three },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 22, fontWeight: '900' },
  avatarName: { fontSize: FontSize.lg, fontWeight: '800' },
  avatarRole: { fontSize: FontSize.sm, fontWeight: '600', marginTop: 2 },
  sectionCard: { borderWidth: 1, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.three, paddingVertical: 12, borderBottomWidth: 1 },
  infoLabel: { fontSize: FontSize.sm, fontWeight: '600' },
  infoValue: { fontSize: FontSize.sm, fontWeight: '500' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.three, borderBottomWidth: 1, gap: 12 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: FontSize.base, fontWeight: '700' },
  menuSub: { fontSize: FontSize.sm, marginTop: 2 },
  noteCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.three },
  noteText: { fontSize: FontSize.sm, flex: 1, lineHeight: 20 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.three, gap: 10 },
  logoutText: { color: '#ef4444', fontSize: FontSize.base, fontWeight: '800' },
  input: { backgroundColor: 'transparent', borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.three, fontSize: FontSize.md, marginBottom: Spacing.two },
  inputLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  pwRow: { position: 'relative', justifyContent: 'center', marginBottom: Spacing.two },
  pwInput: { paddingRight: 48, marginBottom: 0 },
  pwToggle: { position: 'absolute', right: 14 },
  formBtns: { flexDirection: 'row', gap: 10, marginTop: Spacing.two },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.three, alignItems: 'center' },
  cancelText: { fontWeight: '700', fontSize: FontSize.base },
  saveBtn: { flex: 1, backgroundColor: ACCENT, borderRadius: BorderRadius.md, padding: Spacing.three, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: FontSize.base },
  msgBox: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, padding: Spacing.two, marginBottom: Spacing.two, borderWidth: 1 },
  msgOk: { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)' },
  msgErr: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' },
  msgText: { fontSize: FontSize.sm, color: '#f1f5f9', flex: 1 },
});
