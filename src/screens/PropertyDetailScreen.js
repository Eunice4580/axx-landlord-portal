import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function PropertyDetailScreen({ property, onBack }) {
  const [currentImage, setCurrentImage] = useState(0);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const images = property.images || [];
  const total = property.totalUnits || 1;
  const booked = property.bookedUnits || 0;
  const available = Math.max(0, total - booked);

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      {images.length > 0 ? (
        <>
          <Image source={{ uri: images[currentImage] }} style={styles.mainImage} />
          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
              {images.map((uri, index) => (
                <TouchableOpacity key={index} onPress={() => setCurrentImage(index)}>
                  <Image
                    source={{ uri }}
                    style={[
                      styles.thumb,
                      currentImage === index && styles.thumbActive,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </>
      ) : (
        <View style={styles.noImage}>
          <Text style={styles.noImageText}>No images</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.typeTag}>{property.propertyType || 'Rental'}</Text>
        <Text style={styles.title}>{property.title}</Text>
        <Text style={styles.location}>{property.location}, {property.county}</Text>

        <View style={styles.metaRow}>
          {property.bedrooms ? (
            <Text style={styles.metaItem}>{property.bedrooms} Bedrooms</Text>
          ) : null}
          {property.bathrooms ? (
            <Text style={styles.metaItem}>{property.bathrooms} Bathrooms</Text>
          ) : null}
          <Text style={styles.metaItem}>
            {property.furnished ? 'Furnished' : 'Unfurnished'}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            KSh {Number(property.price || 0).toLocaleString()} / month
          </Text>
          <Text
            style={[
              styles.availability,
              { color: available > 0 ? colors.success : colors.danger },
            ]}
          >
            {available > 0 ? `${available} units available` : 'Fully Booked'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>
          {property.description || 'No description provided.'}
        </Text>

        {property.amenities && property.amenities.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {property.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {property.rules ? (
          <>
            <Text style={styles.sectionTitle}>House Rules</Text>
            <Text style={styles.description}>{property.rules}</Text>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.description}>
          {(property.status || 'pending').charAt(0).toUpperCase() +
            (property.status || 'pending').slice(1)}
        </Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backButton: { padding: Spacing.three },
  backLink: { color: colors.primary, fontSize: 15 },
  mainImage: { width, height: 250 },
  noImage: {
    width,
    height: 250,
    backgroundColor: colors.backgroundElement,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: { color: colors.textSecondary },
  thumbRow: { padding: Spacing.two },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: Spacing.two,
    opacity: 0.6,
  },
  thumbActive: { opacity: 1, borderWidth: 2, borderColor: colors.primary },
  content: { padding: Spacing.four },
  typeTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundElement,
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: Spacing.two,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  location: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.three },
  metaItem: { fontSize: 13, color: colors.text, fontWeight: '600' },
  priceRow: {
    marginTop: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  price: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  availability: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  amenityChip: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  amenityText: { fontSize: 12, color: colors.text },
});
