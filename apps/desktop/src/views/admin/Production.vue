<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { type ProductionReport } from '@/services/productionReports';
import { Plus } from 'lucide-vue-next';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ProductionReportForm from './components/production/ProductionReportForm.vue';
import ProductionReportList from './components/production/ProductionReportList.vue';

const { t } = useI18n();
const currentView = ref<'list' | 'form'>('list');
const selectedReport = ref<ProductionReport | undefined>(undefined);

const handleCreate = () => {
  selectedReport.value = undefined;
  currentView.value = 'form';
};

const handleEdit = (report: ProductionReport) => {
  selectedReport.value = report;
  currentView.value = 'form';
};

const handleSaved = () => {
  currentView.value = 'list';
};

const handleCancel = () => {
  currentView.value = 'list';
};
</script>

<template>
  <div class="h-full flex flex-col space-y-6 p-8 max-w-[1600px] mx-auto w-full">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-foreground">
          {{ t('production.title') }}
        </h1>
        <p class="text-muted-foreground">{{ t('production.subtitle') }}</p>
      </div>
      <div v-if="currentView === 'list'">
        <Button @click="handleCreate" class="gap-2">
          <Plus class="h-4 w-4" />
          {{ t('production.createReport') }}
        </Button>
      </div>
    </div>

    <div class="flex-1 overflow-hidden">
      <ProductionReportList v-if="currentView === 'list'" @edit="handleEdit" />
      <ProductionReportForm
        v-else
        :initial-data="selectedReport"
        @saved="handleSaved"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>
