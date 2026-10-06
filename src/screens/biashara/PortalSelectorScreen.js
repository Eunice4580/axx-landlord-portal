import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle, Polyline, Line } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, FontSize } from '../../constants/theme';

/* ── Inline icons ────────────────────────────────────────────────── */
const KeyIcon = ({ color, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="8" cy="15" r="5" />
    <Path d="M14.5 9.5 21 3m-3 0 3 3-3.5 3.5-3-3" />
  </Svg>
);

const StoreIcon = ({ color, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 3h20l-2 7H4L2 3z" />
    <Path d="M4 10v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V10" />
    <Path d="M9 21V13h6v8" />
  </Svg>
);

const HomeIcon = ({ color, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);

const AgentIcon = ({ color, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </Svg>
);

const ChevronRight = ({ color, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);

const PORTALS = [
  {
    key: 'landlord',
    title: 'Landlord Portal',
    subtitle: 'Manage properties & tenants',
    accent: '#e11d48',
    Icon: KeyIcon,
  },
  {
    key: 'biashara',
    title: 'AxxBiashara',
    subtitle: 'Manage your business directory',
    accent: '#fbbf24',
    Icon: StoreIcon,
  },
  {
    key: 'accommodation',
    title: 'Accommodation',
    subtitle: 'Manage properties & bookings',
    accent: '#10b981',
    Icon: HomeIcon,
  },
  {
    key: 'agent',
    title: 'Agent Portal',
    subtitle: 'Manage listings & partnerships',
    accent: '#fbbf24',
    Icon: AgentIcon,
  },
];

function PortalCard({ portal, onPress, delay }) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const { title, subtitle, accent, Icon } = portal;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, delay, useNativeDriver: true,
      tension: 60, friction: 8,
    }).start();
  }, []);

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
        { scale },
      ],
    }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.card, {
          backgroundColor: colors.backgroundElement,
          borderColor: accent + '40',
          shadowColor: accent,
        }]}>
          {/* Left accent stripe */}
          <View style={[styles.stripe, { backgroundColor: accent }]} />

          {/* Icon circle */}
          <View style={[styles.iconCircle, { backgroundColor: accent + '18' }]}>
            <Icon color={accent} size={22} />
          </View>

          {/* Text */}
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>{subtitle}</Text>
          </View>

          {/* Arrow */}
          <ChevronRight color={accent} size={18} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PortalSelectorScreen({ onSelectPortal }) {
  const { colors } = useTheme();
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>

        {/* Header */}
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
        }]}>
          <View style={[styles.logoMark, { backgroundColor: '#e11d48' }]}>
            <Text style={styles.logoText}>AXX</Text>
          </View>
          <Text style={[styles.brandName, { color: colors.text }]}>AXXSPACE</Text>
          <Text style={[styles.brandSub, { color: colors.textMuted }]}>Select your portal to continue</Text>
        </Animated.View>

        {/* Portal cards */}
        <View style={styles.cards}>
          {PORTALS.map((portal, i) => (
            <PortalCard
              key={portal.key}
              portal={portal}
              delay={100 + i * 120}
              onPress={() => onSelectPortal(portal.key)}
            />
          ))}
        </View>

        {/* Footer */}
        <Animated.Text style={[styles.footer, { color: colors.textMuted, opacity: headerAnim }]}>
          AXX Spaces Manager
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
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    justifyContent: 'space-between',
  },
  header: { alignItems: 'center', paddingTop: Spacing.four, paddingBottom: Spacing.two },
  logoMark: {
    width: 72, height: 72, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.two,
    shadowColor: '#e11d48', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  brandName: { fontSize: 26, fontWeight: '900', letterSpacing: 4, marginBottom: 6 },
  brandSub: { fontSize: FontSize.sm, fontWeight: '500', letterSpacing: 0.3 },

  cards: { flex: 1, justifyContent: 'center', gap: 12 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 18,
    paddingRight: 18,
    paddingLeft: 0,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 5,
  },
  stripe: {
    width: 5,
    alignSelf: 'stretch',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    marginRight: 14,
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: FontSize.md, fontWeight: '800', letterSpacing: -0.2, marginBottom: 3 },
  cardSub: { fontSize: FontSize.sm, fontWeight: '500' },

  footer: { textAlign: 'center', fontSize: 11, letterSpacing: 0.5, paddingBottom: Spacing.two },
});
