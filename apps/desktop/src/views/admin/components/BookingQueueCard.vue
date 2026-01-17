<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth';
import { format } from 'date-fns';
import { enUS, th } from 'date-fns/locale';
import { CheckCircle2, Edit2, FileText, Trash2 } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  queue: any;
  selectedDate: Date | null;
  barColor: string;
}>();

const emit = defineEmits(['edit', 'delete', 'show-ticket']);

const { t, locale } = useI18n();
const authStore = useAuthStore();

const currentLocale = computed(() => (locale.value === 'th' ? th : enUS));

const RUBBER_TYPE_MAP: Record<string, string> = {
  EUDR_CL: 'EUDR CL',
  EUDR_NCL: 'EUDR North-East CL',
  EUDR_USS: 'EUDR USS',
  FSC_CL: 'FSC CL',
  FSC_USS: 'FSC USS',
  North_East_CL: 'North East CL',
  Regular_CL: 'Regular CL',
  Regular_USS: 'Regular USS',
};
</script>

<template>
  <Card
    class="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-slate-300 bg-card/60 backdrop-blur-sm shadow-sm flex flex-col w-full max-w-[310px] min-h-[380px] h-full"
  >
    <!-- Card Body -->
    <div class="p-4 flex-1 flex flex-col">
      <!-- Header: Label/Status (Left) & Number (Right) -->
      <div class="flex justify-between items-center mb-4">
        <!-- Left: Label & Status -->
        <div class="flex items-center gap-3">
          <span class="text-[0.625rem] uppercase tracking-widest text-muted-foreground font-bold">{{
            t('bookingQueue.queueNumber')
          }}</span>
          <div
            v-if="queue.status === 'APPROVED'"
            class="flex items-center text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 shadow-sm shrink-0"
          >
            <CheckCircle2 class="h-3 w-3 mr-1" />
            <span class="text-[0.625rem] font-bold uppercase tracking-tight">{{
              t('booking.deliveryCompleted') || 'Completed'
            }}</span>
          </div>
        </div>

        <!-- Right: Number -->
        <span class="text-3xl font-black text-primary leading-none">{{ queue.queueNo }}</span>
      </div>

      <!-- Main Info List -->
      <div class="space-y-2.5 flex-1">
        <!-- Row: Code -->
        <div class="flex justify-between items-start text-[0.8125rem]">
          <span class="text-muted-foreground font-medium">{{ t('ticketDialog.code') }}:</span>
          <span class="font-bold text-blue-600 ml-2 text-right">{{ queue.supplierCode }}</span>
        </div>

        <!-- Row: Name -->
        <div class="flex justify-between items-start text-[0.8125rem]">
          <span class="text-muted-foreground font-medium">{{ t('ticketDialog.name') }}:</span>
          <span class="font-bold text-foreground ml-2 text-right line-clamp-2">{{
            queue.supplierName
          }}</span>
        </div>

        <!-- Row: Date -->
        <div class="flex justify-between items-start text-[0.8125rem]">
          <span class="text-muted-foreground font-medium">{{ t('ticketDialog.date') }}:</span>
          <span class="font-medium text-foreground ml-2 text-right">
            ( {{ format(new Date(queue.date), 'EEEE', { locale: currentLocale }) }} )
            {{ format(new Date(queue.date), 'd MMM yyyy', { locale: currentLocale }) }}
          </span>
        </div>

        <!-- Row: Time -->
        <div class="flex justify-between items-start text-[0.8125rem]">
          <span class="text-muted-foreground font-medium">{{ t('ticketDialog.time') }}:</span>
          <span class="font-medium text-foreground ml-2 text-right">{{
            queue.startTime || queue.slot?.split('-')[0] || '-'
          }}</span>
        </div>

        <!-- Row: Truck -->
        <div class="flex justify-between items-start text-[0.8125rem]">
          <span class="text-muted-foreground font-medium">{{ t('ticketDialog.truck') }}:</span>
          <span class="font-bold text-foreground ml-2 text-right">
            {{ [queue.truckType, queue.truckRegister].filter(Boolean).join(' ') }}
          </span>
        </div>

        <!-- Row: Rubber Type -->
        <div class="flex justify-between items-start text-[0.8125rem]">
          <span class="text-muted-foreground font-medium">{{ t('ticketDialog.type') }}:</span>
          <span class="font-bold text-foreground ml-2 text-right">
            {{ RUBBER_TYPE_MAP[queue.rubberType] || queue.rubberTypeName || queue.rubberType }}
          </span>
        </div>

        <!-- Divider -->
        <div class="border-t border-dashed border-border/60 my-1"></div>

        <!-- Row: Booking Code -->
        <div class="flex justify-between items-start text-[0.75rem]">
          <span class="text-muted-foreground">{{ t('ticketDialog.booking') }}:</span>
          <span class="font-mono font-medium text-muted-foreground ml-2 text-right">{{
            queue.bookingCode
          }}</span>
        </div>

        <!-- Row: Recorder -->
        <div class="flex justify-between items-start text-[0.75rem]">
          <span class="text-muted-foreground">{{ t('ticketDialog.recorder') }}:</span>
          <span class="font-medium text-muted-foreground/80 ml-2 text-right italic">{{
            queue.recorder || '-'
          }}</span>
        </div>
      </div>

      <!-- Footer Actions -->
      <div
        class="pt-3 flex justify-between items-center mt-auto border-t border-dashed border-border/40"
      >
        <!-- Left: Edit/Delete -->
        <div
          v-if="queue.status !== 'APPROVED'"
          class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Button
            v-if="authStore.hasPermission('bookings:update')"
            variant="secondary"
            size="icon"
            class="h-8 w-8 rounded-full shadow-sm hover:bg-primary hover:text-white transition-colors"
            @click.stop="emit('edit', queue)"
          >
            <Edit2 class="h-3.5 w-3.5" />
          </Button>
          <Button
            v-if="authStore.hasPermission('bookings:delete')"
            variant="secondary"
            size="icon"
            class="h-8 w-8 rounded-full shadow-sm text-destructive hover:bg-destructive hover:text-white transition-colors"
            @click.stop="emit('delete', queue)"
          >
            <Trash2 class="h-3.5 w-3.5" />
          </Button>
        </div>
        <div v-else></div>

        <!-- Right: Ticket Button -->
        <Button
          variant="outline"
          size="sm"
          class="h-7 px-3 text-[0.6875rem] font-bold gap-1.5 bg-background shadow-sm hover:bg-primary hover:text-white transition-all rounded-lg"
          @click.stop="emit('show-ticket', queue)"
        >
          <FileText class="h-3 w-3" />
          {{ t('bookingQueue.ticket') }}
        </Button>
      </div>
    </div>

    <!-- Bottom Status Bar (Color by Day) -->
    <div class="h-1.5 w-full shrink-0" :style="{ backgroundColor: barColor }"></div>
  </Card>
</template>
