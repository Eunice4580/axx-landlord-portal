import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Image, StyleSheet, TouchableOpacity, Text,
  PanResponder, ActivityIndicator, Modal,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

const CORNER_HIT = 48;  // px — zone around each corner that triggers resize
const MIN_SIZE   = 60;  // minimum crop box side in px

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/**
 * Detect which zone of the crop box was touched.
 * Returns: 'tl' | 'tr' | 'bl' | 'br' | 'drag' | 'none'
 */
function touchZone(lx, ly, c, hit) {
  const inBox = lx >= c.x && lx <= c.x + c.w && ly >= c.y && ly <= c.y + c.h;
  if (!inBox) return 'none';
  const nearL = lx <= c.x + hit;
  const nearR = lx >= c.x + c.w - hit;
  const nearT = ly <= c.y + hit;
  const nearB = ly >= c.y + c.h - hit;
  if (nearT && nearL) return 'tl';
  if (nearT && nearR) return 'tr';
  if (nearB && nearL) return 'bl';
  if (nearB && nearR) return 'br';
  return 'drag';
}

export default function ImageCropModal({
  visible, imageUri, imageWidth, imageHeight, onDone, onCancel,
}) {
  /* ── refs ── */
  const imgRef     = useRef(null);               // rendered image bounds { x, y, w, h }
  const cropRef    = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const overlayRef = useRef(null);               // for measure()
  const overlayOff = useRef({ x: 0, y: 0 });    // screen position of overlay
  const zone       = useRef('none');             // current gesture zone
  const g0         = useRef(null);               // crop snapshot at gesture start

  /* ── state ── */
  const [crop, setCrop]             = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [croppedUri, setCroppedUri] = useState(null);
  const [busy, setBusy]             = useState(false);
  const [ready, setReady]           = useState(false);
  const [areaKey, setAreaKey]       = useState(0); // increment → forces onLayout to re-fire

  /* ── reset on every open ── */
  useEffect(() => {
    if (visible) {
      imgRef.current  = null;
      cropRef.current = { x: 0, y: 0, w: 0, h: 0 };
      setCrop({ x: 0, y: 0, w: 0, h: 0 });
      setCroppedUri(null);
      setBusy(false);
      setReady(false);
      setAreaKey(k => k + 1); // remount imageArea → guarantees onLayout fires
    }
  }, [visible, imageUri]);

  /* ── compute image render bounds inside the area ── */
  const onAreaLayout = useCallback((e) => {
    const { width: aW, height: aH } = e.nativeEvent.layout;
    if (!imageWidth || !imageHeight || aW <= 0 || aH <= 0) return;
    const iA = imageWidth / imageHeight;
    const aA = aW / aH;
    let dW, dH, oX, oY;
    if (iA > aA) {
      dW = aW;  dH = aW / iA;  oX = 0;            oY = (aH - dH) / 2;
    } else {
      dH = aH;  dW = aH * iA;  oX = (aW - dW) / 2; oY = 0;
    }
    const ib = { x: oX, y: oY, w: dW, h: dH };
    imgRef.current  = ib;
    cropRef.current = { ...ib };
    setCrop({ ...ib });
    setReady(true);
  }, [imageWidth, imageHeight]);

  /* ── measure screen position of overlay for reliable touch coords ── */
  const measureOverlay = useCallback(() => {
    overlayRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      overlayOff.current = { x: pageX || 0, y: pageY || 0 };
    });
  }, []);

  /* ── single PanResponder handles drag + all 4 corner resizes ── */
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => imgRef.current !== null,
    onMoveShouldSetPanResponder:  () => false,

    onPanResponderGrant: (e) => {
      // pageX/pageY are reliable on Android; locationX/Y are not
      const lx = (e.nativeEvent.pageX ?? 0) - overlayOff.current.x;
      const ly = (e.nativeEvent.pageY ?? 0) - overlayOff.current.y;
      zone.current = touchZone(lx, ly, cropRef.current, CORNER_HIT);
      g0.current   = { ...cropRef.current };
    },

    onPanResponderMove: (_, g) => {
      const ib = imgRef.current;
      const c0 = g0.current;
      if (!ib || !c0 || zone.current === 'none') return;

      const { dx, dy } = g;
      const maxX = ib.x + ib.w;
      const maxY = ib.y + ib.h;
      let next = { ...c0 };

      switch (zone.current) {
        case 'drag':
          // Move the whole box
          next.x = clamp(c0.x + dx, ib.x, maxX - c0.w);
          next.y = clamp(c0.y + dy, ib.y, maxY - c0.h);
          break;

        case 'br':
          // Bottom-right: TL corner is fixed
          next.w = clamp(c0.w + dx, MIN_SIZE, maxX - c0.x);
          next.h = clamp(c0.h + dy, MIN_SIZE, maxY - c0.y);
          break;

        case 'bl': {
          // Bottom-left: TR corner is fixed (x+w and y are fixed)
          const newX = clamp(c0.x + dx, ib.x, c0.x + c0.w - MIN_SIZE);
          next.x = newX;
          next.w = c0.x + c0.w - newX;
          next.h = clamp(c0.h + dy, MIN_SIZE, maxY - c0.y);
          break;
        }

        case 'tr': {
          // Top-right: BL corner is fixed (x and y+h are fixed)
          const newY = clamp(c0.y + dy, ib.y, c0.y + c0.h - MIN_SIZE);
          next.y = newY;
          next.w = clamp(c0.w + dx, MIN_SIZE, maxX - c0.x);
          next.h = c0.y + c0.h - newY;
          break;
        }

        case 'tl': {
          // Top-left: BR corner is fixed (x+w and y+h are fixed)
          const newX = clamp(c0.x + dx, ib.x, c0.x + c0.w - MIN_SIZE);
          const newY = clamp(c0.y + dy, ib.y, c0.y + c0.h - MIN_SIZE);
          next.x = newX;
          next.y = newY;
          next.w = c0.x + c0.w - newX;
          next.h = c0.y + c0.h - newY;
          break;
        }
      }

      cropRef.current = next;
      setCrop({ ...next });
    },

    onPanResponderRelease: () => { zone.current = 'none'; },
  })).current;

  /* ── Apply crop ── */
  const handleCrop = async () => {
    const ib = imgRef.current;
    if (!ib || busy) return;
    setBusy(true);
    try {
      const scX     = imageWidth  / ib.w;
      const scY     = imageHeight / ib.h;
      const originX = Math.max(0, Math.round((crop.x - ib.x) * scX));
      const originY = Math.max(0, Math.round((crop.y - ib.y) * scY));
      const cW      = Math.min(imageWidth  - originX, Math.round(crop.w * scX));
      const cH      = Math.min(imageHeight - originY, Math.round(crop.h * scY));
      const result  = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop: { originX, originY, width: cW, height: cH } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
      );
      setCroppedUri(result.uri);
    } catch (err) {
      console.error('Crop error:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleRecrop = () => {
    setCroppedUri(null);
    const ib = imgRef.current;
    if (ib) { cropRef.current = { ...ib }; setCrop({ ...ib }); }
  };

  const handleDone = () => onDone(croppedUri || imageUri);

  const ib = imgRef.current || { x: 0, y: 0, w: 0, h: 0 };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={ss.root}>

        {/* ── Top bar ── */}
        <View style={ss.topBar}>
          <TouchableOpacity onPress={onCancel} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
            <Text style={ss.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={ss.topTitle}>Crop Photo</Text>
          <TouchableOpacity onPress={handleDone} disabled={busy} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
            <Text style={[ss.doneText, busy && { opacity: 0.4 }]}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* ── Image + crop overlay ── */}
        <View key={areaKey} style={ss.imageArea} onLayout={onAreaLayout}>
          <Image
            source={{ uri: croppedUri || imageUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />

          {ready && !croppedUri && (
            <View
              ref={overlayRef}
              style={StyleSheet.absoluteFill}
              onLayout={measureOverlay}
              {...pan.panHandlers}
            >
              {/* Dark shade outside crop box */}
              <View style={[ss.shade, { left: ib.x, top: ib.y, width: ib.w, height: Math.max(0, crop.y - ib.y) }]} />
              <View style={[ss.shade, { left: ib.x, top: crop.y + crop.h, width: ib.w, height: Math.max(0, (ib.y + ib.h) - (crop.y + crop.h)) }]} />
              <View style={[ss.shade, { left: ib.x, top: crop.y, width: Math.max(0, crop.x - ib.x), height: crop.h }]} />
              <View style={[ss.shade, { left: crop.x + crop.w, top: crop.y, width: Math.max(0, (ib.x + ib.w) - (crop.x + crop.w)), height: crop.h }]} />

              {/* Crop box (pointerEvents none so PanResponder on parent handles all touches) */}
              <View pointerEvents="none" style={[ss.cropBox, { left: crop.x, top: crop.y, width: crop.w, height: crop.h }]}>
                {/* Rule-of-thirds grid */}
                <View style={[ss.grid, { top: '33.3%', left: 0, right: 0, height: StyleSheet.hairlineWidth }]} />
                <View style={[ss.grid, { top: '66.6%', left: 0, right: 0, height: StyleSheet.hairlineWidth }]} />
                <View style={[ss.grid, { left: '33.3%', top: 0, bottom: 0, width: StyleSheet.hairlineWidth }]} />
                <View style={[ss.grid, { left: '66.6%', top: 0, bottom: 0, width: StyleSheet.hairlineWidth }]} />

                {/* All 4 corner handles */}
                <View style={[ss.corner, ss.cTL]} />
                <View style={[ss.corner, ss.cTR]} />
                <View style={[ss.corner, ss.cBL]} />
                <View style={[ss.corner, ss.cBR]} />
              </View>
            </View>
          )}

          {busy && (
            <View style={ss.busyOverlay}>
              <ActivityIndicator size="large" color="#e11d48" />
              <Text style={ss.busyText}>Cropping…</Text>
            </View>
          )}
        </View>

        {/* ── Bottom bar ── */}
        <View style={ss.bottomBar}>
          {croppedUri ? (
            <>
              <TouchableOpacity style={ss.recropBtn} onPress={handleRecrop} activeOpacity={0.8}>
                <Text style={ss.recropText}>Re-crop</Text>
              </TouchableOpacity>
              <Text style={ss.previewHint}>Tap Done to save</Text>
            </>
          ) : (
            <TouchableOpacity
              style={[ss.cropBtn, busy && { opacity: 0.4 }]}
              onPress={handleCrop}
              disabled={busy}
              activeOpacity={0.8}
            >
              <Text style={ss.cropBtnText}>Crop</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </Modal>
  );
}

/* ── Styles ── */
const T = 3;   // corner border thickness
const C = 24;  // corner handle size

const ss = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: '#111',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2d2d2d',
  },
  topTitle:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelText: { color: '#9ca3af', fontSize: 15, fontWeight: '600', minWidth: 60 },
  doneText:   { color: '#e11d48', fontSize: 15, fontWeight: '800', minWidth: 60, textAlign: 'right' },

  imageArea: { flex: 1, backgroundColor: '#000' },

  shade:   { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.58)' },
  cropBox: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' },
  grid:    { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.28)' },

  corner:  { position: 'absolute', width: C, height: C },
  cTL:     { top: -T / 2, left: -T / 2,     borderTopWidth: T,    borderLeftWidth: T,  borderColor: '#e11d48' },
  cTR:     { top: -T / 2, right: -T / 2,    borderTopWidth: T,    borderRightWidth: T, borderColor: '#e11d48' },
  cBL:     { bottom: -T / 2, left: -T / 2,  borderBottomWidth: T, borderLeftWidth: T,  borderColor: '#e11d48' },
  cBR:     { bottom: -T / 2, right: -T / 2, borderBottomWidth: T, borderRightWidth: T, borderColor: '#e11d48' },

  busyOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  busyText: { color: '#e11d48', fontSize: 14, fontWeight: '600' },

  bottomBar: {
    backgroundColor: '#111', paddingVertical: 20, paddingHorizontal: 24, paddingBottom: 38,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#2d2d2d',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 18,
  },
  cropBtn:     { backgroundColor: '#e11d48', paddingHorizontal: 48, paddingVertical: 14, borderRadius: 12 },
  cropBtnText: { color: '#1f2937', fontSize: 16, fontWeight: '800' },
  recropBtn:   { backgroundColor: '#374151', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  recropText:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  previewHint: { color: '#9ca3af', fontSize: 13, fontWeight: '500' },
});
