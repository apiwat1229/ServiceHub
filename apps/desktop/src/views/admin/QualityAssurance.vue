<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { bookingsApi } from '@/services/bookings';
import { rubberTypesApi, type RubberType } from '@/services/rubberTypes';
import { getLocalTimeZone, today } from '@internationalized/date';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  ClipboardList,
  List,
  Search,
  TestTubes,
  Waves,
} from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

import ClLabTab from './tabs/ClLabTab.vue';
import ClPoPriTab from './tabs/ClPoPriTab.vue';
import ClSummaryTab from './tabs/ClSummaryTab.vue';
import UssPoPriTab from './tabs/UssPoPriTab.vue';

const { t } = useI18n();

const isLoading = ref(false);
const bookings = ref<any[]>([]);
const rubberTypes = ref<RubberType[]>([]);

// Filters
const searchQuery = ref('');
const statusFilter = ref('ALL');
const currentStats = ref({ total: 0, complete: 0, incomplete: 0 });

const selectedDateObject = ref<any>(today(getLocalTimeZone()));
const isDatePopoverOpen = ref(false);
const selectedDate = computed(() => {
  return selectedDateObject.value ? selectedDateObject.value.toString() : '';
});

const handleDateSelect = (newDate: any) => {
  selectedDateObject.value = newDate;
  isDatePopoverOpen.value = false;
};

const handleStatsUpdate = (stats: { total: number; complete: number; incomplete: number }) => {
  currentStats.value = stats;
};

const currentTab = ref('cl-po-pri');

const selectedCategory = ref<'CL' | 'USS'>(
  (localStorage.getItem('qaCategory') as 'CL' | 'USS') || 'CL'
);

const allTabs = [
  { id: 'cl-po-pri', label: 'qa.tabs.clPoPri', icon: ClipboardList, category: 'CL' },
  { id: 'cl-lab', label: 'qa.tabs.clLab', icon: TestTubes, category: 'CL' },
  { id: 'cl-summary', label: 'qa.tabs.clSummary', icon: List, category: 'CL' },
  { id: 'cuplump-pool', label: 'qa.tabs.cuplumpPool', icon: Waves, category: 'CL' },
  { id: 'uss-po-pri', label: 'qa.tabs.ussPoPri', icon: ClipboardList, category: 'USS' },
  { id: 'uss-summary', label: 'qa.tabs.ussSummary', icon: List, category: 'USS' },
];

const tabs = computed(() => {
  return allTabs
    .filter((tab) => tab.category === selectedCategory.value)
    .map((tab) => ({ ...tab, label: t(tab.label) }));
});

const currentTabLabel = computed(() => {
  return allTabs.find((tab) => tab.id === currentTab.value)?.label || '';
});

const router = useRouter();

// Watch category change to reset tab
watch(selectedCategory, (newVal) => {
  localStorage.setItem('qaCategory', newVal);
  const firstTab = tabs.value[0];
  if (firstTab) {
    currentTab.value = firstTab.id;
  }
});

// Navigate to separate modules if selected as tab
watch(currentTab, (newTab) => {
  if (newTab === 'cuplump-pool') {
    router.push('/cuplump-pool');
    // Revert tab selection so it doesn't stay on an empty state if they come back
    setTimeout(() => {
      currentTab.value = 'cl-po-pri';
    }, 100);
  }
});

const fetchData = async () => {
  isLoading.value = true;
  try {
    const [bookingsData, typesData] = await Promise.all([
      bookingsApi.getAll(),
      rubberTypesApi.getAll(),
    ]);
    // Filter for bookings that are relevant to QA (e.g., Checked In, Weight In, etc.)
    // For now, showing all or those that have lab data potential
    bookings.value = bookingsData;
    rubberTypes.value = typesData;
  } catch (error) {
    console.error('Failed to load data:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="h-full flex flex-col space-y-4 p-4 max-w-[1600px] mx-auto w-full">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div class="flex items-center gap-4">
        <h2 class="text-2xl font-bold tracking-tight">{{ t('qa.title') }}</h2>
        <!-- Category Selector -->
        <div class="flex items-center bg-muted/50 p-1 rounded-lg border border-border">
          <button
            class="px-3 py-1 text-sm font-medium rounded-md transition-all"
            :class="
              selectedCategory === 'CL'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="selectedCategory = 'CL'"
          >
            {{ t('qa.cuplump') }}
          </button>
          <button
            class="px-3 py-1 text-sm font-medium rounded-md transition-all"
            :class="
              selectedCategory === 'USS'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="selectedCategory = 'USS'"
          >
            {{ t('qa.uss') }}
          </button>
        </div>
      </div>

      <!-- Tabs ONLY -->
      <div class="w-full md:w-auto">
        <Tabs v-model="currentTab" class="w-auto">
          <TabsList class="bg-muted p-1 rounded-lg w-full h-auto flex flex-wrap justify-end gap-1">
            <TabsTrigger
              v-for="tab in tabs"
              :key="tab.id"
              :value="tab.id"
              class="gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all rounded-md text-sm font-medium"
            >
              <component :is="tab.icon" class="w-4 h-4" v-if="tab.icon" />
              {{ tab.label }}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>

    <!-- Filters Bar (Moved above table) -->
    <div class="flex items-center justify-between px-1 mb-2">
      <div class="flex items-center gap-2">
        <div class="w-1.5 h-6 bg-primary rounded-full mr-1"></div>
        <h3 class="text-sm font-black uppercase tracking-widest text-foreground">
          {{ currentTabLabel }}
        </h3>
      </div>

      <div class="flex items-center gap-3">
        <!-- Search Input (Replaced Popover) -->
        <div class="relative w-64">
          <Search
            class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <Input
            v-model="searchQuery"
            :placeholder="t('qa.searchPlaceholder')"
            class="pl-9 h-9 bg-card border-input text-xs"
          />
        </div>

        <Popover :open="isDatePopoverOpen" @update:open="isDatePopoverOpen = $event">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              class="w-[150px] pl-3 text-left font-normal bg-card h-9 shadow-sm hover:bg-muted/50 transition-all border-input"
              :class="!selectedDateObject && 'text-muted-foreground'"
            >
              {{
                selectedDateObject
                  ? format(new Date(selectedDateObject.toString()), 'dd-MMM-yyyy')
                  : t('qa.pickDate')
              }}
              <CalendarIcon class="ml-auto h-4 w-4 text-muted-foreground/50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="end">
            <Calendar
              v-model="selectedDateObject"
              mode="single"
              @update:model-value="handleDateSelect"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>

    <!-- Tab Content -->
    <!-- Tab Content Area -->
    <div
      class="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
    >
      <div v-if="currentTab === 'cl-po-pri'">
        <ClPoPriTab
          :search-query="searchQuery"
          :date="selectedDate"
          :status-filter="statusFilter"
          @update:stats="handleStatsUpdate"
        />
      </div>
      <div v-else-if="currentTab === 'cl-lab'">
        <ClLabTab
          :search-query="searchQuery"
          :date="selectedDate"
          :status-filter="statusFilter"
          @update:stats="handleStatsUpdate"
        />
      </div>
      <div v-else-if="currentTab === 'cl-summary'">
        <ClSummaryTab
          :search-query="searchQuery"
          :date="selectedDate"
          :status-filter="statusFilter"
          @update:stats="handleStatsUpdate"
        />
      </div>
      <div v-else-if="currentTab === 'cuplump-pool'">
        <div
          class="flex items-center justify-center h-64 border rounded-lg bg-muted/20 border-dashed"
        >
          <div class="text-center">
            <Waves class="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 class="text-lg font-medium text-foreground">{{ t('qa.tabs.cuplumpPool') }}</h3>
            <p class="text-muted-foreground mt-1">{{ t('qa.comingSoon') }}</p>
          </div>
        </div>
      </div>
      <div v-else-if="currentTab === 'uss-po-pri'">
        <UssPoPriTab
          :search-query="searchQuery"
          :date="selectedDate"
          :status-filter="statusFilter"
          @update:stats="handleStatsUpdate"
        />
      </div>
      <div v-else-if="currentTab === 'uss-summary'">
        <div
          class="flex items-center justify-center h-64 border rounded-lg bg-muted/20 border-dashed"
        >
          <div class="text-center">
            <List class="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 class="text-lg font-medium text-foreground">{{ t('qa.tabs.ussSummary') }}</h3>
            <p class="text-muted-foreground mt-1">{{ t('qa.comingSoon') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
