import React, { createContext, useContext, useState } from 'react';

const LightColors = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  background: '#ffffff',
  backgroundElement: '#F0F0F3',
  text: '#000000',
  textSecondary: '#60646C',
  success: '#22c55e',
  danger: '#ef4444',
  border: '#E0E1E6',
};

const DarkColors = {
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  background: '#121212',
  backgroundElement: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#a0a4ab',
  success: '#22c55e',
  danger: '#ef4444',
  border: '#2e3135',
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
