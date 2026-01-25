<script setup lang="ts">
import { bookingsApi } from '@/services/bookings';
import { fromDate, getLocalTimeZone, type DateValue } from '@internationalized/date';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, FileText, Plus, Search as SearchIcon } from 'lucide-vue-next';
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Spinner from '@/components/ui/spinner/Spinner.vue';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/auth';
import { useRoute, useRouter } from 'vue-router';
import BookingQueueCard from './components/BookingQueueCard.vue';

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
const { t } = useI18n();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const selectedDate = ref(fromDate(new Date(), getLocalTimeZone())) as Ref<DateValue>;
const selectedSlot = ref<string>('08:00-09:00'); // Default slot
const queues = ref<any[]>([]);
const dailyQueues = ref<any[]>([]); // All bookings for the day
const loading = ref(false);
const calendarPopoverOpen = ref(false); // Add popover state
const searchQuery = ref(''); // Add search query state

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
    const list = [...queues.value].sort((a, b) => a.queueNo - b.queueNo);

    if (!searchQuery.value) return list;

    const q = searchQuery.value.toLowerCase();
    return list.filter(
      (item) =>
        item.queueNo?.toString().includes(q) ||
        item.supplierName?.toLowerCase().includes(q) ||
        item.supplierCode?.toLowerCase().includes(q) ||
        item.truckRegister?.toLowerCase().includes(q)
    );
  }
  // For Cuplump, ensure we filter out any stray USS if API returns mixed (safety check)
  const list = queues.value.filter((q) => {
    const isUSS = q.rubberType && q.rubberType.toUpperCase().includes('USS');
    return !isUSS;
  });

  if (!searchQuery.value) return list;

  const q = searchQuery.value.toLowerCase();
  return list.filter(
    (item) =>
      item.queueNo?.toString().includes(q) ||
      item.supplierName?.toLowerCase().includes(q) ||
      item.supplierCode?.toLowerCase().includes(q) ||
      item.truckRegister?.toLowerCase().includes(q)
  );
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
      // For Cuplump specific slot, fetch specific slot bookings
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
  if (queueMode.value === 'USS' && !selectedSlot.value) {
    selectedSlot.value = '08:00-09:00'; // Default daily slot
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
  console.log('[BookingQueue] Component Mounted. TIME_SLOTS:', TIME_SLOTS);
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
      <div class="flex items-center gap-3">
        <!-- Search Popover -->
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              size="icon"
              class="h-9 w-9 text-muted-foreground hover:text-primary bg-white/50 hover:bg-white shadow-sm border-slate-200"
            >
              <SearchIcon class="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-80 p-2" align="start">
            <div class="flex items-center gap-2">
              <SearchIcon class="h-4 w-4 text-muted-foreground" />
              <Input
                v-model="searchQuery"
                placeholder="Search items..."
                class="h-8 border-none focus-visible:ring-0 shadow-none"
                auto-focus
              />
            </div>
          </PopoverContent>
        </Popover>

        <!-- Date Popover -->
        <Popover v-model:open="calendarPopoverOpen">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-9 w-[180px] justify-center text-foreground font-normal bg-white/50 hover:bg-white shadow-sm transition-all border-slate-200"
            >
              <span class="text-xs font-medium">{{
                selectedDate ? format(selectedDateJS, 'dd MMM yyyy') : t('bookingQueue.pickDate')
              }}</span>
              <CalendarIcon class="ml-3 h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start">
            <Calendar v-model="selectedDate" class="rounded-md border shadow-sm" initial-focus />
          </PopoverContent>
        </Popover>
      </div>

      <div class="flex items-center space-x-2">
        <Tabs v-model="queueMode" class="w-[250px]">
          <TabsList class="grid w-full grid-cols-2 bg-muted/50 p-1 h-10 rounded-lg gap-1">
            <TabsTrigger
              value="Cuplump"
              class="h-9 text-xs font-black uppercase tracking-wide data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border-2 data-[state=active]:border-primary transition-all rounded-md"
            >
              Cuplump
            </TabsTrigger>
            <TabsTrigger
              value="USS"
              class="h-9 text-xs font-black uppercase tracking-wide data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border-2 data-[state=active]:border-primary transition-all rounded-md"
            >
              USS
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
          <!-- Time Slot Tabs -->
          <div class="flex-1 flex flex-col gap-2 w-full">
            <Tabs v-model="selectedSlot" class="w-full">
              <TabsList
                class="w-full h-auto flex-wrap bg-muted/50 p-1 rounded-lg gap-1"
                :style="{
                  gridTemplateColumns: `repeat(${Math.min(availableSlots.length, 5)}, minmax(0, 1fr))`,
                }"
              >
                <TabsTrigger
                  v-for="slot in availableSlots"
                  :key="slot.value"
                  :value="slot.value"
                  @click="queueMode !== 'USS' ? (selectedSlot = slot.value) : null"
                  class="flex-1 flex flex-col gap-0.5 py-2 min-w-[85px] transition-all rounded-md"
                  :class="[
                    queueMode === 'USS'
                      ? 'opacity-40 pointer-events-none grayscale cursor-default'
                      : '',
                    slotStats[slot.value] &&
                    slotStats[slot.value].limit !== null &&
                    slotStats[slot.value].booked >= (slotStats[slot.value].limit || 0) &&
                    queueMode !== 'USS'
                      ? 'bg-red-500 text-white hover:bg-red-600 data-[state=active]:bg-red-700 data-[state=active]:text-white shadow-sm border-red-600'
                      : 'bg-white text-muted-foreground border border-slate-200 shadow-sm hover:border-primary/50 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-primary',
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

    <div v-else>
      <!-- Carousel View for ALL Slots -->
      <div class="w-full px-12">
        <Carousel class="w-full max-w-[90vw] mx-auto" :opts="{ align: 'start' }">
          <CarouselContent class="-ml-4">
            <CarouselItem
              v-for="queue in filteredQueues"
              :key="queue.id"
              class="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/5 pt-1 pb-2"
            >
              <BookingQueueCard
                :queue="queue"
                :selectedDate="selectedDateJS"
                :barColor="DAY_COLORS[selectedDateJS.getDay()].queueBg"
                @edit="handleEdit"
                @delete="handleDeleteClick"
                @show-ticket="handleShowTicket"
                class="h-full"
              />
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
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
