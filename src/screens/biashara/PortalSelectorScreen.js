import React, { useRef, useEffect, useState } from 'react';
import {
  Image, View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polyline } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { FontSize } from '../../constants/theme';
import { checkForAppUpdate, openAppUpdatePage } from '../../services/appUpdate';

const ChevronRight = ({ color, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);

const AXX_LOGO         = require('../../../assets/axx-logo.jpg');
const MARKETPLACE_LOGO = require('../../../assets/marketplace-logo.png');

const PORTALS = [
  {
    key: 'landlord',
    title: 'Landlord Portal',
    subtitle: 'Manage properties & tenants',
    accent: '#e11d48',
    logo: AXX_LOGO,
  },
  {
    key: 'biashara',
    title: 'AxxBiashara',
    subtitle: 'Manage your business directory',
    accent: '#e11d48',
    logo: MARKETPLACE_LOGO,
    whiteBadge: true,
  },
  {
    key: 'accommodation',
    title: 'Accommodation',
    subtitle: 'Manage properties & bookings',
    accent: '#e11d48',
    logo: AXX_LOGO,
  },
  {
    key: 'agent',
    title: 'Agent Portal',
    subtitle: 'Manage listings & partnerships',
    accent: '#e11d48',
    logo: AXX_LOGO,
  },
];

function PortalCard({ portal, onPress, delay }) {
  const { colors } = useTheme();
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const { title, subtitle, accent, logo, whiteBadge } = portal;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, delay, useNativeDriver: true,
      tension: 60, friction: 8,
    }).start();
  }, []);

  const handlePressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
        { scale },
      ],
    }}>
      <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={[styles.card, {
          backgroundColor: colors.backgroundElement,
          borderColor: accent + '40',
          shadowColor: accent,
        }]}>
          <View style={[styles.stripe, { backgroundColor: accent }]} />

          <View style={[styles.iconCircle, { backgroundColor: accent + '18' }]}>
            {whiteBadge ? (
              <View style={styles.whiteBadge}>
                <Image source={logo} style={styles.badgeImg} resizeMode="cover" />
              </View>
            ) : (
              <Image source={logo} style={styles.cardLogo} resizeMode="contain" />
            )}
          </View>

          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>{subtitle}</Text>
          </View>

          <ChevronRight color={accent} size={18} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PortalSelectorScreen({ onSelectPortal }) {
  const { colors } = useTheme();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-16)).current;
  const [updateRelease, setUpdateRelease] = useState(null);

  useEffect(() => {
    let active = true;
    checkForAppUpdate().then((release) => {
      if (active && release) setUpdateRelease(release);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>

        {/* ── Hero Header ── */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Logo with glow ring */}
          <View style={styles.logoRing}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>

          {/* Styled brand name — AXX in red, SPACE in navy */}
          <View style={styles.brandRow}>
            <Text style={styles.brandAxx}>AXX</Text>
            <Text style={styles.brandSpace}>SPACE</Text>
          </View>

          {/* Coloured accent dots */}
          <View style={styles.dotsRow}>
            <View style={[styles.dot, { backgroundColor: '#e11d48' }]} />
            <View style={[styles.dot, { backgroundColor: '#e11d48' }]} />
            <View style={[styles.dot, { backgroundColor: '#1e3a5f' }]} />
          </View>

          <Text style={[styles.brandSub, { color: colors.textMuted }]}>
            Property · Business · Accommodation · Agents
          </Text>
        </Animated.View>

        {/* ── Update reminder (only when a newer APK is published) ── */}
        {updateRelease ? (
          <TouchableOpacity
            style={styles.updateNotice}
            onPress={openAppUpdatePage}
            activeOpacity={0.8}
            accessibilityRole="link"
            accessibilityLabel={`Update Axxspace Manager to version ${updateRelease.latestVersion} on the website`}
          >
            <View style={styles.updateNoticeBody}>
              <Text style={styles.updateNoticeTitle}>
                Update available: Axxspace Manager {updateRelease.latestVersion}
              </Text>
              <Text style={styles.updateNoticeLink}>Update on axxspace.com</Text>
            </View>
            <ChevronRight color="#1e3a5f" size={16} />
          </TouchableOpacity>
        ) : null}

        {/* ── Portal cards ── */}
        <View style={styles.cards}>
          {PORTALS.map((portal, i) => (
            <PortalCard
              key={portal.key}
              portal={portal}
              delay={80 + i * 100}
              onPress={() => onSelectPortal(portal.key)}
            />
          ))}
        </View>

        {/* ── Footer ── */}
        <Animated.Text style={[styles.footer, { color: colors.textMuted, opacity: fadeAnim }]}>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },

  /* ── Header ── */
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },

  /* Glowing ring around logo */
  logoRing: {
    width: 130, height: 130,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: '#e11d48',
    backgroundColor: '#e11d48',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%', height: '100%',
  },

  /* AXX SPACE styled */
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  brandAxx: {
    fontSize: 36,
    fontWeight: '900',
    color: '#e11d48',
    letterSpacing: 3,
  },
  brandSpace: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1e3a5f',
    letterSpacing: 3,
  },

  /* Three brand color dots */
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
  },

  brandSub: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  /* ── Cards ── */
  cards: { flex: 1, justifyContent: 'center', gap: 12 },

  /* ── Update reminder ── */
  updateNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#1e3a5f33',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  updateNoticeBody: { flex: 1, marginRight: 10 },
  updateNoticeTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1e3a5f',
    marginBottom: 2,
  },
  updateNoticeLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e3a5f',
    textDecorationLine: 'underline',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 16,
    paddingRight: 18,
    paddingLeft: 0,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  stripe: {
    width: 5, alignSelf: 'stretch',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    marginRight: 14,
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14, overflow: 'hidden',
  },
  cardLogo:  { width: 40, height: 40, borderRadius: 10 },
  whiteBadge: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#fff', overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
  },
  badgeImg: { width: 40, height: 40 },

  cardText:  { flex: 1 },
  cardTitle: { fontSize: FontSize.md, fontWeight: '800', letterSpacing: -0.2, marginBottom: 3 },
  cardSub:   { fontSize: FontSize.sm, fontWeight: '500' },

  footer: {
    textAlign: 'center', fontSize: 11,
    letterSpacing: 0.5, paddingTop: 12,
  },
});
