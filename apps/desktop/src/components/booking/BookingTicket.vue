<script setup lang="ts">
import QrcodeVue from 'qrcode.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

// --- Props ---
const props = withDefaults(
  defineProps<{
    ticket: any;
  }>(),
  {}
);

// --- State ---
const { t } = useI18n();
// const ticketRef = ref<HTMLDivElement | null>(null);

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
</script>

<template>
  <!-- Ticket Card (Modern Queue Version) -->
  <div
    ref="ticketRef"
    :style="{
      background: theme.cardBg,
      border: `2px solid ${theme.border}`,
      padding: '24px 16px',
      borderRadius: '12px',
      fontFamily: '\'Sarabun\', \'Kanit\', sans-serif',
      minHeight: '310px',
    }"
    class="shadow-md w-full max-w-[250px] relative transition-all duration-300 hover:scale-[1.2] hover:z-50 hover:shadow-2xl cursor-default flex flex-col"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <img
          src="/logo-dark.png"
          alt="YTRC Logo"
          class="h-5 w-auto"
          @error="(e: any) => (e.target.style.display = 'none')"
        />
      </div>
      <span class="text-[10px] font-bold opacity-40 uppercase tracking-widest">{{
        t('ticketDialog.queueTicket')
      }}</span>
    </div>

    <!-- Details -->
    <div class="space-y-1.5">
      <div class="flex justify-between text-[12px] leading-tight">
        <span class="font-medium text-muted-foreground/70">{{ t('ticketDialog.code') }}:</span>
        <span class="text-right flex-1 ml-2 font-bold">{{ ticket.supplierCode || '-' }}</span>
      </div>
      <div class="flex justify-between text-[12px] leading-tight">
        <span class="font-medium text-muted-foreground/70">{{ t('ticketDialog.name') }}:</span>
        <span class="text-right flex-1 ml-2 font-bold">{{ ticket.supplierName || '-' }}</span>
      </div>
      <div class="flex justify-between text-[12px] leading-tight text-muted-foreground">
        <span class="font-medium">{{ t('ticketDialog.date') }}:</span>
        <span class="text-right flex-1 ml-2">{{ formattedDate }}</span>
      </div>
      <div class="flex justify-between text-[12px] leading-tight text-muted-foreground">
        <span class="font-medium">{{ t('ticketDialog.time') }}:</span>
        <span class="text-right flex-1 ml-2">{{ ticket.startTime || '-' }}</span>
      </div>
      <div class="flex justify-between text-[12px] leading-tight text-muted-foreground">
        <span class="font-medium">{{ t('ticketDialog.truck') }}:</span>
        <span class="text-right flex-1 ml-2">{{ truckPreview }}</span>
      </div>
      <div class="flex justify-between text-[12px] leading-tight">
        <span class="font-medium text-muted-foreground/70">{{ t('ticketDialog.type') }}:</span>
        <span class="text-right flex-1 ml-2 font-bold">
          {{
            RUBBER_TYPE_MAP[ticket.rubberType] || ticket.rubberTypeName || ticket.rubberType || '-'
          }}
        </span>
      </div>
      <div class="flex justify-between text-[11px] leading-tight text-muted-foreground/60">
        <span class="font-medium">{{ t('ticketDialog.booking') }}:</span>
        <span class="text-right flex-1 ml-2 font-mono text-[11px]">{{
          ticket.bookingCode || '-'
        }}</span>
      </div>
    </div>

    <!-- Queue Number -->
    <div class="flex justify-between items-center my-4">
      <span class="text-[11px] font-black opacity-60 uppercase tracking-tight">{{
        t('ticketDialog.queue')
      }}</span>
      <div
        :style="{
          width: '50px',
          height: '50px',
          borderRadius: '8px',
          background: theme.queueBg,
          color: '#fff',
          fontSize: '28px',
          fontWeight: 900,
          border: `2px solid rgba(0,0,0,0.15)`,
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
      class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-red-600 border-2 rounded-lg p-2 rotate-[-15deg] opacity-70 pointer-events-none z-10"
    >
      <span class="text-2xl font-black text-red-600 uppercase tracking-widest">CANCELLED</span>
    </div>

    <!-- Info (Ultra Compact) -->
    <div class="text-center my-2 leading-none">
      <p class="text-[9px] font-bold opacity-40 uppercase tracking-tighter">
        {{ t('ticketDialog.parkingInfo') }}
      </p>
    </div>

    <!-- QR Code -->
    <div class="flex justify-center mt-auto">
      <div v-if="ticket.bookingCode" class="p-2">
        <QrcodeVue
          :value="String(ticket.bookingCode)"
          :size="100"
          level="H"
          background="transparent"
          render-as="canvas"
          class="block"
        />
      </div>
      <div
        v-else
        class="w-20 h-20 bg-muted/50 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center"
      >
        <span class="text-gray-400 text-[10px]">{{ t('ticketDialog.noCode') }}</span>
      </div>
    </div>
  </div>
</template>
