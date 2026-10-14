import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { getCurrentPlace, matchCounty } from '../utils/currentPlace';

export default function LocateButton({ counties = [], onFound, accent = '#fbbf24', textColor = '#d97706' }) {
  const [loading, setLoading] = useState(false);

  const detect = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const p = await getCurrentPlace();
      const county = matchCounty(p.region, counties);
      onFound && onFound({ ...p, county });
      Alert.alert('Location detected', county ? 'County: ' + county : 'Please check that the county is correct.');
    } catch (e) {
      Alert.alert('Location', (e && e.message) || 'Could not get your location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={detect}
      disabled={loading}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 12, borderRadius: 10, borderWidth: 1,
        borderColor: accent, backgroundColor: accent + '20', marginBottom: 12,
      }}
    >
      {loading ? <ActivityIndicator size="small" color={textColor} /> : null}
      <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>
        {loading ? 'Detecting location…' : '📍 Use my current location'}
      </Text>
    </TouchableOpacity>
  );
}
