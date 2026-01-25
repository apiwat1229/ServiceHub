<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/composables/usePermissions';
import { type JobOrder, jobOrdersApi } from '@/services/jobOrders';
import { type ProductionReport } from '@/services/productionReports';
import { DateFormatter, getLocalTimeZone, today } from '@internationalized/date';
import { CalendarIcon, Search, Shield } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import JobOrderForm from './components/JobOrderForm.vue';
import ProductionReportForm from './components/production/ProductionReportForm.vue';
import ProductionReportList from './components/production/ProductionReportList.vue';
import JobOrderTab from './tabs/JobOrderTab.vue';

const { t } = useI18n();
const { hasPermission, isAdmin } = usePermissions();

const canRead = computed(() => isAdmin.value || hasPermission('production:read'));
const canCreate = computed(() => isAdmin.value || hasPermission('production:create'));

// Context: 'production' | 'job-order'
const activeContext = ref('production');
// View: 'list' | 'create'
const activeTab = ref('list');

// Filters
const searchQuery = ref('');
const selectedDateObject = ref<any>(today(getLocalTimeZone()));

const df = new DateFormatter('en-GB', {
  dateStyle: 'medium',
});

const selectedDate = computed({
  get: () => (selectedDateObject.value ? selectedDateObject.value.toString() : undefined),
  set: (val) => (selectedDateObject.value = val),
});

// Production Report State
const selectedReport = ref<ProductionReport | undefined>(undefined);

// Job Order State
const selectedJobOrder = ref<JobOrder | undefined>(undefined);
const jobOrderListKey = ref(0); // To force refresh list

// Production Handlers
const handleEditReport = (report: ProductionReport) => {
  selectedReport.value = report;
  activeTab.value = 'create';
};

const handleReportSaved = () => {
  activeTab.value = 'list';
};

const handleReportCancel = () => {
  activeTab.value = 'list';
};

// Job Order Handlers
const handleEditJobOrder = (jobOrder: JobOrder) => {
  selectedJobOrder.value = jobOrder;
  activeTab.value = 'create';
};

const handleJobOrderSave = async (data: JobOrder) => {
  try {
    if (data.id) {
      await jobOrdersApi.update(data.id, data);
      toast.success(t('qa.jobOrderForm.updateSuccess'));
    } else {
      await jobOrdersApi.create(data);
      toast.success(t('qa.jobOrderForm.createSuccess'));
    }
    activeTab.value = 'list';
    jobOrderListKey.value++; // Refresh list
  } catch (error) {
    console.error('Failed to save job order', error);
    toast.error(t('common.errorSave'));
  }
};

const handleJobOrderDelete = async (id: string) => {
  try {
    await jobOrdersApi.delete(id);
    toast.success(t('common.deleteSuccess'));
    activeTab.value = 'list';
    jobOrderListKey.value++; // Refresh list
  } catch (error) {
    console.error('Failed to delete job order', error);
    toast.error(t('common.error'));
  }
};

const handleJobOrderCancel = () => {
  activeTab.value = 'list';
};

// Reset view when switching context
watch(activeContext, () => {
  activeTab.value = 'list';
  selectedReport.value = undefined;
  selectedJobOrder.value = undefined;
});

const handleCreateClick = () => {
  selectedReport.value = undefined;
  selectedJobOrder.value = undefined;
};
</script>

<template>
  <div v-if="canRead" class="h-full flex flex-col space-y-6 p-8 max-w-[1600px] mx-auto w-full">
    <Tabs v-model="activeTab" class="h-full flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <!-- Left Side: Search & Date -->
        <div class="flex items-center gap-3">
          <!-- Search -->
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" size="icon" class="h-10 w-10 bg-white border-slate-200">
                <Search class="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-60 p-2" align="start">
              <div class="relative w-full items-center">
                <Input v-model="searchQuery" type="text" placeholder="Search..." class="pl-8 h-9" />
                <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                  <Search class="size-4 text-muted-foreground" />
                </span>
              </div>
            </PopoverContent>
          </Popover>

          <!-- Date Picker -->
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="w-[240px] justify-between text-left font-normal bg-white h-10 border-slate-200"
                :class="!selectedDateObject && 'text-muted-foreground'"
              >
                {{
                  selectedDateObject
                    ? df.format(selectedDateObject.toDate(getLocalTimeZone()))
                    : 'Pick a date'
                }}
                <CalendarIcon class="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar v-model="selectedDateObject as any" initial-focus />
            </PopoverContent>
          </Popover>
        </div>

        <!-- Right Side: Tabs & Select -->
        <div class="flex items-center gap-4">
          <TabsList class="bg-muted/50 p-1 h-10 rounded-lg gap-1">
            <TabsTrigger
              value="list"
              class="px-6 h-9 text-xs font-black uppercase tracking-wide data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border-2 data-[state=active]:border-primary transition-all rounded-md text-muted-foreground hover:text-foreground"
            >
              {{
                activeContext === 'production'
                  ? t('production.reportList')
                  : t('qa.tabs.jobOrderList')
              }}
            </TabsTrigger>
            <TabsTrigger
              v-if="activeContext === 'production' && canCreate"
              value="create"
              class="px-6 h-9 text-xs font-black uppercase tracking-wide data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border-2 data-[state=active]:border-primary transition-all rounded-md text-muted-foreground hover:text-foreground"
              @click="handleCreateClick"
            >
              {{ t('production.createReport') }}
            </TabsTrigger>
          </TabsList>

          <Select v-model="activeContext">
            <SelectTrigger class="w-[220px] h-10 bg-white">
              <SelectValue placeholder="Select context" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="production">Production & Quality</SelectItem>
              <SelectItem value="job-order">Job Order</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden">
        <!-- List Tab -->
        <TabsContent value="list" class="h-full mt-0 border-0 p-0">
          <template v-if="activeContext === 'production'">
            <ProductionReportList
              :search-query="searchQuery"
              :date="selectedDate"
              @edit="handleEditReport"
            />
          </template>
          <template v-else>
            <JobOrderTab
              :key="jobOrderListKey"
              :search-query="searchQuery"
              :date="selectedDate || ''"
              @edit="handleEditJobOrder"
            />
          </template>
        </TabsContent>

        <!-- Create/Form Tab -->
        <TabsContent value="create" class="h-full mt-0 border-0 p-0">
          <div class="h-full flex flex-col">
            <template v-if="activeContext === 'production'">
              <ProductionReportForm
                :initial-data="selectedReport"
                @saved="handleReportSaved"
                @cancel="handleReportCancel"
              />
            </template>
            <template v-else>
              <JobOrderForm
                :initial-data="selectedJobOrder || {}"
                @save="handleJobOrderSave"
                @delete="handleJobOrderDelete"
                @cancel="handleJobOrderCancel"
              />
            </template>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  </div>
  <div v-else class="h-full flex items-center justify-center">
    <div class="text-center">
      <Shield class="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
      <h3 class="text-lg font-medium text-muted-foreground">Access Denied</h3>
      <p class="text-sm text-muted-foreground/60">
        You don't have permission to access Production Reports.
      </p>
    </div>
  </div>
</template>
