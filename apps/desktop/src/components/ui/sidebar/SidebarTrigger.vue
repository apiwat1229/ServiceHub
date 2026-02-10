<script setup lang="ts">
import { cn } from '@/lib/utils';
import { PanelLeft } from 'lucide-vue-next';
import { inject } from 'vue';

const props = defineProps<{
  class?: any;
}>();

const { toggleSidebar } = inject('sidebar') as any;
</script>

<template>
  <button
    data-sidebar="trigger"
    :class="
      cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9',
        props.class
      )
    "
    @click="toggleSidebar"
  >
    <PanelLeft class="h-4 w-4" />
    <span class="sr-only">Toggle Sidebar</span>
  </button>
</template>
