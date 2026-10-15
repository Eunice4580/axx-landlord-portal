import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import LocateButton from '../components/LocateButton';
import { createPropertyWithImages } from '../services/api';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { AMENITIES_LIST, PROPERTY_TYPES } from '../constants/propertyOptions';

const COUNTIES = [
  'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta',
  'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Tharaka Nithi',
  'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua', 'Nyeri', 'Kirinyaga',
  "Murang'a", 'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia',
  'Uasin Gishu', 'Elgeyo Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru',
  'Narok', 'Kajiado', 'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma',
  'Busia', 'Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Nairobi City',
];

const LEASE_TYPES = ['monthly', '6months', 'yearly'];
const LEASE_LABELS = { monthly: 'Monthly', '6months': '6 Months', yearly: 'Yearly' };

/* ── Dropdown Picker component ─────────────────────────────── */
function Picker({ label, value, options, optionLabels, onSelect, required, colors }) {
  const [open, setOpen] = useState(false);
  const display = optionLabels ? optionLabels[value] : value;
  return (
    <View style={{ marginBottom: Spacing.two }}>
      <Text style={[pickerStyles.label, { color: colors.textSecondary }]}>
        {label}{required && <Text style={{ color: colors.primary }}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[pickerStyles.btn, { borderColor: colors.border, backgroundColor: colors.background }]}
        onPress={() => setOpen(v => !v)}
        activeOpacity={0.8}
      >
        <Text style={{ color: value ? colors.text : colors.textMuted, fontSize: FontSize.md }}>
          {display || `Select ${label.toLowerCase()}`}
        </Text>
        <Text style={{ color: colors.textMuted }}>▾</Text>
      </TouchableOpacity>
      {open && (
        <View style={[pickerStyles.dropdown, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
            {options.map(o => (
              <TouchableOpacity
                key={o}
                style={[pickerStyles.item, value === o && { backgroundColor: colors.primary + '18' }]}
                onPress={() => { onSelect(o); setOpen(false); }}
              >
                <Text style={[pickerStyles.itemText, { color: value === o ? colors.primary : colors.text }]}>
                  {optionLabels ? optionLabels[o] : o}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  label: { fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.one },
  btn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderRadius: BorderRadius.md,
    padding: Spacing.two + 4, fontSize: FontSize.md,
  },
  dropdown: {
    borderWidth: 1, borderRadius: BorderRadius.md,
    marginTop: 4, zIndex: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  item: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  itemText: { fontSize: FontSize.md },
});

export default function AddPropertyScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  // Basic Info
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [county, setCounty] = useState('');
  const [location, setLocation] = useState('');
  const [totalUnits, setTotalUnits] = useState('1');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  // Details
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [furnished, setFurnished] = useState(false);
  const [leaseType, setLeaseType] = useState('monthly');
  const [availableFrom, setAvailableFrom] = useState('');
  const [rules, setRules] = useState('');

  // Media & Amenities
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setImages(prev => [...prev, ...uris].slice(0, 10));
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !description || !location || !price || !propertyType || !county) {
      Alert.alert('Incomplete form', 'Please fill in all required fields.');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Photos required', 'Please add at least one photo.');
      return;
    }
    if (selectedAmenities.length === 0) {
      Alert.alert('Amenities required', 'Please select at least one amenity.');
      return;
    }

    setLoading(true);
    try {
      await createPropertyWithImages(
        {
          title,
          description,
          location,
          county,
          price,
          propertyType,
          totalUnits: totalUnits || '1',
          bedrooms: bedrooms || '0',
          bathrooms: bathrooms || '0',
          deposit: deposit || undefined,
          furnished: String(furnished),
          leaseType,
          ...(availableFrom && { availableFrom }),
          ...(rules && { rules }),
          ...(lat && { lat }),
          ...(lng && { lng }),
          amenities: JSON.stringify(selectedAmenities),
        },
        images
      );
      Alert.alert('Success', 'Property submitted for review. You will be notified once approved.', [{ text: 'OK' }]);
      // Reset form
      setTitle(''); setDescription(''); setLocation(''); setCounty('');
      setPrice(''); setDeposit(''); setPropertyType(''); setTotalUnits('1');
      setBedrooms(''); setBathrooms(''); setFurnished(false); setLeaseType('monthly');
      setAvailableFrom(''); setRules(''); setLat(''); setLng('');
      setSelectedAmenities([]); setImages([]);
    } catch (error) {
      Alert.alert('Failed', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, required, children }) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Add Property</Text>
        <Text style={styles.pageSubtitle}>Your listing will be reviewed before going live.</Text>

        {/* ── BASIC INFO ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>

          <Field label="Title" required>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Modern 2BR Apartment in Kilimani"
              placeholderTextColor={colors.textMuted}
            />
          </Field>

          <View style={{ marginBottom: Spacing.two }}>
            <Text style={styles.fieldLabel}>Property Type <Text style={styles.required}>*</Text></Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {PROPERTY_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chip, propertyType === type && styles.chipActive]}
                    onPress={() => setPropertyType(type)}
                  >
                    <Text style={[styles.chipText, propertyType === type && styles.chipTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <Picker
            label="County"
            value={county}
            options={COUNTIES}
            onSelect={setCounty}
            required
            colors={colors}
          />

          <Field label="Location / Street Address" required>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Kilimani, Nairobi"
              placeholderTextColor={colors.textMuted}
            />
          </Field>

          <Field label="Number of Units" required>
            <TextInput
              style={styles.input}
              value={totalUnits}
              onChangeText={setTotalUnits}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={colors.textMuted}
            />
          </Field>

          {/* GPS Auto-detect */}
          <LocateButton
            counties={COUNTIES}
            onFound={p => {
              if (p.lat) setLat(p.lat.toFixed(6));
              if (p.lng) setLng(p.lng.toFixed(6));
              if (p.county) setCounty(p.county);
              if (p.town && !location.trim()) setLocation(p.town);
            }}
          />

          <View style={styles.row}>
            <View style={[styles.rowItem]}>
              <Field label="Latitude">
                <TextInput
                  style={styles.input}
                  value={lat}
                  onChangeText={setLat}
                  keyboardType="decimal-pad"
                  placeholder="-1.292066"
                  placeholderTextColor={colors.textMuted}
                />
              </Field>
            </View>
            <View style={[styles.rowItem]}>
              <Field label="Longitude">
                <TextInput
                  style={styles.input}
                  value={lng}
                  onChangeText={setLng}
                  keyboardType="decimal-pad"
                  placeholder="36.821945"
                  placeholderTextColor={colors.textMuted}
                />
              </Field>
            </View>
          </View>
        </View>

        {/* ── DETAILS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>

          <Field label="Description" required>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the property, surroundings, nearby amenities..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
          </Field>

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Field label="Price (KES)" required>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder="e.g. 25000"
                  placeholderTextColor={colors.textMuted}
                />
              </Field>
            </View>
            <View style={styles.rowItem}>
              <Field label="Deposit (KES)">
                <TextInput
                  style={styles.input}
                  value={deposit}
                  onChangeText={setDeposit}
                  keyboardType="numeric"
                  placeholder="Optional"
                  placeholderTextColor={colors.textMuted}
                />
              </Field>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Field label="Bedrooms">
                <TextInput
                  style={styles.input}
                  value={bedrooms}
                  onChangeText={setBedrooms}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </Field>
            </View>
            <View style={styles.rowItem}>
              <Field label="Bathrooms">
                <TextInput
                  style={styles.input}
                  value={bathrooms}
                  onChangeText={setBathrooms}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </Field>
            </View>
          </View>

          <View style={[styles.field, styles.switchRow]}>
            <Text style={styles.fieldLabel}>Furnished</Text>
            <Switch
              value={furnished}
              onValueChange={setFurnished}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={{ marginBottom: Spacing.two }}>
            <Text style={styles.fieldLabel}>Lease Type</Text>
            <View style={styles.chipRow}>
              {LEASE_TYPES.map(lt => (
                <TouchableOpacity
                  key={lt}
                  style={[styles.chip, leaseType === lt && styles.chipActive]}
                  onPress={() => setLeaseType(lt)}
                >
                  <Text style={[styles.chipText, leaseType === lt && styles.chipTextActive]}>
                    {LEASE_LABELS[lt]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Field label="Available From">
            <TextInput
              style={styles.input}
              value={availableFrom}
              onChangeText={setAvailableFrom}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </Field>

          <Field label="House Rules">
            <TextInput
              style={[styles.input, styles.textArea]}
              value={rules}
              onChangeText={setRules}
              placeholder="e.g. No pets, no smoking inside..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
          </Field>
        </View>

        {/* ── PHOTOS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.photoPickerBtn} onPress={pickImages}>
            <Text style={styles.photoPickerText}>+ Add Photos (max 10)</Text>
          </TouchableOpacity>
          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                  <TouchableOpacity style={styles.imageRemove} onPress={() => removeImage(index)}>
                    <Text style={styles.imageRemoveText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── AMENITIES ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities <Text style={styles.required}>*</Text></Text>
          <View style={styles.amenitiesGrid}>
            {AMENITIES_LIST.map(amenity => (
              <TouchableOpacity
                key={amenity}
                style={[styles.chip, selectedAmenities.includes(amenity) && styles.chipActive]}
                onPress={() => toggleAmenity(amenity)}
              >
                <Text style={[styles.chipText, selectedAmenities.includes(amenity) && styles.chipTextActive]}>
                  {amenity}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── SUBMIT ── */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Submit Property</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  pageTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginBottom: Spacing.four,
  },
  section: {
    backgroundColor: colors.backgroundElement,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: Spacing.three,
  },
  field: { marginBottom: Spacing.two },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: Spacing.one,
  },
  required: { color: colors.primary },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.two + 4,
    fontSize: FontSize.md,
    color: colors.text,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: Spacing.two },
  rowItem: { flex: 1 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
    backgroundColor: colors.background,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { fontSize: FontSize.sm, color: colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  photoPickerBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  photoPickerText: { color: colors.primary, fontWeight: '600', fontSize: FontSize.md },
  imageRow: { marginTop: Spacing.two },
  imageWrapper: { marginRight: Spacing.two, position: 'relative' },
  imageThumb: { width: 80, height: 80, borderRadius: BorderRadius.md },
  imageRemove: {
    position: 'absolute',
    top: -6, right: -6,
    backgroundColor: colors.danger,
    borderRadius: 12,
    width: 22, height: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  imageRemoveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
