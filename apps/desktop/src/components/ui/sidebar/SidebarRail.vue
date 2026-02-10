<script setup lang="ts">
import { inject } from 'vue';

const { toggleSidebar } = inject('sidebar') as any;
</script>

<template>
  <button
    data-sidebar="rail"
    aria-label="Toggle Sidebar"
    tabindex="-1"
    @click="toggleSidebar"
    title="Toggle Sidebar"
    class="absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex"
  />
</template>
