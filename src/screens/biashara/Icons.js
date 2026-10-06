/**
 * Shared SVG icon components for the AxxBiashara portal.
 * All icons use react-native-svg (already installed in the project).
 * No emojis — professional line icons only.
 */
import React from 'react';
import Svg, { Path, Rect, Circle, Polyline, Line, Polygon } from 'react-native-svg';

const d = (size, color, strokeWidth = 1.8) => ({
  width: size, height: size, fill: 'none',
  stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
});

export const SearchIcon = ({ color = '#94a3b8', size = 18 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Circle cx="11" cy="11" r="8" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
);

export const LocationIcon = ({ color = '#94a3b8', size = 14 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

export const StarIcon = ({ color = '#fbbf24', size = 14, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Svg>
);

export const PhoneIcon = ({ color = '#94a3b8', size = 18 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.47 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" />
  </Svg>
);

export const MailIcon = ({ color = '#94a3b8', size = 18 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <Polyline points="22,6 12,13 2,6" />
  </Svg>
);

export const GlobeIcon = ({ color = '#94a3b8', size = 18 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="2" y1="12" x2="22" y2="12" />
    <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Svg>
);

export const MessageIcon = ({ color = '#22c55e', size = 18 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

export const FacebookIcon = ({ color = '#94a3b8', size = 18 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </Svg>
);

export const InstagramIcon = ({ color = '#94a3b8', size = 18 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <Path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <Line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </Svg>
);

export const TwitterIcon = ({ color = '#94a3b8', size = 18 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </Svg>
);

export const LogoutIcon = ({ color = '#ef4444', size = 18 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </Svg>
);

export const UserIcon = ({ color = '#94a3b8', size = 18 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

export const EyeIcon = ({ color = '#94a3b8', size = 16 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

export const EyeOffIcon = ({ color = '#94a3b8', size = 16 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
);

export const CheckIcon = ({ color = '#22c55e', size = 16 }) => (
  <Svg {...d(size, color, 2.5)} viewBox="0 0 24 24">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

export const AlertIcon = ({ color = '#ef4444', size = 16 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);

export const ChevronRightIcon = ({ color = '#94a3b8', size = 16 }) => (
  <Svg {...d(size, color, 2.5)} viewBox="0 0 24 24">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);

export const ArrowLeftIcon = ({ color = '#fbbf24', size = 16 }) => (
  <Svg {...d(size, color, 2.5)} viewBox="0 0 24 24">
    <Line x1="19" y1="12" x2="5" y2="12" />
    <Polyline points="12 19 5 12 12 5" />
  </Svg>
);

export const FilterIcon = ({ color = '#94a3b8', size = 16 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </Svg>
);

export const RefreshIcon = ({ color = '#fbbf24', size = 16 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Polyline points="23 4 23 10 17 10" />
    <Polyline points="1 20 1 14 7 14" />
    <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </Svg>
);

export const StoreIcon = ({ color = '#fbbf24', size = 24 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M2 3h20l-2 7H4L2 3z" />
    <Path d="M4 10v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V10" />
    <Path d="M9 21V13h6v8" />
  </Svg>
);

export const BuildingIcon = ({ color = '#e11d48', size = 24 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Rect x="3" y="2" width="18" height="20" rx="1" />
    <Path d="M9 22V12h6v10" />
    <Rect x="6" y="6" width="3" height="3" />
    <Rect x="15" y="6" width="3" height="3" />
    <Rect x="6" y="11" width="3" height="3" />
    <Rect x="15" y="11" width="3" height="3" />
  </Svg>
);

export const BarChartIcon = ({ color = '#fbbf24', size = 20 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Line x1="18" y1="20" x2="18" y2="10" />
    <Line x1="12" y1="20" x2="12" y2="4" />
    <Line x1="6" y1="20" x2="6" y2="14" />
    <Line x1="2" y1="20" x2="22" y2="20" />
  </Svg>
);

export const ShieldCheckIcon = ({ color = '#22c55e', size = 14 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Polyline points="9 12 11 14 15 10" />
  </Svg>
);

export const ClockIcon = ({ color = '#f59e0b', size = 14 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);

export const GridIcon = ({ color = '#94a3b8', size = 16 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Rect x="3" y="3" width="7" height="7" />
    <Rect x="14" y="3" width="7" height="7" />
    <Rect x="14" y="14" width="7" height="7" />
    <Rect x="3" y="14" width="7" height="7" />
  </Svg>
);

export const EditIcon = ({ color = '#fbbf24', size = 16 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

export const SunIcon = ({ color = '#fbbf24', size = 16 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="5" />
    <Line x1="12" y1="1" x2="12" y2="3" />
    <Line x1="12" y1="21" x2="12" y2="23" />
    <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <Line x1="1" y1="12" x2="3" y2="12" />
    <Line x1="21" y1="12" x2="23" y2="12" />
    <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </Svg>
);

export const MoonIcon = ({ color = '#fbbf24', size = 16 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Svg>
);

export const BarChartIcon = ({ color = '#94a3b8', size = 18 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Line x1="18" y1="20" x2="18" y2="10" />
    <Line x1="12" y1="20" x2="12" y2="4" />
    <Line x1="6"  y1="20" x2="6"  y2="14" />
    <Line x1="2"  y1="20" x2="22" y2="20" />
  </Svg>
);
