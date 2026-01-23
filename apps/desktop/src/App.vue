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

  <!-- Loading & Error States with Navbar -->
  <div v-if="isLoading || error" class="flex flex-col h-screen text-foreground">
    <Navbar :show-brand="true" />

    <div class="flex-1 flex flex-col items-center justify-center p-4">
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex flex-col items-center justify-center p-8 rounded-xl bg-background/60 backdrop-blur-md border border-border/50 shadow-sm"
      >
        <Loader2 class="h-10 w-10 animate-spin text-primary mb-4" />
        <p class="text-lg font-medium text-foreground">Connecting to system...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex flex-col items-center max-w-md text-center p-8 rounded-xl bg-background/80 backdrop-blur-md border border-destructive/20 shadow-lg"
      >
        <div class="rounded-full bg-destructive/10 p-4 mb-6">
          <AlertCircle class="h-10 w-10 text-destructive" />
        </div>
        <h2 class="text-2xl font-bold mb-3">Connection Failed</h2>
        <p class="text-muted-foreground mb-8">{{ error }}</p>
        <Button
          @click="handleRetry"
          :disabled="isRetrying"
          size="lg"
          class="w-full sm:w-auto min-w-[140px]"
        >
          <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': isRetrying }" />
          {{ isRetrying ? 'Retrying...' : 'Retry Connection' }}
        </Button>
      </div>
    </div>
  </div>

  <!-- Main App -->
  <router-view v-else />

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
