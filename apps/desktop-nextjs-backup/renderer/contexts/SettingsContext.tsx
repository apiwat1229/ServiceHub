import React, { createContext, ReactNode, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

export type Theme = 'light' | 'dark';

export interface SettingsContextType {
  theme: Theme;
  fontSize: number;
  primaryColor: string;
  borderRadius: number;
  fontFamily: string;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
  setPrimaryColor: (color: string) => void;
  setBorderRadius: (radius: number) => void;
  setFontFamily: (font: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  // Directly use the store hook for better performance and simplicity
  const store = useSettingsStore();
  return {
    theme: store.theme,
    fontSize: store.fontSize,
    primaryColor: store.primaryColor,
    borderRadius: store.borderRadius,
    fontFamily: store.fontFamily,
    setTheme: store.setTheme,
    setFontSize: store.setFontSize,
    setPrimaryColor: store.setPrimaryColor,
    setBorderRadius: store.setBorderRadius,
    setFontFamily: store.setFontFamily,
  };
};

// Helper to convert Hex to HSL
const hexToHSL = (hex: string) => {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt('0x' + hex[1] + hex[1]);
    g = parseInt('0x' + hex[2] + hex[2]);
    b = parseInt('0x' + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt('0x' + hex[1] + hex[2]);
    g = parseInt('0x' + hex[3] + hex[4]);
    b = parseInt('0x' + hex[5] + hex[6]);
  }

  r /= 255;
  g /= 255;
  b /= 255;

  let cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin,
    h = 0,
    s = 0,
    l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
};

interface SettingsProviderProps {
  children: ReactNode;
  initialSettings?: any; // For backward compatibility if needed
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { theme, fontSize, primaryColor, borderRadius, fontFamily } = useSettingsStore();

  // Apply settings to document root (Side Effects)
  useEffect(() => {
    const root = document.documentElement;

    // Apply theme
    root.setAttribute('data-theme', theme);
    // localStorage handled by persist middleware

    // Apply font size
    root.style.setProperty('--base-font-size', `${fontSize}px`);
    // Force global font size scaling on HTML element
    root.style.fontSize = `${fontSize}px`;

    // Apply primary color (Hex for simple usage)
    root.style.setProperty('--primary-color', primaryColor);

    // Apply primary color (HSL for Tailwind/Shadcn)
    const hsl = hexToHSL(primaryColor);
    root.style.setProperty('--primary', hsl);
    // Also update ring color to match primary for focus states
    root.style.setProperty('--ring', hsl);

    // Apply border radius
    root.style.setProperty('--border-radius', `${borderRadius}px`);
    root.style.setProperty('--radius', `${borderRadius / 16}rem`); // Update Tailwind's --radius

    // Apply font family
    root.style.setProperty('--font-family', fontFamily);
    // Force global font family on HTML element
    root.style.fontFamily = fontFamily;
  }, [theme, fontSize, primaryColor, borderRadius, fontFamily]);

  // We actually don't generally need to provide context values since useSettings uses the store directly,
  // but we keep the Provider to mount the side-effects.
  // Ideally, useSettings should just use the store, but if passing to Context for legacy...
  // However, useSettings defined above IGNORES the context and uses the store directly.

  return <>{children}</>;
};
