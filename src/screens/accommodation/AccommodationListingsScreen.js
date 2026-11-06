import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import * as SecureStore from 'expo-secure-store';

const API_BASE = 'https://axx-spaces-backend-1.onrender.com/api';

export default function AccommodationListingsScreen({ navigation }) {
  const { colors } = useTheme();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const token = await SecureStore.getItemAsync('accom_token');
        const res = await fetch(`${API_BASE}/accommodations`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.ok) setListings(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AccommodationDetail', { id: item._id })}
    >
      {item.photos && item.photos[0] ? (
        <Image source={{ uri: item.photos[0] }} style={styles.image} />
      ) : null}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.location, { color: colors.textMuted }]}>{[item.location?.town, item.location?.county].filter(Boolean).join(', ')}</Text>
        <Text style={[styles.price, { color: colors.accent }]}>${item.pricePerNight} / night</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <FlatList
      data={listings}
      keyExtractor={item => item._id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: { marginBottom: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', elevation: 2 },
  image: { width: '100%', height: 150 },
  info: { padding: 12 },
  title: { fontSize: 16, fontWeight: '600' },
  location: { fontSize: 14, marginTop: 4 },
  price: { fontSize: 14, marginTop: 4, fontWeight: '500' },
});
