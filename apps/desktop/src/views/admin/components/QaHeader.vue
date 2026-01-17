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
import { ClipboardList, FileBox, List, TestTubes, Waves } from 'lucide-vue-next';

import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();

const props = defineProps<{
  activeTab: string;
}>();

const emit = defineEmits(['update:category', 'update:activeTab']);

const selectedCategory = ref<'CL' | 'USS' | 'JOB_ORDER'>('CL');

const currentTab = ref(props.activeTab);

const allTabs = [
  { id: 'cl-po-pri', label: 'qa.tabs.clPoPri', icon: ClipboardList, category: 'CL' },
  { id: 'cl-lab', label: 'qa.tabs.clLab', icon: TestTubes, category: 'CL' },
  { id: 'cl-summary', label: 'qa.tabs.clSummary', icon: List, category: 'CL' },
  { id: 'cuplump-pool', label: 'qa.tabs.cuplumpPool', icon: Waves, category: 'CL' },
  { id: 'uss-po-pri', label: 'qa.tabs.ussPoPri', icon: ClipboardList, category: 'USS' },
  { id: 'uss-summary', label: 'qa.tabs.ussSummary', icon: List, category: 'USS' },
  { id: 'lab-orders', label: 'qa.tabs.labOrders', icon: FileBox, category: 'JOB_ORDER' },
];

const tabs = computed(() => {
  return allTabs
    .filter((tab) => tab.category === selectedCategory.value)
    .map((tab) => ({ ...tab, label: t(tab.label) }));
});

// Watch category change
watch(selectedCategory, (newVal) => {
  localStorage.setItem('qaCategory', newVal);
  emit('update:category', newVal);

  // Switch to the first tab of the new category
  const firstTab = allTabs.find((tab) => tab.category === newVal);
  if (firstTab && currentTab.value !== firstTab.id) {
    currentTab.value = firstTab.id;
  }

  // If we're not on the QA page, go there
  if (window.location.hash.indexOf('/admin/qa') === -1) {
    router.push('/admin/qa');
  }
});

// Watch tab selection for cross-route navigation
watch(currentTab, (newTab) => {
  if (newTab === props.activeTab) return;

  if (newTab === 'cuplump-pool') {
    router.push('/cuplump-pool');
  } else {
    router.push({ path: '/admin/qa', query: { tab: newTab } });
  }
});

// Sync local ref with prop
watch(
  () => props.activeTab,
  (newTab) => {
    currentTab.value = newTab;
  }
);
</script>

<template>
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div class="flex items-center gap-4">
      <h2 class="text-2xl font-bold tracking-tight">{{ t('qa.title') }}</h2>

      <!-- Category Selector -->
      <Select v-model="selectedCategory">
        <SelectTrigger class="w-[180px] bg-background">
          <SelectValue placeholder="Select Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="CL">
              {{ t('qa.cuplump') }}
            </SelectItem>
            <SelectItem value="USS">
              {{ t('qa.uss') }}
            </SelectItem>
            <SelectItem value="JOB_ORDER">
              {{ t('qa.jobOrder') }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <!-- Tabs ONLY -->
    <div class="w-full md:w-auto">
      <Tabs
        v-model="currentTab"
        class="w-auto"
        @update:model-value="$emit('update:activeTab', $event)"
      >
        <TabsList>
          <TabsTrigger v-for="tab in tabs" :key="tab.id" :value="tab.id" class="gap-2">
            {{ tab.label }}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  </div>
</template>
