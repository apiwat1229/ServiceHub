<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useAuthStore } from '@/stores/auth';
import {
  ArrowUpDown,
  Factory,
  FlaskConical,
  Leaf,
  ShoppingCart,
  Truck,
  Warehouse,
  type LucideIcon,
} from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

interface MrpModule {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  hoverBorder: string;
  route: string;
}

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

// Permission check
onMounted(() => {
  if (!authStore.hasPermission('mrp:read')) {
    toast.error(t('errors.noPermission'), {
      description: t('errors.noPermissionDescription'),
    });
    router.push('/');
  }
});

const handleModuleClick = (module: MrpModule) => {
  router.push(module.route);
};

const modules = computed<MrpModule[]>(() => [
  {
    id: 'receiving',
    title: t('services.receiving.name'), // "Raw Material Receiving"
    description: t('services.receiving.description'),
    icon: Leaf,
    color: 'text-green-600',
    bgColor: 'bg-green-50/50 group-hover:bg-green-100/50',
    hoverBorder: 'group-hover:border-green-500',
    route: '/admin/receiving',
  },
  {
    id: 'production',
    title: t('services.production.name'),
    description: t('services.production.description'),
    icon: Factory,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50/50 group-hover:bg-orange-100/50',
    hoverBorder: 'group-hover:border-orange-500',
    route: '/admin/production',
  },
  {
    id: 'qa',
    title: t('services.qa.name'),
    description: t('services.qa.description'),
    icon: FlaskConical,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50/50 group-hover:bg-purple-100/50',
    hoverBorder: 'group-hover:border-purple-500',
    route: '/admin/qa',
  },
  {
    id: 'warehouse',
    title: t('services.warehouse.name'),
    description: t('services.warehouse.description'),
    icon: Warehouse,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50/50 group-hover:bg-cyan-100/50',
    hoverBorder: 'group-hover:border-cyan-500',
    route: '/admin/warehouse',
  },
  {
    id: 'shipping',
    title: t('services.shipping.name'),
    description: t('services.shipping.description'),
    icon: Truck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50/50 group-hover:bg-blue-100/50',
    hoverBorder: 'group-hover:border-blue-500',
    route: '/admin/shipping',
  },
  // NEW PURCHASING MODULE
  {
    id: 'purchasing',
    title: t('services.purchasing.name'),
    description: t('services.purchasing.description'),
    icon: ShoppingCart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50/50 group-hover:bg-pink-100/50',
    hoverBorder: 'group-hover:border-pink-500',
    route: '/admin/purchasing',
  },
]);

// Search and Sorting
const searchQuery = ref('');
const sortBy = ref<'az' | 'recent'>('az');

const filteredModules = computed(() => {
  let list = modules.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    list = list.filter(
      (m) => m.title.toLowerCase().includes(query) || m.description.toLowerCase().includes(query)
    );
  }

  if (sortBy.value === 'az') {
    return list.sort((a, b) => a.title.localeCompare(b.title));
  }

  // Recent not tracked for sub-modules yet, fallback to default order or A-Z
  return list;
});
</script>

<template>
  <div class="h-full flex flex-col max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <!-- Header -->
    <div class="mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-4 text-center md:text-left">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-foreground leading-tight">
            {{ t('services.mrp.name') }}
          </h1>
          <p class="text-muted-foreground text-lg">{{ t('services.mrp.description') }}</p>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex gap-4 w-full md:w-auto">
        <!-- Search -->
        <div class="relative w-full md:w-64">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('common.search')"
            class="w-full h-10 px-4 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        <!-- Sort -->
        <Select v-model="sortBy">
          <SelectTrigger
            class="w-[140px] bg-transparent border-border/40 backdrop-blur-sm rounded-xl"
          >
            <div class="flex items-center gap-2">
              <ArrowUpDown class="h-4 w-4 text-muted-foreground" />
              <span v-if="sortBy === 'az'">{{ t('common.sortAZ') }}</span>
              <span v-else>{{ t('common.sortRecent') }}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="az">{{ t('common.sortAZ') }}</SelectItem>
            <SelectItem value="recent">{{ t('common.sortRecent') }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Modules Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="module in filteredModules"
        :key="module.id"
        @click="handleModuleClick(module)"
        class="cursor-pointer"
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
      </div>
    </div>
  </div>
</template>
