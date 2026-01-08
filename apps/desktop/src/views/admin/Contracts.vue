<script setup lang="ts">
import { FileText } from 'lucide-vue-next';
</script>

<template>
  <div class="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
    <div class="bg-rose-50 p-6 rounded-full mb-6">
      <FileText class="w-12 h-12 text-rose-600" />
    </div>
    <h2 class="text-2xl font-bold tracking-tight mb-2">Contract Management</h2>
    <p class="text-muted-foreground max-w-md">
      This module is currently under development. Contract management, renewals, and legal document
      templates will be available soon.
    </p>
  </div>
</template>
