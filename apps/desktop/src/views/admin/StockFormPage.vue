<script setup lang="ts">
import { useMyMachine } from '@/composables/useMyMachine';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import StockForm from './components/mymachine/StockForm.vue';

const { t } = useI18n();
const router = useRouter();
const { addStock } = useMyMachine();

const handleSave = (data: any) => {
  addStock(data);
  toast.success(t('services.myMachine.messages.stockSuccess'));
  router.push('/my-machine');
};

const handleCancel = () => {
  router.push('/my-machine');
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-6 flex flex-col">
    <!-- Form Content - Full Width -->
    <div class="flex-1">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-fit">
        <StockForm :initial-data="null" @save="handleSave" @cancel="handleCancel" />
      </div>
    </div>
  </div>
</template>
