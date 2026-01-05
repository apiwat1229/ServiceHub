<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

const locales = [
  { code: 'en', name: 'English', flag: '🇬🇧', label: 'EN' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭', label: 'TH' },
];

const currentLocale = computed(() => locales.find((l) => l.code === locale.value) || locales[0]);

const toggleLanguage = () => {
  const newLocale = locale.value === 'en' ? 'th' : 'en';
  locale.value = newLocale;
  localStorage.setItem('language', newLocale);
};

// Load saved language preference on mount
const savedLang = localStorage.getItem('language');
if (savedLang && (savedLang === 'en' || savedLang === 'th')) {
  locale.value = savedLang;
}
</script>

<template>
  <Button variant="ghost" size="sm" class="h-8 px-2" @click="toggleLanguage">
    <span class="font-medium text-xs">{{ currentLocale.label }}</span>
  </Button>
</template>
