<script setup lang="ts">
import { FileClock } from 'lucide-vue-next';
</script>

<template>
  <div class="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
    <div class="bg-amber-50 p-6 rounded-full mb-6">
      <FileClock class="w-12 h-12 text-amber-600" />
    </div>
    <h2 class="text-2xl font-bold tracking-tight mb-2">Contact Management</h2>
    <p class="text-muted-foreground max-w-md">
      This module is currently under development. Features for tracking contract expirations and
      renewals will be available soon.
    </p>
  </div>
</template>
