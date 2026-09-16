import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const WEBSITE_URL = 'https://axxspace.com';

export default function QRGeneratorScreen({ propertyId, propertyTitle, onBack }) {
  const [source, setSource] = useState('poster');
  const [sharing, setSharing] = useState(false);
  const viewShotRef = useRef();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const qrValue = `${WEBSITE_URL}/listings/${propertyId}?ref=qr&source=${source}`;

  const sources = ['poster', 'flyer', 'noticeboard', 'business-card'];

  const handleShare = async () => {
    try {
      setSharing(true);
      const uri = await viewShotRef.current.capture();

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Not available', 'Sharing is not available on this device.');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `QR Code - ${propertyTitle}`,
      });
    } catch (error) {
      Alert.alert('Failed', 'Could not save or share the QR code.');
      console.error(error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Promote Property</Text>
      <Text style={styles.subtitle}>{propertyTitle}</Text>

      <Text style={styles.label}>Where will this QR code be used?</Text>
      <View style={styles.sourceRow}>
        {sources.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.sourceChip, source === s && styles.sourceChipSelected]}
            onPress={() => setSource(s)}
          >
            <Text
              style={[
                styles.sourceChipText,
                source === s && styles.sourceChipTextSelected,
              ]}
            >
              {s.replace('-', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
        <View style={styles.qrCard}>
          <QRCode value={qrValue} size={220} color="#000000" backgroundColor="#ffffff" />
          <Text style={styles.qrCardTitle}>{propertyTitle}</Text>
          <Text style={styles.qrCardSubtitle}>Scan to view this property</Text>
        </View>
      </ViewShot>

      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShare}
        disabled={sharing}
      >
        <Text style={styles.shareButtonText}>
          {sharing ? 'Preparing...' : 'Download / Share QR Code'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Save this image and use it on a printed flyer, poster, or business
        card. Anyone who scans it goes straight to this property's listing,
        and the scan gets tracked in your QR Stats.
      </Text>

      <View style={styles.urlBox}>
        <Text style={styles.urlLabel}>Link</Text>
        <Text style={styles.urlText} numberOfLines={2}>
          {qrValue}
        </Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.four, alignItems: 'center' },
  backLink: {
    color: colors.primary,
    fontSize: 15,
    marginBottom: Spacing.three,
    alignSelf: 'flex-start',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.text, alignSelf: 'flex-start' },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: Spacing.four,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: Spacing.two,
    alignSelf: 'flex-start',
  },
  sourceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.four,
    alignSelf: 'flex-start',
  },
  sourceChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  sourceChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  sourceChipText: { fontSize: 13, color: colors.text, textTransform: 'capitalize' },
  sourceChipTextSelected: { color: '#fff', fontWeight: '600' },
  qrCard: {
    backgroundColor: '#fff',
    padding: Spacing.four,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  qrCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginTop: Spacing.three,
    textAlign: 'center',
  },
  qrCardSubtitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  shareButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    marginBottom: Spacing.three,
    width: '100%',
    alignItems: 'center',
  },
  shareButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.four,
    lineHeight: 18,
  },
  urlBox: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 8,
    padding: Spacing.three,
    width: '100%',
  },
  urlLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  urlText: { fontSize: 12, color: colors.text },
});
