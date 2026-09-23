import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';

function PortalCard({ title, accentColor, onPress, delay }) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 480, delay, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
      <TouchableOpacity
        style={[styles.card, { borderColor: accentColor + '50', backgroundColor: colors.backgroundElement }]}
        onPress={onPress}
        activeOpacity={0.78}
      >
        <View style={[styles.cardAccentBar, { backgroundColor: accentColor }]} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PortalSelectorScreen({ onSelectPortal }) {
  const { colors } = useTheme();
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }]}>
          <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoMarkText}>AXX</Text>
          </View>
          <Text style={[styles.brandName, { color: colors.text }]}>AXXSPACE</Text>
          <Text style={[styles.brandSub, { color: colors.textSecondary }]}>Manager</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.prompt, { color: colors.textMuted }]}>SELECT A PORTAL</Text>
        </Animated.View>

        {/* Cards */}
        <View style={styles.cards}>
          <PortalCard
            title="Landlord Portal"
            accentColor={colors.primary}
            delay={120}
            onPress={() => onSelectPortal('landlord')}
          />
          <View style={{ height: 14 }} />
          <PortalCard
            title="AxxBiashara"
            accentColor="#fbbf24"
            delay={240}
            onPress={() => onSelectPortal('biashara')}
          />
        </View>

        {/* Footer */}
        <Animated.Text style={[styles.footer, { color: colors.textMuted, opacity: headerAnim }]}>
          AXX Spaces — Space hunting bila stress.
        </Animated.Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    justifyContent: 'space-between',
  },
  header: { alignItems: 'center', paddingTop: Spacing.three },
  logoMark: {
    width: 68, height: 68, borderRadius: BorderRadius.lg,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.two,
    shadowColor: '#e11d48', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28, shadowRadius: 14, elevation: 7,
  },
  logoMarkText: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  brandName: { fontSize: 28, fontWeight: '900', letterSpacing: 4 },
  brandSub: { fontSize: 15, letterSpacing: 2, marginTop: 2 },
  divider: { width: 36, height: 1, marginVertical: Spacing.three },
  prompt: { fontSize: 11, fontWeight: '800', letterSpacing: 3 },

  cards: { flex: 1, justifyContent: 'center' },

  card: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
    paddingVertical: 36,
    paddingHorizontal: Spacing.four,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  cardAccentBar: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 4,
    borderTopLeftRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
  },
  cardTitle: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  footer: { textAlign: 'center', fontSize: 12, letterSpacing: 0.5 },
});
