<script setup lang="ts">
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { bookingsApi } from '@/services/bookings';
import { rubberTypesApi, type RubberType } from '@/services/rubberTypes';
import type { ColumnDef } from '@tanstack/vue-table';
import { computed, h, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ClPoPriDialog from '../components/ClPoPriDialog.vue';

const { t } = useI18n();

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
    // Filter for Cuplump only
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

const calculateGrade = (avg: number) => {
  if (!avg || avg === 0) return '-';
  if (avg < 20) return 'D';
  if (avg < 35) return 'C';
  if (avg < 47) return 'B';
  if (avg < 60) return 'A';
  return 'AA';
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

    // Only display if samples exist AND Lot Number is present
    if (bSamplesMain.length > 0 && b.lotNo) {
      result.push({
        ...b,
        id: b.id + '-main',
        originalId: b.id,
        isTrailerPart: false,
        partLabel: t('qa.labels.mainTruck'),
        displayRubberType: getRubberTypeName(b.rubberType),
        displayLocation: b.rubberSource || '-',
        displayWeightIn: grossMain,
        displayNetWeight: netWeightMain,
        avgPo: avgPoMain,
        avgPri: avgPriMain,
        grade: calculateGrade(avgPriMain),
        lotNo: b.lotNo,
      });
    }

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

      // Only display if trailer samples exist AND Lot Number is present
      if (bSamplesTrailer.length > 0 && b.lotNo) {
        result.push({
          ...b,
          id: b.id + '-trailer',
          originalId: b.id,
          isTrailerPart: true,
          partLabel: t('qa.labels.trailer'),
          displayRubberType: getRubberTypeName(b.trailerRubberType || b.rubberType),
          displayLocation: b.trailerRubberSource || b.rubberSource || '-',
          displayWeightIn: grossTrailer,
          displayNetWeight: netWeightTrailer,
          avgPo: avgPoTrailer,
          avgPri: avgPriTrailer,
          grade: calculateGrade(avgPriTrailer),
          lotNo: b.lotNo,
        });
      }
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
    result = result.filter((b: any) => b.avgPo > 0 || b.avgPri > 0);
  } else if (statusFilter.value === 'INCOMPLETE') {
    result = result.filter((b: any) => !(b.avgPo > 0 || b.avgPri > 0));
  }

  if (props.searchQuery) {
    const query = props.searchQuery.toLowerCase();
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
    header: () => t('qa.columns.lotNumber'),
    cell: ({ row }) => {
      const booking = row.original;
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-bold text-sm text-foreground' }, booking.lotNo),
        h(
          'span',
          { class: 'text-xs text-primary font-medium' },
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
    header: () => t('qa.columns.supplier'),
    cell: ({ row }) => {
      const booking = row.original;
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-bold text-sm text-foreground' }, booking.supplierCode),
        h('span', { class: 'text-xs text-primary font-medium' }, booking.supplierName),
      ]);
    },
  },
  {
    accessorKey: 'truckRegister',
    header: () => t('qa.columns.truck'),
    cell: ({ row }) => {
      const booking = row.original;
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-bold text-sm capitalize text-foreground' }, booking.truckRegister),
        h(
          'span',
          { class: 'text-xs text-primary font-medium' },
          booking.isTrailerPart
            ? t('qa.labels.trailer')
            : booking.truckType || t('qa.labels.mainTruck')
        ),
      ]);
    },
  },
  {
    accessorKey: 'rubberType',
    header: () => t('qa.columns.rubberType'),
    cell: ({ row }) => {
      const booking = row.original;
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium text-sm text-foreground' }, booking.displayRubberType),
        h('span', { class: 'text-xs text-primary font-medium' }, booking.displayLocation),
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
            'text-center bg-primary/10 text-primary h-8 flex items-center justify-center rounded-sm mx-1 min-w-[80px] font-bold text-xs',
        },
        t('qa.columns.avgPo')
      ),
    cell: ({ row }) => {
      const val = row.original.avgPo;
      if (!val || val === 0)
        return h('div', { class: 'text-center text-muted-foreground/30' }, '-');
      return h('div', { class: 'text-center font-bold text-foreground/80' }, val.toFixed(1));
    },
  },
  {
    accessorKey: 'avgPri',
    header: () =>
      h(
        'div',
        {
          class:
            'text-center bg-primary/10 text-primary h-8 flex items-center justify-center rounded-sm mx-1 min-w-[80px] font-bold text-xs',
        },
        t('qa.columns.avgPri')
      ),
    cell: ({ row }) => {
      const val = row.original.avgPri;
      if (!val || val === 0)
        return h('div', { class: 'text-center text-muted-foreground/30' }, '-');
      return h('div', { class: 'text-center font-bold text-foreground/80' }, val.toFixed(1));
    },
  },
  {
    accessorKey: 'grade',
    header: () =>
      h(
        'div',
        {
          class:
            'text-center bg-primary/10 text-primary h-8 flex items-center justify-center rounded-sm mx-1 min-w-[60px] font-bold text-xs',
        },
        t('qa.columns.grade')
      ),
    cell: ({ row }) => {
      const val = row.original.grade;
      if (!val || val === '-')
        return h('div', { class: 'text-center text-muted-foreground/30' }, '-');
      return h('div', { class: 'text-center font-black text-foreground' }, val);
    },
  },
  {
    accessorKey: 'netWeight',
    header: () => h('div', { class: 'text-right' }, t('qa.columns.netWeight')),
    cell: ({ row }) => {
      const val = row.original.displayNetWeight;
      return h('div', { class: 'text-right' }, [
        val > 0
          ? h(
              'span',
              { class: 'font-bold text-emerald-600' },
              `${val.toLocaleString()} ${t('qa.labels.kg')}`
            )
          : h('span', { class: 'text-emerald-600/30 font-bold' }, '-'),
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
    <ClPoPriDialog
      v-model:open="isDialogOpen"
      :booking-id="selectedBookingId"
      :is-trailer="selectedIsTrailer"
      @update="fetchData"
    />
  </div>
</template>
