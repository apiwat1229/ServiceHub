<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/auth';
import {
  ArrowUpDown,
  Box,
  Calendar,
  Clock,
  Droplets,
  FileClock,
  FileText,
  Headset,
  Truck,
  Wrench,
  type LucideIcon,
} from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface ServiceModule {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  hoverBorder: string;
  route: string;
  permission?: string; // Optional permission required to access this module
}

const { t } = useI18n();
const authStore = useAuthStore();

const modules = computed<ServiceModule[]>(() => [
  {
    id: 'mrp',
    title: t('services.mrp.name'),
    description: t('services.mrp.description'),
    icon: Box,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50/50 group-hover:bg-blue-100/50',
    hoverBorder: 'group-hover:border-blue-500',
    route: '/mrp',
    permission: 'mrp:read',
  },
  {
    id: 'cuplump',
    title: t('services.cuplump.name'),
    description: t('services.cuplump.description'),
    icon: Droplets,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50/50 group-hover:bg-orange-100/50',
    hoverBorder: 'group-hover:border-orange-500',
    route: '/admin/cuplump',
    permission: 'bookings:read', // Cuplump is part of booking system
  },
  {
    id: 'booking',
    title: t('services.booking.name'),
    description: t('services.booking.description'),
    icon: Calendar,
    color: 'text-green-600',
    bgColor: 'bg-green-50/50 group-hover:bg-green-100/50',
    hoverBorder: 'group-hover:border-green-500',
    route: '/admin/bookings',
    permission: 'bookings:read',
  },
  {
    id: 'truck-scale',
    title: t('services.truck.name'),
    description: t('services.truck.description'),
    icon: Truck,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50/50 group-hover:bg-emerald-100/50',
    hoverBorder: 'group-hover:border-emerald-500',
    route: '/scale',
    permission: 'truckScale:read',
  },
  {
    id: 'maintenance',
    title: t('services.maintenance.name'),
    description: t('services.maintenance.description'),
    icon: Wrench,
    color: 'text-red-500',
    bgColor: 'bg-red-50/50 group-hover:bg-red-100/50',
    hoverBorder: 'group-hover:border-red-500',
    route: '/admin/maintenance',
  },
  {
    id: 'it-helpdesk',
    title: t('services.itHelp.name'),
    description: t('services.itHelp.description'),
    icon: Headset,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50/50 group-hover:bg-purple-100/50',
    hoverBorder: 'group-hover:border-purple-500',
    route: '/admin/helpdesk',
  },
  {
    id: 'project-timeline',
    title: t('services.projectTimeline.name'),
    description: t('services.projectTimeline.description'),
    icon: Clock,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50/50 group-hover:bg-indigo-100/50',
    hoverBorder: 'group-hover:border-indigo-500',
    route: '/admin/project-timeline',
  },
  {
    id: 'contracts',
    title: t('services.contracts.name'),
    description: t('services.contracts.description'),
    icon: FileText,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50/50 group-hover:bg-rose-100/50',
    hoverBorder: 'group-hover:border-rose-500',
    route: '/admin/contracts',
  },
  {
    id: 'contact-management',
    title: t('services.contactManagement.name'),
    description: t('services.contactManagement.description'),
    icon: FileClock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50/50 group-hover:bg-amber-100/50',
    hoverBorder: 'group-hover:border-amber-500',
    route: '/admin/contact-management',
  },
]);

// Sorting Logic
const searchQuery = ref('');
const sortBy = ref<'az' | 'recent'>('az');
const moduleUsage = ref<Record<string, number>>({});

const loadUsage = () => {
  try {
    const stored = localStorage.getItem('module_usage');
    if (stored) {
      moduleUsage.value = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load module usage', e);
  }
};

const trackModuleUsage = (moduleId: string) => {
  moduleUsage.value[moduleId] = Date.now();
  localStorage.setItem('module_usage', JSON.stringify(moduleUsage.value));
};

onMounted(() => {
  loadUsage();
});

const sortedModules = computed(() => {
  let list = [...modules.value];

  console.log('[Home] User permissions:', authStore.userPermissions);
  console.log('[Home] User object:', authStore.user);
  console.log('[Home] Total modules before filter:', list.length);

  // If user is not loaded yet (no user object), show all modules temporarily
  // This prevents modules from disappearing during page reload
  if (!authStore.user) {
    console.log('[Home] User not loaded yet, showing all modules');
    return list;
  }

  // Filter by permissions - only show modules user has access to
  list = list.filter((m) => {
    // If no permission required, show the module
    if (!m.permission) {
      console.log(`[Home] Module "${m.id}" - no permission required, showing`);
      return true;
    }
    // Otherwise check if user has the required permission
    const hasAccess = authStore.hasPermission(m.permission);
    console.log(`[Home] Module "${m.id}" - requires "${m.permission}", has access: ${hasAccess}`);
    return hasAccess;
  });

  console.log('[Home] Total modules after filter:', list.length);

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    list = list.filter(
      (m) => m.title.toLowerCase().includes(query) || m.description.toLowerCase().includes(query)
    );
  }

  // Sort by selected option
  if (sortBy.value === 'az') {
    return list.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy.value === 'recent') {
    return list.sort((a, b) => {
      const timeA = moduleUsage.value[a.id] || 0;
      const timeB = moduleUsage.value[b.id] || 0;
      // If time is same (both 0), fallback to A-Z
      if (timeB === timeA) return a.title.localeCompare(b.title);
      return timeB - timeA;
    });
  }
  return list;
});
</script>

<template>
  <div class="h-full flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <!-- Header with Sorting -->
    <div class="mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-4 text-center md:text-left">
        <!-- Text -->
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-foreground leading-tight">
            {{ t('services.title') }}
          </h1>
          <p class="text-muted-foreground text-lg">{{ t('services.subtitle') }}</p>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex gap-4 w-full md:w-auto">
        <!-- Search -->
        <div class="relative w-full md:w-64">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('common.searchModules') || 'Search modules...'"
            class="w-full h-10 px-4 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        <!-- Sort -->
        <div class="w-full md:w-auto">
          <Select v-model="sortBy">
            <SelectTrigger
              class="w-full md:w-[180px] bg-transparent border-border/40 backdrop-blur-sm rounded-xl"
            >
              <div class="flex items-center gap-2">
                <ArrowUpDown class="h-4 w-4 text-muted-foreground" />
                <SelectValue :placeholder="t('common.sortBy')" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="az">{{ t('common.sortAZ') }}</SelectItem>
              <SelectItem value="recent">{{ t('common.sortRecent') }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    <!-- Modules Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <router-link
        v-for="module in sortedModules"
        :key="module.id"
        :to="module.route"
        @click="trackModuleUsage(module.id)"
        :class="[
          'group relative overflow-hidden rounded-2xl border border-border bg-card/20 backdrop-blur-md p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 block',
          module.hoverBorder,
        ]"
      >
        <!-- Large Background Icon (Watermark) -->
        <component
          :is="module.icon"
          class="absolute -right-8 -bottom-8 w-40 h-40 opacity-[0.03] rotate-[-15deg] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-5deg]"
          :class="module.color"
        />

        <!-- Access Indicator -->
        <div
          class="absolute top-6 right-6 flex items-center gap-2 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
        >
          <span class="text-xs font-bold tracking-wider uppercase" :class="module.color">{{
            t('services.accessModule')
          }}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="module.color"
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </div>

        <div class="relative z-10 flex flex-col h-full">
          <!-- Small Icon -->
          <div
            class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300"
            :class="module.bgColor"
          >
            <component :is="module.icon" :class="['h-6 w-6', module.color]" />
          </div>

          <h3 class="mb-2 text-xl font-semibold tracking-tight text-foreground">
            {{ module.title }}
          </h3>

          <p class="text-sm text-muted-foreground leading-relaxed flex-grow">
            {{ module.description }}
          </p>
        </div>
      </router-link>
    </div>

    <!-- Background aesthetic elements -->
    <div class="fixed right-0 top-1/4 -z-10 opacity-[0.03] pointer-events-none">
      <svg
        width="400"
        height="400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="0.5"
      >
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
      </svg>
    </div>
  </div>
</template>
