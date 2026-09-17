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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { createPropertyWithImages } from '../services/api';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { AMENITIES_LIST, PROPERTY_TYPES } from '../constants/propertyOptions';

export default function AddPropertyScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [county, setCounty] = useState('');
  const [price, setPrice] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [totalUnits, setTotalUnits] = useState('1');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
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
          amenities: JSON.stringify(selectedAmenities),
        },
        images
      );
      Alert.alert('Success', 'Property submitted for review. You will be notified once approved.', [{ text: 'OK' }]);
      // Reset form
      setTitle(''); setDescription(''); setLocation(''); setCounty('');
      setPrice(''); setPropertyType(''); setTotalUnits('1');
      setBedrooms(''); setBathrooms(''); setSelectedAmenities([]); setImages([]);
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

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Field label="Property Title" required>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Modern 2BR Apartment in Kilimani"
              placeholderTextColor={colors.textMuted}
            />
          </Field>

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

          <Field label="Location / Street Address" required>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Kilimani, Nairobi"
              placeholderTextColor={colors.textMuted}
            />
          </Field>

          <Field label="County" required>
            <TextInput
              style={styles.input}
              value={county}
              onChangeText={setCounty}
              placeholder="e.g. Nairobi"
              placeholderTextColor={colors.textMuted}
            />
          </Field>

          <Field label="Monthly Rent (KES)" required>
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

        {/* Property Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Type <Text style={styles.required}>*</Text></Text>
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

        {/* Units & Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Units & Size</Text>
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
            <View style={styles.rowItem}>
              <Field label="Total Units">
                <TextInput
                  style={styles.input}
                  value={totalUnits}
                  onChangeText={setTotalUnits}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={colors.textMuted}
                />
              </Field>
            </View>
          </View>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.photoPickerBtn} onPress={pickImages}>
            <Text style={styles.photoPickerText}>+ Add Photos</Text>
          </TouchableOpacity>
          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                  <TouchableOpacity style={styles.imageRemove} onPress={() => removeImage(index)}>
                    <Text style={styles.imageRemoveText}>x</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Amenities */}
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

        {/* Submit */}
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
  chipRow: { flexDirection: 'row', gap: Spacing.two },
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
    top: -6,
    right: -6,
    backgroundColor: colors.danger,
    borderRadius: 12,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageRemoveText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
