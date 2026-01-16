<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { bookingsApi } from '@/services/bookings';
import { rubberTypesApi, type RubberType } from '@/services/rubberTypes';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, List, Search, Waves } from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { toast } from 'vue-sonner';

import QaHeader from './components/QaHeader.vue';

import ClLabTab from './tabs/ClLabTab.vue';
import ClPoPriTab from './tabs/ClPoPriTab.vue';
import ClSummaryTab from './tabs/ClSummaryTab.vue';
import JobOrderTab from './tabs/JobOrderTab.vue';
import UssPoPriTab from './tabs/UssPoPriTab.vue';

const { t } = useI18n();

const isLoading = ref(false);
const bookings = ref<any[]>([]);
const rubberTypes = ref<RubberType[]>([]);

// Filters
const searchQuery = ref('');
const statusFilter = ref('ALL');
const currentStats = ref({ total: 0, complete: 0, incomplete: 0 });

// Date Persistence Logic
const getInitialDate = () => {
  const now = today(getLocalTimeZone());
  const storedDateStr = localStorage.getItem('qa_selected_date');
  const storedTodayStr = localStorage.getItem('qa_last_accessed_today');
  const currentTodayStr = now.toString();

  // If we haven't stored today yet, or if today has changed since last visit
  if (!storedTodayStr || storedTodayStr !== currentTodayStr) {
    localStorage.setItem('qa_last_accessed_today', currentTodayStr);
    localStorage.removeItem('qa_selected_date'); // Clear old choice from previous day
    return now;
  }

  // If we have a stored choice for the SAME day
  if (storedDateStr) {
    try {
      const d = JSON.parse(storedDateStr);
      return new CalendarDate(d.year, d.month, d.day);
    } catch (e) {
      return now;
    }
  }

  return now;
};

const selectedDateObject = ref<any>(getInitialDate());
const isDatePopoverOpen = ref(false);
const selectedDate = computed(() => {
  return selectedDateObject.value ? selectedDateObject.value.toString() : '';
});

const handleDateSelect = (newDate: any) => {
  selectedDateObject.value = newDate;
  isDatePopoverOpen.value = false;

  // Store the intentional selection
  if (newDate) {
    localStorage.setItem(
      'qa_selected_date',
      JSON.stringify({
        year: newDate.year,
        month: newDate.month,
        day: newDate.day,
      })
    );
  } else {
    localStorage.removeItem('qa_selected_date');
  }
};

const handleStatsUpdate = (stats: { total: number; complete: number; incomplete: number }) => {
  currentStats.value = stats;
};

const currentTab = ref('cl-po-pri');
const route = useRoute();

const selectedCategory = ref<'CL' | 'USS' | 'JOB_ORDER'>(
  (localStorage.getItem('qaCategory') as 'CL' | 'USS' | 'JOB_ORDER') || 'CL'
);

const currentTabLabel = computed(() => {
  const allTabs = [
    { id: 'cl-po-pri', label: 'qa.tabs.clPoPri', category: 'CL' },
    { id: 'cl-lab', label: 'qa.tabs.clLab', category: 'CL' },
    { id: 'cl-summary', label: 'qa.tabs.clSummary', category: 'CL' },
    { id: 'cuplump-pool', label: 'qa.tabs.cuplumpPool', category: 'CL' },
    { id: 'uss-po-pri', label: 'qa.tabs.ussPoPri', category: 'USS' },
    { id: 'uss-summary', label: 'qa.tabs.ussSummary', category: 'USS' },
    { id: 'lab-orders', label: 'qa.tabs.labOrders', category: 'JOB_ORDER' },
  ];
  return t(allTabs.find((tab) => tab.id === currentTab.value)?.label || '');
});

// Sync tab with query query
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && typeof newTab === 'string') {
      currentTab.value = newTab;
    }
  },
  { immediate: true }
);

// Watch category changes from header
const handleCategoryUpdate = (newCat: 'CL' | 'USS' | 'JOB_ORDER') => {
  selectedCategory.value = newCat;
};

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
    <QaHeader :active-tab="currentTab" @update:category="handleCategoryUpdate" />

    <!-- Filters Bar (Show for all tabs except Job Orders) -->
    <div v-if="currentTab !== 'lab-orders'" class="flex items-center justify-between px-1 mb-2">
      <div class="flex items-center gap-2">
        <div class="w-1.5 h-6 bg-primary rounded-full mr-1"></div>
        <h3 class="text-sm font-black uppercase tracking-widest text-foreground">
          {{ currentTabLabel }}
        </h3>
      </div>

      <div class="flex items-center gap-3">
        <!-- Search Input -->
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
      <div v-else-if="currentTab === 'lab-orders'">
        <JobOrderTab :search-query="searchQuery" :date="selectedDate" />
      </div>
    </div>
  </div>
</template>
