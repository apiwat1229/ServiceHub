<script setup lang="ts">
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { bookingsApi } from '@/services/bookings';
import { rubberTypesApi, type RubberType } from '@/services/rubberTypes';
import type { ColumnDef } from '@tanstack/vue-table';
import { computed, h, onMounted, ref, watch } from 'vue';
import ClLabDialog from '../components/ClLabDialog.vue';

const props = defineProps<{
  searchQuery?: string;
  date?: string;
  statusFilter?: string;
}>();

const emit = defineEmits(['update:stats']);

const bookings = ref<any[]>([]);
const rubberTypes = ref<RubberType[]>([]);
const isLoading = ref(false);
// Local statusFilter removed, using props.statusFilter
const statusFilter = computed(() => props.statusFilter || 'ALL');

// Detail Dialog
const isDialogOpen = ref(false);
const selectedBookingId = ref<string | null>(null);
const selectedIsTrailer = ref(false);

const handleOpenDetail = (bookingId: string, isTrailer = false) => {
  selectedBookingId.value = bookingId;
  selectedIsTrailer.value = isTrailer;
  isDialogOpen.value = true;
};

// Watch Date Prop
watch(
  () => props.date,
  (newVal) => {
    if (newVal) fetchData();
  }
);

const fetchData = async () => {
  isLoading.value = true;
  try {
    const [bookingsData, typesData] = await Promise.all([
      bookingsApi.getAll({ date: props.date }),
      rubberTypesApi.getAll(),
    ]);

    rubberTypes.value = typesData;
    // Filter for Cuplump only (Should match CL PO PRI logic)
    bookings.value = (bookingsData || []).filter(
      (b: any) =>
        b.rubberType &&
        (b.rubberType === 'Coagulating Cup Lumps' ||
          b.rubberType.includes('Cup') ||
          b.rubberType.includes('CL'))
    );
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
    // Calculate simple stats if needed, or rely on stored fields if backend calculates
    // Currently relying on frontend processing for display consistency

    // Using avgPri for grade just for reference, but main focus is Lab fields availability?
    const validPriMain = bSamplesMain.filter((s: any) => s.pri && s.pri > 0);
    const avgPriMain =
      validPriMain.length > 0
        ? validPriMain.reduce((sum: number, s: any) => sum + s.pri, 0) / validPriMain.length
        : 0;

    const grossMain = Math.max(0, (b.weightIn || 0) - (b.weightOut || 0));
    const drcMain = b.drcActual || 0;
    const netWeightMain = drcMain > 0 ? Math.round(grossMain * (drcMain / 100)) : 0;

    // Only display if samples exist AND Lot Number is present
    if (bSamplesMain.length > 0 && b.lotNo) {
      result.push({
        ...b,
        id: b.id + '-main',
        originalId: b.id,
        isTrailerPart: false,
        partLabel: 'Main Truck',
        displayRubberType: getRubberTypeName(b.rubberType),
        displayWeightIn: grossMain,
        displayNetWeight: netWeightMain,
        drcActual: drcMain,
        avgPri: avgPriMain,
        lotNo: b.lotNo,
      });
    }

    // 2. Trailer Part
    const hasTrailer =
      (b.trailerWeightIn && b.trailerWeightIn > 0) || (b.trailerRubberType && b.trailerRubberType);
    if (hasTrailer) {
      const bSamplesTrailer = b.labSamples?.filter((s: any) => s.isTrailer) || [];

      // Only display if trailer samples exist AND Lot Number is present
      if (bSamplesTrailer.length > 0 && b.lotNo) {
        const grossTrailer = Math.max(0, (b.trailerWeightIn || 0) - (b.trailerWeightOut || 0));
        result.push({
          ...b,
          id: b.id + '-trailer',
          originalId: b.id,
          isTrailerPart: true,
          partLabel: 'Trailer',
          displayRubberType: getRubberTypeName(b.trailerRubberType || b.rubberType),
          displayWeightIn: grossTrailer,
          // ... simplified for brevity
          lotNo: b.lotNo,
        });
      }
    }
  });
  return result;
});

const stats = computed(() => {
  // Check completeness based on Lab Data?
  // Assume complete if drcActual > 0 ? Or if samples exist?
  return { total: processedBookings.value.length, complete: 0, incomplete: 0 };
});

watch(
  stats,
  (newStats) => {
    emit('update:stats', newStats);
  },
  { immediate: true }
);

const filteredBookings = computed(() => {
  let result = processedBookings.value;

  if (statusFilter.value === 'COMPLETE') {
    // ClLab filtering logic for complete/incomplete
    // Assuming complete means drcActual > 0
    result = result.filter((b: any) => b.drcActual && b.drcActual > 0);
  } else if (statusFilter.value === 'INCOMPLETE') {
    result = result.filter((b: any) => !b.drcActual || b.drcActual <= 0);
  }
  // Apply Search
  if (props.searchQuery) {
    const query = props.searchQuery.toLowerCase();
    result = result.filter(
      (b) =>
        b.bookingCode?.toLowerCase().includes(query) ||
        b.supplierName?.toLowerCase().includes(query) ||
        b.lotNo?.toLowerCase().includes(query)
    );
  }
  return result;
});

// Column Definitions (Simplified for Lab)
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
        h('span', { class: 'font-bold text-sm' }, booking.supplierCode),
        h('span', { class: 'text-[10px] text-muted-foreground' }, booking.supplierName),
      ]);
    },
  },
  {
    accessorKey: 'drcActual',
    header: () => h('div', { class: 'text-center' }, 'DRC %'),
    cell: ({ row }) => {
      const val = row.original.drcActual;
      if (!val) return h('div', { class: 'text-center text-muted-foreground/30' }, '-');
      return h('div', { class: 'text-center font-bold text-blue-600' }, `${val}%`);
    },
  },
  {
    accessorKey: 'netWeight',
    header: () => h('div', { class: 'text-right' }, 'Net Weight'),
    cell: ({ row }) => {
      // Reuse logic from ClPoPriTab
      const val = row.original.displayNetWeight;
      return h('div', { class: 'text-right' }, [
        val > 0
          ? h('span', { class: 'font-bold text-green-600' }, `${val.toLocaleString()} Kg.`)
          : h('span', { class: 'text-green-600/30 font-bold' }, '-'),
      ]);
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
    <ClLabDialog
      v-model:open="isDialogOpen"
      :booking-id="selectedBookingId"
      :is-trailer="selectedIsTrailer"
      @update="fetchData"
    />
  </div>
</template>
