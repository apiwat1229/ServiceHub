<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { bookingsApi } from '@/services/bookings';
import { rubberTypesApi, type RubberType } from '@/services/rubberTypes';
import {
  Beaker,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Scale,
  Thermometer,
} from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  searchQuery?: string;
  date?: string;
  statusFilter?: string;
}>();

const emit = defineEmits(['update:stats']);

const isLoading = ref(false);
const bookings = ref<any[]>([]);
const rubberTypes = ref<RubberType[]>([]);

const fetchData = async () => {
  isLoading.value = true;
  try {
    const [bookingsData, typesData] = await Promise.all([
      bookingsApi.getAll(),
      rubberTypesApi.getAll(),
    ]);
    bookings.value = bookingsData;
    rubberTypes.value = typesData;
  } catch (error) {
    console.error('Failed to load summary data:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchData);
watch(() => props.date, fetchData);

const getRubberTypeName = (code: string) => {
  const t = rubberTypes.value.find((rt) => rt.code === code);
  return t ? t.name : code || '-';
};

const getGradeColorClass = (grade: string) => {
  switch (grade?.toUpperCase()) {
    case 'AA':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'A':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'B':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'C':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'D':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const processedBookings = computed(() => {
  if (!bookings.value) return [];

  const query = props.searchQuery?.toLowerCase() || '';
  const dateStr = props.date || '';

  return bookings.value
    .filter((b: any) => {
      // Filter by Date
      const bDate = new Date(b.date).toISOString().split('T')[0];
      if (dateStr && bDate !== dateStr) return false;

      // Filter by Category (CL)
      if (b.rubberType?.startsWith('USS')) return false;

      // Only show if has lotNo and labSamples
      if (!b.lotNo) return false;
      if (!b.labSamples || b.labSamples.length === 0) return false;

      // Filter by Search Query
      if (query) {
        return (
          b.lotNo.toLowerCase().includes(query) ||
          b.supplierName.toLowerCase().includes(query) ||
          b.supplierCode.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .map((b: any) => {
      const parts: any[] = [];
      const getMedian = (arr: any[]) => {
        const sorted = arr
          .filter((v) => v !== null && v !== undefined && !isNaN(parseFloat(v)))
          .sort((a, b) => a - b);
        if (sorted.length === 0) return null;
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0
          ? sorted[mid]
          : (parseFloat(sorted[mid - 1]) + parseFloat(sorted[mid])) / 2;
      };

      const processSamples = (samples: any[]) => {
        return samples
          .sort((a: any, b: any) => a.sampleNo - b.sampleNo)
          .map((s: any) => {
            const beforeBakings = [s.beforeBaking1, s.beforeBaking2, s.beforeBaking3].map((v) =>
              parseFloat(v)
            );
            const afterDryers = [s.afterDryerB1, s.afterDryerB2, s.afterDryerB3].map((v) =>
              parseFloat(v)
            );
            const moistures = [s.moisturePercentB1, s.moisturePercentB2, s.moisturePercentB3].map(
              (v) => parseFloat(v)
            );
            const beforeLabs = [s.beforeLabDryerB1, s.beforeLabDryerB2, s.beforeLabDryerB3].map(
              (v) => parseFloat(v)
            );
            const afterLabs = [s.afterLabDryerB1, s.afterLabDryerB2, s.afterLabDryerB3].map((v) =>
              parseFloat(v)
            );

            return {
              ...s,
              medianBeforeBaking: getMedian(beforeBakings),
              medianAfterDryer: getMedian(afterDryers),
              medianMoisture: getMedian(moistures),
              medianBeforeLab: getMedian(beforeLabs),
              medianAfterLab: getMedian(afterLabs),
            };
          });
      };

      const mainSamples = b.labSamples.filter((s: any) => !s.isTrailer);
      if (mainSamples.length > 0) {
        const validPriMain = mainSamples.filter((s: any) => s.pri && s.pri > 0);
        const avgPriMain =
          validPriMain.length > 0
            ? validPriMain.reduce((sum: number, s: any) => sum + s.pri, 0) / validPriMain.length
            : 0;

        parts.push({
          ...b,
          id: b.id + '-main',
          originalId: b.id,
          isTrailerPart: false,
          partLabel: 'Main Truck',
          displayRubberType: getRubberTypeName(b.rubberType),
          displayLocation: b.rubberSource || '-',
          samples: processSamples(mainSamples),
          displayWeight: (b.weightIn || 0) - (b.weightOut || 0),
          displayGrade: calculateGrade(avgPriMain),
          drcEstimate: b.drcEst, // From booking
        });
      }

      const trailerSamples = b.labSamples.filter((s: any) => s.isTrailer);
      if (trailerSamples.length > 0) {
        const validPriTrailer = trailerSamples.filter((s: any) => s.pri && s.pri > 0);
        const avgPriTrailer =
          validPriTrailer.length > 0
            ? validPriTrailer.reduce((sum: number, s: any) => sum + s.pri, 0) /
              validPriTrailer.length
            : 0;

        parts.push({
          ...b,
          id: b.id + '-trailer',
          originalId: b.id,
          isTrailerPart: true,
          partLabel: 'Trailer',
          displayRubberType: getRubberTypeName(b.trailerRubberType || b.rubberType),
          displayLocation: b.trailerRubberSource || b.rubberSource || '-',
          samples: processSamples(trailerSamples),
          displayWeight: (b.trailerWeightIn || 0) - (b.trailerWeightOut || 0),
          displayGrade: calculateGrade(avgPriTrailer),
          drcEstimate: b.trailerDrcEst || b.drcEst,
        });
      }

      return parts;
    })
    .flat();
});

const calculateGrade = (avg: number) => {
  if (!avg || avg === 0) return '-';
  if (avg < 20) return 'D';
  if (avg < 35) return 'C';
  if (avg < 47) return 'B';
  if (avg < 60) return 'A';
  return 'AA';
};

const scrollContainers = ref<Record<string, HTMLElement | null>>({});

const scroll = (id: string, dir: 'left' | 'right') => {
  const el = scrollContainers.value[id];
  if (el) {
    const amount = dir === 'left' ? -524 : 524;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }
};

// Update stats for parent component
watch(
  processedBookings,
  (newVal) => {
    emit('update:stats', {
      total: newVal.length,
      complete: newVal.length, // In this tab, all shown are complete (filtered)
      incomplete: 0,
    });
  },
  { immediate: true }
);

const formatNum = (val: any, decimals = 1) => {
  if (val === null || val === undefined || val === '') return '-';
  const n = parseFloat(val);
  return isNaN(n) ? '-' : n.toFixed(decimals);
};
</script>

<template>
  <div class="space-y-6">
    <div v-if="isLoading" class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"
      ></div>
    </div>

    <div
      v-else-if="processedBookings.length === 0"
      class="flex flex-col items-center justify-center py-20 bg-slate-50 border border-dashed rounded-xl border-slate-200"
    >
      <FlaskConical class="h-12 w-12 text-slate-300 mb-4" />
      <h3 class="text-lg font-medium text-slate-900">No Cuplump Summary Data</h3>
      <p class="text-slate-500 text-sm max-w-xs text-center">
        We couldn't find any recorded lab samples for this date. Make sure samples are recorded in
        the Lab tab.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 gap-6">
      <Card
        v-for="b in processedBookings"
        :key="b.id"
        class="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow"
      >
        <!-- Card Header Area -->
        <div class="bg-slate-50/80 border-b border-slate-100 p-4">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-6">
              <div class="flex flex-col">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"
                  >Date</span
                >
                <span class="text-sm font-semibold text-slate-900">
                  {{
                    new Date(b.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  }}
                </span>
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"
                  >Lot Number</span
                >
                <span class="text-lg font-black text-blue-600 leading-none">{{ b.lotNo }}</span>
              </div>
              <div class="flex flex-col max-w-[200px] justify-center">
                <span class="text-sm font-bold text-slate-900 truncate leading-none mb-1">{{
                  b.supplierCode
                }}</span>
                <span class="text-[11px] text-slate-500 truncate leading-none">{{
                  b.supplierName
                }}</span>
              </div>
            </div>

            <div class="flex items-center gap-8">
              <div class="flex flex-col items-end">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"
                  >Net Weight</span
                >
                <span class="text-sm font-bold text-slate-900"
                  >{{ b.displayWeight.toLocaleString() }}
                  <span class="text-slate-400 font-normal ml-1">kg.</span></span
                >
              </div>
              <div class="flex flex-col items-end justify-center">
                <Badge
                  variant="secondary"
                  class="bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-100"
                >
                  {{ b.displayRubberType }}
                </Badge>
                <span class="text-[10px] font-medium text-blue-600 mt-1">{{
                  b.displayLocation
                }}</span>
              </div>
              <div
                class="flex flex-col items-center justify-center bg-white border-2 rounded-lg h-12 w-14"
                :class="getGradeColorClass(b.displayGrade)"
              >
                <span class="text-[9px] font-black uppercase mb-0.5">Grade</span>
                <span class="text-xl font-black leading-none">{{ b.displayGrade || '-' }}</span>
              </div>
            </div>
          </div>
        </div>

        <CardContent class="p-4">
          <!-- Horizontal Scroll Container for Samples -->
          <div class="relative group">
            <!-- Navigation Buttons -->
            <button
              v-if="b.samples.length > 2"
              @click="scroll(b.id, 'left')"
              class="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-lg border border-slate-200 rounded-full p-2 text-slate-600 hover:text-blue-600 hover:bg-white transition-all opacity-0 group-hover:opacity-100 -ml-4"
            >
              <ChevronLeft class="h-5 w-5" />
            </button>
            <button
              v-if="b.samples.length > 2"
              @click="scroll(b.id, 'right')"
              class="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-lg border border-slate-200 rounded-full p-2 text-slate-600 hover:text-blue-600 hover:bg-white transition-all opacity-0 group-hover:opacity-100 -mr-4"
            >
              <ChevronRight class="h-5 w-5" />
            </button>

            <div
              :ref="
                (el) => {
                  if (el) scrollContainers[b.id] = el as HTMLElement;
                }
              "
              class="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory max-w-full"
              :class="b.samples.length <= 2 ? 'justify-center' : 'justify-start'"
            >
              <div
                v-for="(s, sIdx) in b.samples"
                :key="s.id"
                class="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shrink-0 w-[420px] md:w-[500px] snap-center mx-1"
              >
                <!-- Sample Header -->
                <div class="bg-blue-600 text-white px-3 py-2 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Beaker class="h-4 w-4" />
                    <span class="text-sm font-bold">Sample {{ Number(sIdx) + 1 }}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="flex flex-col items-end">
                      <span class="text-[9px] opacity-80 uppercase leading-none">DRC Median</span>
                      <span class="font-black leading-none">{{ formatNum(s.drc) }}%</span>
                    </div>
                    <div class="flex flex-col items-end">
                      <span class="text-[9px] opacity-80 uppercase leading-none">Recal Median</span>
                      <span class="font-black leading-none text-yellow-300"
                        >{{ formatNum(s.recalDrc) }}%</span
                      >
                    </div>
                  </div>
                </div>

                <!-- Sample Body: 3-Column Grid -->
                <div class="p-4">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Column 1: Weight Process -->
                    <div class="space-y-4">
                      <div class="flex items-center gap-2 mb-2 text-slate-400">
                        <Scale class="h-3 w-3" />
                        <span class="text-[10px] font-bold tracking-wider">Weight Process</span>
                      </div>
                      <div class="space-y-1">
                        <div class="flex justify-between text-[11px]">
                          <span class="text-slate-500">Before Press</span>
                          <span class="font-bold text-slate-700">{{
                            formatNum(s.beforePress, 1)
                          }}</span>
                        </div>
                        <div class="flex justify-between text-[11px]">
                          <span class="text-slate-500">After Press</span>
                          <span class="font-bold text-slate-700">{{
                            formatNum(s.afterPress, 1)
                          }}</span>
                        </div>
                        <div class="flex justify-between text-[11px]">
                          <span class="text-slate-500">Basket</span>
                          <span class="font-bold text-slate-700">{{
                            formatNum(s.basketWeight, 1)
                          }}</span>
                        </div>
                        <div class="flex justify-between text-[11px]">
                          <span class="text-slate-500">Before Dryer</span>
                          <span class="font-bold text-slate-700">{{
                            formatNum(s.medianBeforeBaking, 1)
                          }}</span>
                        </div>
                        <div class="flex justify-between text-[11px]">
                          <span class="text-slate-500">After Dryer</span>
                          <span class="font-bold text-slate-700">{{
                            formatNum(s.medianAfterDryer, 1)
                          }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Column 2: DRC Analysis -->
                    <div class="space-y-4 border-l border-slate-100 pl-6">
                      <div class="flex items-center gap-2 mb-2 text-slate-400">
                        <Thermometer class="h-3 w-3" />
                        <span class="text-[10px] font-bold tracking-wider">DRC Analysis</span>
                      </div>
                      <div class="space-y-1">
                        <div class="flex justify-between text-[11px]">
                          <span class="text-slate-500">DRC After Baking</span>
                          <span class="font-bold text-slate-700">{{ formatNum(s.drc, 1) }}</span>
                        </div>
                        <div class="flex justify-between text-[11px]">
                          <span class="text-slate-500">DRC Median</span>
                          <span class="font-bold text-slate-700">{{ formatNum(s.drc, 1) }}</span>
                        </div>
                        <div class="flex justify-between text-[11px]">
                          <span class="text-slate-500">Recal DRC</span>
                          <span class="font-bold text-blue-600">{{
                            formatNum(s.recalDrc, 1)
                          }}</span>
                        </div>
                        <div class="flex justify-between text-[11px] pt-2 border-t border-slate-50">
                          <span class="text-slate-500">Difference</span>
                          <span
                            class="font-bold"
                            :class="
                              parseFloat(s.difference) >= 0 ? 'text-green-600' : 'text-red-600'
                            "
                          >
                            {{ formatNum(s.difference, 1) }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Column 3: Summary -->
                    <div class="space-y-4 border-l border-slate-100 pl-6">
                      <div class="space-y-1">
                        <div class="flex justify-between text-[11px]">
                          <span class="text-slate-500">DRC Est.</span>
                          <span class="font-bold text-slate-700"
                            >{{ formatNum(b.drcEstimate, 0) }}%</span
                          >
                        </div>
                        <div class="flex justify-between text-[11px]">
                          <span class="text-slate-500">DRC</span>
                          <span class="font-bold text-slate-700">{{ formatNum(s.drc, 1) }}</span>
                        </div>
                        <div class="flex justify-between text-[11px]">
                          <span class="text-slate-500">DRC Dry</span>
                          <span class="font-bold text-purple-600">{{
                            formatNum(s.drcDry, 1)
                          }}</span>
                        </div>
                        <div class="flex justify-between text-[11px]">
                          <span class="text-slate-500">Recal DRC</span>
                          <span class="font-bold text-blue-500">{{
                            formatNum(s.recalDrc, 1)
                          }}</span>
                        </div>
                      </div>

                      <div class="pt-2 border-t border-slate-100">
                        <span class="text-[10px] font-bold text-slate-400 tracking-wider block mb-2"
                          >Moisture & Lab</span
                        >
                        <div class="space-y-1">
                          <div class="flex justify-between text-[11px]">
                            <span class="text-slate-500">Moisture %</span>
                            <span class="font-bold text-orange-600"
                              >{{ formatNum(s.medianMoisture, 1) }}%</span
                            >
                          </div>
                          <div class="flex justify-between text-[11px]">
                            <span class="text-slate-500">Before Lab Dryer</span>
                            <span class="font-bold text-slate-700">{{
                              formatNum(s.medianBeforeLab, 1)
                            }}</span>
                          </div>
                          <div class="flex justify-between text-[11px]">
                            <span class="text-slate-500">After Lab</span>
                            <span class="font-bold text-slate-700">{{
                              formatNum(s.medianAfterLab, 1)
                            }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
