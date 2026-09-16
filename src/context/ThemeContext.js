import React, { createContext, useContext, useState } from 'react';

// ── Dark theme ────────────────────────────────────────────────────────────────
const DarkColors = {
  background: '#0f1729',
  backgroundElement: '#1e293b',
  backgroundElevated: '#162035',

  primary: '#e11d48',       // crimson red
  primaryDark: '#be123c',
  accent: '#fbbf24',

  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',

  border: '#334155',
  borderLight: '#253347',

  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',

  isDark: true,
};

// ── Light theme ───────────────────────────────────────────────────────────────
const LightColors = {
  background: '#f8fafc',
  backgroundElement: '#ffffff',
  backgroundElevated: '#f1f5f9',

  primary: '#e11d48',
  primaryDark: '#be123c',
  accent: '#f59e0b',

  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',

  border: '#e2e8f0',
  borderLight: '#f1f5f9',

  success: '#16a34a',
  danger: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',

  isDark: false,
};

// Keep backward-compat export (defaults to dark)
export const Colors = DarkColors;

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const colors = isDark ? DarkColors : LightColors;

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
