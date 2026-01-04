<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { bookingsApi } from '@/services/bookings';
import { getLocalTimeZone, today } from '@internationalized/date';
import type { ColumnDef } from '@tanstack/vue-table';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Edit, Search } from 'lucide-vue-next';
import { VisuallyHidden } from 'radix-vue';
import { computed, h, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import CuplumpDetailContent from './components/CuplumpDetailContent.vue';

const { t } = useI18n();
// const router = useRouter(); // Router might not be needed for nav anymore if fully modal based

// State
const bookings = ref<any[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const activeTab = ref('all'); // all, complete, incomplete

// Date Handling
const selectedDateObject = ref<any>(today(getLocalTimeZone()));
const isDatePopoverOpen = ref(false);
const selectedDate = computed(() => {
  return selectedDateObject.value ? selectedDateObject.value.toString() : '';
});

watch(selectedDate, (newVal) => {
  if (newVal) fetchBookings();
});

const handleDateSelect = (newDate: any) => {
  selectedDateObject.value = newDate;
  isDatePopoverOpen.value = false;
};

// Modal Logic
const isDetailOpen = ref(false);
const selectedBooking = ref<any>(null);

const handleRowClick = (row: any) => {
  selectedBooking.value = {
    bookingId: row.originalId,
    isTrailer: row.isTrailerPart,
    partLabel: row.partLabel,
  };
  isDetailOpen.value = true;
};

// Fetch Data
const fetchBookings = async () => {
  isLoading.value = true;
  try {
    const response = await bookingsApi.getAll({ date: selectedDate.value });
    bookings.value = Array.isArray(response) ? response : (response as any).data || [];
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    toast.error(t('truckScale.toast.loadBookingsFailed'));
    bookings.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Processed Data (Split logic)
const processedBookings = computed(() => {
  const result: any[] = [];

  bookings.value.forEach((b) => {
    // Check if this booking should be in the list? (Maybe filter by service type if API doesn't?)
    // For now assume all bookings.

    const isTrailer = ['10 ล้อ พ่วง', '10 ล้อ (พ่วง)'].includes(b.truckType);

    // 1. Main Truck
    // If weights were combined in TruckScale, weightIn includes both, and trailerWeightIn is 0.
    // So we don't need complex matching here, just check if trailerWeightIn exists.

    result.push({
      ...b,
      id: b.id + '-main',
      originalId: b.id,
      isTrailerPart: false,
      partLabel: t('truckScale.mainTruck') || 'Main Truck',
      // Display values
      displayRubberType: b.rubberType,
      displayRubberSource: b.rubberSource,
      displayWeightIn: b.weightIn,
      displayWeightOut: b.weightOut,
      // Stats (Mock or real if available)
      moisture: b.moisture || '-',
      drcEst: b.drcEst || '-',
      drcRequested: b.drcRequested || '-',
      drcActual: b.drcActual || '-',
      cpAvg: b.cpAvg || '-',
      lotNo: b.lotNo || '-',
    });

    // 2. Trailer Part
    // Only add if there is a separate trailer weight
    if (isTrailer && b.trailerWeightIn > 0) {
      result.push({
        ...b,
        id: b.id + '-trailer',
        originalId: b.id,
        isTrailerPart: true,
        partLabel: t('truckScale.trailer') || 'Trailer',
        // Display values (Trailer specific)
        displayRubberType: b.trailerRubberType || '-',
        displayRubberSource: b.trailerRubberSource || '-',
        displayWeightIn: b.trailerWeightIn || 0,
        displayWeightOut: b.trailerWeightOut || 0, // Assuming simple split or 0
        // Stats
        moisture: b.trailerMoisture || '-',
        drcEst: b.trailerDrcEst || '-',
        cpAvg: b.trailerCpAvg || '-',
        lotNo: b.trailerLotNo || '1251226-' + b.queueNo + '/2',
      });
    }
  });

  // Filter by Tab and Search
  let data = result;

  // Tab Filter
  if (activeTab.value === 'complete') {
    // Logic: Has Weight Out? Or Lab Data?
    data = data.filter((item) => item.displayWeightOut > 0);
  } else if (activeTab.value === 'incomplete') {
    data = data.filter((item) => !item.displayWeightOut);
  }

  // Search Filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    data = data.filter(
      (item) =>
        item.bookingCode?.toLowerCase().includes(q) ||
        item.supplierName?.toLowerCase().includes(q) ||
        item.truckRegister?.toLowerCase().includes(q)
    );
  }

  return data;
});

// Stats for Header
const stats = computed(() => {
  const total = processedBookings.value.length;
  const complete = processedBookings.value.filter((i) => i.displayWeightOut > 0).length;
  const incomplete = total - complete;

  // Weight Sums
  const grossWeight = processedBookings.value.reduce((sum, i) => sum + (i.displayWeightIn || 0), 0);
  const netWeight = processedBookings.value.reduce((sum, i) => {
    const net = (i.displayWeightIn || 0) - (i.displayWeightOut || 0);
    return sum + (net > 0 ? net : 0); // Only positive nets
  }, 0);

  return { total, complete, incomplete, grossWeight, netWeight };
});

// Columns
const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'lotNo',
    header: () => t('cuplump.lotNo'),
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-bold text-blue-600' }, row.original.lotNo),
        h(
          'span',
          { class: 'text-xs text-muted-foreground' },
          format(new Date(row.original.date), 'dd MMM yyyy')
        ),
      ]),
  },
  {
    accessorKey: 'supplierName',
    header: () => t('cuplump.supplier'),
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col' }, [
        h(
          'span',
          { class: 'font-medium' },
          row.original.supplierCode + ' : ' + row.original.supplierName
        ),
      ]),
  },
  {
    accessorKey: 'truckRegister',
    header: () => t('cuplump.truck'),
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium' }, row.original.truckRegister || '-'),
        h(
          'span',
          { class: 'text-xs text-muted-foreground' },
          row.original.truckType + (row.original.isTrailerPart ? ' (Trailer)' : '')
        ),
      ]),
  },
  {
    accessorKey: 'rubberType',
    header: () => t('cuplump.rubberType'),
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium' }, row.original.displayRubberType || '-'),
        // Mock Location if needed
        h(
          'span',
          { class: 'text-xs text-muted-foreground' },
          row.original.displayRubberSource || '-'
        ),
      ]),
  },
  {
    accessorKey: 'moisture',
    header: () =>
      h(
        'div',
        {
          class: 'bg-orange-100/50 text-orange-700 px-2 py-1 rounded text-center text-xs font-bold',
        },
        t('cuplump.moisture')
      ),
    cell: ({ row }) =>
      h('div', { class: 'text-center font-bold text-orange-600' }, row.original.moisture),
  },
  {
    accessorKey: 'drcEst',
    header: () =>
      h(
        'div',
        { class: 'bg-blue-100/50 text-blue-700 px-2 py-1 rounded text-center text-xs font-bold' },
        t('cuplump.drcEst')
      ),
    cell: ({ row }) =>
      h('div', { class: 'text-center font-bold text-blue-600' }, row.original.drcEst),
  },
  {
    accessorKey: 'cpAvg',
    header: () =>
      h(
        'div',
        { class: 'bg-green-100/50 text-green-700 px-2 py-1 rounded text-center text-xs font-bold' },
        t('cuplump.avgCp')
      ),
    cell: ({ row }) =>
      h('div', { class: 'text-center font-bold text-green-600' }, row.original.cpAvg),
  },
  {
    accessorKey: 'weightIn',
    header: () => t('cuplump.grossWeight'),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'font-bold' },
        (row.original.displayWeightIn || 0).toLocaleString() + ' ' + t('cuplump.kg')
      ),
  },
  {
    accessorKey: 'netWeight',
    header: () => t('cuplump.netWeight'), // This would normally be calculated after deduction
    cell: ({ row }) => {
      // Mock calculation: Net = Gross - Tare (WeightOut).
      // If WeightOut is 0, Net is 0 or '-'? Dashboard image shows lower net than gross.
      const net = (row.original.displayWeightIn || 0) - (row.original.displayWeightOut || 0);
      return h(
        'div',
        { class: 'font-bold text-green-600' },
        (net > 0 ? net : 0).toLocaleString() + ' ' + t('cuplump.kg')
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          size: 'icon',
          onClick: (e: any) => {
            e.stopPropagation(); // Prevent duplicate trigger if row click exists
            handleRowClick(row.original);
          },
        },
        () => h(Edit, { class: 'w-4 h-4 text-muted-foreground' })
      );
    },
  },
];

onMounted(() => {
  fetchBookings();
});
</script>

<template>
  <div class="h-full flex flex-col max-w-[1600px] mx-auto p-6 space-y-6">
    <!-- Header Controls -->
    <Card class="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
      <CardContent class="p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        <!-- Date & Search -->
        <div class="flex items-center gap-4 w-full lg:w-auto">
          <div class="flex flex-col gap-1.5">
            <span class="text-xs font-medium text-muted-foreground">{{
              t('truckScale.date')
            }}</span>
            <Popover v-model:open="isDatePopoverOpen">
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="w-[180px] justify-start text-left font-normal border-input/50"
                >
                  <CalendarIcon class="mr-2 h-4 w-4" />
                  {{
                    selectedDate
                      ? format(new Date(selectedDate), 'dd-MMM-yyyy')
                      : t('truckScale.selectDate')
                  }}
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0" align="start">
                <Calendar
                  v-model="selectedDateObject"
                  mode="single"
                  :initial-focus="true"
                  @update:model-value="handleDateSelect"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div class="flex flex-col gap-1.5 flex-1 lg:w-[300px]">
            <span class="text-xs font-medium text-muted-foreground">{{ t('common.search') }}</span>
            <div class="relative">
              <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              />
              <Input
                v-model="searchQuery"
                :placeholder="t('truckScale.searchPlaceholder')"
                class="pl-9 border-input/50"
              />
            </div>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
          <Button
            size="sm"
            :variant="activeTab === 'all' ? 'secondary' : 'ghost'"
            @click="activeTab = 'all'"
            class="gap-2"
          >
            {{ t('cuplump.all') }} <Badge variant="secondary" class="ml-1">{{ stats.total }}</Badge>
          </Button>
          <Button
            size="sm"
            :variant="activeTab === 'complete' ? 'secondary' : 'ghost'"
            @click="activeTab = 'complete'"
            class="gap-2 text-green-600"
          >
            {{ t('cuplump.complete') }}
            <Badge class="ml-1 bg-green-100 text-green-700 hover:bg-green-100">{{
              stats.complete
            }}</Badge>
          </Button>
          <Button
            size="sm"
            :variant="activeTab === 'incomplete' ? 'secondary' : 'ghost'"
            @click="activeTab = 'incomplete'"
            class="gap-2 text-orange-600"
            :class="{ 'bg-orange-100/50 hover:bg-orange-100/70': activeTab === 'incomplete' }"
          >
            {{ t('cuplump.incomplete') }}
            <Badge
              class="ml-1 bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200"
              >{{ stats.incomplete }}</Badge
            >
          </Button>
        </div>

        <!-- Summary Stats (Right Side) -->
        <div class="items-center gap-8 px-4 border-l border-border/50 hidden xl:flex">
          <div>
            <div class="text-xs text-muted-foreground text-right mb-0.5">
              {{ t('cuplump.grossWeight') }}
            </div>
            <div class="text-lg font-bold">
              {{ stats.grossWeight.toLocaleString() }}
              <span class="text-xs font-normal text-muted-foreground">{{ t('cuplump.kg') }}</span>
            </div>
          </div>
          <div>
            <div class="text-xs text-muted-foreground text-right mb-0.5">
              {{ t('cuplump.netWeight') }}
            </div>
            <div class="text-lg font-bold text-green-600">
              {{ stats.netWeight.toLocaleString() }}
              <span class="text-xs font-normal text-muted-foreground">{{ t('cuplump.kg') }}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Data Table -->
    <div class="flex-1 overflow-hidden">
      <DataTable
        :columns="columns"
        :data="processedBookings"
        :loading="isLoading"
        @row-click="handleRowClick"
      />
    </div>

    <!-- Detail Modal -->
    <Dialog v-model:open="isDetailOpen">
      <DialogContent class="max-w-[95vw] h-auto max-h-[95vh] overflow-y-auto flex flex-col p-6">
        <VisuallyHidden>
          <DialogTitle>{{ t('cuplump.mainInfo') }}</DialogTitle>
          <DialogDescription>Booking Details</DialogDescription>
        </VisuallyHidden>
        <CuplumpDetailContent
          v-if="selectedBooking"
          :booking-id="selectedBooking.bookingId"
          :is-trailer="selectedBooking.isTrailer"
          :part-label="selectedBooking.partLabel"
          @close="isDetailOpen = false"
          @update="fetchBookings"
        />
      </DialogContent>
    </Dialog>
  </div>
</template>
