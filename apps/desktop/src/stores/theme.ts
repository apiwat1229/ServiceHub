import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { storage } from '../services/storage';
import { usersApi } from '../services/users';

export const useThemeStore = defineStore('theme', () => {
    const themeColor = ref(storage.get('theme_color') || 'blue');
    const fontSize = ref(storage.get('font_size') || 'medium');
    const fontFamily = ref(storage.get('font_family') || 'baiJamjuree');
    const isDark = ref(storage.get('is_dark') || false);

    const fontFamilies: Record<string, string> = {
        baiJamjuree: '"Bai Jamjuree", sans-serif',
        sarabun: '"Sarabun", sans-serif',
        kanit: '"Kanit", sans-serif',
        prompt: '"Prompt", sans-serif',
        notoSansThai: '"Noto Sans Thai", sans-serif',
    };

    // Define color palettes (HSL values without hsl())
    // Based on Shadcn UI themes
    const colors: Record<string, any> = {
        zinc: {
            primary: '240 5.9% 10%',
            primaryForeground: '0 0% 98%',
            colorClass: 'text-zinc-500',
        },
        teal: {
            primary: '175.3 77.1% 40.6%', // Teal 600
            primaryForeground: '0 0% 100%',
            colorClass: 'text-teal-500',
        },
        green: {
            primary: '142.1 76.2% 36.3%',
            primaryForeground: '355.7 100% 97.3%',
            colorClass: 'text-green-500',
        },
        blue: {
            primary: '221.2 83.2% 53.3%',
            primaryForeground: '210 40% 98%',
            colorClass: 'text-blue-500',
        },
        pink: {
            primary: '333.3 71.4% 50.6%', // Pink 500
            primaryForeground: '0 0% 100%',
            colorClass: 'text-pink-500',
        },
        violet: {
            primary: '262.1 83.3% 57.8%',
            primaryForeground: '210 40% 98%',
            colorClass: 'text-violet-500',
        },
        rose: {
            primary: '346.8 77.2% 49.8%',
            primaryForeground: '355.7 100% 97.3%',
            colorClass: 'text-rose-500',
        },
    };

    const fontSizes: Record<string, string> = {
        small: '14px',
        medium: '15px',
        large: '16px',
        xl: '18px',
    };

    // Apply changes to DOM
    const applyTheme = () => {
        const root = document.documentElement;

        // Apply Color
        const color = colors[themeColor.value] || colors.zinc;
        root.style.setProperty('--primary', color.primary);
        root.style.setProperty('--primary-foreground', color.primaryForeground);

        // Also update ring color to match primary for consistent focus states
        root.style.setProperty('--ring', color.primary);

        // Apply Font Size
        const size = fontSizes[fontSize.value] || fontSizes.medium;
        root.style.fontSize = size;

        // Apply Font Family
        const family = fontFamilies[fontFamily.value] || fontFamilies.baiJamjuree;
        root.style.setProperty('--font-sans', family);
        root.style.fontFamily = family; // Set directly on html for global effect


        // Apply Dark Mode (Using class)
        if (isDark.value) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // --- Backend Sync Logic ---

    // Debounced save function to avoid API spam
    const saveToBackend = async () => {
        // Use storage directly to avoid circular dependency with AuthStore
        const user = storage.get('user');
        if (!user?.id) return;

        const preferences = {
            themeColor: themeColor.value,
            fontSize: fontSize.value,
            fontFamily: fontFamily.value,
            isDark: isDark.value,
        };

        try {
            await usersApi.update(user.id, { preferences });

            // Update user in storage to persist changes for next reload
            user.preferences = preferences;
            storage.set('user', user);

        } catch (error) {
            console.error('Failed to save theme preferences:', error);
        }
    };

    // Simple debounce implementation if lodash not available or to keep it light
    let timeout: any;
    const debouncedSave = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            saveToBackend();
        }, 1000);
    };

    // Load preferences from user object (call this on login/init)
    const loadFromUser = (user: any) => {
        if (!user?.preferences) return;

        const prefs = user.preferences;
        if (prefs.themeColor) themeColor.value = prefs.themeColor;
        if (prefs.fontSize) fontSize.value = prefs.fontSize;
        if (prefs.fontFamily) fontFamily.value = prefs.fontFamily;
        if (typeof prefs.isDark === 'boolean') isDark.value = prefs.isDark;

        applyTheme();
    };

    // Persist changes
    watch(themeColor, (val) => {
        storage.set('theme_color', val);
        applyTheme();
        debouncedSave();
    });

    watch(fontSize, (val) => {
        storage.set('font_size', val);
        applyTheme();
        debouncedSave();
    });

    watch(fontFamily, (val) => {
        storage.set('font_family', val);
        applyTheme();
        debouncedSave();
    });


    watch(isDark, (val) => {
        storage.set('is_dark', val);
        applyTheme();
        debouncedSave();
    });

    // Initialize
    applyTheme();

    return {
        themeColor,
        fontSize,
        fontFamily,
        colors, // This now exposes the full preset object
        fontFamilies,
        fontSizes,
        isDark,
        toggleDark: () => (isDark.value = !isDark.value),
        loadFromUser,
    };
});
