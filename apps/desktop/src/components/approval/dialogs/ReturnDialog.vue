<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import approvalsApi from '@/services/approvals';
import { handleApiError } from '@/utils/errorHandler';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-vue-next';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const props = defineProps<{
  requestId: string;
}>();

const emit = defineEmits<{
  success: [];
}>();

const isOpen = defineModel<boolean>('open');
const { t } = useI18n();
const remark = ref('');
const isLoading = ref(false);
const error = ref('');

const handleReturn = async () => {
  try {
    isLoading.value = true;
    error.value = '';

    // Use default remark if none provided (simplified flow)
    const finalRemark = remark.value.trim() || t('approval.dialogs.return.defaultRemark');

    await approvalsApi.return(props.requestId, {
      remark: finalRemark,
    });

    toast.success(t('approval.dialogs.return.success'));

    emit('success');
    isOpen.value = false;
    remark.value = '';
  } catch (err: any) {
    handleApiError(err, t('approval.dialogs.return.error'));
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2 text-blue-600">
          <ArrowLeft class="w-5 h-5" />
          {{ t('approval.dialogs.return.title') }}
        </DialogTitle>
      </DialogHeader>

      <div class="py-4">
        <p class="text-sm text-muted-foreground leading-relaxed">
          {{ t('approval.dialogs.return.confirmMessage') }}
        </p>
      </div>

      <DialogFooter class="gap-2 sm:gap-0">
        <Button variant="ghost" @click="isOpen = false" :disabled="isLoading">{{
          t('common.cancel')
        }}</Button>
        <Button
          class="bg-blue-600 hover:bg-blue-700 text-white"
          @click="handleReturn"
          :disabled="isLoading"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
          <CheckCircle2 v-else class="w-4 h-4 mr-2" />
          {{ isLoading ? t('approval.dialogs.return.processing') : t('common.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
