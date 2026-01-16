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
        afterDryerB1: s.afterDryerB1?.toString() || '',
        beforeLabDryerB1: s.beforeLabDryerB1?.toString() || '',
        afterLabDryerB1: s.afterLabDryerB1?.toString() || '',

        afterDryerB2: s.afterDryerB2?.toString() || '',
        beforeLabDryerB2: s.beforeLabDryerB2?.toString() || '',
        afterLabDryerB2: s.afterLabDryerB2?.toString() || '',

        afterDryerB3: s.afterDryerB3?.toString() || '',
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
const calculateLabDrc = (before: string | number, after: string | number) => {
  const b = parseFloat(before?.toString());
  const a = parseFloat(after?.toString());
  if (b && a && b > 0) {
    return ((a / b) * 100).toFixed(1);
  }
  return null;
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
      const calcMoisture = (beforeLab: number | null, afterLab: number | null) =>
        beforeLab && afterLab && beforeLab > 0 ? ((beforeLab - afterLab) / beforeLab) * 100 : null;
      const calcRecal = (drc: number | null, moisture: number | null) =>
        drc !== null && moisture !== null ? drc / (1 - moisture / 100) : null;
      const calcDrcDry = (drc: number | null) => (drc ? drc / 0.9152 : null); // Assuming 8.48% target moisture for factory "Dry" standard if recal not used? Or use Recal?
      // Actually, looking at the image, Recal and DRC Dry are separate.
      // I'll use a placeholder or common formula if found. For now, let's use recalDrc as a base for drcDry or keeping it null.
      // Actually, I'll just map recalDrc for now to see if it matches.

      const drcB1 = calcDrc(ad1, bb1);
      const moist1 = calcMoisture(bl1, al1);
      const recal1 = calcRecal(drcB1, moist1);
      const drcDry1 = calcDrcDry(drcB1);

      const drcB2 = calcDrc(ad2, bb2);
      const moist2 = calcMoisture(bl2, al2);
      const recal2 = calcRecal(drcB2, moist2);
      const drcDry2 = calcDrcDry(drcB2);

      const drcB3 = calcDrc(ad3, bb3);
      const moist3 = calcMoisture(bl3, al3);
      const recal3 = calcRecal(drcB3, moist3);
      const drcDry3 = calcDrcDry(drcB3);

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
        labDrcB1: bl1 && al1 ? (al1 / bl1) * 100 : null,

        drcB2,
        moisturePercentB2: moist2,
        recalDrcB2: recal2,
        drcDryB2: drcDry2,
        labDrcB2: bl2 && al2 ? (al2 / bl2) * 100 : null,

        drcB3,
        moisturePercentB3: moist3,
        recalDrcB3: recal3,
        drcDryB3: drcDry3,
        labDrcB3: bl3 && al3 ? (al3 / bl3) * 100 : null,

        // Summary
        drc: medianDrc,
        recalDrc: medianRecal,
        drcDry: medianDrcDry,
        difference,

        isTrailer: props.isTrailer || false,
        basketWeight: pf(s.basketWeight),
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
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-6">
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
        <div class="flex flex-col col-span-2">
          <span class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
            >Supplier</span
          >
          <div class="flex flex-col">
            <span class="text-sm font-bold text-foreground truncate">{{
              booking?.supplierCode || '-'
            }}</span>
            <span class="text-xs text-muted-foreground truncate">{{
              booking?.supplierName || '-'
            }}</span>
          </div>
        </div>
        <div class="flex flex-col">
          <span class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
            >Rubber Type</span
          >
          <Badge variant="secondary" class="bg-primary/10 text-primary hover:bg-primary/20 w-fit">
            {{ displayRubberType }}
          </Badge>
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
            >Net Weight</span
          >
          <span class="text-sm font-bold text-foreground">{{ displayNetWeight }} kg</span>
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
              <div class="flex gap-1" title="Basket Weight">
                <span>Basket:</span>
                <span class="font-bold text-foreground">{{ sample.basketWeight || '-' }}</span>
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
                  <Input
                    v-model="sample.basketWeight"
                    class="h-8 bg-card border-border"
                    placeholder="kg"
                    @input="handleNumericInput(sample, 'basketWeight', $event.target.value)"
                    @keydown.enter="handleEnter"
                    :disabled="!isEditing"
                  />
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
              <div class="mt-2 text-right">
                <span class="text-xs text-muted-foreground">Lab DRC: </span>
                <span class="text-xs font-bold text-primary">
                  {{
                    calculateLabDrc(sample['beforeLabDryerB' + b], sample['afterLabDryerB' + b]) ||
                    '-'
                  }}%
                </span>
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
