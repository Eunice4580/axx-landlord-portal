import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Image, Dimensions, Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import Svg, { Path, Circle, Rect, Line, Polygon, Text as SvgText } from 'react-native-svg';

/* ── Brand palette — exact match with website */
const NAVY  = '#081A34';
const RED   = '#d9383a';
const WHITE = '#ffffff';

const LOGO = require('../../assets/qr-logo.png');

/* ── Responsive poster width: 92% of screen, max 380 */
const { width: SCREEN_W } = Dimensions.get('window');
const PW = Math.min(Math.round(SCREEN_W * 0.92), 380);
const MEET_X = Math.round(PW * 0.30); // mirrors website: 240/800 = 30%
const AXXSPACE_WEB = 'https://axxspace.com';

const SOURCES = [
  { value: 'generic',          label: 'General / Digital Link' },
  { value: 'gate',             label: 'Gate Poster' },
  { value: 'building_outside', label: 'Building Exterior' },
  { value: 'noticeboard',      label: 'Noticeboard' },
  { value: 'shop_nearby',      label: 'Local Shop/Kiosk' },
  { value: 'office',           label: 'Landlord Office' },
  { value: 'vacancy_sign',     label: 'Vacancy Signboard' },
];

/* ── Icons */
const ArrowLeftIcon = ({ size = 22, color = NAVY }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 12H5M12 5l-7 7 7 7" />
  </Svg>
);
const ShareIcon = ({ size = 18, color = WHITE }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="18" cy="5" r="3" /><Circle cx="6" cy="12" r="3" /><Circle cx="18" cy="19" r="3" />
    <Path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
  </Svg>
);
const GlobeIcon = ({ size = 11, color = WHITE }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="2" y1="12" x2="22" y2="12" />
    <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Svg>
);
const MailIcon = ({ size = 13, color = NAVY }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="4" width="20" height="16" rx="2" /><Path d="M22 7l-10 7L2 7" />
  </Svg>
);
const WhatsAppIcon = ({ size = 13, color = NAVY }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.761.459 3.475 1.33 4.988l-1.417 5.176 5.297-1.39a9.939 9.939 0 0 0 4.778 1.214h.004c5.506 0 9.988-4.482 9.988-9.988.001-2.66-1.034-5.161-2.92-7.052A9.92 9.92 0 0 0 12.012 2zm5.727 13.916c-.244.686-1.22 1.262-1.682 1.344-.462.081-.926.156-3.033-.674-2.529-.993-4.148-3.565-4.274-3.732-.127-.168-.946-1.258-.946-2.398 0-1.14.597-1.705.809-1.928.212-.224.462-.28.618-.28h.442c.112 0 .262-.042.411.319.15.362.511 1.25.555 1.34.043.089.073.193.013.31-.06.117-.089.192-.178.297-.09.104-.188.232-.269.31-.089.088-.182.183-.078.36.104.178.461.76.99 1.23.681.605 1.254.793 1.43.882.176.088.277.074.379-.044.103-.118.441-.518.56-.695.118-.178.238-.148.397-.089.159.059 1.011.477 1.184.566.173.089.288.134.332.208.044.074.044.431-.2.116z" />
  </Svg>
);
const InstagramIcon = ({ size = 11, color = NAVY }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <Path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <Line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </Svg>
);
const TikTokIcon = ({ size = 11, color = NAVY }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12.525.02c1.31.02 2.61.35 3.75 1 .1-.8.4-1.56.9-2.2H12.85v14.1c0 2.26-1.89 4.1-4.22 4.1-2.33 0-4.22-1.84-4.22-4.1 0-2.26 1.89-4.1 4.22-4.1.47 0 .92.08 1.34.22V6.02c-5 .52-8.84 4.77-8.84 9.98 0 5.52 4.48 10 10 10s10-4.48 10-10V4.82c1.47.88 3.2 1.38 5.02 1.38v-3c-2.33 0-4.38-1.22-5.5-3.08a7.88 7.88 0 0 1-5.18-.1M10.125 15.02c-.93 0-1.68.75-1.68 1.68s.75 1.68 1.68 1.68 1.68-.75 1.68-1.68-.75-1.68-1.68-1.68" />
  </Svg>
);
const XIcon = ({ size = 10, color = NAVY }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </Svg>
);

/* ── Top slanted accent — polygon matching website clipPath: polygon(0 0, 100% 0, 100% 40%, 0 100%) */
const TopSlantedAccent = () => (
  <Svg width={PW} height={16} viewBox={`0 0 ${PW} 16`}>
    <Polygon points={`0,0 ${PW},0 ${PW},6 0,16`} fill={NAVY} />
  </Svg>
);

/* ── Bottom diagonal corner accents — mirrors website canvas triangle drawing */
const BottomAccents = () => (
  <Svg width={PW} height={20} viewBox={`0 0 ${PW} 20`}>
    <Polygon points={`0,0 ${MEET_X},20 0,20`} fill={RED} />
    <Polygon points={`${MEET_X},20 ${PW},0 ${PW},20`} fill={NAVY} />
  </Svg>
);

/* ── House scallop badge (matches website VacancyPoster badge) */
const HouseScallopBadge = ({ size = 88 }) => {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.37, n = 18, d = size * 0.036;
  const pts = [];
  for (let i = 0; i <= 360; i++) {
    const a = (i * Math.PI) / 180;
    const cr = r + Math.sin(a * n) * d;
    pts.push(`${i === 0 ? 'M' : 'L'} ${cx + cr * Math.cos(a)} ${cy + cr * Math.sin(a)}`);
  }
  const scallop = pts.join(' ') + ' Z';
  // House dimensions
  const hBase = cy + size * 0.14;
  const hTop  = cy - size * 0.16;
  const hW    = size * 0.22;
  const dW    = size * 0.08, dH = size * 0.11;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Path d={scallop} fill={NAVY} stroke={RED} strokeWidth="2.5" />
      {/* House body */}
      <Rect x={cx - hW} y={hTop + size * 0.12} width={hW * 2}
        height={hBase - (hTop + size * 0.12)}
        fill="none" stroke={WHITE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Roof */}
      <Path d={`M${cx - hW - 3} ${hTop + size * 0.12} L${cx} ${hTop} L${cx + hW + 3} ${hTop + size * 0.12}`}
        fill="none" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Door */}
      <Rect x={cx - dW / 2} y={hBase - dH} width={dW} height={dH} fill={WHITE} />
      <SvgText x={cx} y={cy + size * 0.22} fill={WHITE}
        fontSize={size * 0.073} fontWeight="bold" textAnchor="middle">Listed On</SvgText>
      <SvgText x={cx} y={cy + size * 0.34} fill={WHITE}
        fontSize={size * 0.088} fontWeight="900" textAnchor="middle">AXXSPACE</SvgText>
    </Svg>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   Vacancy QR Poster — mirrors website VacancyPoster design exactly
══════════════════════════════════════════════════════════════════════ */
function VacancyPoster({ propertyId, source, viewShotRef }) {
  const qrValue = `${AXXSPACE_WEB}/listings/${propertyId}?ref=qr&source=${source}`;
  const qrSize = Math.round(PW * 0.58);

  return (
    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
      <View style={ps.poster}>

        {/* Top slanted navy accent */}
        <TopSlantedAccent />

        {/* Logo section */}
        <View style={ps.logoSection}>
          <Image source={LOGO} style={ps.logoImg} resizeMode="contain" />
          <Text style={ps.logoText}>
            <Text style={{ color: RED }}>AXX</Text>
            <Text style={{ color: NAVY }}> SPACE</Text>
          </Text>
          <Text style={ps.tagline}>Space hunting bila stress</Text>
          <View style={ps.redSeparator} />
        </View>

        {/* ROOM/HOUSE AVAILABLE + scallop badge */}
        <View style={ps.titleSection}>
          <View style={ps.titleTextWrap}>
            <Text style={ps.titleRow1}>ROOM/HOUSE</Text>
            <Text style={ps.titleRow2}>AVAILABLE</Text>
          </View>
          <View style={ps.badgeWrap}>
            <HouseScallopBadge size={Math.round(PW * 0.20)} />
          </View>
        </View>

        <Text style={ps.scanInstruction}>SCAN TO VIEW HOUSE DETAILS AND CONTACTS</Text>

        {/* QR in red-bordered box */}
        <View style={ps.qrContainer}>
          <View style={ps.qrBox}>
            <QRCode 
              value={qrValue} 
              size={qrSize} 
              color={NAVY} 
              backgroundColor={WHITE} 
              ecl="H"
            />
          </View>
        </View>

        {/* OR VISIT */}
        <View style={ps.visitSection}>
          <Text style={ps.orVisit}>OR VISIT</Text>
          <View style={ps.visitPill}>
            <View style={ps.globeCircle}><GlobeIcon size={11} color={WHITE} /></View>
            <Text style={ps.visitUrl}>www.axxspace.com</Text>
          </View>
        </View>

        {/* Contact footer */}
        <View style={ps.contactFooter}>
          <View style={ps.contactItem}>
            <MailIcon size={13} color={NAVY} />
            <Text style={ps.contactText}>info@axxspace.com</Text>
          </View>
          <View style={ps.contactItem}>
            <WhatsAppIcon size={13} color={NAVY} />
            <Text style={ps.contactText}>+254 745 689 773</Text>
          </View>
          <View style={ps.contactItem}>
            <View style={ps.socialIcons}>
              <InstagramIcon size={11} color={NAVY} />
              <TikTokIcon size={11} color={NAVY} />
              <XIcon size={10} color={NAVY} />
            </View>
            <Text style={ps.contactText}>axx.space</Text>
          </View>
        </View>

        {/* Spacer + diagonal bottom accents */}
        <View style={{ height: 20 }} />
        <View style={ps.bottomAccentsWrap}>
          <BottomAccents />
        </View>
      </View>
    </ViewShot>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Main Screen
══════════════════════════════════════════════════════════════════════ */
export default function QRGeneratorScreen({ propertyId, propertyTitle, onBack }) {
  const [source, setSource] = useState('generic');
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const viewShotRef = useRef(null);

  const handleDownloadPoster = async () => {
    try {
      setDownloading(true);
      const uri = await viewShotRef.current.capture();
      
      // Read the captured image
      const imageData = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Save to device Documents folder
      const fileName = `axxspace-poster-${propertyId}-${Date.now()}.png`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Write the file
      await FileSystem.writeAsStringAsync(fileUri, imageData, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      Alert.alert(
        'Poster Saved!', 
        `Saved to: ${fileName}\n\nYou can find it in your Files app.`,
        [{ text: 'OK' }]
      );
      
    } catch (err) {
      console.error(err);
      Alert.alert('Download Failed', err.message || 'Could not save poster.');
    } finally {
      setDownloading(false);
    }
  };

  const handleSharePoster = async () => {
    try {
      setSharing(true);
      const uri = await viewShotRef.current.capture();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Share ${propertyTitle}`,
        });
      } else {
        Alert.alert('Not Available', 'Sharing is not available.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not share poster.');
    } finally {
      setSharing(false);
    }
  };

  const handlePrintPoster = async () => {
    try {
      setSharing(true);
      const uri = await viewShotRef.current.capture();
      
      // Read the image as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Create HTML with the image for printing
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <img src="data:image/png;base64,${base64}" />
          </body>
        </html>
      `;
      
      await Print.printAsync({
        html,
        width: 612,  // A4 width in points
        height: 792, // A4 height in points
      });
      
    } catch (err) {
      console.error(err);
      Alert.alert('Print Failed', err.message || 'Could not open print dialog.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeftIcon size={22} color={NAVY} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>QR Poster</Text>
        <TouchableOpacity onPress={onBack} style={s.closeBtn} activeOpacity={0.7}>
          <Text style={s.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.propTitle} numberOfLines={2}>{propertyTitle}</Text>

        <Text style={s.sourceLabel}>Where will this QR be used?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          <View style={s.chipRow}>
            {SOURCES.map((src) => (
              <TouchableOpacity
                key={src.value}
                style={[s.chip, source === src.value && s.chipActive]}
                onPress={() => setSource(src.value)} activeOpacity={0.7}
              >
                <Text style={[s.chipText, source === src.value && s.chipTextActive]}>
                  {src.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <VacancyPoster propertyId={propertyId} source={source} viewShotRef={viewShotRef} />

        {/* Action Buttons Row */}
        <View style={s.buttonRow}>
          <TouchableOpacity
            style={[s.actionBtn, s.shareBtn, sharing && { opacity: 0.5 }]}
            onPress={handleSharePoster} 
            disabled={sharing || downloading} 
            activeOpacity={0.8}
          >
            <Text style={s.actionBtnText}>Share Poster</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, s.downloadPosterBtn, downloading && { opacity: 0.5 }]}
            onPress={handleDownloadPoster} 
            disabled={downloading || sharing} 
            activeOpacity={0.8}
          >
            <Text style={s.actionBtnText}>Download Poster</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.printBtn, (downloading || sharing) && { opacity: 0.5 }]}
          onPress={handlePrintPoster} 
          disabled={downloading || sharing} 
          activeOpacity={0.8}
        >
          <Text style={s.printBtnText}>Print Poster (A4 PDF)</Text>
        </TouchableOpacity>

        <Text style={s.hint}>
          Save this poster and use it on a gate, noticeboard, or flyer.
          Anyone who scans it goes straight to this property.
        </Text>
      </ScrollView>
    </View>
  );
}

/* ── Poster styles */
const ps = StyleSheet.create({
  poster: {
    width: PW, backgroundColor: WHITE, borderRadius: 12,
    overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  logoSection:  { alignItems: 'center', paddingTop: 14 },
  logoImg:      { width: PW * 0.18, height: PW * 0.18, borderRadius: 8, marginBottom: 6 },
  logoText:     { fontSize: PW * 0.075, fontWeight: '900', letterSpacing: 1 },
  tagline:      { fontSize: PW * 0.034, color: '#475569', fontWeight: '500', marginTop: 2 },
  redSeparator: { width: PW - 20, height: 3, backgroundColor: RED, marginTop: 10 },

  titleSection:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 6 },
  titleTextWrap:  { flex: 1, justifyContent: 'center' },
  titleRow1:      { fontSize: PW * 0.063, fontWeight: '900', color: NAVY, letterSpacing: -0.5, lineHeight: PW * 0.075 },
  titleRow2:      { fontSize: PW * 0.126, fontWeight: '900', color: RED, letterSpacing: -2, lineHeight: PW * 0.14 },
  badgeWrap:      { alignItems: 'center', justifyContent: 'center', marginLeft: 4 },

  scanInstruction: {
    textAlign: 'center', fontSize: PW * 0.030, fontWeight: '800',
    color: NAVY, letterSpacing: 0.5, marginTop: 4, paddingHorizontal: 16,
  },

  qrContainer: { alignItems: 'center', marginTop: 10 },
  qrBox: {
    width: PW * 0.70, height: PW * 0.70,
    borderWidth: 4, borderColor: RED, borderRadius: 10,
    padding: 10, backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
  },

  visitSection: { alignItems: 'center', marginTop: 10, gap: 5 },
  orVisit:      { fontSize: 11, fontWeight: '800', color: NAVY, letterSpacing: 1 },
  visitPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 2, borderColor: NAVY, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5, backgroundColor: WHITE,
  },
  globeCircle: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: NAVY,
    alignItems: 'center', justifyContent: 'center',
  },
  visitUrl:     { fontSize: 12, fontWeight: '800', color: NAVY, letterSpacing: 0.3 },

  contactFooter: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 9, paddingHorizontal: 8, marginTop: 8,
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  contactItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  contactText:  { fontSize: 10, fontWeight: '700', color: NAVY },
  socialIcons:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bottomAccentsWrap: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});

/* ── Screen styles */
const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#f8f4f0' },
  header: {
    backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  backBtn:      { padding: 4 },
  headerTitle:  { flex: 1, fontSize: 17, fontWeight: '700', color: NAVY },
  closeBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  closeBtnText: { color: NAVY, fontSize: 13, fontWeight: '700' },
  container:    { padding: 20, alignItems: 'center', paddingBottom: 48 },
  propTitle:    { fontSize: 15, fontWeight: '700', color: NAVY, textAlign: 'center', marginBottom: 12 },
  sourceLabel:  { fontSize: 12, fontWeight: '600', color: '#6b7280', alignSelf: 'flex-start', marginBottom: 8 },
  chipScroll:   { alignSelf: 'stretch', marginBottom: 20 },
  chipRow:      { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 12,
  },
  chipActive:     { backgroundColor: RED, borderColor: RED },
  chipText:       { fontSize: 12, color: '#374151' },
  chipTextActive: { color: WHITE, fontWeight: '700' },
  
  buttonRow: {
    flexDirection: 'row', gap: 10, marginTop: 24, alignSelf: 'stretch',
  },
  actionBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  downloadQrBtn: {
    backgroundColor: '#3b82f6',
  },
  shareBtn: {
    backgroundColor: '#8b5cf6',
  },
  downloadPosterBtn: {
    backgroundColor: '#1e3a5f',
  },
  actionBtnText: { 
    color: WHITE, fontSize: 13, fontWeight: '700',
  },
  printBtn: {
    marginTop: 10, backgroundColor: '#1e3a5f', 
    paddingVertical: 14, borderRadius: 10,
    alignItems: 'center', alignSelf: 'stretch',
  },
  printBtnText: { color: '#0f172a', fontSize: 14, fontWeight: '800' },
  
  hint: {
    fontSize: 12, color: '#9ca3af', textAlign: 'center',
    marginTop: 12, lineHeight: 17, paddingHorizontal: 20,
  },
});
