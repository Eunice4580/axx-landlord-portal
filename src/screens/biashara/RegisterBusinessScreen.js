import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { biasharaBusinessAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { ArrowLeftIcon, CheckIcon, AlertIcon } from './Icons';

const ACCENT = '#fbbf24';

/* ── Complete categories from Business.js model ─────────────── */
const CATEGORIES = [
  'Furniture', 'Electronics', 'Appliances', 'Tools', 'Clothing',
  'Books', 'Sports & Outdoors', 'Home & Garden', 'Beauty & Personal Care',
  'Toys & Games', 'Construction Materials', 'Vehicles & Parts',
  'Food & Beverage', 'Health & Wellness', 'Education & Training',
  'Professional Services', 'Hospitality & Tourism', 'Agriculture',
  'Manufacturing', 'Retail', 'Technology', 'Fashion & Accessories',
  'Media & Entertainment', 'Real Estate', 'Finance & Insurance', 'Other',
];

const COUNTIES = [
  'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta',
  'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru',
  'Tharaka Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua',
  'Nyeri', 'Kirinyaga', "Murang'a", 'Kiambu', 'Turkana', 'West Pokot',
  'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo Marakwet', 'Nandi',
  'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho', 'Bomet',
  'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya', 'Kisumu', 'Homa Bay',
  'Migori', 'Kisii', 'Nyamira', 'Nairobi City',
];

const PRICE_RANGES    = ['Budget ($)', 'Mid-range ($$)', 'Premium ($$$)', 'Luxury ($$$$)'];
const PRICE_RANGE_MAP = { 'Budget ($)': '$', 'Mid-range ($$)': '$$', 'Premium ($$$)': '$$$', 'Luxury ($$$$)': '$$$$' };
const EMPLOYEE_COUNTS = ['1-10', '11-50', '51-200', '201-500', '500+'];

const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';
const CLOUDINARY_CLOUD = 'YOUR_CLOUD_NAME'; // update with your cloud name

/* ── Sub-components ──────────────────────────────────────────── */
function MsgBanner({ msg }) {
  if (!msg.text) return null;
  const ok = msg.isSuccess;
  return (
    <View style={[s.msgBanner, ok ? s.msgOk : s.msgErr]}>
      {ok ? <CheckIcon color="#22c55e" size={14} /> : <AlertIcon color="#ef4444" size={14} />}
      <Text style={[s.msgText, { color: ok ? '#22c55e' : '#ef4444' }]}> {msg.text}</Text>
    </View>
  );
}

function SectionHeader({ title, colors }) {
  return (
    <View style={[s.sectionHeader, { borderBottomColor: colors.border }]}>
      <Text style={[s.sectionTitle, { color: ACCENT }]}>{title}</Text>
    </View>
  );
}

function InputBox({ colors, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[s.input, {
        color: colors.text,
        backgroundColor: colors.backgroundElement,
        borderColor: focused ? ACCENT : colors.border,
      }, style]}
      placeholderTextColor={colors.textMuted}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    />
  );
}

function Field({ label, colors, required, children }) {
  return (
    <View style={s.field}>
      <Text style={[s.label, { color: colors.textSecondary }]}>
        {label}{required ? <Text style={{ color: '#ef4444' }}> *</Text> : null}
      </Text>
      {children}
    </View>
  );
}

function ChipGrid({ options, selected, onToggle, colors }) {
  return (
    <View style={s.chipGrid}>
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            style={[s.chip, {
              borderColor: active ? ACCENT : colors.border,
              backgroundColor: active ? ACCENT + '20' : 'transparent',
            }]}
            onPress={() => onToggle(opt)}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, { color: active ? ACCENT : colors.textSecondary }]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SingleChips({ options, selected, onSelect, colors }) {
  return (
    <View style={s.chipGrid}>
      {options.map(opt => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[s.chip, {
              borderColor: active ? ACCENT : colors.border,
              backgroundColor: active ? ACCENT + '20' : 'transparent',
            }]}
            onPress={() => onSelect(active ? '' : opt)}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, { color: active ? ACCENT : colors.textSecondary }]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ── Image upload via XHR to Cloudinary ─────────────────────── */
async function uploadToCloudinary(uri, preset = 'biashara_upload') {
  const filename = uri.split('/').pop();
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const mime = mimeMap[ext] || 'image/jpeg';

  const form = new FormData();
  form.append('file', { uri, name: filename, type: mime });
  form.append('upload_preset', preset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`);
    xhr.onload = () => {
      const res = JSON.parse(xhr.responseText);
      if (xhr.status === 200) resolve(res.secure_url);
      else reject(new Error(res.error?.message || 'Upload failed'));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(form);
  });
}

/* ── Main Screen ─────────────────────────────────────────────── */
export default function RegisterBusinessScreen({ user, business, onDone, onBack }) {
  const isEdit = !!business;
  const { colors } = useTheme();
  const [loading, setLoading]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]             = useState({ text: '', isSuccess: false });

  // Basic
  const [name, setName]                     = useState('');
  const [description, setDescription]       = useState('');
  const [categories, setCategories]         = useState([]);
  const [priceRange, setPriceRange]         = useState('');
  const [employeeCount, setEmployeeCount]   = useState('');
  const [yearEstablished, setYearEstablished] = useState('');

  // Location
  const [county, setCounty]   = useState('');
  const [town, setTown]       = useState('');
  const [street, setStreet]   = useState('');
  const [lat, setLat]         = useState('');
  const [lng, setLng]         = useState('');

  // Contact
  const [phone, setPhone]     = useState('');
  const [email, setEmail]     = useState('');
  const [website, setWebsite] = useState('');

  // Social media — full set matching Business.js model
  const [facebook, setFacebook]   = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter]     = useState('');
  const [whatsapp, setWhatsapp]   = useState('');
  const [linkedin, setLinkedin]   = useState('');
  const [tiktok, setTiktok]       = useState('');

  // Media
  const [logo, setLogo]       = useState(null);   // { uri, url? }
  const [photos, setPhotos]   = useState([]);     // [{ uri, url? }]

  // Pre-fill when editing
  useEffect(() => {
    if (!business) return;
    setName(business.name || '');
    setDescription(business.description || '');
    setCategories(business.categories || []);
    setPriceRange(
      Object.keys(PRICE_RANGE_MAP).find(k => PRICE_RANGE_MAP[k] === business.priceRange) || ''
    );
    setEmployeeCount(business.employeeCount || '');
    setYearEstablished(business.yearEstablished ? String(business.yearEstablished) : '');
    setCounty(business.location?.county || '');
    setTown(business.location?.town || '');
    setStreet(business.location?.address || '');
    setLat(business.location?.coordinates?.lat ? String(business.location.coordinates.lat) : '');
    setLng(business.location?.coordinates?.lng ? String(business.location.coordinates.lng) : '');
    setPhone(business.contact?.phone || '');
    setEmail(business.contact?.email || '');
    setWebsite(business.contact?.website || '');
    setFacebook(business.socialMedia?.facebook || '');
    setInstagram(business.socialMedia?.instagram || '');
    setTwitter(business.socialMedia?.twitter || '');
    setWhatsapp(business.socialMedia?.whatsapp || '');
    setLinkedin(business.socialMedia?.linkedin || '');
    setTiktok(business.socialMedia?.tiktok || '');
    if (business.logo) setLogo({ uri: business.logo, url: business.logo });
    if (business.images?.length) setPhotos(business.images.map(u => ({ uri: u, url: u })));
  }, [business]);

  const toggleCategory = (cat) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  /* ── Image picker ───────────────────────────────────────── */
  const pickLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setMsg({ text: 'Camera roll permission needed.', isSuccess: false }); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]) setLogo({ uri: res.assets[0].uri });
  };

  const pickPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setMsg({ text: 'Camera roll permission needed.', isSuccess: false }); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, quality: 0.8, selectionLimit: 6,
    });
    if (!res.canceled && res.assets?.length) {
      setPhotos(prev => [...prev, ...res.assets.map(a => ({ uri: a.uri }))].slice(0, 6));
    }
  };

  const removePhoto = (idx) => setPhotos(prev => prev.filter((_, i) => i !== idx));

  /* ── Submit ─────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!name.trim())          { setMsg({ text: 'Business name is required.', isSuccess: false }); return; }
    if (!description.trim())   { setMsg({ text: 'Description is required.', isSuccess: false }); return; }
    if (categories.length === 0) { setMsg({ text: 'Select at least one category.', isSuccess: false }); return; }
    if (!county)               { setMsg({ text: 'Please select a county.', isSuccess: false }); return; }
    if (!town.trim())          { setMsg({ text: 'Town / area is required.', isSuccess: false }); return; }
    if (!phone.trim())         { setMsg({ text: 'Phone number is required.', isSuccess: false }); return; }

    setLoading(true);
    setMsg({ text: '', isSuccess: false });

    try {
      // Upload logo if new local file
      let logoUrl = logo?.url || null;
      if (logo?.uri && !logo.url) {
        setUploading(true);
        logoUrl = await uploadToCloudinary(logo.uri);
        setUploading(false);
      }

      // Upload new photos
      setUploading(photos.some(p => !p.url));
      const photoUrls = await Promise.all(
        photos.map(p => p.url ? Promise.resolve(p.url) : uploadToCloudinary(p.uri))
      );
      setUploading(false);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        categories,
        submitterName: user?.name || '',
        ...(priceRange && { priceRange: PRICE_RANGE_MAP[priceRange] || priceRange }),
        ...(employeeCount && { employeeCount }),
        ...(yearEstablished && { yearEstablished: parseInt(yearEstablished) }),
        location: {
          county,
          town: town.trim(),
          ...(street.trim() && { address: street.trim() }),
          ...(lat && lng ? { coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) } } : {}),
        },
        contact: {
          phone: phone.trim(),
          ...(email.trim() && { email: email.trim() }),
          ...(website.trim() && { website: website.trim() }),
        },
        ...(facebook || instagram || twitter || whatsapp || linkedin || tiktok ? {
          socialMedia: {
            ...(facebook.trim()  && { facebook:  facebook.trim() }),
            ...(instagram.trim() && { instagram: instagram.trim() }),
            ...(twitter.trim()   && { twitter:   twitter.trim() }),
            ...(whatsapp.trim()  && { whatsapp:  whatsapp.trim() }),
            ...(linkedin.trim()  && { linkedin:  linkedin.trim() }),
            ...(tiktok.trim()    && { tiktok:    tiktok.trim() }),
          },
        } : {}),
        ...(logoUrl && { logo: logoUrl }),
        ...(photoUrls.length > 0 && { images: photoUrls }),
      };

      if (isEdit) {
        await biasharaBusinessAPI.updateMyBusiness(business._id, payload);
        setMsg({ text: 'Business updated successfully.', isSuccess: true });
      } else {
        await biasharaBusinessAPI.createBusiness(payload);
        setMsg({ text: 'Business submitted for review. You will be notified once approved.', isSuccess: true });
      }
      setTimeout(onDone, 2000);
    } catch (err) {
      setUploading(false);
      setMsg({ text: err.message || 'Failed to save business. Please try again.', isSuccess: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <View style={[s.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <ArrowLeftIcon color={ACCENT} size={20} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>{isEdit ? 'Edit Business' : 'Register Business'}</Text>
        <View style={s.backBtn} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <MsgBanner msg={msg} />

          <View style={[s.noticeBanner, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '35' }]}>
            <Text style={[s.noticeText, { color: ACCENT }]}>
              Your listing will be submitted for review and go live once approved by our team.
            </Text>
          </View>

          {/* ── Basic Info ── */}
          <SectionHeader title="BASIC INFORMATION" colors={colors} />

          <Field label="Business Name" colors={colors} required>
            <InputBox colors={colors} placeholder="e.g. Wanjiku Electronics" value={name} onChangeText={setName} />
          </Field>

          <Field label="Description" colors={colors} required>
            <InputBox colors={colors} placeholder="Describe your business, products/services, and unique value..." value={description} onChangeText={setDescription} multiline numberOfLines={4} style={s.textarea} />
          </Field>

          <Field label="Year Established" colors={colors}>
            <InputBox colors={colors} placeholder="e.g. 2018" value={yearEstablished} onChangeText={setYearEstablished} keyboardType="numeric" maxLength={4} />
          </Field>

          {/* ── Categories ── */}
          <SectionHeader title="CATEGORIES" colors={colors} />
          <Text style={[s.hint, { color: colors.textMuted }]}>Select all that apply *</Text>
          <ChipGrid options={CATEGORIES} selected={categories} onToggle={toggleCategory} colors={colors} />

          {/* ── Business Details ── */}
          <SectionHeader title="BUSINESS DETAILS" colors={colors} />

          <Field label="Price Range" colors={colors}>
            <SingleChips options={PRICE_RANGES} selected={priceRange} onSelect={setPriceRange} colors={colors} />
          </Field>

          <Field label="Number of Employees" colors={colors}>
            <SingleChips options={EMPLOYEE_COUNTS} selected={employeeCount} onSelect={setEmployeeCount} colors={colors} />
          </Field>

          {/* ── Location ── */}
          <SectionHeader title="LOCATION" colors={colors} />

          <Field label="County" colors={colors} required>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={s.chipGrid}>
                {COUNTIES.map(c => {
                  const active = county === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[s.chip, { borderColor: active ? ACCENT : colors.border, backgroundColor: active ? ACCENT + '20' : 'transparent' }]}
                      onPress={() => setCounty(c)}
                    >
                      <Text style={[s.chipText, { color: active ? ACCENT : colors.textSecondary }]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </Field>

          <Field label="Town / Area" colors={colors} required>
            <InputBox colors={colors} placeholder="e.g. Westlands" value={town} onChangeText={setTown} />
          </Field>

          <Field label="Street / Building" colors={colors}>
            <InputBox colors={colors} placeholder="e.g. Moi Avenue, 2nd Floor" value={street} onChangeText={setStreet} />
          </Field>

          <Field label="Latitude (GPS)" colors={colors}>
            <InputBox colors={colors} placeholder="e.g. -1.286389" value={lat} onChangeText={setLat} keyboardType="decimal-pad" />
          </Field>

          <Field label="Longitude (GPS)" colors={colors}>
            <InputBox colors={colors} placeholder="e.g. 36.817223" value={lng} onChangeText={setLng} keyboardType="decimal-pad" />
          </Field>

          {/* ── Contact ── */}
          <SectionHeader title="CONTACT INFORMATION" colors={colors} />

          <Field label="Phone Number" colors={colors} required>
            <InputBox colors={colors} placeholder="+254 7XX XXX XXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </Field>

          <Field label="Email" colors={colors}>
            <InputBox colors={colors} placeholder="business@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </Field>

          <Field label="Website" colors={colors}>
            <InputBox colors={colors} placeholder="https://yourwebsite.com" value={website} onChangeText={setWebsite} autoCapitalize="none" keyboardType="url" />
          </Field>

          {/* ── Social Media ── */}
          <SectionHeader title="SOCIAL MEDIA (Optional)" colors={colors} />

          <Field label="Facebook" colors={colors}>
            <InputBox colors={colors} placeholder="Facebook page URL or @handle" value={facebook} onChangeText={setFacebook} autoCapitalize="none" />
          </Field>
          <Field label="Instagram" colors={colors}>
            <InputBox colors={colors} placeholder="@mybusiness" value={instagram} onChangeText={setInstagram} autoCapitalize="none" />
          </Field>
          <Field label="WhatsApp" colors={colors}>
            <InputBox colors={colors} placeholder="+254 7XX XXX XXX" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
          </Field>
          <Field label="X / Twitter" colors={colors}>
            <InputBox colors={colors} placeholder="@handle" value={twitter} onChangeText={setTwitter} autoCapitalize="none" />
          </Field>
          <Field label="LinkedIn" colors={colors}>
            <InputBox colors={colors} placeholder="linkedin.com/company/..." value={linkedin} onChangeText={setLinkedin} autoCapitalize="none" />
          </Field>
          <Field label="TikTok" colors={colors}>
            <InputBox colors={colors} placeholder="@tiktokhandle" value={tiktok} onChangeText={setTiktok} autoCapitalize="none" />
          </Field>

          {/* ── Logo ── */}
          <SectionHeader title="BUSINESS LOGO" colors={colors} />
          <TouchableOpacity style={[s.mediaPickerBtn, { borderColor: ACCENT + '50', backgroundColor: ACCENT + '08' }]} onPress={pickLogo} activeOpacity={0.8}>
            {logo ? (
              <Image source={{ uri: logo.uri }} style={s.logoPreview} />
            ) : (
              <Text style={[s.mediaPickerText, { color: ACCENT }]}>Tap to upload logo</Text>
            )}
          </TouchableOpacity>
          {logo && (
            <TouchableOpacity onPress={() => setLogo(null)} style={{ alignSelf: 'center', marginTop: 6 }}>
              <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>Remove logo</Text>
            </TouchableOpacity>
          )}

          {/* ── Business Photos ── */}
          <SectionHeader title="BUSINESS PHOTOS (Up to 6)" colors={colors} />
          <View style={s.photosGrid}>
            {photos.map((p, i) => (
              <View key={i} style={s.photoThumbWrap}>
                <Image source={{ uri: p.uri }} style={s.photoThumb} />
                <TouchableOpacity style={s.photoRemoveBtn} onPress={() => removePhoto(i)}>
                  <Text style={s.photoRemoveText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 6 && (
              <TouchableOpacity style={[s.photoAddBtn, { borderColor: ACCENT + '50', backgroundColor: ACCENT + '08' }]} onPress={pickPhotos} activeOpacity={0.8}>
                <Text style={[s.photoAddText, { color: ACCENT }]}>+ Add Photos</Text>
              </TouchableOpacity>
            )}
          </View>

          {uploading && (
            <View style={s.uploadingRow}>
              <ActivityIndicator color={ACCENT} size="small" />
              <Text style={[s.uploadingText, { color: colors.textMuted }]}>Uploading images...</Text>
            </View>
          )}

          <MsgBanner msg={msg} />

          <TouchableOpacity
            style={[s.submitBtn, (loading || uploading) && s.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading || uploading}
          >
            {loading
              ? <ActivityIndicator color="#0f172a" size="small" />
              : <Text style={s.submitText}>{isEdit ? 'Save Changes' : 'Submit for Review'}</Text>
            }
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingVertical: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 32 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '900' },
  content: { padding: Spacing.three },

  noticeBanner: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 16 },
  noticeText: { fontSize: FontSize.sm, fontWeight: '600', lineHeight: 18 },

  sectionHeader: { borderBottomWidth: 1, paddingBottom: 8, marginTop: Spacing.three, marginBottom: Spacing.two },
  sectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },

  field: { marginBottom: Spacing.two },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7 },
  hint: { fontSize: 11, marginBottom: 8, marginTop: -4 },
  input: { borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: FontSize.base },
  textarea: { minHeight: 100, paddingTop: 12, textAlignVertical: 'top' },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12, fontWeight: '600' },

  // Logo
  mediaPickerBtn: {
    height: 120, borderWidth: 2, borderStyle: 'dashed', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  logoPreview: { width: 100, height: 100, borderRadius: 10, resizeMode: 'cover' },
  mediaPickerText: { fontSize: 14, fontWeight: '700' },

  // Photos
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  photoThumbWrap: { position: 'relative' },
  photoThumb: { width: 90, height: 90, borderRadius: 10, resizeMode: 'cover' },
  photoRemoveBtn: {
    position: 'absolute', top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveText: { color: '#fff', fontSize: 14, fontWeight: '900', lineHeight: 20 },
  photoAddBtn: {
    width: 90, height: 90, borderWidth: 2, borderStyle: 'dashed',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  photoAddText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },

  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
  uploadingText: { fontSize: 13 },

  msgBanner: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10,
    padding: 12, marginBottom: 14,
  },
  msgOk: { backgroundColor: '#22c55e12', borderColor: '#22c55e35' },
  msgErr: { backgroundColor: '#ef444412', borderColor: '#ef444435' },
  msgText: { fontSize: FontSize.sm, fontWeight: '600', flex: 1 },

  submitBtn: {
    backgroundColor: ACCENT, borderRadius: BorderRadius.lg,
    paddingVertical: 16, alignItems: 'center', marginTop: Spacing.three,
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#0f172a', fontSize: FontSize.md, fontWeight: '900', letterSpacing: 0.3 },
});
