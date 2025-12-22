<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-4">{{ title }}</h1>
    <div
      class="p-8 border rounded-lg bg-card text-card-foreground flex flex-col items-center justify-center min-h-[400px]"
    >
      <div class="text-6xl mb-4">🚧</div>
      <h2 class="text-xl font-semibold mb-2">Under Construction</h2>
      <p class="text-muted-foreground">This page is currently being built.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const title = computed(() => route.name?.toString() || 'Page');
</script>
