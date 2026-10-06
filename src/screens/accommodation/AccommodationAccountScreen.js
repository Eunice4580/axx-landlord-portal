import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Alert, KeyboardAvoidingView,
  Platform, Linking, Image, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import {
  UserIcon, LogoutIcon, CheckIcon, AlertIcon, EyeIcon, EyeOffIcon,
  HomeIcon, EditIcon, SunIcon, MoonIcon, ChevronRightIcon, ArrowLeftIcon,
  CameraIcon,
} from './AccomIcons';

const ACCENT = '#10b981';
const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

function MsgBanner({ msg }) {
  if (!msg?.text) return null;
  return (
    <View style={[styles.msgBox, msg.ok ? styles.msgOk : styles.msgErr]}>
      {msg.ok ? <CheckIcon color="#22c55e" size={14} /> : <AlertIcon color="#ef4444" size={14} />}
      <Text style={[styles.msgText, { color: msg.ok ? '#22c55e' : '#ef4444' }]}> {msg.text}</Text>
    </View>
  );
}

function SectionCard({ title, children, colors }) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      {title ? <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text> : null}
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

/* ── Change Password View ─────────────────────────────────────────── */
function ChangePasswordView({ colors, onDone }) {
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' });
  const [show, setShow] = useState({ current: false, newPw: false });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: false });

  const handleSave = async () => {
    setMsg({ text: '', ok: false });
    if (!form.current || !form.newPw || !form.confirm) {
      setMsg({ text: 'All password fields are required.', ok: false });
      return;
    }
    if (form.newPw !== form.confirm) {
      setMsg({ text: 'New passwords do not match.', ok: false });
      return;
    }
    if (form.newPw.length < 6) {
      setMsg({ text: 'Password must be at least 6 characters.', ok: false });
      return;
    }
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('accom_token');
      const res = await fetch(`${API_BASE}/profile/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || `Failed (${res.status})`);
      setMsg({ text: 'Password changed successfully.', ok: true });
      setTimeout(onDone, 1200);
    } catch (err) {
      setMsg({ text: err.message || 'Failed. Check your current password.', ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.formCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      <Text style={[styles.formCardTitle, { color: colors.text }]}>Change Password</Text>
      <MsgBanner msg={msg} />

      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CURRENT PASSWORD</Text>
      <View style={styles.pwRow}>
        <TextInput
          style={[styles.input, styles.pwInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          placeholder="Current password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!show.current}
          value={form.current}
          onChangeText={v => setForm(p => ({ ...p, current: v }))}
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShow(p => ({ ...p, current: !p.current }))}>
          {show.current ? <EyeOffIcon color={ACCENT} size={16} /> : <EyeIcon color={ACCENT} size={16} />}
        </TouchableOpacity>
      </View>

      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>NEW PASSWORD</Text>
      <View style={styles.pwRow}>
        <TextInput
          style={[styles.input, styles.pwInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          placeholder="New password (min. 6 characters)"
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!show.newPw}
          value={form.newPw}
          onChangeText={v => setForm(p => ({ ...p, newPw: v }))}
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShow(p => ({ ...p, newPw: !p.newPw }))}>
          {show.newPw ? <EyeOffIcon color={ACCENT} size={16} /> : <EyeIcon color={ACCENT} size={16} />}
        </TouchableOpacity>
      </View>

      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CONFIRM NEW PASSWORD</Text>
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
        placeholder="Repeat new password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={form.confirm}
        onChangeText={v => setForm(p => ({ ...p, confirm: v }))}
      />

      <View style={styles.formBtns}>
        <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onDone}>
          <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveBtn, loading && styles.saveBtnDisabled]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save Password</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Edit Profile View (With Profile Picture Upload) ──────────────── */
function EditProfileView({ user, colors, onDone, onProfileSaved }) {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [county, setCounty] = useState(user?.county || '');
  const [avatarUri, setAvatarUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: false });

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to update your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    setMsg({ text: '', ok: false });
    if (!name.trim()) { setMsg({ text: 'Full name cannot be empty.', ok: false }); return; }
    setLoading(true);

    SecureStore.getItemAsync('accom_token').then(token => {
      if (!token) throw new Error('No authentication token found. Please log in again.');

      const fd = new FormData();
      fd.append('name', name.trim());
      if (phone.trim()) fd.append('phone', phone.trim());
      if (county.trim()) fd.append('county', county.trim());

      if (avatarUri) {
        const ext = avatarUri.split('.').pop() || 'jpg';
        fd.append('avatar', {
          uri: avatarUri,
          name: `profile_${Date.now()}.${ext}`,
          type: 'image/jpeg',
        });
      }

      const xhr = new XMLHttpRequest();
      xhr.open('PATCH', `${API_BASE}/profile`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.timeout = 40000;

      xhr.onload = () => {
        setLoading(false);
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            setMsg({ text: 'Profile & picture updated successfully!', ok: true });
            const serverUser = res.data?.user || res.user || {};
            const savedAvatar = serverUser.profileImage || avatarUri;

            onProfileSaved?.(
              {
                name: name.trim(),
                phone: phone.trim(),
                county: county.trim(),
                profileImage: savedAvatar,
                avatar: savedAvatar,
              },
              savedAvatar
            );
            setTimeout(onDone, 1200);
          } else {
            setMsg({ text: res.error || res.message || `Failed to update (${xhr.status}).`, ok: false });
          }
        } catch {
          setMsg({ text: 'Unexpected server response.', ok: false });
        }
      };

      xhr.onerror = () => {
        setLoading(false);
        setMsg({ text: 'Network connection error. Please try again.', ok: false });
      };

      xhr.ontimeout = () => {
        setLoading(false);
        setMsg({ text: 'Request timed out uploading profile photo.', ok: false });
      };

      xhr.send(fd);
    }).catch(err => {
      setLoading(false);
      setMsg({ text: err.message || 'Failed to save profile.', ok: false });
    });
  };

  const currentDisplay = avatarUri || user?.profileImage || user?.avatar;

  return (
    <View style={[styles.formCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      <Text style={[styles.formCardTitle, { color: colors.text }]}>Edit Host Profile</Text>
      <MsgBanner msg={msg} />

      {/* Avatar picker */}
      <View style={styles.avatarPickerWrap}>
        <TouchableOpacity style={styles.avatarPickerRow} onPress={pickAvatar} activeOpacity={0.8}>
          {currentDisplay ? (
            <Image source={{ uri: currentDisplay }} style={styles.avatarPreview} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: ACCENT }]}>
              <Text style={styles.avatarInitialLg}>{(user?.name || 'H').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={[styles.avatarEditBadge, { backgroundColor: ACCENT }]}>
            <CameraIcon color="#fff" size={14} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.avatarPickerHint, { color: colors.textMuted }]}>
          Tap photo to change profile picture{'\n'}
          <Text style={{ fontSize: 11, color: ACCENT }}>Syncs across AxxSpaces website and apps</Text>
        </Text>
      </View>

      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FULL NAME *</Text>
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
        placeholder="Your full name"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PHONE NUMBER</Text>
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
        placeholder="+254 7XX XXX XXX"
        placeholderTextColor={colors.textMuted}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>COUNTY / LOCATION</Text>
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
        placeholder="e.g. Mombasa, Nairobi, Kilifi"
        placeholderTextColor={colors.textMuted}
        value={county}
        onChangeText={setCounty}
      />

      <View style={[styles.readonlyRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[styles.readonlyLabel, { color: colors.textMuted }]}>EMAIL ADDRESS</Text>
        <Text style={[styles.readonlyValue, { color: colors.textSecondary }]}>{user?.email || '—'}</Text>
      </View>

      <View style={styles.formBtns}>
        <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onDone}>
          <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveBtn, loading && styles.saveBtnDisabled]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save Profile</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Main Account Screen ─────────────────────────────────────────── */
export default function AccommodationAccountScreen({ user, onLogout, onProfileUpdated }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const [view, setView] = useState('main'); // 'main' | 'editProfile' | 'changePassword'
  const [localUser, setLocalUser] = useState(user);

  useEffect(() => {
    if (user) setLocalUser(user);
  }, [user]);

  const handleProfileSaved = (updatedFields, avatarUri) => {
    setLocalUser(prev => ({
      ...prev,
      ...updatedFields,
      ...(avatarUri ? { profileImage: avatarUri, avatar: avatarUri } : {}),
    }));
    onProfileUpdated?.(updatedFields, avatarUri);
  };

  const displayName = localUser?.name || 'Accommodation Host';
  const email = localUser?.email || '';
  const avatarUrl = localUser?.profileImage || localUser?.avatar;

  const confirmLogout = () =>
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: onLogout },
    ]);

  const back = () => setView('main');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        {view !== 'main' ? (
          <TouchableOpacity onPress={back} style={styles.headerBack}>
            <ArrowLeftIcon color={ACCENT} size={18} />
          </TouchableOpacity>
        ) : <View style={styles.headerBack} />}
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {view === 'main' ? 'Host Account' : view === 'editProfile' ? 'Edit Profile' : 'Change Password'}
        </Text>
        <View style={styles.headerBack} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.three, gap: 14 }}>
          {/* Sub-views */}
          {view === 'editProfile' && (
            <EditProfileView
              user={localUser || user}
              colors={colors}
              onDone={back}
              onProfileSaved={handleProfileSaved}
            />
          )}

          {view === 'changePassword' && (
            <ChangePasswordView
              colors={colors}
              onDone={back}
            />
          )}

          {/* Main View */}
          {view === 'main' && (
            <>
              {/* Profile Card with Avatar & Edit button */}
              <View style={[styles.profileCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <TouchableOpacity onPress={() => setView('editProfile')} style={styles.avatarWrap} activeOpacity={0.8}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={[styles.avatarInitialWrap, { backgroundColor: ACCENT }]}>
                      <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={[styles.avatarEditIconWrap, { backgroundColor: ACCENT }]}>
                    <CameraIcon color="#fff" size={12} />
                  </View>
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
                  <Text style={[styles.profileRole, { color: ACCENT }]}>Accommodation Provider</Text>
                  <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{email}</Text>
                </View>

                <TouchableOpacity style={[styles.editPencilBtn, { backgroundColor: ACCENT + '15', borderColor: ACCENT + '30' }]} onPress={() => setView('editProfile')}>
                  <EditIcon color={ACCENT} size={16} />
                </TouchableOpacity>
              </View>

              {/* Profile Details summary - Host Details before Appearance */}
              <SectionCard title="Host Details" colors={colors}>
                <InfoRow label="Full Name" value={localUser?.name} colors={colors} />
                <InfoRow label="Email" value={localUser?.email} colors={colors} />
                <InfoRow label="Phone" value={localUser?.phone} colors={colors} />
                <InfoRow label="County" value={localUser?.county} colors={colors} />
                <InfoRow label="Account Role" value={localUser?.role === 'host' ? 'Accommodation Host' : localUser?.role} colors={colors} />
              </SectionCard>

              {/* APPEARANCE / MODE CHANGE */}
              <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>APPEARANCE</Text>
              <View style={[styles.menuCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <View style={styles.menuRow}>
                  <View style={[styles.menuIcon, { backgroundColor: ACCENT + '15' }]}>
                    {isDark ? <MoonIcon color={ACCENT} size={18} /> : <SunIcon color={ACCENT} size={18} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
                    <Text style={[styles.menuSub, { color: colors.textMuted }]}>Toggle app appearance</Text>
                  </View>
                  <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: '#94a3b8', true: ACCENT + '60' }}
                    thumbColor={isDark ? ACCENT : '#f1f5f9'}
                  />
                </View>
              </View>

              {/* PROFILE & SECURITY */}
              <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>ACCOUNT SETTINGS</Text>
              <View style={[styles.menuCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]} onPress={() => setView('editProfile')}>
                  <View style={[styles.menuIcon, { backgroundColor: ACCENT + '15' }]}>
                    <UserIcon color={ACCENT} size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>Edit Profile & Photo</Text>
                    <Text style={[styles.menuSub, { color: colors.textMuted }]}>Update your name, phone, and profile photo</Text>
                  </View>
                  <ChevronRightIcon color={colors.textMuted} size={16} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuRow} onPress={() => setView('changePassword')}>
                  <View style={[styles.menuIcon, { backgroundColor: ACCENT + '15' }]}>
                    <EyeOffIcon color={ACCENT} size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>Change Password</Text>
                    <Text style={[styles.menuSub, { color: colors.textMuted }]}>Update your account login password</Text>
                  </View>
                  <ChevronRightIcon color={colors.textMuted} size={16} />
                </TouchableOpacity>
              </View>

              {/* Website Property Portal */}
              <View style={[styles.noteCard, { backgroundColor: ACCENT + '10', borderColor: ACCENT + '30' }]}>
                <HomeIcon color={ACCENT} size={18} />
                <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                  {' '}Properties listed in the app automatically sync with{' '}
                  <Text
                    style={{ color: ACCENT, fontWeight: '700' }}
                    onPress={() => Linking.openURL('https://axxspace.com/accommodation')}
                  >
                    axxspace.com/accommodation
                  </Text>
                </Text>
              </View>

              {/* Sign Out */}
              <TouchableOpacity style={[styles.logoutBtn, { borderColor: '#ef444430', backgroundColor: '#ef444410' }]} onPress={confirmLogout}>
                <LogoutIcon color="#ef4444" size={18} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerBack: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.md, fontWeight: '800' },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: BorderRadius.xl, padding: Spacing.three, gap: 14,
  },
  avatarWrap: { position: 'relative' },
  avatarImage: { width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderColor: ACCENT },
  avatarInitialWrap: { width: 62, height: 62, borderRadius: 31, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 24, fontWeight: '900' },
  avatarEditIconWrap: {
    position: 'absolute', bottom: -2, right: -2, width: 22, height: 22,
    borderRadius: 11, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  profileName: { fontSize: FontSize.lg, fontWeight: '800', letterSpacing: -0.2 },
  profileRole: { fontSize: FontSize.xs, fontWeight: '800', marginTop: 2 },
  profileEmail: { fontSize: FontSize.xs, marginTop: 2 },
  editPencilBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  sectionHeading: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 6 },
  menuCard: { borderWidth: 1, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.three, gap: 12 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: FontSize.sm, fontWeight: '700' },
  menuSub: { fontSize: 11, marginTop: 2 },
  sectionCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.three },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.two },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  infoLabel: { fontSize: FontSize.sm, fontWeight: '600' },
  infoValue: { fontSize: FontSize.sm, fontWeight: '700' },
  noteCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.three, gap: 10 },
  noteText: { fontSize: FontSize.xs, flex: 1, lineHeight: 18 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.three, gap: 8, marginTop: 6,
  },
  logoutText: { color: '#ef4444', fontSize: FontSize.md, fontWeight: '800' },

  /* Form & Edit styles */
  formCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.three },
  formCardTitle: { fontSize: FontSize.base, fontWeight: '800', marginBottom: Spacing.two },
  avatarPickerWrap: { alignItems: 'center', marginVertical: Spacing.two },
  avatarPickerRow: { position: 'relative', alignItems: 'center' },
  avatarPreview: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: ACCENT },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  avatarInitialLg: { color: '#fff', fontSize: 36, fontWeight: '900' },
  avatarEditBadge: {
    position: 'absolute', bottom: 2, right: 2, width: 28, height: 28,
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarPickerHint: { fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 16 },
  inputLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginTop: Spacing.two, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.three, fontSize: FontSize.md },
  pwRow: { position: 'relative', justifyContent: 'center' },
  pwInput: { paddingRight: 44 },
  eyeBtn: { position: 'absolute', right: 12 },
  readonlyRow: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.three, marginTop: Spacing.two },
  readonlyLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  readonlyValue: { fontSize: FontSize.sm, fontWeight: '700' },
  formBtns: { flexDirection: 'row', gap: 10, marginTop: Spacing.four },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.md, padding: 13, alignItems: 'center' },
  cancelBtnText: { fontSize: FontSize.sm, fontWeight: '700' },
  saveBtn: { flex: 1.5, backgroundColor: ACCENT, borderRadius: BorderRadius.md, padding: 13, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '800' },
  msgBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.two, marginBottom: Spacing.two },
  msgOk: { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)' },
  msgErr: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' },
  msgText: { fontSize: FontSize.xs, flex: 1 },
});
