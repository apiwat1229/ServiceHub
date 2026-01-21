<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DateFormatter,
  type DateValue,
  getLocalTimeZone,
  parseDate,
} from '@internationalized/date';
import {
  Calendar as CalendarIcon,
  ClipboardList,
  List,
  Search as SearchIcon,
  TestTubes,
  Waves,
} from 'lucide-vue-next';

import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();

const props = defineProps<{
  activeTab: string;
  searchQuery?: string;
  date?: string | DateValue | null;
  isEditing?: boolean;
}>();

const emit = defineEmits([
  'update:category',
  'update:activeTab',
  'update:searchQuery',
  'update:date',
]);

const isCalendarOpen = ref(false);

// Date Handling
const df = new DateFormatter('en-GB', {
  dateStyle: 'medium',
});

const selectedDate = computed({
  get: () => {
    if (!props.date) return undefined;
    if (typeof props.date === 'string') {
      try {
        return parseDate(props.date);
      } catch {
        return undefined;
      }
    }
    return props.date;
  },
  set: (val) => emit('update:date', val),
});

const formattedDate = computed(() => {
  if (!selectedDate.value) return '-';
  return df.format(selectedDate.value.toDate(getLocalTimeZone()));
});

// Helper to determine if we should show global search/date controls
const showGlobalControls = computed(() => {
  const list = [
    'cl-po-pri',
    'cl-lab',
    'cl-summary',
    'uss-po-pri',
    'uss-summary',
    'cuplump-pool',
    'job-order-list',
    'job-order-create', // Might only need list for search/date, but maybe create too? Usually create doesn't need search/date.
    // Let's keep it consistent, maybe create doesn't show them.
    // Actually user said "Cancel Modal usage", so Create is a full page form. It probably doesn't need the header controls.
    // Let's only add job-order-list to showGlobalControls.
    'raw-material-plan-list',
  ];
  return list.includes(props.activeTab);
});

// ... existing code ...

const allTabs = [
  { id: 'cl-po-pri', label: 'qa.tabs.clPoPri', icon: ClipboardList, category: 'CL' },
  { id: 'cl-lab', label: 'qa.tabs.clLab', icon: TestTubes, category: 'CL' },
  { id: 'cl-summary', label: 'qa.tabs.clSummary', icon: List, category: 'CL' },
  { id: 'cuplump-pool', label: 'qa.tabs.cuplumpPool', icon: Waves, category: 'CL' },
  { id: 'uss-po-pri', label: 'qa.tabs.ussPoPri', icon: ClipboardList, category: 'USS' },
  { id: 'uss-summary', label: 'qa.tabs.ussSummary', icon: List, category: 'USS' },
  { id: 'job-order-list', label: 'qa.tabs.jobOrderList', category: 'JOB_ORDER' },
  { id: 'job-order-create', label: 'qa.tabs.jobOrderCreate', category: 'JOB_ORDER' },
  {
    id: 'raw-material-plan-list',
    label: 'qa.tabs.planList',
    icon: ClipboardList,
    category: 'RAW_MATERIAL_PLAN',
  },
  {
    id: 'raw-material-plan-create',
    label: 'qa.tabs.createPlan',
    icon: ClipboardList,
    category: 'RAW_MATERIAL_PLAN',
  },
];

const selectedCategory = ref<'CL' | 'USS' | 'JOB_ORDER' | 'RAW_MATERIAL_PLAN'>(
  (allTabs.find((t) => t.id === props.activeTab)?.category as any) || 'CL'
);

const currentTab = ref(props.activeTab);

const tabs = computed(() => {
  return allTabs
    .filter((tab) => tab.category === selectedCategory.value)
    .map((tab) => {
      let label = t(tab.label);
      if (props.isEditing && tab.id === props.activeTab) {
        if (tab.id === 'raw-material-plan-create') label = t('qa.tabs.editPlan');
        if (tab.id === 'job-order-create') label = t('qa.tabs.editJobOrder');
      }
      return { ...tab, label };
    });
});

// Watch category change
watch(selectedCategory, (newVal) => {
  localStorage.setItem('qaCategory', newVal);
  emit('update:category', newVal);

  // Switch to the first tab of the new category
  const firstTab = allTabs.find((tab) => tab.category === newVal);
  if (firstTab && currentTab.value !== firstTab.id) {
    currentTab.value = firstTab.id;
  } else if (!firstTab && newVal === 'RAW_MATERIAL_PLAN') {
    // If no specific tabs for Raw Material Plan yet, we might need a default or placeholder
    currentTab.value = 'raw-material-plan-list';
  }
});

// Watch tab selection for cross-route navigation
watch(currentTab, (newTab) => {
  if (newTab === props.activeTab) return;
  router.push({ path: '/admin/qa', query: { tab: newTab } });
});

// Sync local ref with prop
watch(
  () => props.activeTab,
  (newTab) => {
    currentTab.value = newTab;
    const cat = allTabs.find((t) => t.id === newTab)?.category;
    if (cat && cat !== selectedCategory.value) {
      selectedCategory.value = cat as any;
    }
  }
);
</script>

<template>
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-3">
      <!-- Global Controls (Show only for standard tabs) -->
      <div v-if="showGlobalControls" class="flex items-center gap-3">
        <!-- Search Popover -->
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              size="icon"
              class="h-9 w-9 text-muted-foreground hover:text-primary bg-white/50 hover:bg-white shadow-sm border-slate-200"
            >
              <SearchIcon class="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-80 p-2" align="start">
            <div class="flex items-center gap-2">
              <SearchIcon class="h-4 w-4 text-muted-foreground" />
              <Input
                :model-value="searchQuery"
                @update:model-value="$emit('update:searchQuery', $event)"
                placeholder="Search items..."
                class="h-8 border-none focus-visible:ring-0 shadow-none"
                auto-focus
              />
            </div>
          </PopoverContent>
        </Popover>

        <!-- Date Popover -->
        <Popover v-model:open="isCalendarOpen">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-9 w-[180px] justify-center text-foreground font-normal bg-white/50 hover:bg-white shadow-sm transition-all border-slate-200"
            >
              <span class="text-xs font-medium">{{ formattedDate }}</span>
              <CalendarIcon class="ml-3 h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start">
            <Calendar
              :model-value="selectedDate"
              @update:model-value="
                (date: any) => {
                  selectedDate = date;
                  isCalendarOpen = false;
                }
              "
              mode="single"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>

    <div class="flex items-center gap-4 ml-auto">
      <!-- Extra content (like sub-tabs) -->
      <slot name="extra" />

      <!-- Tabs ONLY -->
      <div v-if="tabs.length > 0" class="w-full md:w-auto">
        <Tabs
          v-model="currentTab"
          class="w-auto"
          @update:model-value="$emit('update:activeTab', $event)"
        >
          <TabsList class="bg-muted/50 p-1 h-10 rounded-lg gap-1">
            <TabsTrigger
              v-for="tab in tabs"
              :key="tab.id"
              :value="tab.id"
              class="px-6 h-9 text-xs font-black uppercase tracking-wide data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border-2 data-[state=active]:border-primary transition-all rounded-md"
            >
              {{ tab.label }}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Select v-model="selectedCategory">
        <SelectTrigger
          class="w-[180px] h-10 border-slate-200 bg-white shadow-sm font-medium hover:bg-slate-50 transition-colors rounded-lg focus:ring-0 focus:ring-offset-0"
        >
          <SelectValue placeholder="Select Category" />
        </SelectTrigger>
        <SelectContent class="rounded-lg shadow-lg border-slate-100">
          <SelectGroup>
            <SelectItem value="CL" class="font-medium text-sm py-2.5 cursor-pointer">
              {{ t('qa.cuplump') }}
            </SelectItem>
            <SelectItem value="USS" class="font-medium text-sm py-2.5 cursor-pointer">
              {{ t('qa.uss') }}
            </SelectItem>
            <SelectItem value="JOB_ORDER" class="font-medium text-sm py-2.5 cursor-pointer">
              {{ t('qa.jobOrder') }}
            </SelectItem>
            <SelectItem value="RAW_MATERIAL_PLAN" class="font-medium text-sm py-2.5 cursor-pointer">
              {{ t('qa.rawMaterialPlan') }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
