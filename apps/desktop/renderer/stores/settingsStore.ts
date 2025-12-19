import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SettingsState } from '../types/store';

const DEFAULT_SETTINGS = {
    theme: 'system' as const,
    fontSize: 16,
    primaryColor: '#3b82f6',
    borderRadius: 8,
    fontFamily: 'Inter',
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            ...DEFAULT_SETTINGS,

            setTheme: (theme) => {
                localStorage.setItem('theme', theme);
                set({ theme });
            },

            setFontSize: (fontSize) => {
                localStorage.setItem('fontSize', fontSize.toString());
                set({ fontSize });
            },

            setPrimaryColor: (primaryColor) => {
                localStorage.setItem('primaryColor', primaryColor);
                set({ primaryColor });
            },

            setBorderRadius: (borderRadius) => {
                localStorage.setItem('borderRadius', borderRadius.toString());
                set({ borderRadius });
            },

            setFontFamily: (fontFamily) => {
                localStorage.setItem('fontFamily', fontFamily);
                set({ fontFamily });
            },

            resetSettings: () => {
                Object.keys(DEFAULT_SETTINGS).forEach((key) => {
                    localStorage.removeItem(key);
                });
                set(DEFAULT_SETTINGS);
            },
        }),
        {
            name: 'settings-storage',
        }
    )
);
