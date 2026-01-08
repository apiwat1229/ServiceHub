<script setup lang="ts">
import { useRoute } from 'vue-router';
import Navbar from './Navbar.vue';

const route = useRoute();
</script>

<template>
  <div class="flex h-screen bg-transparent text-foreground overflow-hidden font-sans flex-col">
    <!-- Top Navbar -->
    <Navbar :show-brand="true" />

    <div class="flex flex-1 overflow-hidden">
      <!-- Main Content Area - Full Width No Sidebar -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto p-0">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
