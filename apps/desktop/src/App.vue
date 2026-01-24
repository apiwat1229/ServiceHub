```
<script setup lang="ts">
import Navbar from '@/components/layout/Navbar.vue';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import api from '@/services/api';
import { useThemeStore } from '@/stores/theme';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-vue-next';
import { onMounted, onUnmounted, ref } from 'vue';
import GlobalBackground from './components/layout/GlobalBackground.vue';
import UpdateNotification from './components/UpdateNotification.vue';

useThemeStore();

const isLoading = ref(true);
const error = ref<string | null>(null);
const isRetrying = ref(false);

const checkHealth = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    // Simple health check to ensure API is reachable
    await api.get('/health');
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
});

onUnmounted(() => {
  // socketService managed in Navbar
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
        class="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 bg-background/20 backdrop-blur-[2px]"
      >
        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="flex flex-col items-center justify-center p-8 rounded-2xl bg-background/60 backdrop-blur-md border border-border/50 shadow-sm transition-all duration-500 animate-in fade-in zoom-in"
        >
          <div class="relative mb-6">
            <Loader2 class="h-12 w-12 animate-spin text-primary" />
            <div class="absolute inset-0 h-12 w-12 rounded-full border-2 border-primary/20"></div>
          </div>
          <p class="text-xl font-semibold text-foreground mb-1">Connecting to app.ytrc.co.th</p>
          <p class="text-sm text-muted-foreground animate-pulse">
            Establishing secure connection...
          </p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="flex flex-col items-center max-w-md text-center p-8 rounded-2xl bg-background/80 backdrop-blur-md border border-destructive/20 shadow-xl animate-in fade-in slide-in-from-bottom-4"
        >
          <div class="rounded-full bg-destructive/10 p-4 mb-6">
            <AlertCircle class="h-12 w-12 text-destructive" />
          </div>
          <h2 class="text-2xl font-bold mb-3">Connection Failed</h2>
          <p class="text-muted-foreground mb-8">{{ error }}</p>
          <Button
            @click="handleRetry"
            :disabled="isRetrying"
            size="lg"
            class="w-full sm:w-auto min-w-[160px] rounded-xl shadow-lg shadow-primary/20"
          >
            <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': isRetrying }" />
            {{ isRetrying ? 'Retrying Connection...' : 'Retry Connection' }}
          </Button>
        </div>
      </div>

      <!-- Main App Content -->
      <router-view v-else />
    </div>
  </div>

  <UpdateNotification />
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
