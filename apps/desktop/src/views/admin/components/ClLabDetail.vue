<script setup lang="ts">
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bookingsApi } from '@/services/bookings';
import { rubberTypesApi } from '@/services/rubberTypes';
import { Pencil, Save, Trash2 } from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';

const props = defineProps<{
  bookingId: string;
  isTrailer?: boolean;
}>();

const emit = defineEmits(['close', 'update', 'print']);

// State
const booking = ref<any>(null);
const samples = ref<any[]>([]);
const rubberTypes = ref<any[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const showBookingDeleteConfirm = ref(false);
const isEditing = ref(false);

const deleteBooking = async () => {
  if (!booking.value?.id) return;
  isDeleting.value = true;
  try {
    await bookingsApi.delete(booking.value.id);
    toast.success('Deleted successfully');
    emit('close');
    emit('update');
  } catch (error) {
    console.error('Failed to delete:', error);
    toast.error('Failed to delete');
  } finally {
    isDeleting.value = false;
    showBookingDeleteConfirm.value = false;
  }
};

const fetchData = async () => {
  if (!props.bookingId) return;
  isLoading.value = true;
  try {
    const [bookingData, samplesData, typesData] = await Promise.all([
      bookingsApi.getById(props.bookingId),
      bookingsApi.getSamples(props.bookingId),
      rubberTypesApi.getAll(),
    ]);

    booking.value = bookingData;
    samples.value = samplesData
      .filter((s: any) => s.isTrailer === (props.isTrailer || false))
      .map((s: any) => ({
        ...s,
        // Map Lab Fields
        afterDryerB1:
          s.afterDryerB1 !== null && s.afterDryerB1 !== undefined
            ? Number(s.afterDryerB1).toFixed(3)
            : '',
        beforeLabDryerB1: s.beforeLabDryerB1?.toString() || '',
        afterLabDryerB1: s.afterLabDryerB1?.toString() || '',

        afterDryerB2:
          s.afterDryerB2 !== null && s.afterDryerB2 !== undefined
            ? Number(s.afterDryerB2).toFixed(3)
            : '',
        beforeLabDryerB2: s.beforeLabDryerB2?.toString() || '',
        afterLabDryerB2: s.afterLabDryerB2?.toString() || '',

        afterDryerB3:
          s.afterDryerB3 !== null && s.afterDryerB3 !== undefined
            ? Number(s.afterDryerB3).toFixed(3)
            : '',
        beforeLabDryerB3: s.beforeLabDryerB3?.toString() || '',
        afterLabDryerB3: s.afterLabDryerB3?.toString() || '',

        // Include P0/P30/Press for Grade Calculation and Display
        p0: s.p0?.toString() || '',
        p30: s.p30?.toString() || '',
        beforePress: s.beforePress?.toString() || '',
        afterPress: s.afterPress?.toString() || '',
      }));
    rubberTypes.value = typesData;

    // Check if any lab data exists
    const hasData = samplesData.some(
      (s: any) =>
        s.afterDryerB1 ||
        s.afterDryerB2 ||
        s.afterDryerB3 ||
        s.afterLabDryerB1 ||
        s.afterLabDryerB2 ||
        s.afterLabDryerB3
    );

    if (!hasData) {
      isEditing.value = true;
    } else {
      isEditing.value = false;
    }
  } catch (error) {
    console.error('Failed to load data:', error);
    toast.error('Error loading data');
  } finally {
    isLoading.value = false;
  }
};

// Calculation Logic for display
const formatNum = (val: number | null | undefined, digits = 2) => {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return val.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const calculateMetrics = (s: any, b: number) => {
  const bb = parseFloat(s['beforeBaking' + b]);
  const ad = parseFloat(s['afterDryerB' + b]);
  const bl = parseFloat(s['beforeLabDryerB' + b]);
  const al = parseFloat(s['afterLabDryerB' + b]);

  const drc = bb && ad ? (ad / bb) * 100 : 0;
  const moisture = bb && ad ? ((bb - ad) / bb) * 100 : 0;

  // DRC Dry factor derived from user examples (66.70/75.00 = 0.8893)
  const drcDry = drc * 0.8893;

  const moistureFactor = bl && al && bl > 0 ? al / bl : 0;
  const recalDrc = drcDry * moistureFactor;

  return { drc, moisture, drcDry, moistureFactor, recalDrc, hasData: bb && ad };
};

const handleNumericInput = (sample: any, field: string, value: string) => {
  let cleaned = value.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');

  sample[field] = cleaned;
  // Trigger reactivity if needed
};

const saveAll = async () => {
  isSaving.value = true;
  try {
    const all = samples.value;

    for (const s of all) {
      // Helper to parse float or null
      const pf = (v: any) => parseFloat(v?.toString()) || null;

      const ad1 = pf(s.afterDryerB1);
      const bl1 = pf(s.beforeLabDryerB1);
      const al1 = pf(s.afterLabDryerB1);
      const bb1 = pf(s.beforeBaking1);

      const ad2 = pf(s.afterDryerB2);
      const bl2 = pf(s.beforeLabDryerB2);
      const al2 = pf(s.afterLabDryerB2);
      const bb2 = pf(s.beforeBaking2);

      const ad3 = pf(s.afterDryerB3);
      const bl3 = pf(s.beforeLabDryerB3);
      const al3 = pf(s.afterLabDryerB3);
      const bb3 = pf(s.beforeBaking3);

      // Calculations per basket
      const calcDrc = (after: number | null, before: number | null) =>
        after && before ? (after / before) * 100 : null;
      const calcMoisture = (beforeDryer: number | null, afterDryer: number | null) =>
        beforeDryer && afterDryer ? ((beforeDryer - afterDryer) / beforeDryer) * 100 : null;

      const calcDrcDry = (drc: number | null) => (drc ? drc * 0.8893 : null);

      // Moisture Factor (Lab Ratio)
      const calcMoistureFactor = (beforeLab: number | null, afterLab: number | null) =>
        beforeLab && afterLab && beforeLab > 0 ? afterLab / beforeLab : null;

      const calcRecal = (drcDry: number | null, moistureFactor: number | null) =>
        drcDry !== null && moistureFactor !== null ? drcDry * moistureFactor : null;

      const drcB1 = calcDrc(ad1, bb1);
      const moist1 = calcMoisture(bb1, ad1);
      const drcDry1 = calcDrcDry(drcB1);
      const mf1 = calcMoistureFactor(bl1, al1);
      const recal1 = calcRecal(drcDry1, mf1);

      const drcB2 = calcDrc(ad2, bb2);
      const moist2 = calcMoisture(bb2, ad2);
      const drcDry2 = calcDrcDry(drcB2);
      const mf2 = calcMoistureFactor(bl2, al2);
      const recal2 = calcRecal(drcDry2, mf2);

      const drcB3 = calcDrc(ad3, bb3);
      const moist3 = calcMoisture(bb3, ad3);
      const drcDry3 = calcDrcDry(drcB3);
      const mf3 = calcMoistureFactor(bl3, al3);
      const recal3 = calcRecal(drcDry3, mf3);

      // Summary Calculations (Median)
      const drcs = [drcB1, drcB2, drcB3].filter((v) => v !== null) as number[];
      const recals = [recal1, recal2, recal3].filter((v) => v !== null) as number[];
      const drys = [drcDry1, drcDry2, drcDry3].filter((v) => v !== null) as number[];

      const getMedian = (arr: number[]) => {
        if (arr.length === 0) return null;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      };

      const medianDrc = getMedian(drcs);
      const medianRecal = getMedian(recals);
      const medianDrcDry = getMedian(drys);

      // Difference = Recal DRC - Est DRC (percentCp)
      const estDrc = pf(s.percentCp);
      const difference = medianRecal !== null && estDrc !== null ? medianRecal - estDrc : null;

      await bookingsApi.saveSample(props.bookingId, {
        ...s,
        // Raw Inputs
        afterDryerB1: ad1,
        beforeLabDryerB1: bl1,
        afterLabDryerB1: al1,
        afterDryerB2: ad2,
        beforeLabDryerB2: bl2,
        afterLabDryerB2: al2,
        afterDryerB3: ad3,
        beforeLabDryerB3: bl3,
        afterLabDryerB3: al3,

        // Calculated Per Basket
        drcB1,
        moisturePercentB1: moist1,
        recalDrcB1: recal1,
        drcDryB1: drcDry1,
        labDrcB1: mf1 ? mf1 * 100 : null,

        drcB2,
        moisturePercentB2: moist2,
        recalDrcB2: recal2,
        drcDryB2: drcDry2,
        labDrcB2: mf2 ? mf2 * 100 : null,

        drcB3,
        moisturePercentB3: moist3,
        recalDrcB3: recal3,
        drcDryB3: drcDry3,
        labDrcB3: mf3 ? mf3 * 100 : null,

        // Summary
        drc: medianDrc,
        recalDrc: medianRecal,
        drcDry: medianDrcDry,
        difference,

        isTrailer: props.isTrailer || false,
        basketWeight:
          s.basketWeight && !isNaN(parseFloat(s.basketWeight.toString()))
            ? parseFloat(parseFloat(s.basketWeight.toString()).toFixed(1))
            : null,
      });
    }

    toast.success('Lab data saved successfully');
    fetchData();
    emit('update');
    emit('close');
  } catch (error) {
    console.error('Failed to save:', error);
    toast.error('Failed to save data');
  } finally {
    isSaving.value = false;
  }
};

const handleEnter = (e: KeyboardEvent) => {
  e.preventDefault();
  // Skip disabled AND readonly inputs from navigation
  const inputs = Array.from(document.querySelectorAll('input:not([disabled]):not([readonly])'));
  const index = inputs.indexOf(e.target as HTMLInputElement);

  if (index > -1 && index < inputs.length - 1) {
    (inputs[index + 1] as HTMLElement).focus();
  } else {
    saveAll();
  }
};

const displayRubberType = computed(() => {
  if (!booking.value) return '-';
  const code = props.isTrailer ? booking.value.trailerRubberType : booking.value.rubberType;
  const type = rubberTypes.value.find((t) => t.code === code);
  return type ? type.name : code || '-';
});

const displayNetWeight = computed(() => {
  if (!booking.value) return '0';
  const inW = props.isTrailer ? booking.value.trailerWeightIn || 0 : booking.value.weightIn || 0;
  const outW = props.isTrailer ? booking.value.trailerWeightOut || 0 : booking.value.weightOut || 0;
  return Math.max(0, inW - outW).toLocaleString();
});

const displayLocation = computed(() => {
  if (!booking.value) return '-';
  return props.isTrailer
    ? booking.value.trailerRubberSource || booking.value.rubberSource || '-'
    : booking.value.rubberSource || '-';
});

const displayGrossWeight = computed(() => {
  if (!booking.value) return '0';
  const inW = props.isTrailer ? booking.value.trailerWeightIn || 0 : booking.value.weightIn || 0;
  return inW.toLocaleString();
});

const averagePri = computed(() => {
  const valid = samples.value
    .map((s) => {
      const p0 = parseFloat(s.p0);
      const p30 = parseFloat(s.p30);
      if (p0 && p30 && p0 > 0) {
        return (p30 / p0) * 100;
      }
      return NaN;
    })
    .filter((v) => !isNaN(v));

  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
});

const averagePo = computed(() => {
  const valid = samples.value.map((s) => parseFloat(s.p0)).filter((v) => !isNaN(v) && v > 0);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
});

const calculatedGrade = computed(() => {
  const avg = averagePri.value;
  if (avg === null) return '-';

  if (avg < 20) return 'D';
  if (avg < 35) return 'C';
  if (avg < 47) return 'B';
  if (avg < 60) return 'A';
  return 'AA';
});

const calculatePri = (p0: any, p30: any) => {
  const p0Val = parseFloat(p0);
  const p30Val = parseFloat(p30);
  if (p0Val && p30Val && p0Val > 0) {
    return ((p30Val / p0Val) * 100).toFixed(2);
  }
  return '-';
};

const formatDecimal = (val: any) => {
  if (val === null || val === undefined || val === '') return '-';
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return num.toFixed(3);
};

onMounted(async () => {
  await fetchData();
  // Focus first input
  nextTick(() => {
    const input = document.querySelector('input:not([disabled])');
    if (input) (input as HTMLElement).focus();
  });
});
</script>

<template>
  <div
    class="bg-card rounded-xl shadow-lg border border-border overflow-hidden flex flex-col h-full relative"
  >
    <!-- Header Section -->
    <div class="p-6 border-b border-border bg-muted/30">
      <div class="flex flex-wrap items-center gap-y-4 gap-x-8">
        <div class="flex flex-col">
          <span class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
            >Date</span
          >
          <span class="text-sm font-bold text-foreground">{{
            booking
              ? new Date(booking.date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '-'
          }}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
            >Lot Number</span
          >
          <span class="text-sm font-black text-primary truncate" :title="booking?.lotNo">{{
            booking?.lotNo || booking?.bookingCode || '-'
          }}</span>
        </div>
        <div class="flex flex-col max-w-[200px]">
          <div class="flex flex-col gap-1">
            <span class="text-sm font-bold text-foreground truncate">{{
              booking?.supplierCode || '-'
            }}</span>
            <span class="text-xs text-muted-foreground truncate">{{
              booking?.supplierName || '-'
            }}</span>
          </div>
        </div>
        <div class="flex flex-col">
          <div class="flex flex-col gap-1">
            <span class="text-[10px] font-bold text-primary uppercase h-5 flex items-center">
              {{ displayRubberType }}
            </span>
            <span class="text-xs font-medium text-primary truncate max-w-[120px]">{{
              displayLocation
            }}</span>
          </div>
        </div>

        <div class="flex flex-col">
          <span class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
            >AVG PO</span
          >
          <span class="text-sm font-bold text-foreground">{{
            averagePo ? averagePo.toFixed(2) : '-'
          }}</span>
        </div>

        <div class="flex flex-col">
          <span class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
            >AVG PRI</span
          >
          <span class="text-sm font-bold text-foreground">{{
            averagePri ? averagePri.toFixed(2) : '-'
          }}</span>
        </div>

        <div class="flex flex-col">
          <span class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
            >Grade</span
          >
          <div
            class="flex items-center justify-center border-2 border-border rounded px-2 h-6 w-12 bg-card"
          >
            <span class="text-sm font-black text-foreground">{{ calculatedGrade }}</span>
          </div>
        </div>

        <div class="flex flex-col">
          <span class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
            >Gross Weight</span
          >
          <span class="text-sm font-bold text-foreground">{{ displayGrossWeight }} kg</span>
        </div>

        <div class="flex flex-col">
          <span class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
            >Net Weight</span
          >
          <span class="text-sm font-bold text-blue-600">{{ displayNetWeight }} kg</span>
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div class="flex-1 overflow-y-auto bg-muted/20 p-6 space-y-4">
      <div v-if="isLoading" class="flex justify-center py-8">
        <div
          class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"
        ></div>
      </div>

      <div v-else-if="samples.length === 0" class="text-center py-8 text-muted-foreground">
        No samples found. Please check existing samples.
      </div>

      <div
        v-else
        v-for="(sample, index) in samples"
        :key="sample.id"
        class="bg-card border border-border rounded-lg p-4 shadow-sm"
      >
        <div class="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
          <div class="flex items-center gap-4">
            <Badge variant="outline" class="bg-muted text-muted-foreground"
              >Sample {{ index + 1 }}</Badge
            >
            <div class="items-center gap-4 text-xs text-muted-foreground hidden md:flex">
              <div class="flex gap-1" title="Before Press">
                <span>Before Press:</span>
                <span class="font-bold text-foreground">{{ sample.beforePress || '-' }}</span>
              </div>
              <div class="flex gap-1" title="After Press">
                <span>After Press:</span>
                <span class="font-bold text-foreground">{{ sample.afterPress || '-' }}</span>
              </div>
              <div class="flex gap-1">
                <span>PO:</span>
                <span class="font-bold text-foreground">{{ sample.p0 || '-' }}</span>
              </div>
              <div class="flex gap-1">
                <span>P30:</span>
                <span class="font-bold text-foreground">{{ sample.p30 || '-' }}</span>
              </div>
              <div class="flex gap-1">
                <span>PRI:</span>
                <span class="font-bold text-primary">{{
                  calculatePri(sample.p0, sample.p30)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Loop 3 Baskets -->
          <div
            v-for="b in [1, 2, 3]"
            :key="b"
            class="bg-muted/10 p-3 rounded-lg border border-border/50"
          >
            <div class="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
              Basket {{ b }}
            </div>
            <div class="space-y-2">
              <div class="grid grid-cols-3 gap-2">
                <!-- Basket Weight -->
                <div class="space-y-1">
                  <label class="text-xs font-bold text-muted-foreground uppercase">Basket</label>
                  <div
                    class="h-8 flex items-center px-3 bg-muted border border-border rounded-md text-sm font-bold text-foreground"
                  >
                    {{ sample.basketWeight }}
                  </div>
                </div>
                <!-- Before Dryer (Read Only) -->
                <div class="space-y-1">
                  <label class="text-xs font-bold text-muted-foreground uppercase"
                    >Before Dryer</label
                  >
                  <div
                    class="h-8 flex items-center px-3 bg-muted border border-border rounded-md text-sm font-bold text-foreground"
                  >
                    {{ formatDecimal(sample['beforeBaking' + b]) }}
                  </div>
                </div>
                <!-- After Dryer -->
                <div class="space-y-1">
                  <label class="text-xs font-bold text-muted-foreground uppercase"
                    >After Dryer</label
                  >
                  <Input
                    v-model="sample['afterDryerB' + b]"
                    class="h-8 bg-card border-border"
                    placeholder="kg"
                    @input="handleNumericInput(sample, 'afterDryerB' + b, $event.target.value)"
                    @keydown.enter="handleEnter"
                    :disabled="!isEditing"
                  />
                </div>
              </div>
              <!-- Lab Dryer Group -->
              <div class="grid grid-cols-2 gap-2 mt-2">
                <div class="space-y-1">
                  <label class="text-xs font-bold text-muted-foreground uppercase"
                    >Before Lab</label
                  >
                  <Input
                    v-model="sample['beforeLabDryerB' + b]"
                    class="h-8 bg-card border-border"
                    placeholder="g"
                    @input="handleNumericInput(sample, 'beforeLabDryerB' + b, $event.target.value)"
                    @keydown.enter="handleEnter"
                    :disabled="!isEditing"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-bold text-muted-foreground uppercase">After Lab</label>
                  <Input
                    v-model="sample['afterLabDryerB' + b]"
                    class="h-8 bg-card border-border"
                    placeholder="g"
                    @input="handleNumericInput(sample, 'afterLabDryerB' + b, $event.target.value)"
                    @keydown.enter="handleEnter"
                    :disabled="!isEditing"
                  />
                </div>
              </div>
              <!-- Calc Result -->
              <!-- Summary Stats for Basket -->
              <div
                v-if="calculateMetrics(sample, b).hasData"
                class="grid grid-cols-5 gap-2 mt-3 pt-2 border-t border-border/50 text-[10px]"
              >
                <div class="flex flex-col">
                  <span class="text-muted-foreground">DRC</span>
                  <span class="font-bold text-foreground">{{
                    formatNum(calculateMetrics(sample, b).drc, 2)
                  }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-muted-foreground">Moisture</span>
                  <span class="font-bold text-orange-600">{{
                    formatNum(calculateMetrics(sample, b).moisture, 2)
                  }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-muted-foreground">DRC Dry</span>
                  <span class="font-bold text-violet-500">{{
                    formatNum(calculateMetrics(sample, b).drcDry, 2)
                  }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-muted-foreground">M.Factor</span>
                  <span class="font-bold text-orange-500"
                    >{{ formatNum(calculateMetrics(sample, b).moistureFactor * 100, 2) }}%</span
                  >
                </div>
                <div class="flex flex-col">
                  <span class="text-muted-foreground">Recal</span>
                  <span class="font-bold text-blue-600">{{
                    formatNum(calculateMetrics(sample, b).recalDrc, 2)
                  }}</span>
                </div>
              </div>

              <div class="mt-2 text-right hidden">
                <!-- Hidden old lab display -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Action -->
    <div class="p-6 border-t border-border bg-muted/30 flex justify-between items-center gap-3">
      <!-- Left: Delete Button -->
      <Button
        variant="ghost"
        class="text-destructive hover:text-destructive hover:bg-destructive/10"
        :disabled="!isEditing"
        @click="showBookingDeleteConfirm = true"
      >
        <Trash2 class="w-4 h-4 mr-2" />
        Delete Booking
      </Button>

      <div class="flex gap-3">
        <Button variant="outline" @click="isEditing ? (isEditing = false) : emit('close')">
          {{ isEditing ? 'Cancel' : 'Close' }}
        </Button>
        <Button
          v-if="!isEditing"
          class="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]"
          @click="isEditing = true"
        >
          <Pencil class="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button
          v-else
          class="bg-primary hover:bg-primary/90 min-w-[120px]"
          :disabled="isSaving"
          @click="saveAll"
        >
          <Save v-if="!isSaving" class="w-4 h-4 mr-2" />
          <div
            v-else
            class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"
          ></div>
          Save Labs
        </Button>
      </div>
    </div>

    <!-- Delete Booking Confirmation -->
    <AlertDialog :open="showBookingDeleteConfirm" @update:open="showBookingDeleteConfirm = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Booking</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this booking data? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            @click="deleteBooking"
          >
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
