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
import * as DocumentPicker from 'expo-document-picker';
import LocateButton from '../components/LocateButton';
import UniversityPicker from '../components/UniversityPicker';
import { createPropertyWithImages, uploadOwnershipDocument } from '../services/api';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import {
  AMENITIES_LIST,
  PROPERTY_TYPES,
  HOSTEL_PROPERTY_TYPE,
  OWNERSHIP_TYPES,
  SALE_TERMS,
} from '../constants/propertyOptions';

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
  const [listingType, setListingType] = useState('rent');
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [county, setCounty] = useState('');
  const [location, setLocation] = useState('');
  const [totalUnits, setTotalUnits] = useState('1');
  const [plotSize, setPlotSize] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState(null);

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

  // Sale details
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [saleTerms, setSaleTerms] = useState('cash');
  const [ownershipType, setOwnershipType] = useState('');
  const [titleNumber, setTitleNumber] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');

  // Media & amenities
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [ownershipDoc, setOwnershipDoc] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSale = listingType === 'sale';
  const universityRequired = !isSale && propertyType === HOSTEL_PROPERTY_TYPE;

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

  const pickVideos = async () => {
    if (videos.length >= 5) {
      Alert.alert('Limit reached', 'You can add up to 5 videos per listing.');
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your videos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets?.length) {
      const tooLarge = result.assets.find(a => a.fileSize && a.fileSize > 100 * 1024 * 1024);
      if (tooLarge) {
        Alert.alert('Video too large', `${tooLarge.fileName || 'A video'} exceeds the 100MB limit.`);
      }
      const valid = result.assets.filter(a => !a.fileSize || a.fileSize <= 100 * 1024 * 1024);
      setVideos(prev => [...prev, ...valid].slice(0, 5));
    }
  };

  const pickOwnershipDoc = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset) return;
    if (asset.size && asset.size > 10 * 1024 * 1024) {
      Alert.alert('File too large', 'Ownership document must be 10MB or smaller.');
      return;
    }
    setOwnershipDoc(asset);
  };

  const handleSubmit = async () => {
    if (!title || !description || !location || !price || !propertyType || !county) {
      Alert.alert('Incomplete form', 'Please fill in all required fields.');
      return;
    }
    if (!isSale && (!totalUnits || Number(totalUnits) < 1)) {
      Alert.alert('Units required', 'Enter at least one available unit.');
      return;
    }
    if (universityRequired && !selectedUniversity?.id) {
      Alert.alert('University required', 'Select the university this hostel is linked to.');
      return;
    }
    if (isSale && !ownershipType) {
      Alert.alert('Ownership type required', 'Select the ownership type for this sale listing.');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Photos required', 'Please add at least one photo.');
      return;
    }
    if (!isSale && selectedAmenities.length === 0) {
      Alert.alert('Amenities required', 'Please select at least one amenity.');
      return;
    }
    if (isSale && !ownershipDoc) {
      Alert.alert('Ownership document required', 'Attach the title deed, sectional title or sale agreement.');
      return;
    }
    if (!agreed) {
      Alert.alert('Terms required', 'Please confirm the listing details and listing terms.');
      return;
    }

    setLoading(true);
    try {
      let ownershipProofUrl;
      if (isSale && ownershipDoc) {
        ownershipProofUrl = await uploadOwnershipDocument(ownershipDoc, 'token');
      }

      await createPropertyWithImages(
        {
          listingType,
          title,
          description,
          location,
          county,
          price,
          propertyType,
          bedrooms: bedrooms || '0',
          bathrooms: bathrooms || '0',
          ...(lat && { lat }),
          ...(lng && { lng }),
          ...(rules && { rules }),
          amenities: JSON.stringify(selectedAmenities),
          ...(isSale
            ? {
                priceNegotiable: String(priceNegotiable),
                saleTerms,
                ownershipType,
                ...(titleNumber && { titleNumber }),
                ...(plotSize && { plotSize }),
                ...(yearBuilt && { yearBuilt }),
                ...(ownershipProofUrl && { ownershipProofUrl }),
              }
            : {
                totalUnits: totalUnits || '1',
                ...(deposit && { deposit }),
                furnished: String(furnished),
                leaseType,
                ...(availableFrom && { availableFrom }),
                ...(selectedUniversity?.name && { university: selectedUniversity.name }),
                ...(selectedUniversity?.id && { universityId: String(selectedUniversity.id) }),
              }),
        },
        images,
        videos
      );
      Alert.alert('Success', 'Property submitted for review. You will be notified once approved.', [{ text: 'OK' }]);
      // Reset form
      setListingType('rent'); setTitle(''); setDescription(''); setLocation(''); setCounty('');
      setPrice(''); setDeposit(''); setPropertyType(''); setTotalUnits('1'); setPlotSize('');
      setBedrooms(''); setBathrooms(''); setFurnished(false); setLeaseType('monthly');
      setAvailableFrom(''); setRules(''); setLat(''); setLng('');
      setPriceNegotiable(false); setSaleTerms('cash'); setOwnershipType('');
      setTitleNumber(''); setYearBuilt(''); setSelectedUniversity(null);
      setSelectedAmenities([]); setImages([]); setVideos([]); setOwnershipDoc(null); setAgreed(false);
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

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Listing intention</Text>
            <View style={styles.modeRow}>
              {[{ key: 'rent', label: 'For Rent' }, { key: 'sale', label: 'For Sale' }].map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.modeBtn, listingType === opt.key && styles.modeBtnActive]}
                  onPress={() => setListingType(opt.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modeText, listingType === opt.key && styles.modeTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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

          {isSale ? (
            <Field label="Plot / Built-up Size">
              <TextInput
                style={styles.input}
                value={plotSize}
                onChangeText={setPlotSize}
                placeholder="e.g. 50x100 ft or 0.25 acre"
                placeholderTextColor={colors.textMuted}
              />
            </Field>
          ) : (
            <>
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

              <UniversityPicker
                value={selectedUniversity}
                onChange={setSelectedUniversity}
                required={universityRequired}
                label={universityRequired ? 'Linked Campus / University' : 'Nearby University (Optional)'}
                hint={universityRequired
                  ? 'Required for hostel listings so students find your property.'
                  : 'Link your property to a nearby campus to appear in student hostel searches.'}
                colors={colors}
              />
            </>
          )}

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
              <Field label={isSale ? 'Asking Price (KES)' : 'Monthly Rent (KES)'} required>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder={isSale ? 'e.g. 8500000' : 'e.g. 25000'}
                  placeholderTextColor={colors.textMuted}
                />
              </Field>
            </View>
            <View style={styles.rowItem}>
              {isSale ? (
                <Picker
                  label="Payment Terms"
                  value={saleTerms}
                  options={SALE_TERMS.map(t => t.value)}
                  optionLabels={Object.fromEntries(SALE_TERMS.map(t => [t.value, t.label]))}
                  onSelect={setSaleTerms}
                  colors={colors}
                />
              ) : (
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
              )}
            </View>
          </View>

          {isSale && (
            <TouchableOpacity
              style={[styles.field, styles.checkRow]}
              onPress={() => setPriceNegotiable(v => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, priceNegotiable && styles.checkboxActive]}>
                {priceNegotiable && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.fieldLabel}>Asking price is negotiable</Text>
            </TouchableOpacity>
          )}

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

          {isSale ? (
            <>
              <Picker
                label="Ownership Type"
                value={ownershipType}
                options={OWNERSHIP_TYPES.map(t => t.value)}
                optionLabels={Object.fromEntries(OWNERSHIP_TYPES.map(t => [t.value, t.label]))}
                onSelect={setOwnershipType}
                required
                colors={colors}
              />

              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Field label="Title / Plot Number">
                    <TextInput
                      style={styles.input}
                      value={titleNumber}
                      onChangeText={setTitleNumber}
                      placeholder="e.g. Nairobi/Block 92/1234"
                      placeholderTextColor={colors.textMuted}
                    />
                  </Field>
                </View>
                <View style={styles.rowItem}>
                  <Field label="Year Built">
                    <TextInput
                      style={styles.input}
                      value={yearBuilt}
                      onChangeText={setYearBuilt}
                      keyboardType="numeric"
                      placeholder="e.g. 2019"
                      placeholderTextColor={colors.textMuted}
                    />
                  </Field>
                </View>
              </View>
            </>
          ) : (
            <>
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
            </>
          )}

          <Field label={isSale ? 'Viewing Notes' : 'House Rules'}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={rules}
              onChangeText={setRules}
              placeholder={isSale
                ? 'e.g. Viewings on weekends only, serious buyers please'
                : 'e.g. No pets, no smoking inside...'}
              placeholderTextColor={colors.textMuted}
              multiline
            />
          </Field>
        </View>

        {/* ── PHOTOS & MEDIA ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos & Media <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.photoPickerBtn} onPress={pickImages}>
            <Text style={styles.photoPickerText}>+ Add Photos (max 10)</Text>
          </TouchableOpacity>
          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                  {index === 0 && (
                    <View style={styles.coverBadge}>
                      <Text style={styles.coverBadgeText}>COVER</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.imageRemove} onPress={() => removeImage(index)}>
                    <Text style={styles.imageRemoveText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={[styles.field, { marginTop: Spacing.three }]}>
            <Text style={styles.fieldLabel}>Walkthrough Video (Optional)</Text>
            <Text style={styles.hint}>Add up to 5 videos, max 100MB each.</Text>

            {videos.length > 0 && (
              <View style={styles.videoList}>
                {videos.map((asset, index) => (
                  <View key={`video-${index}`} style={styles.videoRow}>
                    <Text style={styles.videoName} numberOfLines={1}>
                      {asset.fileName || `Video ${index + 1}`}
                    </Text>
                    <TouchableOpacity onPress={() => setVideos(prev => prev.filter((_, i) => i !== index))}>
                      <Text style={styles.videoRemove}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.videoPickerBtn} onPress={pickVideos} activeOpacity={0.8}>
              <Text style={styles.videoPickerText}>+ Add Walkthrough Video</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── AMENITIES & TERMS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Amenities {!isSale && <Text style={styles.required}>*</Text>}
          </Text>
          <Text style={styles.hint}>
            {isSale
              ? 'Select any amenities that apply, then attach the ownership document.'
              : 'Select all that apply.'}
          </Text>
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

          {isSale && (
            <View style={styles.docCard}>
              <Text style={styles.docTitle}>Ownership Document <Text style={styles.required}>*</Text></Text>
              <Text style={styles.hint}>
                Upload the title deed, sectional title, share certificate or sale agreement.
                PDF, Word or a clear photo — maximum 10MB. Only administrators can review it.
              </Text>
              <TouchableOpacity style={styles.videoPickerBtn} onPress={pickOwnershipDoc} activeOpacity={0.8}>
                <Text style={styles.videoPickerText}>
                  {ownershipDoc ? `Selected: ${ownershipDoc.name}` : '+ Upload Ownership Document'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.termsRow]}
            onPress={() => setAgreed(v => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              {isSale
                ? 'I confirm that I am the owner or an authorised representative, that the ownership document is genuine, and that all details and photos are accurate and comply with AXXSpace listing terms.'
                : "I confirm the property information is accurate and I agree to AXXSpace's listing terms. The listing will be reviewed before going live."}
            </Text>
          </TouchableOpacity>
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
  coverBadge: {
    position: 'absolute',
    left: 4, bottom: 4,
    backgroundColor: 'rgba(30,58,95,0.85)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  coverBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },
  hint: { fontSize: FontSize.sm, color: colors.textMuted, lineHeight: 18 },
  modeRow: { flexDirection: 'row', gap: Spacing.two },
  modeBtn: {
    flex: 1,
    paddingVertical: Spacing.two + 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  modeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  modeText: { fontSize: FontSize.md, fontWeight: '600', color: colors.textSecondary },
  modeTextActive: { color: colors.primary, fontWeight: '700' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  checkbox: {
    width: 22, height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { color: '#fff', fontWeight: '800', fontSize: 12 },
  videoList: { gap: Spacing.one, marginTop: Spacing.two },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.two,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: colors.background,
  },
  videoName: { flex: 1, fontSize: FontSize.sm, fontWeight: '600', color: colors.text },
  videoRemove: { fontSize: FontSize.sm, fontWeight: '700', color: colors.danger },
  videoPickerBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  videoPickerText: { fontSize: FontSize.sm, fontWeight: '700', color: colors.textSecondary },
  docCard: {
    marginTop: Spacing.three,
    padding: Spacing.two + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  docTitle: { fontSize: FontSize.md, fontWeight: '700', color: colors.text, marginBottom: Spacing.one },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  termsText: { flex: 1, fontSize: FontSize.sm, color: colors.textSecondary, lineHeight: 18 },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
