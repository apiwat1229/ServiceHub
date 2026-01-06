<script setup lang="ts">
import BookingTicket from '@/components/booking/BookingTicket.vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from 'vue-i18n';

// --- Props ---
defineProps<{
  open: boolean;
  ticket: any;
}>();

defineEmits(['update:open']);

// --- State ---
const { t } = useI18n();
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('ticketDialog.title') }}</DialogTitle>
        <DialogDescription>{{ t('ticketDialog.description') }}</DialogDescription>
      </DialogHeader>

      <div v-if="ticket">
        <BookingTicket :ticket="ticket" :show-actions="true" />
      </div>
    </DialogContent>
  </Dialog>
</template>
