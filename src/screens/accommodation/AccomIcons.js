import React from 'react';
import Svg, { Path, Rect, Circle, Polyline, Line } from 'react-native-svg';

const d = (size, color, sw = 1.8) => ({
  width: size, height: size, fill: 'none',
  stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round',
});

export const HomeIcon = ({ color = '#94a3b8', size = 20 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);

export const CalendarIcon = ({ color = '#94a3b8', size = 20 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Line x1="16" y1="2" x2="16" y2="6" />
    <Line x1="8" y1="2" x2="8" y2="6" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);

export const BarChartIcon = ({ color = '#94a3b8', size = 20 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Line x1="18" y1="20" x2="18" y2="10" />
    <Line x1="12" y1="20" x2="12" y2="4" />
    <Line x1="6" y1="20" x2="6" y2="14" />
    <Line x1="2" y1="20" x2="22" y2="20" />
  </Svg>
);

export const UserIcon = ({ color = '#94a3b8', size = 20 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

export const ArrowLeftIcon = ({ color = '#94a3b8', size = 18 }) => (
  <Svg {...d(size, color, 2.5)} viewBox="0 0 24 24">
    <Line x1="19" y1="12" x2="5" y2="12" />
    <Polyline points="12 19 5 12 12 5" />
  </Svg>
);

export const EyeIcon = ({ color = '#94a3b8', size = 17 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

export const EyeOffIcon = ({ color = '#94a3b8', size = 17 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
);

export const CheckIcon = ({ color = '#22c55e', size = 15 }) => (
  <Svg {...d(size, color, 2.5)} viewBox="0 0 24 24">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

export const AlertIcon = ({ color = '#ef4444', size = 15 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);

export const StarIcon = ({ color = '#fbbf24', size = 12, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? color : 'none'} stroke={color} strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
  </Svg>
);

export const LocationIcon = ({ color = '#94a3b8', size = 13 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

export const RefreshIcon = ({ color = '#94a3b8', size = 18 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Polyline points="23 4 23 10 17 10" />
    <Polyline points="1 20 1 14 7 14" />
    <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </Svg>
);

export const LogoutIcon = ({ color = '#ef4444', size = 18 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </Svg>
);

export const ShieldCheckIcon = ({ color = '#22c55e', size = 14 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Polyline points="9 12 11 14 15 10" />
  </Svg>
);

export const EditIcon = ({ color = '#10b981', size = 16 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

export const SunIcon = ({ color = '#10b981', size = 16 }) => (
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

export const MoonIcon = ({ color = '#10b981', size = 16 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Svg>
);

export const TrashIcon = ({ color = '#ef4444', size = 16 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <Line x1="10" y1="11" x2="10" y2="17" />
    <Line x1="14" y1="11" x2="14" y2="17" />
  </Svg>
);

export const PlusIcon = ({ color = '#fff', size = 18 }) => (
  <Svg {...d(size, color, 2.5)} viewBox="0 0 24 24">
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

export const ChevronRightIcon = ({ color = '#94a3b8', size = 16 }) => (
  <Svg {...d(size, color, 2.5)} viewBox="0 0 24 24">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);

export const CameraIcon = ({ color = '#10b981', size = 18 }) => (
  <Svg {...d(size, color)} viewBox="0 0 24 24">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);
