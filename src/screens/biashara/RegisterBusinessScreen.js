import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { biasharaBusinessAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { ArrowLeftIcon, CheckIcon, AlertIcon } from './Icons';

const ACCENT = '#fbbf24';

const CATEGORIES = [
  'Furniture', 'Electronics', 'Appliances', 'Tools', 'Clothing',
  'Books', 'Sports & Outdoors', 'Home & Garden', 'Beauty & Personal Care',
  'Toys & Games', 'Construction Materials', 'Vehicles & Parts', 'Other',
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

const PRICE_RANGES = ['Budget', 'Mid-range', 'Premium', 'Luxury'];
const EMPLOYEE_COUNTS = ['1-5', '6-20', '21-50', '51-200', '200+'];

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

function Label({ text, colors, required }) {
  return (
    <Text style={[s.label, { color: colors.textSecondary }]}>
      {text}{required ? <Text style={{ color: '#ef4444' }}> *</Text> : null}
    </Text>
  );
}

function Field({ label, colors, required, children }) {
  return (
    <View style={s.field}>
      <Label text={label} colors={colors} required={required} />
      {children}
    </View>
  );
}

function InputBox({ colors, style, ...props }) {
  return (
    <TextInput
      style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement }, style]}
      placeholderTextColor={colors.textMuted}
      {...props}
    />
  );
}

function ChipSelector({ options, selected, onToggle, accent, colors }) {
  return (
    <View style={s.chipWrap}>
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            style={[s.chip, { borderColor: active ? accent : colors.border, backgroundColor: active ? accent + '20' : 'transparent' }]}
            onPress={() => onToggle(opt)}
          >
            <Text style={[s.chipText, { color: active ? accent : colors.textSecondary }]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SingleSelect({ options, selected, onSelect, accent, colors }) {
  return (
    <View style={s.chipWrap}>
      {options.map(opt => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[s.chip, { borderColor: active ? accent : colors.border, backgroundColor: active ? accent + '20' : 'transparent' }]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[s.chipText, { color: active ? accent : colors.textSecondary }]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SectionHeader({ title, colors }) {
  return (
    <View style={[s.sectionHeader, { borderBottomColor: ACCENT + '30' }]}>
      <Text style={[s.sectionTitle, { color: ACCENT }]}>{title}</Text>
    </View>
  );
}

/* ── Main Screen ─────────────────────────────────────────────── */
export default function RegisterBusinessScreen({ user, onDone, onBack }) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', isSuccess: false });

  // Core fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [priceRange, setPriceRange] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [yearEstablished, setYearEstablished] = useState('');

  // Location
  const [county, setCounty] = useState('');
  const [town, setTown] = useState('');
  const [street, setStreet] = useState('');

  // Contact
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  // Social
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const toggleCategory = (cat) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setMsg({ text: 'Business name is required.', isSuccess: false }); return; }
    if (!description.trim()) { setMsg({ text: 'Description is required.', isSuccess: false }); return; }
    if (categories.length === 0) { setMsg({ text: 'Select at least one category.', isSuccess: false }); return; }
    if (!county) { setMsg({ text: 'Please select a county.', isSuccess: false }); return; }

    setLoading(true);
    setMsg({ text: '', isSuccess: false });

    const payload = {
      name: name.trim(),
      description: description.trim(),
      categories,
      submitterName: user?.name || '',
      ...(priceRange && { priceRange }),
      ...(employeeCount && { employeeCount }),
      ...(yearEstablished && { yearEstablished: parseInt(yearEstablished) }),
      location: {
        county,
        ...(town.trim() && { town: town.trim() }),
        ...(street.trim() && { address: street.trim() }),
      },
      contact: {
        ...(phone.trim() && { phone: phone.trim() }),
        ...(email.trim() && { email: email.trim() }),
        ...(website.trim() && { website: website.trim() }),
      },
      ...(facebook || instagram || twitter || whatsapp ? {
        socialMedia: {
          ...(facebook.trim() && { facebook: facebook.trim() }),
          ...(instagram.trim() && { instagram: instagram.trim() }),
          ...(twitter.trim() && { twitter: twitter.trim() }),
          ...(whatsapp.trim() && { whatsapp: whatsapp.trim() }),
        },
      } : {}),
    };

    try {
      await biasharaBusinessAPI.createBusiness(payload);
      setMsg({ text: 'Business submitted for review. You will be notified once approved.', isSuccess: true });
      setTimeout(onDone, 2500);
    } catch (err) {
      setMsg({ text: err.message || 'Failed to register business. Please try again.', isSuccess: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <ArrowLeftIcon color={ACCENT} size={20} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Register Business</Text>
        <View style={s.backBtn} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <MsgBanner msg={msg} />

          {/* Notice */}
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
            <InputBox
              colors={colors} placeholder="Describe your business, what you offer, your USP..."
              value={description} onChangeText={setDescription}
              multiline numberOfLines={4} style={s.textarea}
            />
          </Field>

          <Field label="Year Established" colors={colors}>
            <InputBox colors={colors} placeholder="e.g. 2018" value={yearEstablished}
              onChangeText={setYearEstablished} keyboardType="numeric" maxLength={4} />
          </Field>

          {/* ── Categories ── */}
          <SectionHeader title="CATEGORIES" colors={colors} />
          <Text style={[s.hint, { color: colors.textMuted }]}>Select all that apply *</Text>
          <ChipSelector
            options={CATEGORIES} selected={categories}
            onToggle={toggleCategory} accent={ACCENT} colors={colors}
          />

          {/* ── Business Details ── */}
          <SectionHeader title="BUSINESS DETAILS" colors={colors} />

          <Field label="Price Range" colors={colors}>
            <SingleSelect options={PRICE_RANGES} selected={priceRange} onSelect={setPriceRange} accent={ACCENT} colors={colors} />
          </Field>

          <Field label="Number of Employees" colors={colors}>
            <SingleSelect options={EMPLOYEE_COUNTS} selected={employeeCount} onSelect={setEmployeeCount} accent={ACCENT} colors={colors} />
          </Field>

          {/* ── Location ── */}
          <SectionHeader title="LOCATION" colors={colors} />

          <Field label="County" colors={colors} required>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
              <View style={s.chipWrap}>
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

          <Field label="Town / Area" colors={colors}>
            <InputBox colors={colors} placeholder="e.g. Westlands" value={town} onChangeText={setTown} />
          </Field>

          <Field label="Street / Building" colors={colors}>
            <InputBox colors={colors} placeholder="e.g. Moi Avenue, 2nd Floor" value={street} onChangeText={setStreet} />
          </Field>

          {/* ── Contact ── */}
          <SectionHeader title="CONTACT INFORMATION" colors={colors} />

          <Field label="Phone Number" colors={colors}>
            <InputBox colors={colors} placeholder="+254 7XX XXX XXX" value={phone}
              onChangeText={setPhone} keyboardType="phone-pad" />
          </Field>

          <Field label="Email" colors={colors}>
            <InputBox colors={colors} placeholder="business@example.com" value={email}
              onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </Field>

          <Field label="Website" colors={colors}>
            <InputBox colors={colors} placeholder="https://yourwebsite.com" value={website}
              onChangeText={setWebsite} autoCapitalize="none" keyboardType="url" />
          </Field>

          {/* ── Social Media ── */}
          <SectionHeader title="SOCIAL MEDIA (Optional)" colors={colors} />

          <Field label="Facebook" colors={colors}>
            <InputBox colors={colors} placeholder="Facebook page URL or handle" value={facebook} onChangeText={setFacebook} autoCapitalize="none" />
          </Field>
          <Field label="Instagram" colors={colors}>
            <InputBox colors={colors} placeholder="Instagram handle (e.g. @mybusiness)" value={instagram} onChangeText={setInstagram} autoCapitalize="none" />
          </Field>
          <Field label="WhatsApp" colors={colors}>
            <InputBox colors={colors} placeholder="+254 7XX XXX XXX" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
          </Field>
          <Field label="X / Twitter" colors={colors}>
            <InputBox colors={colors} placeholder="@handle" value={twitter} onChangeText={setTwitter} autoCapitalize="none" />
          </Field>

          {/* Submit */}
          <MsgBanner msg={msg} />

          <TouchableOpacity
            style={[s.submitBtn, loading && s.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#0f172a" size="small" />
              : <Text style={s.submitText}>Submit for Review</Text>
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
  input: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.three, fontSize: FontSize.base },
  textarea: { minHeight: 100, paddingTop: Spacing.two, textAlignVertical: 'top' },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12, fontWeight: '600' },

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
