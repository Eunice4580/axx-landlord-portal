import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { profileUpdateAPI } from '../services/api';
import { Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function ChangeContactScreen({ user, onBack, onUpdated }) {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUri, setAvatarUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name || !phone) {
      Alert.alert('Missing info', 'Please fill in both fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await profileUpdateAPI.updateContact(name, phone, avatarUri);
      Alert.alert('Success', 'Profile updated successfully.', [
        {
          text: 'OK',
          onPress: () => {
            if (onUpdated && response?.data?.user) {
              onUpdated(response.data.user);
            }
            onBack();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Failed', error.message || 'Could not update profile.');
    } finally {
      setLoading(false);
    }
  };

  const displayImage = avatarUri || user?.profileImage;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Edit Profile</Text>

      <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
        {displayImage ? (
          <Image source={{ uri: displayImage }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              {(name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.avatarEditText}>Change Photo</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: Spacing.four },
  backLink: { color: colors.primary, fontSize: 15, marginBottom: Spacing.three },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: Spacing.four },
  avatarWrapper: { alignItems: 'center', marginBottom: Spacing.four },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: Spacing.two },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  avatarPlaceholderText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  avatarEditText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: Spacing.one },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
