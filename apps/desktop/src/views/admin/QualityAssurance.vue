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
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
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
  { id: 'cl-po-pri', label: 'CL PO PRI', icon: ClipboardList, category: 'CL' },
  { id: 'cl-lab', label: 'CL Lab', icon: TestTubes, category: 'CL' },
  { id: 'cl-summary', label: 'CL Summary', icon: List, category: 'CL' },
  { id: 'cuplump-pool', label: 'Cuplump Pool', icon: Waves, category: 'CL' },
  { id: 'uss-po-pri', label: 'USS PO PRI', icon: ClipboardList, category: 'USS' },
  { id: 'uss-summary', label: 'USS Summary', icon: List, category: 'USS' },
];

const tabs = computed(() => {
  return allTabs.filter((tab) => tab.category === selectedCategory.value);
});

// Watch category change to reset tab
import { watch } from 'vue';
watch(selectedCategory, (newVal) => {
  localStorage.setItem('qaCategory', newVal);
  const firstTab = tabs.value[0];
  if (firstTab) {
    currentTab.value = firstTab.id;
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
        <h2 class="text-2xl font-bold tracking-tight">Quality Assurance</h2>
        <!-- Category Selector -->
        <div class="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            class="px-3 py-1 text-sm font-medium rounded-md transition-all"
            :class="
              selectedCategory === 'CL'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            "
            @click="selectedCategory = 'CL'"
          >
            Cuplump
          </button>
          <button
            class="px-3 py-1 text-sm font-medium rounded-md transition-all"
            :class="
              selectedCategory === 'USS'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            "
            @click="selectedCategory = 'USS'"
          >
            USS
          </button>
        </div>
      </div>

      <!-- Center Tabs & Filters -->
      <div class="flex-1 flex flex-col md:flex-row items-center justify-end gap-3 w-full md:w-auto">
        <!-- Filters -->
        <div class="flex items-center gap-2 w-full md:w-auto">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" size="icon" class="bg-white border-dashed">
                <Search class="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="p-2 w-80" align="end">
              <div class="relative w-full">
                <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  v-model="searchQuery"
                  placeholder="Search..."
                  class="pl-8 bg-white"
                  autoFocus
                />
              </div>
            </PopoverContent>
          </Popover>

          <Popover :open="isDatePopoverOpen" @update:open="isDatePopoverOpen = $event">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="w-[150px] pl-3 text-left font-normal bg-white"
                :class="!selectedDateObject && 'text-muted-foreground'"
              >
                {{
                  selectedDateObject
                    ? format(new Date(selectedDateObject.toString()), 'dd-MMM-yyyy')
                    : 'Pick a date'
                }}
                <CalendarIcon class="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <Calendar
                v-model="selectedDateObject"
                mode="single"
                @update:model-value="handleDateSelect"
              />
            </PopoverContent>
          </Popover>
        </div>

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

    <!-- Tab Content -->
    <!-- Tab Content Area -->
    <div
      class="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
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
          class="flex items-center justify-center h-64 border rounded-lg bg-slate-50 border-dashed"
        >
          <div class="text-center">
            <Waves class="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 class="text-lg font-medium text-slate-900">Cuplump Pool</h3>
            <p class="text-slate-500">Feature coming soon</p>
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
          class="flex items-center justify-center h-64 border rounded-lg bg-slate-50 border-dashed"
        >
          <div class="text-center">
            <List class="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 class="text-lg font-medium text-slate-900">USS Summary</h3>
            <p class="text-slate-500">Feature coming soon</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
