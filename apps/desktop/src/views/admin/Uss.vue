<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import DataTable from '@/components/ui/data-table/DataTable.vue';
// import { Dialog, DialogContent } from '@/components/ui/dialog'; // Removed
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { bookingsApi } from '@/services/bookings';
import { rubberTypesApi, type RubberType } from '@/services/rubberTypes';
import { getLocalTimeZone, today } from '@internationalized/date';
import type { ColumnDef } from '@tanstack/vue-table';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Edit, Search, Sheet, Trash2 } from 'lucide-vue-next'; // Changed Droplets to Sheet
// import { VisuallyHidden } from 'radix-vue'; // Removed
import { computed, h, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
// import UssDetailContent from './components/UssDetailContent.vue'; // Removed

const props = defineProps({
  embedded: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n();
const router = useRouter();

// State
const bookings = ref<any[]>([]);
const rubberTypes = ref<RubberType[]>([]);
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
const handleRowClick = (row: any) => {
  router.push({
    name: 'UssDetail',
    params: { id: row.originalId },
    query: {
      isTrailer: row.isTrailerPart ? 'true' : 'false',
      partLabel: row.partLabel,
    },
  });
};

// Fetch Data
const fetchBookings = async () => {
  isLoading.value = true;
  try {
    const [bookingsResponse, typesResponse] = await Promise.all([
      bookingsApi.getAll({ date: selectedDate.value }),
      rubberTypesApi.getAll(),
    ]);
    bookings.value = Array.isArray(bookingsResponse)
      ? bookingsResponse
      : (bookingsResponse as any).data || [];
    rubberTypes.value = typesResponse;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    toast.error(t('truckScale.toast.loadBookingsFailed'));
    bookings.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Helper to get Rubber Type Name
const getRubberTypeName = (code: string) => {
  const type = rubberTypes.value.find((t) => t.code === code);
  return type ? type.name : code;
};

// Helper to check if Rubber Type is USS
const isUssType = (val: string) => {
  if (!val) return false;
  // Look up in master data by code or name
  const type = rubberTypes.value.find((t) => t.code === val || t.name === val);
  if (type) return type.category === 'USS';
  // Robust fallback for names like "EUDR USS", "Regular USS"
  const upperVal = val.toUpperCase();
  return upperVal.includes('USS');
};

// Processed Data (Split logic)
const processedBookings = computed(() => {
  const result: any[] = [];

  bookings.value.forEach((b) => {
    const isTrailer = ['10 ล้อ พ่วง', '10 ล้อ (พ่วง)'].includes(b.truckType);

    // 1. Main Truck Part
    const hasMainWeight =
      (b.weightIn && b.weightIn > 0) ||
      (b.grossWeight && b.grossWeight > 0) ||
      (b.actualWeight && b.actualWeight > 0) ||
      (b.estimatedWeight && b.estimatedWeight > 0);

    if (isUssType(b.rubberType) && hasMainWeight) {
      const bSamples = b.labSamples?.filter((s: any) => !s.isTrailer) || [];
      const validCpSamples = bSamples.filter((s: any) => s.percentCp > 0);
      const avgCp =
        validCpSamples.length > 0
          ? validCpSamples.reduce((sum: number, s: any) => sum + s.percentCp, 0) /
            validCpSamples.length
          : b.cpAvg || 0;

      const isComplete = (b.weightOut || 0) > 0 && avgCp > 0;
      const gross = Math.max(0, (b.weightIn || 0) - (b.weightOut || 0));
      const drc = b.drcActual || 0;
      const netWeight = drc > 0 ? Math.round(gross * (drc / 100)) : 0;

      result.push({
        ...b,
        id: b.id + '-main',
        originalId: b.id,
        isTrailerPart: false,
        partLabel: t('truckScale.mainTruck') || 'Main Truck',
        displayRubberType: getRubberTypeName(b.rubberType),
        displayRubberSource: b.rubberSource,
        displayWeightIn: b.weightIn || b.grossWeight || b.actualWeight || 0,
        displayWeightOut: b.weightOut || 0,
        displayNetWeight: netWeight,
        moisture: b.moisture ? b.moisture.toFixed(1) : '-',
        drcEst: b.drcEst ? b.drcEst.toFixed(1) : '-',
        drcRequested: b.drcRequested ? b.drcRequested.toFixed(1) : '-',
        drcActual: b.drcActual ? b.drcActual.toFixed(1) : '-',
        cpAvg: avgCp > 0 ? avgCp.toFixed(2) : '-',
        lotNo: b.lotNo || '-',
        isComplete,
      });
    }

    // 2. Trailer Part
    const hasTrailerWeight =
      (b.trailerWeightIn && b.trailerWeightIn > 0) ||
      (b.trailerGrossWeight && b.trailerGrossWeight > 0) ||
      (b.trailerActualWeight && b.trailerActualWeight > 0) ||
      (b.trailerEstimatedWeight && b.trailerEstimatedWeight > 0);

    if (isTrailer && hasTrailerWeight && isUssType(b.trailerRubberType)) {
      const bSamples = b.labSamples?.filter((s: any) => s.isTrailer) || [];
      const validCpSamples = bSamples.filter((s: any) => s.percentCp > 0);
      const avgCp =
        validCpSamples.length > 0
          ? validCpSamples.reduce((sum: number, s: any) => sum + s.percentCp, 0) /
            validCpSamples.length
          : b.trailerCpAvg || 0;

      const isComplete = (b.trailerWeightOut || 0) > 0 && avgCp > 0;
      const gross = Math.max(0, (b.trailerWeightIn || 0) - (b.trailerWeightOut || 0));
      const drc = b.trailerDrcActual || 0;
      const netWeight = drc > 0 ? Math.round(gross * (drc / 100)) : 0;

      result.push({
        ...b,
        id: b.id + '-trailer',
        originalId: b.id,
        isTrailerPart: true,
        partLabel: t('truckScale.trailer') || 'Trailer',
        displayRubberType: getRubberTypeName(b.trailerRubberType),
        displayRubberSource: b.trailerRubberSource || '-',
        displayWeightIn: b.trailerWeightIn || b.trailerGrossWeight || b.trailerActualWeight || 0,
        displayWeightOut: b.trailerWeightOut || 0,
        displayNetWeight: netWeight,
        moisture: b.trailerMoisture ? b.trailerMoisture.toFixed(1) : '-',
        drcEst: b.trailerDrcEst ? b.trailerDrcEst.toFixed(1) : '-',
        drcRequested: b.trailerDrcRequested ? b.trailerDrcRequested.toFixed(1) : '-',
        drcActual: b.trailerDrcActual ? b.trailerDrcActual.toFixed(1) : '-',
        cpAvg: avgCp > 0 ? avgCp.toFixed(2) : '-',
        lotNo: b.trailerLotNo || '2251226-' + b.queueNo + '/2',
        isComplete,
      });
    }
  });

  let data = result;

  if (activeTab.value === 'complete') {
    data = data.filter((item) => item.isComplete);
  } else if (activeTab.value === 'incomplete') {
    data = data.filter((item) => !item.isComplete);
  }

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

const stats = computed(() => {
  const total = processedBookings.value.length;
  const complete = processedBookings.value.filter((i) => i.isComplete).length;
  const incomplete = total - complete;
  const grossWeight = processedBookings.value.reduce((sum, i) => sum + (i.displayWeightIn || 0), 0);
  const netWeight = processedBookings.value.reduce((sum, i) => sum + (i.displayNetWeight || 0), 0);

  return { total, complete, incomplete, grossWeight, netWeight };
});

const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'lotNo',
    header: () => t('uss.lotNumber'),
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-bold text-foreground' }, row.original.lotNo),
        h(
          'span',
          { class: 'text-xs text-muted-foreground' },
          format(new Date(row.original.date), 'dd MMM yyyy')
        ),
      ]),
  },
  {
    accessorKey: 'supplierName',
    header: () => t('uss.supplier'),
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
    accessorKey: 'totalPallets',
    header: () => h('div', { class: 'text-center' }, t('uss.totalPallets')),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-center font-medium' },
        (row.original.subBookings?.length || 0).toString()
      ), // Assuming subBookings exists, fallback to 0
  },
  {
    accessorKey: 'grossPlusPallets',
    header: () => h('div', { class: 'text-center' }, t('uss.grossPlusPalletsWeight')),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-center font-medium' },
        (row.original.displayWeightIn || 0).toLocaleString()
      ),
  },
  {
    accessorKey: 'grossWeight',
    header: () => h('div', { class: 'text-center' }, t('uss.grossWeight')),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-center font-medium' },
        (row.original.displayWeightOut || 0).toLocaleString()
      ),
  },
  {
    accessorKey: 'netWeight',
    header: () => h('div', { class: 'text-center' }, t('uss.netWeight')),
    cell: ({ row }) => {
      const val = row.original.displayNetWeight;
      if (!val || val === 0) return h('div', { class: 'text-center font-bold' }, '-');
      return h('div', { class: 'text-center font-bold' }, val.toLocaleString());
    },
  },

  {
    accessorKey: 'drcEst',
    header: () => h('div', { class: 'text-center' }, t('uss.drcEst')),
    cell: ({ row }) => h('div', { class: 'text-center font-medium' }, row.original.drcEst),
  },
  {
    accessorKey: 'drcActual',
    header: () => h('div', { class: 'text-center' }, t('uss.drcActual')),
    cell: ({ row }) => h('div', { class: 'text-center font-medium' }, row.original.drcActual),
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-center' }, t('uss.action')),
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center justify-center gap-2' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            onClick: (e: any) => {
              e.stopPropagation();
              handleRowClick(row.original);
            },
          },
          () => h(Edit, { class: 'w-4 h-4 text-muted-foreground' })
        ),
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            onClick: (e: any) => {
              e.stopPropagation();
              // Add delete handler if needed, placeholder for now
            },
          },
          () => h(Trash2, { class: 'w-4 h-4 text-destructive' })
        ),
      ]);
    },
  },
];

onMounted(() => {
  fetchBookings();
});
</script>

<template>
  <div class="h-full flex flex-col max-w-[1600px] mx-auto space-y-6" :class="{ 'p-6': !embedded }">
    <!-- Header Controls -->
    <Card class="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
      <CardContent
        class="p-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6"
      >
        <!-- Title Section -->
        <div class="flex items-center gap-4 min-w-fit" v-if="!embedded">
          <div class="p-3 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Sheet class="h-8 w-8" />
          </div>
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-foreground">
              {{ t('services.uss.name') || 'USS' }}
            </h1>
            <p class="text-sm text-muted-foreground">
              {{ t('services.uss.description') }}
            </p>
          </div>
        </div>

        <!-- Right Side Controls -->
        <div class="flex flex-col lg:flex-row items-center gap-6 w-full xl:w-auto justify-end">
          <!-- Date & Search -->
          <div class="flex items-center gap-2">
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="w-9 px-0 border-input/50 h-9 bg-background"
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
                  class="w-[150px] justify-start text-left font-normal border-input/50 h-9"
                >
                  <CalendarIcon class="mr-2 h-4 w-4 text-muted-foreground" />
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

          <!-- Filter Tabs -->
          <div class="flex items-center gap-2 bg-muted/50 p-1 rounded-lg self-end lg:self-center">
            <Button
              size="sm"
              :variant="activeTab === 'all' ? 'secondary' : 'ghost'"
              @click="activeTab = 'all'"
              class="gap-2 h-8"
            >
              {{ t('uss.all') }}
              <Badge variant="secondary" class="ml-1">{{ stats.total }}</Badge>
            </Button>
            <Button
              size="sm"
              :variant="activeTab === 'complete' ? 'secondary' : 'ghost'"
              @click="activeTab = 'complete'"
              class="gap-2 text-green-600 h-8"
            >
              {{ t('uss.complete') }}
              <Badge class="ml-1 bg-green-100 text-green-700 hover:bg-green-100">{{
                stats.complete
              }}</Badge>
            </Button>
            <Button
              size="sm"
              :variant="activeTab === 'incomplete' ? 'secondary' : 'ghost'"
              @click="activeTab = 'incomplete'"
              class="gap-2 text-orange-600 h-8"
              :class="{ 'bg-orange-100/50 hover:bg-orange-100/70': activeTab === 'incomplete' }"
            >
              {{ t('uss.incomplete') }}
              <Badge
                class="ml-1 bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200"
                >{{ stats.incomplete }}</Badge
              >
            </Button>
          </div>
        </div>

        <!-- Summary Stats (Right Side) -->
        <div class="items-center gap-8 px-4 border-l border-border/50 hidden xl:flex">
          <div>
            <div class="text-xs text-muted-foreground text-right mb-0.5">
              {{ t('uss.grossWeight') }}
            </div>
            <div class="text-lg font-bold">
              {{ stats.grossWeight.toLocaleString() }}
              <span class="text-xs font-normal text-muted-foreground">{{ t('uss.kg') }}</span>
            </div>
          </div>
          <div>
            <div class="text-xs text-muted-foreground text-right mb-0.5">
              {{ t('uss.netWeight') }}
            </div>
            <div class="text-lg font-bold text-green-600">
              {{ stats.netWeight.toLocaleString() }}
              <span class="text-xs font-normal text-muted-foreground">{{ t('uss.kg') }}</span>
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
    <!-- Detail Modal Removed -->
  </div>
</template>
