<script setup lang="ts">
import Navbar from '@/components/layout/Navbar.vue';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import api from '@/services/api';
import { useThemeStore } from '@/stores/theme';
import { App } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-vue-next';
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import GlobalBackground from './components/layout/GlobalBackground.vue';

useThemeStore();
const router = useRouter();

const isLoading = ref(true);
const error = ref<string | null>(null);
const isRetrying = ref(false);

const checkHealth = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    // Simple health check to ensure API is reachable
    await api.get('/health', { timeout: 5000 });
    isLoading.value = false;
  } catch (err) {
    console.error('Health check failed:', err);
    error.value =
      'Cannot connect to server. Please check your internet connection or try again later.';
    isLoading.value = false;
  }
};

const handleRetry = async () => {
  isRetrying.value = true;
  await checkHealth();
  isRetrying.value = false;
};

onMounted(() => {
  checkHealth();
  // socketService managed in Navbar

  // Hide Status Bar and Navigation Bar (Immersive Mode) - Native Only
  const hideSystemBars = async () => {
    if ((window as any).Capacitor?.isNativePlatform()) {
      try {
        await Promise.all([StatusBar.hide(), NavigationBar.hide()]);
      } catch (err) {
        console.warn('System bars could not be hidden:', err);
      }
    }
  };
  hideSystemBars();

  // Handle Android Hardware Back Button (Swipe to Back)
  App.addListener('backButton', ({ canGoBack }) => {
    if (
      window.location.hash === '#/' ||
      window.location.pathname === '/' ||
      window.location.hash === '#/dashboard'
    ) {
      App.minimizeApp();
    } else {
      router.back();
    }
  });
});

onUnmounted(() => {
  // socketService managed in Navbar
  App.removeAllListeners();
});
</script>

<template>
  <GlobalBackground />
  <div class="flex flex-col h-screen text-foreground">
    <!-- Navbar always visible -->
    <Navbar :show-brand="true" />

    <div class="flex-1 overflow-hidden relative">
      <!-- Loading & Error States -->
      <div
        v-if="isLoading || error"
        class="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-background/95 backdrop-blur-sm"
      >
        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300"
        >
          <div class="relative mb-8">
            <Loader2 class="h-16 w-16 animate-spin text-primary" />
            <div class="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary/20"></div>
          </div>
          <h2 class="text-2xl font-bold text-foreground mb-2">Connecting to Server</h2>
          <p class="text-muted-foreground animate-pulse">
            Establishing secure connection to app.ytrc.co.th...
          </p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="flex flex-col items-center max-w-md text-center animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div class="rounded-full bg-destructive/10 p-6 mb-6">
            <AlertCircle class="h-16 w-16 text-destructive" />
          </div>
          <h2 class="text-2xl font-bold mb-2">Connection Failed</h2>
          <p class="text-muted-foreground mb-8 text-lg">{{ error }}</p>
          <Button
            @click="handleRetry"
            :disabled="isRetrying"
            size="lg"
            class="h-12 px-8 text-lg rounded-xl shadow-lg shadow-primary/20"
          >
            <RefreshCw class="mr-2 h-5 w-5" :class="{ 'animate-spin': isRetrying }" />
            {{ isRetrying ? 'Retrying...' : 'Retry Connection' }}
          </Button>
        </div>
      </div>

      <!-- Main App Content -->
      <router-view v-else />
    </div>
  </div>

  <Toaster
    position="top-center"
    :duration="5000"
    :expand="true"
    :visibleToasts="5"
    :close-button="true"
  />
</template>

<style>
/* Global Styles handled by style.css */
</style>
