<script setup lang="ts">
import { bookingsApi } from '@/services/bookings';
import { jobOrdersApi, type JobOrder } from '@/services/jobOrders';
import { rubberTypesApi, type RubberType } from '@/services/rubberTypes';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { List } from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { toast } from 'vue-sonner';

import QaHeader from './components/QaHeader.vue';

import JobOrderForm from './components/JobOrderForm.vue';
import CuplumpPoolManagement from './CuplumpPoolManagement.vue';
import ClLabTab from './tabs/ClLabTab.vue';
import ClPoPriTab from './tabs/ClPoPriTab.vue';
import ClSummaryTab from './tabs/ClSummaryTab.vue';
import JobOrderTab from './tabs/JobOrderTab.vue';
import RawMaterialPlanForm from './tabs/RawMaterialPlanForm.vue';
import RawMaterialPlanList from './tabs/RawMaterialPlanList.vue';
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

  console.log('[QA Date Debug] Now:', currentTodayStr);
  console.log('[QA Date Debug] Stored Today:', storedTodayStr);
  console.log('[QA Date Debug] Stored Selection:', storedDateStr);

  // If we haven't stored today yet, or if today has changed since last visit
  if (!storedTodayStr || storedTodayStr !== currentTodayStr) {
    console.log('[QA Date Debug] Resetting to Today because date changed or first visit');
    localStorage.setItem('qa_last_accessed_today', currentTodayStr);
    localStorage.removeItem('qa_selected_date'); // Clear old choice from previous day
    return now;
  }

  // If we have a stored choice for the SAME day
  if (storedDateStr) {
    try {
      const d = JSON.parse(storedDateStr);
      console.log('[QA Date Debug] Restoring selection from storage:', d);
      // Safety: check if the stored date is actually valid and for the current year
      // This prevents very old choices from sticking around
      if (d.year === now.year && d.month === now.month && d.day === now.day) {
        return new CalendarDate(d.year, d.month, d.day);
      } else {
        localStorage.removeItem('qa_selected_date');
        return now;
      }
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

const selectedCategory = ref<'CL' | 'USS' | 'JOB_ORDER' | 'RAW_MATERIAL_PLAN'>('CL');

// Sync tab with query query
watch(
  () => route.query.tab,
  (newTab) => {
    console.log('[QA Debug] Route tab changed to:', newTab);
    if (newTab && typeof newTab === 'string') {
      currentTab.value = newTab;
      console.log('[QA Debug] Set currentTab to:', currentTab.value);
    }
  },
  { immediate: true }
);

// Watch category changes from header
// Watch category changes from header
const handleCategoryUpdate = (newCat: 'CL' | 'USS' | 'JOB_ORDER' | 'RAW_MATERIAL_PLAN') => {
  selectedCategory.value = newCat;

  // If selecting Raw Material Plan from header, ensure currentTab updates if needed
  if (newCat === 'RAW_MATERIAL_PLAN' && !currentTab.value.startsWith('raw-material-plan')) {
    currentTab.value = 'raw-material-plan-list';
  } else if (newCat === 'JOB_ORDER' && !currentTab.value.startsWith('job-order')) {
    currentTab.value = 'job-order-list';
  }
};

const selectedJobOrder = ref<JobOrder | undefined>(undefined);

const handleJobOrderEdit = (order: JobOrder) => {
  selectedJobOrder.value = order;
  currentTab.value = 'job-order-create';
};

const handleJobOrderSave = async (formData: JobOrder) => {
  try {
    if (formData.id) {
      await jobOrdersApi.update(formData.id, formData);
      toast.success(t('qa.jobOrderForm.updateSuccess') || 'Job order updated successfully');
    } else {
      await jobOrdersApi.create(formData);
      toast.success(t('qa.jobOrderForm.createSuccess') || 'Job order created successfully');
    }
    currentTab.value = 'job-order-list';
    selectedJobOrder.value = undefined;
  } catch (error: any) {
    console.error('Failed to save job order:', error);
    toast.error(error.response?.data?.message || t('common.errorSave'));
  }
};

const handleJobOrderDelete = async (id: string) => {
  try {
    await jobOrdersApi.delete(id);
    toast.success(t('common.deleteSuccess') || 'Job order deleted successfully');
    currentTab.value = 'job-order-list';
    selectedJobOrder.value = undefined;
    // Refresh list if needed, but switching tab usually re-mounts or we might need to refresh data
    // Ideally JobOrderTab fetches on mount, so switching back should suffice.
  } catch (error: any) {
    console.error('Failed to delete job order:', error);
    toast.error(error.response?.data?.message || t('common.errorDelete'));
  }
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
    <QaHeader
      :active-tab="currentTab"
      :search-query="searchQuery"
      :date="selectedDateObject"
      @update:category="handleCategoryUpdate"
      @update:search-query="searchQuery = $event"
      @update:date="handleDateSelect"
    />

    <!-- Tab Content -->
    <!-- Tab Content Area -->
    <div
      class="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
    >
      <!-- DEBUG: Current Tab = {{ currentTab }} -->
      <div v-if="currentTab === 'cl-po-pri'" key="tab-cl-po-pri">
        <ClPoPriTab
          key="component-cl-po-pri"
          :search-query="searchQuery"
          :date="selectedDate"
          :status-filter="statusFilter"
          @update:stats="handleStatsUpdate"
        />
      </div>
      <div v-else-if="currentTab === 'cl-lab'" key="tab-cl-lab">
        <ClLabTab
          key="component-cl-lab"
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
        <CuplumpPoolManagement />
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
      <div v-else-if="currentTab === 'job-order-list'" key="tab-job-order-list">
        <JobOrderTab
          key="component-job-order-list"
          :search-query="searchQuery"
          :date="selectedDate"
          @edit="handleJobOrderEdit"
        />
      </div>
      <div v-else-if="currentTab === 'job-order-create'" key="tab-job-order-create">
        <JobOrderForm
          :initial-data="selectedJobOrder"
          @save="handleJobOrderSave"
          @delete="handleJobOrderDelete"
          @cancel="
            currentTab = 'job-order-list';
            selectedJobOrder = undefined;
          "
        />
      </div>
      <div v-if="currentTab === 'raw-material-plan-list'" key="tab-raw-material-plan-list">
        <RawMaterialPlanList :search-query="searchQuery" :date="selectedDate" />
      </div>
      <div v-else-if="currentTab === 'raw-material-plan-create'" key="tab-raw-material-plan-create">
        <RawMaterialPlanForm />
      </div>
    </div>
  </div>
</template>
