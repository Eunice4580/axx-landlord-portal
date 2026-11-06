import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Image, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import * as SecureStore from 'expo-secure-store';
import { useRoute } from '@react-navigation/native';

const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

export default function AccommodationDetailScreen() {
  const { colors } = useTheme();
  const route = useRoute();
  const { id } = route.params || {};
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = await SecureStore.getItemAsync('accom_token');
        const res = await fetch(`${API_BASE}/accommodations/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok) setDetail(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text }}>Unable to load accommodation details.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      {detail.photos && detail.photos.length > 0 && (
        <Image source={{ uri: detail.photos[0] }} style={styles.image} />
      )}
      <Text style={[styles.title, { color: colors.text }]}>{detail.title}</Text>
      <Text style={[styles.location, { color: colors.textMuted }]}>{detail.location}</Text>
      <Text style={[styles.price, { color: colors.accent }]}>${detail.pricePerNight} / night</Text>
      <Text style={[styles.description, { color: colors.text }]}>{detail.description}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16 },
  image: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  location: { fontSize: 16, marginBottom: 4 },
  price: { fontSize: 16, fontWeight: '500', marginBottom: 12 },
  description: { fontSize: 14, lineHeight: 20 },
});
