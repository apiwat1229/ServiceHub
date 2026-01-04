<script setup lang="ts">
import { cn } from '@/lib/utils';
</script>

<template>
  <div :class="cn('relative pl-8 space-y-6 my-4', $attrs.class ?? '')">
    <!-- Vertical Line -->
    <div class="absolute left-[17px] top-1 bottom-1 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
    <slot />
  </div>
</template>
