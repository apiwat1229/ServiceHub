<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from 'radix-vue';
import ClLabDetail from './ClLabDetail.vue';

const props = defineProps<{
  open: boolean;
  bookingId: string | null;
  isTrailer?: boolean;
}>();

const emit = defineEmits(['update:open', 'update']);

const close = () => {
  emit('update:open', false);
};

const handleUpdate = () => {
  emit('update');
};
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="max-w-[1400px] w-[95vw] h-[90vh] p-0 overflow-hidden border-none bg-transparent shadow-none"
    >
      <VisuallyHidden>
        <DialogTitle>QA Lab Entry</DialogTitle>
        <DialogDescription> Enter laboratory dryer data for the selected lot. </DialogDescription>
      </VisuallyHidden>
      <ClLabDetail
        v-if="bookingId"
        :booking-id="bookingId"
        :is-trailer="isTrailer"
        @close="close"
        @update="handleUpdate"
      />
    </DialogContent>
  </Dialog>
</template>
