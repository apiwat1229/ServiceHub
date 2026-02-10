<script setup lang="ts">
import { cn } from '@/lib/utils';

defineProps<{
  class?: string;
}>();
</script>

<template>
  <div
    :class="
      cn(
        'bg-sidebar group-data-[variant=floating]:border-r group-data-[variant=floating]:border-sidebar-border relative hidden h-full w-[--sidebar-width] flex-col md:flex',
        $props.class
      )
    "
  >
    <div
      class="absolute inset-y-0 left-0 z-10 hidden h-full w-[--sidebar-width] transition-[width] ease-linear md:flex"
    >
      <div
        class="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
