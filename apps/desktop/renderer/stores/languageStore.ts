import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n/config';

type Language = 'en' | 'th';

interface LanguageState {
    language: Language;
    setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            language: 'en',

            setLanguage: (lang: Language) => {
                i18n.changeLanguage(lang);
                localStorage.setItem('language', lang);
                set({ language: lang });
            },
        }),
        {
            name: 'language-storage',
        }
    )
);
