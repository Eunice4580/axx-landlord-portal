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
import * as ImagePicker from 'expo-image-picker';
import { updatePropertyWithImages, deleteProperty } from '../services/api';
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { AMENITIES_LIST, PROPERTY_TYPES } from '../constants/propertyOptions';

export default function EditPropertyScreen({ property, onBack, onSuccess }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [title, setTitle] = useState(property.title || '');
  const [description, setDescription] = useState(property.description || '');
  const [location, setLocation] = useState(property.location || '');
  const [county, setCounty] = useState(property.county || '');
  const [price, setPrice] = useState(String(property.price || ''));
  const [propertyType, setPropertyType] = useState(property.propertyType || '');
  const [totalUnits, setTotalUnits] = useState(String(property.totalUnits || '1'));
  const [bedrooms, setBedrooms] = useState(String(property.bedrooms || ''));
  const [bathrooms, setBathrooms] = useState(String(property.bathrooms || ''));
  const [selectedAmenities, setSelectedAmenities] = useState(property.amenities || []);
  const [existingImages, setExistingImages] = useState(property.images || []);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
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
      const uris = result.assets.map((a) => a.uri);
      setNewImages((prev) => [...prev, ...uris]);
    }
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !description || !location || !price || !propertyType || !county) {
      Alert.alert('Missing info', 'Please fill in all required fields.');
      return;
    }
    if (existingImages.length + newImages.length === 0) {
      Alert.alert('Missing images', 'Please keep or add at least one photo.');
      return;
    }
    if (selectedAmenities.length === 0) {
      Alert.alert('Missing amenities', 'Please select at least one amenity.');
      return;
    }

    setLoading(true);
    try {
      await updatePropertyWithImages(
        property._id,
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
        newImages,
        existingImages
      );
      Alert.alert('Success', 'Property updated successfully!', [
        { text: 'OK', onPress: onSuccess },
      ]);
    } catch (error) {
      Alert.alert('Failed to update', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteProperty(property._id);
              Alert.alert('Deleted', 'Property deleted successfully.', [
                { text: 'OK', onPress: onSuccess },
              ]);
            } catch (error) {
              Alert.alert('Failed to delete', error.message || 'Something went wrong.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Edit Property</Text>

      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Location *</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} />

      <Text style={styles.label}>County *</Text>
      <TextInput style={styles.input} value={county} onChangeText={setCounty} />

      <Text style={styles.label}>Price (KES) *</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />

      <Text style={styles.label}>Property Type *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {PROPERTY_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.chip, propertyType === type && styles.chipSelected]}
            onPress={() => setPropertyType(type)}
          >
            <Text style={[styles.chipText, propertyType === type && styles.chipTextSelected]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Bedrooms</Text>
          <TextInput style={styles.input} value={bedrooms} onChangeText={setBedrooms} keyboardType="numeric" />
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Bathrooms</Text>
          <TextInput style={styles.input} value={bathrooms} onChangeText={setBathrooms} keyboardType="numeric" />
        </View>
      </View>

      <Text style={styles.label}>Total Units</Text>
      <TextInput style={styles.input} value={totalUnits} onChangeText={setTotalUnits} keyboardType="numeric" />

      <Text style={styles.label}>Photos *</Text>
      <TouchableOpacity style={styles.imagePickerButton} onPress={pickImages}>
        <Text style={styles.imagePickerText}>+ Add Photos</Text>
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
        {existingImages.map((uri, index) => (
          <View key={`existing-${index}`} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeExistingImage(index)}
            >
              <Text style={styles.removeImageText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        {newImages.map((uri, index) => (
          <View key={`new-${index}`} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeNewImage(index)}
            >
              <Text style={styles.removeImageText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.label}>Amenities *</Text>
      <View style={styles.amenitiesGrid}>
        {AMENITIES_LIST.map((amenity) => (
          <TouchableOpacity
            key={amenity}
            style={[
              styles.amenityChip,
              selectedAmenities.includes(amenity) && styles.chipSelected,
            ]}
            onPress={() => toggleAmenity(amenity)}
          >
            <Text
              style={[
                styles.chipText,
                selectedAmenities.includes(amenity) && styles.chipTextSelected,
              ]}
            >
              {amenity}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Save Changes</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
        {deleting ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.deleteButtonText}>Delete Property</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.four },
  backLink: { color: colors.primary, fontSize: 15, marginBottom: Spacing.three },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: Spacing.four },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: Spacing.one, marginTop: Spacing.two },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: Spacing.three,
    fontSize: 15,
    color: colors.text,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: Spacing.two },
  rowItem: { flex: 1 },
  chipRow: { marginBottom: Spacing.two },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    marginRight: Spacing.two,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  imagePickerText: { color: colors.primary, fontWeight: '600' },
  imageRow: { marginBottom: Spacing.two },
  imageWrapper: { marginRight: Spacing.two, position: 'relative' },
  imagePreview: { width: 80, height: 80, borderRadius: 8 },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.danger,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: { color: '#fff', fontWeight: 'bold' },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.two },
  amenityChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  deleteButtonText: { color: colors.danger, fontSize: 15, fontWeight: '600' },
});
