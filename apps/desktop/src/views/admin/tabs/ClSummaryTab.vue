<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { bookingsApi } from '@/services/bookings';
import { rubberTypesApi, type RubberType } from '@/services/rubberTypes';
import { Beaker, FlaskConical } from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
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
          partLabel: t('qa.labels.mainTruck'),
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
          partLabel: t('qa.labels.trailer'),
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
      class="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl border-border"
    >
      <FlaskConical class="h-12 w-12 text-muted-foreground/30 mb-4" />
      <h3 class="text-lg font-medium text-foreground">{{ t('qa.noSummaryData') }}</h3>
      <p class="text-muted-foreground text-sm max-w-xs text-center">
        {{ t('qa.noSummaryDesc') }}
      </p>
    </div>

    <div v-else class="grid grid-cols-1 gap-6">
      <Card
        v-for="b in processedBookings"
        :key="b.id"
        class="overflow-hidden border-border shadow-sm hover:shadow-md transition-shadow"
      >
        <!-- Card Header Area -->
        <div class="bg-muted/30 border-b border-border p-4">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-6">
              <div class="flex flex-col">
                <span
                  class="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1"
                  >{{ t('qa.columns.date') }}</span
                >
                <span class="text-sm font-semibold text-foreground">
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
                <span
                  class="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1"
                  >{{ t('qa.columns.lotNumber') }}</span
                >
                <span class="text-lg font-black text-primary leading-none">{{ b.lotNo }}</span>
              </div>
              <div class="flex flex-col max-w-[200px] justify-center">
                <span class="text-sm font-bold text-foreground truncate leading-none mb-1">{{
                  b.supplierCode
                }}</span>
                <span class="text-xs text-primary font-medium truncate leading-none">{{
                  b.supplierName
                }}</span>
              </div>
            </div>

            <div class="flex items-center gap-8">
              <div class="flex flex-col items-end">
                <span
                  class="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1"
                  >{{ t('qa.columns.netWeight') }}</span
                >
                <span class="text-sm font-bold text-foreground"
                  >{{ b.displayWeight.toLocaleString() }}
                  <span class="text-muted-foreground font-normal ml-1">{{
                    t('qa.labels.kg')
                  }}</span></span
                >
              </div>
              <div class="flex flex-col items-end justify-center">
                <Badge
                  variant="secondary"
                  class="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                >
                  {{ b.displayRubberType }}
                </Badge>
                <span class="text-xs font-medium text-primary mt-1">{{ b.displayLocation }}</span>
              </div>
              <div
                class="flex flex-col items-center justify-center bg-card border-2 rounded-lg h-12 w-14 shadow-sm"
                :class="getGradeColorClass(b.displayGrade)"
              >
                <span class="text-[9px] font-black uppercase mb-0.5 opacity-80">{{
                  t('qa.columns.grade')
                }}</span>
                <span class="text-xl font-black leading-none">{{ b.displayGrade || '-' }}</span>
              </div>
            </div>
          </div>
        </div>

        <CardContent class="p-4">
          <!-- Carousel for Samples -->
          <Carousel
            class="w-full"
            :opts="{
              align: 'start',
              loop: true,
            }"
          >
            <CarouselContent class="-ml-4">
              <CarouselItem
                v-for="(s, sIdx) in b.samples"
                :key="s.id"
                class="pl-4 md:basis-1/2 lg:basis-1/3"
              >
                <div
                  class="flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm"
                >
                  <!-- Sample Header -->
                  <div
                    class="bg-primary text-primary-foreground px-3 py-2 flex items-center justify-between"
                  >
                    <div class="flex items-center gap-2">
                      <Beaker class="h-4 w-4" />
                      <span class="text-sm font-bold"
                        >{{ t('qa.labels.sample') }} {{ Number(sIdx) + 1 }}</span
                      >
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="flex flex-col items-end">
                        <span class="text-[9px] opacity-70 uppercase leading-none">DRC Median</span>
                        <span class="font-black leading-none text-primary-foreground"
                          >{{ formatNum(s.drc) }}%</span
                        >
                      </div>
                      <div class="flex flex-col items-end">
                        <span class="text-[9px] opacity-70 uppercase leading-none"
                          >Recal Median</span
                        >
                        <span class="font-black leading-none text-white"
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
                        <div class="space-y-1">
                          <div class="flex justify-between text-[11px]">
                            <span class="text-muted-foreground">{{
                              t('qa.labels.beforePress')
                            }}</span>
                            <span class="font-bold text-foreground">{{
                              formatNum(s.beforePress, 1)
                            }}</span>
                          </div>
                          <div class="flex justify-between text-[11px]">
                            <span class="text-muted-foreground">{{
                              t('qa.labels.afterPress')
                            }}</span>
                            <span class="font-bold text-foreground">{{
                              formatNum(s.afterPress, 1)
                            }}</span>
                          </div>
                          <div class="flex justify-between text-[11px]">
                            <span class="text-muted-foreground">{{ t('qa.labels.basket') }}</span>
                            <span class="font-bold text-foreground">{{
                              formatNum(s.basketWeight, 1)
                            }}</span>
                          </div>
                          <div class="flex justify-between items-center text-[11px]">
                            <span class="text-muted-foreground">{{
                              t('qa.labels.beforeDryer')
                            }}</span>
                            <span class="font-bold text-foreground">{{
                              formatNum(s.medianBeforeBaking, 1)
                            }}</span>
                          </div>
                          <div class="flex justify-between items-center text-[11px]">
                            <span class="text-muted-foreground">{{
                              t('qa.labels.afterDryer')
                            }}</span>
                            <span class="font-bold text-foreground">{{
                              formatNum(s.medianAfterDryer, 1)
                            }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Column 2: DRC Analysis -->
                      <div class="space-y-4 border-l border-border/50 pl-6">
                        <div class="space-y-1">
                          <div class="flex justify-between text-[11px]">
                            <span class="text-muted-foreground">{{
                              t('qa.labels.drcAfterBaking')
                            }}</span>
                            <span class="font-bold text-foreground">{{ formatNum(s.drc, 1) }}</span>
                          </div>
                          <div class="flex justify-between text-[11px]">
                            <span class="text-muted-foreground">{{
                              t('qa.labels.drcMedian')
                            }}</span>
                            <span class="font-bold text-foreground">{{ formatNum(s.drc, 1) }}</span>
                          </div>
                          <div class="flex justify-between text-[11px]">
                            <span class="text-muted-foreground">{{ t('qa.labels.recalDrc') }}</span>
                            <span class="font-bold text-primary">{{
                              formatNum(s.recalDrc, 1)
                            }}</span>
                          </div>
                          <div
                            class="flex justify-between text-[11px] pt-2 border-t border-border/20"
                          >
                            <span class="text-muted-foreground">{{
                              t('qa.labels.difference')
                            }}</span>
                            <span
                              class="font-bold"
                              :class="
                                parseFloat(s.difference) >= 0
                                  ? 'text-emerald-600'
                                  : 'text-destructive'
                              "
                            >
                              {{ formatNum(s.difference, 1) }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <!-- Column 3: Summary -->
                      <div class="space-y-4 border-l border-border/50 pl-6">
                        <div class="space-y-1">
                          <div class="flex justify-between text-[11px]">
                            <span class="text-muted-foreground">{{ t('qa.labels.drcEst') }}</span>
                            <span class="font-bold text-foreground"
                              >{{ formatNum(b.drcEstimate, 0) }}%</span
                            >
                          </div>
                          <div class="flex justify-between text-[11px]">
                            <span class="text-muted-foreground">{{ t('qa.labels.drc') }}</span>
                            <span class="font-bold text-foreground">{{ formatNum(s.drc, 1) }}</span>
                          </div>
                          <div class="flex justify-between text-[11px]">
                            <span class="text-muted-foreground">{{ t('qa.labels.drcDry') }}</span>
                            <span class="font-bold text-violet-500">{{
                              s.drcDry ? formatNum(s.drcDry, 1) : '-'
                            }}</span>
                          </div>
                          <div class="flex justify-between text-[11px]">
                            <span class="text-muted-foreground">{{ t('qa.labels.recalDrc') }}</span>
                            <span class="font-bold text-primary">{{
                              formatNum(s.recalDrc, 1)
                            }}</span>
                          </div>
                        </div>

                        <div class="pt-2 border-t border-border/50">
                          <div class="space-y-1">
                            <div class="flex justify-between text-[11px]">
                              <span class="text-muted-foreground">{{
                                t('qa.labels.moisturePercent')
                              }}</span>
                              <span class="font-bold text-orange-600"
                                >{{ formatNum(s.medianMoisture, 2) }}%</span
                              >
                            </div>
                            <div class="flex justify-between items-center text-[11px]">
                              <span class="text-muted-foreground">Moisture Factor</span>
                              <span class="font-bold text-foreground">{{
                                s.beforeLabDryer && s.afterLabDryer
                                  ? ((s.afterLabDryer / s.beforeLabDryer) * 100).toFixed(2) + '%'
                                  : '-'
                              }}</span>
                            </div>
                            <div class="flex justify-between items-center text-[11px]">
                              <span class="text-muted-foreground">{{
                                t('qa.labels.beforeLabDryer')
                              }}</span>
                              <span class="font-bold text-foreground">{{
                                formatNum(s.beforeLabDryer, 1)
                              }}</span>
                            </div>
                            <div class="flex justify-between items-center text-[11px]">
                              <span class="text-muted-foreground">{{
                                t('qa.labels.afterLabDryer')
                              }}</span>
                              <span class="font-bold text-foreground">{{
                                formatNum(s.afterLabDryer, 1)
                              }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious class="-left-12" />
            <CarouselNext class="-right-12" />
          </Carousel>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
