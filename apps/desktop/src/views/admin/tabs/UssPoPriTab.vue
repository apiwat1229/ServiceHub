<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { bookingsApi } from '@/services/bookings';
import { rubberTypesApi, type RubberType } from '@/services/rubberTypes';
import { getLocalTimeZone, today } from '@internationalized/date';
import type { ColumnDef } from '@tanstack/vue-table';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Edit, Search } from 'lucide-vue-next';
import { computed, h, onMounted, ref, watch } from 'vue';
import ClPoPriDialog from '../components/ClPoPriDialog.vue';

const bookings = ref<any[]>([]);
const rubberTypes = ref<RubberType[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const statusFilter = ref('ALL');

// Detail Dialog
const isDialogOpen = ref(false);
const selectedBookingId = ref<string | null>(null);
const selectedIsTrailer = ref(false);

const handleOpenDetail = (bookingId: string, isTrailer = false) => {
  selectedBookingId.value = bookingId;
  selectedIsTrailer.value = isTrailer;
  isDialogOpen.value = true;
};

// Date Handling
const selectedDateObject = ref<any>(today(getLocalTimeZone()));
const isDatePopoverOpen = ref(false);
const selectedDate = computed(() => {
  return selectedDateObject.value ? selectedDateObject.value.toString() : '';
});

watch(selectedDate, (newVal) => {
  if (newVal) fetchData();
});

const handleDateSelect = (newDate: any) => {
  selectedDateObject.value = newDate;
  isDatePopoverOpen.value = false;
};

// Helper to check if Rubber Type is USS
const isUssType = (val: string) => {
  if (!val) return false;
  const type = rubberTypes.value.find((t) => t.code === val || t.name === val);
  if (type) return type.category === 'USS';
  const upperVal = val.toUpperCase();
  return upperVal.includes('USS');
};

const fetchData = async () => {
  isLoading.value = true;
  try {
    const [bookingsData, typesData] = await Promise.all([
      bookingsApi.getAll({ date: selectedDate.value }),
      rubberTypesApi.getAll(),
    ]);

    rubberTypes.value = typesData;
    // Filter for USS only
    bookings.value = (bookingsData || []).filter((b: any) => isUssType(b.rubberType));
  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    isLoading.value = false;
  }
};

const getRubberTypeName = (code: string) => {
  const type = rubberTypes.value.find((t) => t.code === code);
  return type ? type.name : code;
};

// Computed Data for Stats
const processedBookings = computed(() => {
  const result: any[] = [];
  bookings.value.forEach((b: any) => {
    // 1. Main Part
    const bSamplesMain = b.labSamples?.filter((s: any) => !s.isTrailer) || [];
    const validPoMain = bSamplesMain.filter((s: any) => s.p0 && s.p0 > 0);
    const validPriMain = bSamplesMain.filter((s: any) => s.pri && s.pri > 0);

    const avgPoMain =
      validPoMain.length > 0
        ? validPoMain.reduce((sum: number, s: any) => sum + s.p0, 0) / validPoMain.length
        : 0;
    const avgPriMain =
      validPriMain.length > 0
        ? validPriMain.reduce((sum: number, s: any) => sum + s.pri, 0) / validPriMain.length
        : 0;

    const grossMain = Math.max(0, (b.weightIn || 0) - (b.weightOut || 0));
    const drcMain = b.drcActual || 0;
    const netWeightMain = drcMain > 0 ? Math.round(grossMain * (drcMain / 100)) : 0;

    result.push({
      ...b,
      id: b.id + '-main',
      originalId: b.id,
      isTrailerPart: false,
      partLabel: 'Main Truck',
      displayRubberType: getRubberTypeName(b.rubberType),
      displayWeightIn: grossMain,
      displayNetWeight: netWeightMain,
      avgPo: avgPoMain,
      avgPri: avgPriMain,
      lotNo: b.lotNo || b.bookingCode || '-',
    });

    // 2. Trailer Part
    const hasTrailer =
      (b.trailerWeightIn && b.trailerWeightIn > 0) || (b.trailerRubberType && b.trailerRubberType);
    if (hasTrailer) {
      const bSamplesTrailer = b.labSamples?.filter((s: any) => s.isTrailer) || [];
      const validPoTrailer = bSamplesTrailer.filter((s: any) => s.p0 && s.p0 > 0);
      const validPriTrailer = bSamplesTrailer.filter((s: any) => s.pri && s.pri > 0);

      const avgPoTrailer =
        validPoTrailer.length > 0
          ? validPoTrailer.reduce((sum: number, s: any) => sum + s.p0, 0) / validPoTrailer.length
          : 0;
      const avgPriTrailer =
        validPriTrailer.length > 0
          ? validPriTrailer.reduce((sum: number, s: any) => sum + s.pri, 0) / validPriTrailer.length
          : 0;

      const grossTrailer = Math.max(0, (b.trailerWeightIn || 0) - (b.trailerWeightOut || 0));
      const drcTrailer = b.trailerDrcActual || 0;
      const netWeightTrailer = drcTrailer > 0 ? Math.round(grossTrailer * (drcTrailer / 100)) : 0;

      result.push({
        ...b,
        id: b.id + '-trailer',
        originalId: b.id,
        isTrailerPart: true,
        partLabel: 'Trailer',
        displayRubberType: getRubberTypeName(b.trailerRubberType || b.rubberType),
        displayWeightIn: grossTrailer,
        displayNetWeight: netWeightTrailer,
        avgPo: avgPoTrailer,
        avgPri: avgPriTrailer,
        lotNo: b.lotNo || b.bookingCode || '-',
      });
    }
  });
  return result;
});

const stats = computed(() => {
  const total = processedBookings.value.length;
  const complete = processedBookings.value.filter((b: any) => b.avgPo > 0 || b.avgPri > 0).length;
  const incomplete = total - complete;
  return { total, complete, incomplete };
});

const filteredBookings = computed(() => {
  let result = processedBookings.value;

  if (statusFilter.value === 'COMPLETE') {
    result = result.filter((b: any) => b.avgPo > 0 || b.avgPri > 0);
  } else if (statusFilter.value === 'INCOMPLETE') {
    result = result.filter((b: any) => !(b.avgPo > 0 || b.avgPri > 0));
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (b) =>
        b.bookingCode?.toLowerCase().includes(query) ||
        b.supplierName?.toLowerCase().includes(query) ||
        b.truckRegister?.toLowerCase().includes(query) ||
        b.lotNo?.toLowerCase().includes(query)
    );
  }

  return result;
});

// Column Definitions
const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'bookingCode',
    header: () => 'Lot Number',
    cell: ({ row }) => {
      const booking = row.original;
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-bold text-sm' }, booking.lotNo),
        h(
          'span',
          { class: 'text-[10px] text-muted-foreground' },
          new Date(booking.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        ),
      ]);
    },
  },
  {
    accessorKey: 'supplierName',
    header: () => 'Supplier',
    cell: ({ row }) => {
      const booking = row.original;
      return h('div', { class: 'flex flex-col' }, [
        h(
          'span',
          { class: 'font-medium text-sm' },
          `${booking.supplierCode} : ${booking.supplierName}`
        ),
      ]);
    },
  },
  {
    accessorKey: 'truckRegister',
    header: () => 'Truck',
    cell: ({ row }) => {
      const booking = row.original;
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-bold text-sm capitalize' }, booking.truckRegister),
        h(
          'span',
          { class: 'text-[10px] text-muted-foreground' },
          booking.isTrailerPart ? 'Trailer' : booking.truckType || 'Main Truck'
        ),
      ]);
    },
  },
  {
    accessorKey: 'rubberType',
    header: () => 'Rubber Type',
    cell: ({ row }) => {
      const booking = row.original;
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium text-sm' }, booking.displayRubberType),
        h('span', { class: 'text-[10px] text-muted-foreground' }, booking.location || '-'),
      ]);
    },
  },
  {
    accessorKey: 'avgPo',
    header: () =>
      h(
        'div',
        {
          class:
            'text-center bg-slate-100 text-slate-700 h-8 flex items-center justify-center rounded-sm mx-1 min-w-[80px] font-bold text-xs',
        },
        'AVG PO'
      ),
    cell: ({ row }) => {
      const val = row.original.avgPo;
      if (!val || val === 0)
        return h('div', { class: 'text-center text-muted-foreground/30' }, '-');
      return h('div', { class: 'text-center font-bold text-slate-600' }, val.toFixed(2));
    },
  },
  {
    accessorKey: 'avgPri',
    header: () =>
      h(
        'div',
        {
          class:
            'text-center bg-slate-100 text-slate-700 h-8 flex items-center justify-center rounded-sm mx-1 min-w-[80px] font-bold text-xs',
        },
        'AVG PRI'
      ),
    cell: ({ row }) => {
      const val = row.original.avgPri;
      if (!val || val === 0)
        return h('div', { class: 'text-center text-muted-foreground/30' }, '-');
      return h('div', { class: 'text-center font-bold text-slate-600' }, val.toFixed(2));
    },
  },
  {
    accessorKey: 'netWeight',
    header: () => h('div', { class: 'text-right' }, 'Net Weight'),
    cell: ({ row }) => {
      const val = row.original.displayNetWeight;
      return h('div', { class: 'text-right' }, [
        val > 0
          ? h('span', { class: 'font-bold text-green-600' }, `${val.toLocaleString()} Kg.`)
          : h('span', { class: 'text-green-600/30 font-bold' }, '-'),
      ]);
    },
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-center' }, 'Actions'),
    cell: ({ row }) => {
      const booking = row.original;
      return h(
        'div',
        { class: 'flex justify-end pr-2' },
        h(
          Button,
          {
            variant: 'ghost',
            size: 'sm',
            onClick: (e: Event) => {
              e.stopPropagation();
              handleOpenDetail(booking.originalId, booking.isTrailerPart);
            },
            class: 'h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50',
          },
          { default: () => h(Edit, { class: 'h-4 w-4' }) }
        )
      );
    },
  },
];

const handleRowClick = (row: any) => {
  handleOpenDetail(row.originalId, row.isTrailerPart);
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="space-y-4">
    <!-- Filters and Summary -->
    <div
      class="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-lg border shadow-sm"
    >
      <div class="flex items-center gap-2 w-full md:w-auto">
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              class="w-10 px-0 border-input/50 h-10 bg-background"
              :class="{
                'text-primary border-primary/50 bg-primary/5': searchQuery,
                'text-muted-foreground': !searchQuery,
              }"
            >
              <Search class="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[300px] p-0" align="start">
            <div class="p-2">
              <div class="relative">
                <Search
                  class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <Input
                  v-model="searchQuery"
                  placeholder="Search..."
                  class="pl-9 border-none focus-visible:ring-0"
                  autoFocus
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover v-model:open="isDatePopoverOpen">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              class="w-[150px] justify-start text-left font-normal border-input/50 h-10"
            >
              <CalendarIcon class="mr-2 h-4 w-4 text-muted-foreground" />
              <span class="text-sm">
                {{ selectedDate ? format(new Date(selectedDate), 'dd-MMM-yyyy') : 'Pick a date' }}
              </span>
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

        <div class="flex items-center gap-2 bg-muted/30 p-1 rounded-lg ml-2">
          <Button
            variant="ghost"
            size="sm"
            class="h-8 px-3 rounded-sm transition-all"
            :class="
              statusFilter === 'ALL'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:bg-background/50'
            "
            @click="statusFilter = 'ALL'"
          >
            All
            <Badge variant="secondary" class="ml-2 bg-slate-100 text-slate-700 border-none">{{
              stats.total
            }}</Badge>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-8 px-3 rounded-sm transition-all text-green-600"
            :class="
              statusFilter === 'COMPLETE'
                ? 'bg-background shadow-sm'
                : 'text-green-600/70 hover:bg-background/50'
            "
            @click="statusFilter = 'COMPLETE'"
          >
            Complete
            <Badge variant="secondary" class="ml-2 bg-green-100 text-green-700 border-none">{{
              stats.complete
            }}</Badge>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-8 px-3 rounded-sm transition-all text-orange-600"
            :class="
              statusFilter === 'INCOMPLETE'
                ? 'bg-background shadow-sm'
                : 'text-orange-600/70 hover:bg-background/50'
            "
            @click="statusFilter = 'INCOMPLETE'"
          >
            Incomplete
            <Badge variant="secondary" class="ml-2 bg-orange-100 text-orange-700 border-none">{{
              stats.incomplete
            }}</Badge>
          </Button>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="rounded-md border bg-card">
      <DataTable
        :columns="columns"
        :data="filteredBookings"
        :loading="isLoading"
        @row-click="handleRowClick"
      />
    </div>

    <!-- Detail Dialog -->
    <ClPoPriDialog
      v-model:open="isDialogOpen"
      :booking-id="selectedBookingId"
      :is-trailer="selectedIsTrailer"
      @update="fetchData"
    />
  </div>
</template>
