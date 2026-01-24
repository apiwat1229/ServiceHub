<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from './Sidebar.vue';

// const authStore = useAuthStore();
const route = useRoute();

const showSidebar = computed(() => {
  if (
    route.path.startsWith('/admin/cuplump') ||
    route.path.startsWith('/cuplump-pool') ||
    route.path.startsWith('/admin/uss') ||
    route.path.startsWith('/admin/helpdesk') ||
    route.path.startsWith('/admin/project-timeline') ||
    route.path.startsWith('/admin/qa') ||
    route.path.startsWith('/admin/production')
  ) {
    return false;
  }
  return route.path.startsWith('/admin');
});
</script>

<template>
  <div class="flex flex-1 h-full overflow-hidden bg-transparent text-foreground font-sans">
    <!-- Sidebar -->
    <Sidebar v-if="showSidebar" />

    <!-- Main Content Area -->
    <main class="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>
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
