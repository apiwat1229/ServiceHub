<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { useSearchStore } from '@/stores/search';
import { ChevronRight, LayoutGrid, Search } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface ServiceModule {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  gradient: string;
  shadow: string;
  route: string;
  permission?: string;
}

const { t } = useI18n();
const authStore = useAuthStore();
const searchStore = useSearchStore();

const modules = computed<ServiceModule[]>(() => [
  // Services moved to sidebar
]);

const visibleModules = computed(() => {
  const baseModules = authStore.user
    ? modules.value.filter((m) => !m.permission || authStore.hasPermission(m.permission))
    : modules.value;

  if (!searchStore.searchQuery.trim()) return baseModules;

  const query = searchStore.searchQuery.toLowerCase();
  return baseModules.filter(
    (m) => m.title.toLowerCase().includes(query) || m.description.toLowerCase().includes(query)
  );
});
</script>

<template>
  <div class="min-h-full flex flex-col pt-4">
    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full px-6 md:px-8 pb-12">
      <!-- Welcome Header -->
      <div class="mb-10 flex items-end justify-between">
        <div>
          <h2 class="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            {{ t('admin.dashboard.title') || 'Dashboard' }}
          </h2>
          <p class="text-sm text-muted-foreground font-medium mt-1">
            {{ t('admin.dashboard.subtitle') || 'Manage and monitor your services in one place.' }}
          </p>
        </div>
      </div>

      <!-- Services Section -->
      <div class="space-y-6">
        <div class="flex items-center gap-2">
          <LayoutGrid class="w-4 h-4 text-primary" />
          <h3 class="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
            Available Services
          </h3>
        </div>

        <!-- App Grid -->
        <div
          v-if="visibleModules.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <router-link
            v-for="module in visibleModules"
            :key="module.id"
            :to="module.route"
            class="group relative flex items-start p-5 rounded-xl bg-card border border-border/50 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5"
          >
            <!-- Module Icon -->
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center mr-4 shrink-0 transition-transform duration-500 group-hover:scale-110 relative overflow-hidden"
              :class="module.color"
            >
              <div
                class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"
              ></div>
              <component :is="module.icon" class="w-6 h-6 text-white relative z-10" />
            </div>

            <!-- Module Info -->
            <div class="flex-1 min-w-0">
              <h4
                class="text-base font-bold text-foreground group-hover:text-primary transition-colors"
              >
                {{ module.title }}
              </h4>
              <p class="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {{ module.description }}
              </p>
            </div>

            <!-- Action Arrow -->
            <div
              class="self-center ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
            >
              <ChevronRight class="w-4 h-4 text-primary" />
            </div>
          </router-link>
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-3xl border border-dashed border-border"
        >
          <div class="bg-card p-6 rounded-full mb-4 shadow-sm">
            <Search class="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 class="text-lg font-bold text-foreground">No services found</h3>
          <p class="text-muted-foreground max-w-xs mx-auto text-sm">
            We couldn't find any services matching "{{ searchStore.searchQuery }}".
          </p>
          <Button variant="link" class="mt-2" @click="searchStore.clearSearchQuery"
            >Clear search</Button
          >
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
