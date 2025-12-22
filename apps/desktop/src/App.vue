<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner';
import { useThemeStore } from '@/stores/theme';
import GlobalBackground from './components/layout/GlobalBackground.vue';

const themeStore = useThemeStore();
</script>

<template>
  <GlobalBackground />
  <router-view />
  <Toaster richColors position="top-center" />
</template>

<style>
/* Global Styles handled by style.css */
</style>
