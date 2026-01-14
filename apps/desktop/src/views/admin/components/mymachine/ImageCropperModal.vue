<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ref } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  open: boolean;
  image: string;
}>();

const emit = defineEmits(['update:open', 'crop', 'cancel']);

const { t } = useI18n();
const cropper = ref<any>(null);

const handleCrop = () => {
  const result = cropper.value.getResult();
  if (result && result.canvas) {
    emit('crop', result.canvas.toDataURL('image/jpeg', 0.85));
    emit('update:open', false);
  }
};

const handleCancel = () => {
  emit('cancel');
  emit('update:open', false);
};
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl bg-white">
      <DialogHeader class="px-6 pt-6 pb-2 text-left">
        <DialogTitle class="text-xl font-bold text-slate-900 flex items-center gap-2">
          {{ t('services.myMachine.forms.image.cropTitle') }}
        </DialogTitle>
        <DialogDescription class="text-slate-500 text-sm">
          {{ t('services.myMachine.forms.image.uploadLimit') }}
        </DialogDescription>
      </DialogHeader>

      <div class="px-6 py-2">
        <div
          class="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 h-[450px] relative"
        >
          <Cropper
            v-if="open && image"
            ref="cropper"
            class="h-full w-full"
            :src="image"
            :stencil-props="{
              aspectRatio: 1 / 1,
            }"
            image-restriction="fit-area"
            :auto-zoom="true"
            :canvas="{
              minHeight: 400,
              minWidth: 400,
              maxHeight: 1200,
              maxWidth: 1200,
            }"
          />
        </div>
        <p class="text-[10px] text-slate-500 mt-2 text-center underline animate-pulse">
          {{ t('services.myMachine.forms.image.uploadLimit') }}
        </p>
      </div>

      <DialogFooter class="px-6 py-4 bg-slate-50 flex items-center justify-between">
        <Button variant="ghost" size="sm" @click="handleCancel" class="text-slate-500 font-bold">
          {{ t('services.myMachine.forms.common.cancel') }}
        </Button>
        <Button
          size="sm"
          @click="handleCrop"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6"
        >
          {{ t('services.myMachine.forms.image.cropAction') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
:deep(.vue-advanced-cropper__background) {
  background: #f1f5f9 !important; /* slate-100 */
}

:deep(.vue-advanced-cropper__foreground) {
  background: rgba(0, 0, 0, 0.45) !important;
}

:deep(.vue-simple-handler) {
  background: #3b82f6 !important; /* blue-500 */
  border: 2px solid white;
}
</style>
