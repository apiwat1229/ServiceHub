<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

const errorMessage = computed(() => {
  return route.query.message || 'An unexpected error occurred. Please try again later.';
});
</script>

<template>
  <div class="h-screen flex flex-col items-center justify-center p-4 text-center">
    <div class="mb-8 p-6 bg-yellow-100 rounded-full dark:bg-yellow-900/20">
      <AlertTriangle class="w-16 h-16 text-yellow-600 dark:text-yellow-400" />
    </div>
    <h1 class="text-4xl font-bold mb-4 tracking-tight">Something went wrong</h1>
    <p class="text-lg text-muted-foreground mb-8 max-w-md">
      {{ errorMessage }}
    </p>
    <div class="flex gap-4">
      <Button variant="outline" @click="router.back()"> Go Back </Button>
      <Button @click="router.push('/')"> Go Home </Button>
    </div>
  </div>
</template>
