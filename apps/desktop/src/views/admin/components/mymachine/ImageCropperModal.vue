<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
      <DialogHeader class="px-6 pt-6 pb-2">
        <DialogTitle class="text-xl font-bold text-slate-900 flex items-center gap-2">
          {{ t('services.myMachine.forms.image.cropTitle') }}
        </DialogTitle>
      </DialogHeader>

      <div class="px-6 py-2">
        <div class="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 h-[400px]">
          <cropper
            ref="cropper"
            class="h-full w-full"
            :src="image"
            :stencil-props="{
              aspectRatio: 1 / 1,
              class: 'stencil',
            }"
            :canvas="{
              minHeight: 400,
              minWidth: 400,
              maxHeight: 1200,
              maxWidth: 1200,
            }"
          />
        </div>
        <p class="text-[10px] text-slate-500 mt-2 text-center italic">
          Tip: Drag corners to resize. Move the image to position.
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
.stencil {
  border: 4px solid white;
  box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.6);
}

:deep(.vue-advanced-cropper__background) {
  background: transparent !important;
}
</style>
