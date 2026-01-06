<script setup lang="ts">
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import { Copy, Download } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

// --- Props ---
const props = defineProps<{
  ticket: any;
  showActions?: boolean;
}>();

// --- State ---
const { t } = useI18n();
const ticketRef = ref<HTMLDivElement | null>(null);

// --- Constants ---
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

const DAY_COLORS = [
  { cardBg: '#fde2e2', border: '#d46b6b', queueBg: '#e11d48' }, // Sun
  { cardBg: '#fff7cc', border: '#d1b208', queueBg: '#eab308' }, // Mon
  { cardBg: '#ffd8e8', border: '#e26c9a', queueBg: '#ec4899' }, // Tue
  { cardBg: '#dff5df', border: '#63a463', queueBg: '#22c55e' }, // Wed
  { cardBg: '#ffe4cc', border: '#d58a4a', queueBg: '#f97316' }, // Thu
  { cardBg: '#dbeeff', border: '#5e97c2', queueBg: '#38bdf8' }, // Fri
  { cardBg: '#eadbff', border: '#8b6abf', queueBg: '#a855f7' }, // Sat
];

// --- Computeds ---
const theme = computed(() => {
  if (!props.ticket?.date) return DAY_COLORS[0];
  const date = new Date(props.ticket.date);
  return DAY_COLORS[date.getDay()];
});

const truckPreview = computed(() => {
  if (!props.ticket) return '-';
  return (
    [props.ticket.truckType, props.ticket.truckRegister].filter(Boolean).join(' ').trim() || '-'
  );
});

const formattedDate = computed(() => {
  if (!props.ticket?.date) return '-';
  const date = new Date(props.ticket.date);
  return thaiDateWithWeekday(date);
});

// --- Helpers ---
function thaiDateWithWeekday(dateField: Date): string {
  const weekdays = [
    t('ticketDialog.weekdays.sunday'),
    t('ticketDialog.weekdays.monday'),
    t('ticketDialog.weekdays.tuesday'),
    t('ticketDialog.weekdays.wednesday'),
    t('ticketDialog.weekdays.thursday'),
    t('ticketDialog.weekdays.friday'),
    t('ticketDialog.weekdays.saturday'),
  ];
  const months = [
    t('ticketDialog.months.jan'),
    t('ticketDialog.months.feb'),
    t('ticketDialog.months.mar'),
    t('ticketDialog.months.apr'),
    t('ticketDialog.months.may'),
    t('ticketDialog.months.jun'),
    t('ticketDialog.months.jul'),
    t('ticketDialog.months.aug'),
    t('ticketDialog.months.sep'),
    t('ticketDialog.months.oct'),
    t('ticketDialog.months.nov'),
    t('ticketDialog.months.dec'),
  ];

  const weekday = weekdays[dateField.getDay()];
  const day = dateField.getDate();
  const month = months[dateField.getMonth()];
  const year = dateField.getFullYear() + 543;

  return `( ${weekday} ) ${day} ${month} ${year}`;
}

const handleSaveTicketImage = async () => {
  if (!ticketRef.value) return;
  try {
    const canvas = await html2canvas(ticketRef.value, {
      backgroundColor: null,
      scale: 3,
      useCORS: true,
      onclone: (clonedDoc) => {
        const queueVal = clonedDoc.getElementById('queue-number-val-' + props.ticket.id);
        if (queueVal) {
          queueVal.style.transform = 'translateY(-14px)'; // Force text up for capture
          queueVal.style.display = 'block'; // Ensure consistent rendering
        }
      },
    });
    const link = document.createElement('a');
    link.download = `ticket_${props.ticket?.bookingCode || 'booking'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success(t('booking.ticketSaved'));
  } catch (err) {
    console.error('Save error:', err);
    toast.error(t('booking.errorSaving'));
  }
};

const handleCopyTicketImage = async () => {
  if (!ticketRef.value) return;
  try {
    const canvas = await html2canvas(ticketRef.value, {
      backgroundColor: null,
      scale: 3,
      useCORS: true,
      onclone: (clonedDoc) => {
        const queueVal = clonedDoc.getElementById('queue-number-val-' + props.ticket.id);
        if (queueVal) {
          queueVal.style.transform = 'translateY(-14px)'; // Force text up for capture
          queueVal.style.display = 'block'; // Ensure consistent rendering
        }
      },
    });
    canvas.toBlob(async (blob: Blob | null) => {
      if (!blob) return;
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      toast.success(t('booking.ticketCopied'));
    }, 'image/png');
  } catch (err: any) {
    console.error('Copy error:', err);
    toast.error(t('booking.errorCopying'));
  }
};

defineExpose({ handleSaveTicketImage, handleCopyTicketImage });
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Ticket Card -->
    <div
      ref="ticketRef"
      :style="{
        background: theme.cardBg,
        border: `1.5px solid ${theme.border}`,
        borderLeft: `4px solid ${theme.queueBg}`,
        padding: '12px',
        borderRadius: '8px',
        fontFamily: '\'Sarabun\', \'Kanit\', sans-serif',
      }"
      class="shadow-sm w-full max-w-[210px] relative"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-1.5">
          <img
            src="/logo-dark.png"
            alt="YTRC Logo"
            class="h-3 w-auto"
            @error="(e: any) => (e.target.style.display = 'none')"
          />
        </div>
        <span class="text-[8px] font-bold opacity-40 uppercase tracking-widest">{{
          t('ticketDialog.queueTicket')
        }}</span>
      </div>

      <!-- Details -->
      <div class="space-y-0.5">
        <div class="flex justify-between text-[9px] leading-tight">
          <span class="font-medium text-muted-foreground/70">{{ t('ticketDialog.code') }}:</span>
          <span class="text-right flex-1 ml-2 font-bold">{{ ticket.supplierCode || '-' }}</span>
        </div>
        <div class="flex justify-between text-[9px] leading-tight">
          <span class="font-medium text-muted-foreground/70">{{ t('ticketDialog.name') }}:</span>
          <span class="text-right flex-1 ml-2 font-bold truncate max-w-[110px]">{{
            ticket.supplierName || '-'
          }}</span>
        </div>
        <div class="flex justify-between text-[9px] leading-tight text-muted-foreground">
          <span class="font-medium">{{ t('ticketDialog.date') }}:</span>
          <span class="text-right flex-1 ml-2">{{ formattedDate }}</span>
        </div>
        <div class="flex justify-between text-[9px] leading-tight text-muted-foreground">
          <span class="font-medium">{{ t('ticketDialog.time') }}:</span>
          <span class="text-right flex-1 ml-2">{{ ticket.startTime || '-' }}</span>
        </div>
        <div class="flex justify-between text-[9px] leading-tight text-muted-foreground">
          <span class="font-medium">{{ t('ticketDialog.truck') }}:</span>
          <span class="text-right flex-1 ml-2 truncate">{{ truckPreview }}</span>
        </div>
        <div class="flex justify-between text-[9px] leading-tight">
          <span class="font-medium text-muted-foreground/70">{{ t('ticketDialog.type') }}:</span>
          <span class="text-right flex-1 ml-2 font-bold">
            {{
              RUBBER_TYPE_MAP[ticket.rubberType] ||
              ticket.rubberTypeName ||
              ticket.rubberType ||
              '-'
            }}
          </span>
        </div>
        <div class="flex justify-between text-[9px] leading-tight text-muted-foreground/60">
          <span class="font-medium">{{ t('ticketDialog.booking') }}:</span>
          <span class="text-right flex-1 ml-2 font-mono text-[8px] sm:text-[9px]">{{
            ticket.bookingCode || '-'
          }}</span>
        </div>
      </div>

      <!-- Queue Number -->
      <div class="flex justify-between items-center my-2">
        <span class="text-[9px] font-black opacity-60 uppercase tracking-tighter">{{
          t('ticketDialog.queue')
        }}</span>
        <div
          :style="{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            background: theme.queueBg,
            color: '#fff',
            fontSize: '18px',
            fontWeight: 900,
            border: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: '1',
          }"
        >
          <div :id="'queue-number-val-' + ticket.id">
            {{ ticket.queueNo ?? '-' }}
          </div>
        </div>
      </div>

      <!-- Cancelled Status Indicator -->
      <div
        v-if="ticket.status === 'CANCELLED' || ticket.deletedAt"
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-red-600 border-2 rounded-lg p-1 rotate-[-15deg] opacity-70 pointer-events-none z-10"
      >
        <span class="text-xl font-black text-red-600 uppercase tracking-widest">CANCELLED</span>
      </div>

      <!-- Info (Ultra Compact) -->
      <div class="text-center my-1 leading-none">
        <p class="text-[7px] font-bold opacity-30 uppercase tracking-tighter">
          {{ t('ticketDialog.parkingInfo') }}
        </p>
      </div>

      <!-- QR Code -->
      <div class="flex justify-center mt-1">
        <QrcodeVue
          v-if="ticket.bookingCode"
          :value="String(ticket.bookingCode)"
          :size="50"
          level="M"
          render-as="svg"
          class="p-0.5 bg-white rounded border border-gray-100"
        />
        <div
          v-else
          class="w-12 h-12 bg-muted/50 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center"
        >
          <span class="text-gray-400 text-[6px]">{{ t('ticketDialog.noCode') }}</span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="showActions" class="flex justify-center gap-2">
      <Button
        @click="handleSaveTicketImage"
        size="sm"
        class="gap-2 bg-green-600 hover:bg-green-700 text-white flex-1"
      >
        <Download class="h-4 w-4" />
        {{ t('ticketDialog.saveTicket') }}
      </Button>
      <Button @click="handleCopyTicketImage" variant="outline" size="sm" class="gap-2 flex-1">
        <Copy class="h-4 w-4" />
        {{ t('ticketDialog.copyTicket') }}
      </Button>
    </div>
  </div>
</template>
