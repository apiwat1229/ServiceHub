<script setup lang="ts">
import { bookingsApi } from '@/services/bookings';
import { fromDate, getLocalTimeZone, type DateValue } from '@internationalized/date';
import { format } from 'date-fns';
import { enUS, th } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Edit2,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-vue-next';
import { computed, onMounted, ref, watch, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

import BookingSheet from '@/components/booking/BookingSheet.vue';
import TicketDialog from '@/components/booking/TicketDialog.vue';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Spinner from '@/components/ui/spinner/Spinner.vue';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/auth';
import { useRoute, useRouter } from 'vue-router';

// --- Constants ---
const TIME_SLOTS: any[] = [
  { label: '08:00-09:00', value: '08:00-09:00', startTime: '08:00', endTime: '09:00', limit: 4 },
  { label: '09:00-10:00', value: '09:00-10:00', startTime: '09:00', endTime: '10:00', limit: 4 },
  { label: '10:00-11:00', value: '10:00-11:00', startTime: '10:00', endTime: '11:00', limit: 4 },
  { label: '11:00-12:00', value: '11:00-12:00', startTime: '11:00', endTime: '12:00', limit: 4 },
  { label: '13:00-14:00', value: '13:00-14:00', startTime: '13:00', endTime: '14:00', limit: null },
];

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

const SLOT_QUEUE_CONFIG: Record<string, { start: number; limit: number | null }> = {
  '08:00-09:00': { start: 1, limit: 4 },
  '09:00-10:00': { start: 5, limit: 4 },
  '10:00-11:00': { start: 9, limit: 4 },
  '11:00-12:00': { start: 13, limit: 4 },
  '13:00-14:00': { start: 17, limit: null },
};

// --- State ---
// --- State ---
const { t, locale } = useI18n();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const currentLocale = computed(() => (locale.value === 'th' ? th : enUS));
const selectedDate = ref(fromDate(new Date(), getLocalTimeZone())) as Ref<DateValue>;
const selectedSlot = ref<string>('08:00-09:00'); // Default slot
const queues = ref<any[]>([]);
const dailyQueues = ref<any[]>([]); // All bookings for the day
const loading = ref(false);
const calendarPopoverOpen = ref(false); // Add popover state

const queueMode = ref<'Cuplump' | 'USS'>('Cuplump'); // Booking Mode

const sheetOpen = ref(false);
const ticketDialogOpen = ref(false);
const deleteDialogOpen = ref(false);

const editingBooking = ref<any>(null);
const selectedTicket = ref<any>(null);
const bookingToDelete = ref<any>(null);

// --- Helpers ---
const selectedDateJS = computed(() => {
  return selectedDate.value ? selectedDate.value.toDate(getLocalTimeZone()) : new Date();
});

// --- Computeds ---

// Filter queues based on Mode
const filteredQueues = computed(() => {
  // queues.value is already set correctly by fetchQueues based on mode
  if (queueMode.value === 'USS') {
    // Ensure sorted by queueNo for USS
    return [...queues.value].sort((a, b) => a.queueNo - b.queueNo);
  }
  // For Cuplump, ensure we filter out any stray USS if API returns mixed (safety check)
  return queues.value.filter((q) => {
    const isUSS = q.rubberType && q.rubberType.toUpperCase().includes('USS');
    return !isUSS;
  });
});

const dailyFiltered = computed(() => {
  return dailyQueues.value.filter((q) => {
    const isUSS = q.rubberType && q.rubberType.toUpperCase().includes('USS');
    return queueMode.value === 'USS' ? isUSS : !isUSS;
  });
});

const totalDailyQueues = computed(() => dailyFiltered.value.length);

const totalDailyWeight = computed(() => {
  return dailyFiltered.value.reduce((sum, q) => {
    return sum + (Number(q.estimatedWeight) || 0);
  }, 0);
});

const currentSlotConfig = computed(() => {
  const dayOfWeek = selectedDateJS.value.getDay();
  // Special case: Saturday 10:00-11:00
  if (dayOfWeek === 6 && selectedSlot.value === '10:00-11:00') {
    return { start: 9, limit: null };
  }
  return SLOT_QUEUE_CONFIG[selectedSlot.value] || { start: 1, limit: null };
});

const isSlotFull = computed(() => {
  // USS mode has no slot limits
  if (queueMode.value === 'USS') return false;

  if (currentSlotConfig.value.limit === null) return false;
  // Use filtered queues for limit check (per warehouse/mode)
  return filteredQueues.value.length >= currentSlotConfig.value.limit;
});

const nextQueueNo = computed(() => {
  if (isSlotFull.value) return null; // isSlotFull now handles USS mode correctly

  const used = filteredQueues.value
    .map((q) => Number(q.queueNo))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);

  if (currentSlotConfig.value.limit === null) {
    let candidate = currentSlotConfig.value.start;
    while (true) {
      if (!used.includes(candidate)) {
        return candidate;
      }
      candidate++;
      // Safety break to prevent infinite loops in weird cases (though unlikely)
      if (candidate > 1000) return candidate;
    }
  }

  // Find gaps for limited slots
  let candidate = currentSlotConfig.value.start;
  const max = currentSlotConfig.value.start + currentSlotConfig.value.limit;

  while (candidate < max) {
    if (!used.includes(candidate)) {
      return candidate;
    }
    candidate++;
  }
  return null;
});

const slotStats = computed(() => {
  const stats: Record<string, { booked: number; limit: number | null }> = {};

  TIME_SLOTS.forEach((slot) => {
    // Filter dailyQueues by slot AND mode
    const booked = dailyQueues.value.filter((q) => {
      const matchSlot = q.slot === slot.value;
      const isUSS = q.rubberType && q.rubberType.toUpperCase().includes('USS');
      const matchMode = queueMode.value === 'USS' ? isUSS : !isUSS;
      return matchSlot && matchMode;
    }).length;

    let limit = slot.limit;

    // Special case Saturday
    if (selectedDateJS.value.getDay() === 6 && slot.value === '10:00-11:00') {
      limit = null;
    }

    stats[slot.value] = { booked, limit };
  });

  return stats;
});

const availableSlots = computed(() => {
  const dayOfWeek = selectedDateJS.value.getDay();
  if (dayOfWeek === 6) {
    // Saturday
    return TIME_SLOTS.filter(
      (slot) =>
        slot.value === '08:00-09:00' || slot.value === '09:00-10:00' || slot.value === '10:00-11:00'
    );
  }
  return TIME_SLOTS;
});

// --- Methods ---
async function fetchQueues() {
  if (!selectedDate.value) return;

  // For USS, we don't need a slot. For Cuplump, we need a slot.
  if (queueMode.value === 'Cuplump' && !selectedSlot.value) return;

  try {
    loading.value = true;
    const dateParam = format(selectedDateJS.value, 'yyyy-MM-dd');

    // 1. Fetch Daily Total (needed for stats and USS mode)
    const dailyResp = await bookingsApi.getAll({ date: dateParam });
    dailyQueues.value = dailyResp || [];

    // 2. Set 'queues' based on mode
    if (queueMode.value === 'USS') {
      // For USS, show ALL daily USS bookings
      queues.value = dailyQueues.value.filter(
        (q) => q.rubberType && q.rubberType.toUpperCase().includes('USS')
      );
    } else {
      // For Cuplump, fetch specific slot bookings (or filter from daily if optimized, but sticking to API for now)
      // Actually, existing logic fetched slot specific. Let's keep it consistent.
      const resp = await bookingsApi.getAll({
        date: dateParam,
        slot: selectedSlot.value,
      });
      queues.value = resp || [];
    }
  } catch (err) {
    console.error('Fetch queues error:', err);
    toast.error(t('bookingQueue.toast.loadFailed'));
    queues.value = [];
    dailyQueues.value = [];
  } finally {
    loading.value = false;
  }
}

// ... handleCreateBooking and others use computeds, so no change needed mostly

function handleCreateBooking() {
  if (isSlotFull.value && queueMode.value !== 'USS') {
    toast.error(t('bookingQueue.slotFull'));
    return;
  }

  // For USS, ensure we have a slot value (even if dummy) for the form
  if (queueMode.value === 'USS') {
    selectedSlot.value = '08:00-17:00'; // Default daily slot
  }

  editingBooking.value = null;
  sheetOpen.value = true;
}

function handleEdit(booking: any) {
  console.log('[BookingQueue] Editing booking:', booking);
  console.log('[BookingQueue] rubberType value:', booking.rubberType);
  console.log('[BookingQueue] rubber_type value:', booking.rubber_type);
  console.log('[BookingQueue] All booking keys:', Object.keys(booking));
  editingBooking.value = booking;
  sheetOpen.value = true;
}

function handleDeleteClick(booking: any) {
  bookingToDelete.value = booking;
  deleteDialogOpen.value = true;
}

async function confirmDelete() {
  if (!bookingToDelete.value) return;
  try {
    const res = await bookingsApi.delete(bookingToDelete.value.id);
    if (res && res.status === 'PENDING_APPROVAL') {
      toast.info(t('bookingQueue.toast.cancellationSent'));
    } else {
      toast.success(t('bookingQueue.toast.deleted'));
    }
    fetchQueues();
  } catch (err) {
    console.error('Delete error:', err);
    toast.error(t('bookingQueue.toast.deleteError'));
  } finally {
    deleteDialogOpen.value = false;
    bookingToDelete.value = null;
  }
}

function handleShowTicket(booking: any) {
  selectedTicket.value = booking;
  ticketDialogOpen.value = true;
}

// Watch for date/slot/mode changes
watch([selectedDate, selectedSlot, queueMode], () => {
  fetchQueues();
  calendarPopoverOpen.value = false; // Close calendar on selection
});

function handleBookingSuccess(_booking?: any) {
  fetchQueues();
  // Auto-open ticket dialog disabled per user request
  // if (booking && booking.bookingCode) {
  //   selectedTicket.value = booking;
  //   ticketDialogOpen.value = true;
  // }
}

// Use VueUse for persistence if available, or manual localStorage
// Since we don't have vueuse explicit here, let's use manual local storage helper
const STORAGE_KEY = 'booking_queue_slot_pref';

onMounted(async () => {
  // 1. Check for 'code' query param implies Deep Link
  const code = route.query.code as string;

  if (code) {
    try {
      loading.value = true;
      console.log(`[BookingQueue] Deep Linking for code: ${code}`);
      // Fetch booking by code to get date/slot
      // We use getAll with code filter
      const bookings = await bookingsApi.getAll({ code });

      if (bookings && bookings.length > 0) {
        const booking = bookings[0];
        console.log(`[BookingQueue] Found booking:`, booking);

        // Set Date and Slot
        selectedDate.value = fromDate(new Date(booking.date), getLocalTimeZone());
        selectedSlot.value = booking.slot;

        // Highlight/Scroll logic could go here

        // We don't save persistence here because this is a specific overwrite
      } else {
        toast.error('Booking not found');
      }
    } catch (error) {
      console.error('Deep link failed', error);
      toast.error('Failed to load linked booking');
    } finally {
      loading.value = false;
    }
  } else {
    // 2. Normal load: Check persistence
    const savedSlot = localStorage.getItem(STORAGE_KEY);
    if (savedSlot) {
      selectedSlot.value = savedSlot;
    }
  }

  // Check Read Permission
  if (!authStore.hasPermission('bookings:read')) {
    toast.error("You don't have permission to view Booking Queue");
    router.push('/'); // Assuming router is available or import it
    return;
  }

  // Always fetch queues after setting state
  fetchQueues();
});

// Watch slot to persist
watch(selectedSlot, (newSlot) => {
  localStorage.setItem(STORAGE_KEY, newSlot);
});

// Watch for date/slot changes (Existing watcher)
// Note: We need to be careful not to double fetch if we set values in onMounted.
// But existing watcher calls fetchQueues() on change.
// In onMounted we manually called fetchQueues().
// Let's rely on the watcher if we change values, but if we don't change (e.g. no deep link, no saved slot), we might need an initial fetch.
// Actually, the existing code:
// watch([selectedDate, selectedSlot], () => fetchQueues())
// onMounted(() => fetchQueues())
// This implies double fetch if onMounted changes values.
// Ideally we remove the explicit fetchQueues in onMounted if we change values.
</script>

<template>
  <div class="h-full flex-1 flex-col space-y-4 p-4 md:flex">
    <!-- Header -->
    <div class="flex items-center justify-between space-y-2">
      <div class="flex items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">{{ t('bookingQueue.title') }}</h2>
          <p class="text-muted-foreground text-xs">
            {{ t('bookingQueue.manageQueue') }}
            {{ format(selectedDateJS, 'dd-MMM-yyyy') }}
          </p>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <Tabs v-model="queueMode" class="w-[250px]">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger
              value="Cuplump"
              class="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Cuplump
            </TabsTrigger>
            <TabsTrigger
              value="USS"
              class="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              USS
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button variant="outline" size="sm" @click="fetchQueues">
          <RefreshCw class="mr-2 h-4 w-4" />
          {{ t('bookingQueue.refresh') }}
        </Button>
        <Button
          size="sm"
          :disabled="isSlotFull"
          @click="handleCreateBooking"
          v-if="authStore.hasPermission('bookings:create')"
        >
          <Plus class="mr-2 h-4 w-4" />
          {{ isSlotFull ? t('bookingQueue.slotFull') : t('bookingQueue.addBooking') }}
        </Button>
      </div>
    </div>

    <!-- Filters/Selection -->
    <Card class="p-3">
      <div class="flex flex-col lg:flex-row gap-6 items-center justify-between">
        <!-- Left: Inputs -->
        <div class="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
          <!-- Date Picker -->
          <div class="flex flex-col gap-2 min-w-[200px]">
            <span class="text-sm text-muted-foreground">{{ t('bookingQueue.selectDate') }}</span>
            <Popover v-model:open="calendarPopoverOpen">
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="w-full justify-start text-left font-normal"
                  :class="!selectedDate && 'text-muted-foreground'"
                >
                  <CalendarIcon class="mr-2 h-4 w-4" />
                  {{
                    selectedDate
                      ? format(selectedDateJS, 'dd-MMM-yyyy')
                      : t('bookingQueue.pickDate')
                  }}
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0" align="start">
                <Calendar
                  v-model="selectedDate"
                  class="rounded-md border shadow-sm"
                  initial-focus
                />
              </PopoverContent>
            </Popover>
          </div>

          <!-- Time Slot Tabs -->
          <div class="flex-1 flex flex-col gap-2 w-full">
            <span class="text-sm text-muted-foreground">{{ t('bookingQueue.timeSlot') }}</span>
            <Tabs v-model="selectedSlot" class="w-full">
              <TabsList
                class="grid w-full h-auto flex-wrap gap-1 bg-muted p-1"
                :style="{
                  gridTemplateColumns: `repeat(${Math.min(availableSlots.length, 5)}, minmax(0, 1fr))`,
                }"
              >
                <TabsTrigger
                  v-for="slot in availableSlots"
                  :key="slot.value"
                  :value="slot.value"
                  @click="queueMode !== 'USS' ? (selectedSlot = slot.value) : null"
                  class="flex-1 flex flex-col gap-0.5 py-1.5 min-w-[80px] transition-all"
                  :class="[
                    selectedSlot === slot.value
                      ? 'bg-primary text-primary-foreground shadow-md scale-105 font-bold ring-2 ring-primary/20'
                      : 'bg-card hover:border-primary/50 text-card-foreground hover:shadow-sm',
                    queueMode === 'USS'
                      ? 'opacity-40 pointer-events-none grayscale cursor-default'
                      : '',
                    slotStats[slot.value] &&
                    slotStats[slot.value].limit !== null &&
                    slotStats[slot.value].booked >= (slotStats[slot.value].limit || 0) &&
                    queueMode !== 'USS'
                      ? 'bg-red-500 text-white hover:bg-red-600 data-[state=active]:bg-red-700 data-[state=active]:text-white'
                      : '',
                  ]"
                >
                  <span class="text-xs font-bold leading-none">{{ slot.label }}</span>
                  <div class="text-[0.625rem] leading-none opacity-90">
                    <template v-if="slotStats[slot.value]">
                      <span
                        v-if="
                          queueMode !== 'USS' &&
                          slotStats[slot.value] &&
                          slotStats[slot.value].limit !== null &&
                          slotStats[slot.value].booked >= (slotStats[slot.value].limit || 0)
                        "
                        class="font-black"
                      >
                        {{ t('bookingQueue.slotFull') }}
                      </span>
                      <template v-else>
                        {{
                          slotStats[slot.value].limit !== null
                            ? `${slotStats[slot.value].booked}/${slotStats[slot.value].limit}`
                            : `${slotStats[slot.value].booked}/${t('bookingQueue.unlimited')}`
                        }}
                      </template>
                    </template>
                  </div>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <!-- Right: Daily Summary -->
        <div class="flex flex-col items-end text-right border-l pl-6 min-w-[240px]">
          <h3 class="text-lg font-semibold tracking-tight text-primary">
            {{ t('bookingQueue.dailySummary') || 'Daily Summary' }}
          </h3>
          <p class="text-sm text-muted-foreground mt-1">
            {{ t('bookingQueue.totalToday') }} :
            <span class="font-bold text-foreground">{{ totalDailyQueues }}</span>
          </p>
          <p class="text-sm text-muted-foreground mt-0.5" v-if="queueMode !== 'Cuplump'">
            {{ t('booking.estimatedWeightTon') }} :
            <span
              class="font-bold"
              :class="{
                'text-orange-500': totalDailyWeight >= 100000 && totalDailyWeight < 120000,
                'text-red-500': totalDailyWeight >= 120000,
                'text-foreground': totalDailyWeight < 100000,
              }"
            >
              {{
                new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }).format(totalDailyWeight / 1000)
              }}
            </span>
            Ton
          </p>
        </div>
      </div>
    </Card>

    <!-- Queue Grid -->
    <div v-if="loading" class="flex justify-center p-12">
      <Spinner class="h-8 w-8 text-primary" />
    </div>

    <div
      v-else-if="queues.length === 0"
      class="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-xl bg-background/50 min-h-[300px]"
    >
      <div
        class="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4"
      >
        <FileText class="w-8 h-8 text-blue-500" />
      </div>
      <h3 class="text-lg font-semibold">{{ t('bookingQueue.noData') }}</h3>
      <p class="text-muted-foreground mt-1">{{ t('bookingQueue.noBookings') }}</p>
    </div>

    <div v-else class="flex flex-wrap justify-center gap-6">
      <Card
        v-for="queue in filteredQueues"
        :key="queue.id"
        class="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-slate-300 bg-card/60 backdrop-blur-sm shadow-sm flex flex-col w-full max-w-[310px] min-h-[380px]"
      >
        <!-- Card Body -->
        <div class="p-4 flex-1 flex flex-col">
          <!-- Header: Queue & Actions -->
          <div class="flex justify-between items-start mb-4">
            <div class="flex flex-col">
              <span
                class="text-[0.625rem] uppercase tracking-widest text-muted-foreground font-bold"
                >{{ t('bookingQueue.queueNumber') }}</span
              >
              <div class="flex items-baseline gap-1">
                <span class="text-3xl font-black text-primary leading-none">{{
                  queue.queueNo
                }}</span>
              </div>
            </div>

            <div class="flex flex-col gap-1 items-end">
              <div
                v-if="queue.status === 'APPROVED'"
                class="flex items-center text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 shadow-sm shrink-0"
              >
                <CheckCircle2 class="h-3 w-3 mr-1" />
                <span class="text-[0.625rem] font-bold uppercase tracking-tight">{{
                  t('booking.deliveryCompleted') || 'Completed'
                }}</span>
              </div>

              <div
                v-if="queue.status !== 'APPROVED'"
                class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Button
                  v-if="authStore.hasPermission('bookings:update')"
                  variant="secondary"
                  size="icon"
                  class="h-8 w-8 rounded-full shadow-sm hover:bg-primary hover:text-white transition-colors"
                  @click="handleEdit(queue)"
                >
                  <Edit2 class="h-3.5 w-3.5" />
                </Button>
                <Button
                  v-if="authStore.hasPermission('bookings:delete')"
                  variant="secondary"
                  size="icon"
                  class="h-8 w-8 rounded-full shadow-sm text-destructive hover:bg-destructive hover:text-white transition-colors"
                  @click="handleDeleteClick(queue)"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
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
          <div class="pt-3 flex justify-end mt-auto">
            <Button
              variant="outline"
              size="sm"
              class="h-7 px-3 text-[0.6875rem] font-bold gap-1.5 bg-background shadow-sm hover:bg-primary hover:text-white transition-all rounded-lg"
              @click="handleShowTicket(queue)"
            >
              <FileText class="h-3 w-3" />
              {{ t('bookingQueue.ticket') }}
            </Button>
          </div>
        </div>

        <!-- Bottom Status Bar (Color by Day) -->
        <div
          class="h-1.5 w-full shrink-0"
          :style="{ backgroundColor: DAY_COLORS[selectedDateJS.getDay()].queueBg }"
        ></div>
      </Card>
    </div>

    <!-- Modals -->
    <BookingSheet
      v-model:open="sheetOpen"
      :selectedDate="selectedDateJS"
      :selectedSlot="selectedSlot"
      :nextQueueNo="nextQueueNo || 1"
      :editingBooking="editingBooking"
      :queueMode="queueMode"
      @success="handleBookingSuccess"
    />

    <TicketDialog v-model:open="ticketDialogOpen" :ticket="selectedTicket" />

    <AlertDialog :open="deleteDialogOpen" @update:open="deleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('bookingQueue.confirmDelete') }}</AlertDialogTitle>
          <AlertDialogDescription class="space-y-4">
            <div
              v-if="bookingToDelete"
              class="bg-muted/50 p-4 rounded-md text-sm text-foreground space-y-3 border"
            >
              <div class="grid grid-cols-[100px_1fr] gap-2">
                <span class="text-muted-foreground">{{ t('bookingQueue.queueNumber') }}:</span>
                <span class="font-bold">{{ bookingToDelete.queueNo }}</span>
              </div>
              <div class="grid grid-cols-[100px_1fr] gap-2">
                <span class="text-muted-foreground">{{ t('bookingQueue.supplierCode') }}:</span>
                <span>{{ bookingToDelete.supplierCode }}</span>
              </div>
              <div class="grid grid-cols-[100px_1fr] gap-2">
                <span class="text-muted-foreground">{{ t('bookingQueue.supplierName') }}:</span>
                <span class="break-words font-medium">{{ bookingToDelete.supplierName }}</span>
              </div>
              <div
                v-if="bookingToDelete.truckType || bookingToDelete.truckRegister"
                class="grid grid-cols-[100px_1fr] gap-2"
              >
                <span class="text-muted-foreground">{{ t('bookingQueue.truck') }}:</span>
                <span>{{
                  [bookingToDelete.truckType, bookingToDelete.truckRegister]
                    .filter(Boolean)
                    .join(' - ')
                }}</span>
              </div>
              <div class="grid grid-cols-[100px_1fr] gap-2">
                <span class="text-muted-foreground">{{ t('bookingQueue.type') }}:</span>
                <span>{{
                  RUBBER_TYPE_MAP[bookingToDelete.rubberType] ||
                  bookingToDelete.rubberTypeName ||
                  bookingToDelete.rubberType
                }}</span>
              </div>
              <div class="grid grid-cols-[100px_1fr] gap-2">
                <span class="text-muted-foreground">{{ t('bookingQueue.bookingCode') }}:</span>
                <span>{{ bookingToDelete.bookingCode }}</span>
              </div>
            </div>
            <p>{{ t('bookingQueue.deleteWarning') }}</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="deleteDialogOpen = false">{{
            t('common.cancel')
          }}</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive hover:bg-destructive/90"
            @click="confirmDelete"
            >{{ t('common.delete') }}</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
