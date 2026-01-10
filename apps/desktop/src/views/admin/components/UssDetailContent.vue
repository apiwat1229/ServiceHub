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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { bookingsApi } from '@/services/bookings';
import { rubberTypesApi } from '@/services/rubberTypes';
import { AlertTriangle, Plus, Save, Trash2 } from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();

const props = defineProps<{
  bookingId: string;
  isTrailer: boolean;
  partLabel: string;
}>();

const emit = defineEmits(['close', 'update']);

// State
const booking = ref<any>(null);
const samples = ref<any[]>([]);
const rubberTypes = ref<any[]>([]);

const originalLotNo = ref(''); // Track original lot no to prevent unnecessary updates
const lotNoError = ref(''); // Validation error message
const isLoading = ref(false);
const isSaving = ref(false);

const isLotNoOpen = ref(false);
const isDrcOpen = ref(false);
const isMoistureOpen = ref(false);
const showSaveConfirm = ref(false);

const drcForm = ref({
  drcEst: '',
  drcRequested: '',
  drcActual: '',
});

const moistureForm = ref('');

watch(isMoistureOpen, (newVal) => {
  if (newVal && booking.value) {
    moistureForm.value = booking.value.moisture || '';
  }
});

watch(isDrcOpen, (newVal) => {
  if (newVal && booking.value) {
    drcForm.value = {
      drcEst: booking.value.drcEst || '',
      drcRequested: booking.value.drcRequested || '',
      drcActual: booking.value.drcActual || '',
    };
  }
});

// New Sample Form (Batch)
const newSamples = ref<any[]>([]);

const addNewSampleRow = () => {
  newSamples.value.push({
    id: 'temp-' + Date.now(),
    beforePress: '',
    basket: 1.4,
    afterPress: '',
    percentCp: '',
    beforeBaking1: '',
    beforeBaking2: '',
    beforeBaking3: '',
  });
};

const populatedCount = computed(() => {
  return newSamples.value.filter(
    (s) => s.beforePress || s.afterPress || s.beforeBaking1 || s.beforeBaking2 || s.beforeBaking3
  ).length;
});

const removeNewSampleRow = (index: number) => {
  newSamples.value.splice(index, 1);
};

// Focus next input on Enter
const focusNextInput = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement;
  const inputs = Array.from(
    document.querySelectorAll(
      'input:not([readonly]):not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([readonly]):not([disabled])'
    )
  ) as HTMLElement[];
  const currentIndex = inputs.indexOf(target);

  if (currentIndex >= 0) {
    let nextIndex = currentIndex + 1;

    // Logic to skip specific fields if requested (e.g., data-skip-enter="true")
    while (
      nextIndex < inputs.length &&
      inputs[nextIndex].getAttribute('data-skip-enter') === 'true'
    ) {
      nextIndex++;
    }

    if (nextIndex < inputs.length) {
      event.preventDefault();
      inputs[nextIndex].focus();
    } else {
      // If we are at the last field of the samples table, add a new row
      const table = target.closest('table');
      if (table) {
        event.preventDefault();
        addNewSampleRow();
        // Wait for nextTick/DOM update to focus the first input of the new row
        setTimeout(() => {
          const freshInputs = Array.from(
            document.querySelectorAll(
              'input:not([readonly]):not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([readonly]):not([disabled])'
            )
          ) as HTMLElement[];
          let finalIndex = currentIndex + 1;
          while (
            finalIndex < freshInputs.length &&
            freshInputs[finalIndex].getAttribute('data-skip-enter') === 'true'
          ) {
            finalIndex++;
          }
          if (freshInputs[finalIndex]) {
            freshInputs[finalIndex].focus();
          }
        }, 50);
      }
    }
  }
};

// Computed Fields for Form
const displayRubberType = computed(() => {
  if (!booking.value) return '-';
  const code = props.isTrailer ? booking.value.trailerRubberType : booking.value.rubberType;
  const type = rubberTypes.value.find((t) => t.code === code);
  return type ? type.name : code;
});

const displayWeightIn = computed(() => {
  if (!booking.value) return 0;
  const w = props.isTrailer ? booking.value.trailerWeightIn : booking.value.weightIn;
  return (w || 0).toLocaleString();
});

// Lot Number Display Logic
const displayLotNo = computed(() => {
  if (!booking.value) return '-';
  const lot = props.isTrailer
    ? booking.value.trailerLotNo || booking.value.lotNo
    : booking.value.lotNo;
  if (lot) return lot;

  // Fallback for trailer as seen in Uss.vue
  if (props.isTrailer) {
    return '1251226-' + (booking.value.queueNo || '0') + '/2';
  }
  return '-';
});

// Net Weight
const displayNetWeight = computed(() => {
  if (!booking.value) return 0;
  const inW = props.isTrailer ? booking.value.trailerWeightIn : booking.value.weightIn;
  const outW = props.isTrailer ? booking.value.trailerWeightOut : booking.value.weightOut;
  const net = (inW || 0) - (outW || 0);
  return (net > 0 ? net : 0).toLocaleString();
});

// Number validation and cleaning
const handleNumericInput = (sample: any, field: string, value: string) => {
  // Allow only numbers and one decimal point
  let cleaned = value.replace(/[^0-9.]/g, '');

  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  // Handle decimal precision
  if (parts.length === 2) {
    const isBakingField = field.startsWith('beforeBaking');
    const maxDecimals = isBakingField ? 3 : 2;
    if (parts[1].length > maxDecimals) {
      cleaned = parts[0] + '.' + parts[1].substring(0, maxDecimals);
      toast.error(
        t('common.decimalLimit', { n: maxDecimals }) || `Maximum ${maxDecimals} decimal places`
      );
    }
  }

  if (cleaned !== value) {
    sample[field] = cleaned;
  } else {
    sample[field] = value;
  }

  if (['beforePress', 'basket', 'afterPress'].includes(field)) {
    calculatePercentCp(sample);
  }
};

const calculatePercentCp = (sample: any) => {
  const beforePress = parseFloat(sample.beforePress || '0');
  const basket = parseFloat(sample.basket || '0');
  const afterPress = parseFloat(sample.afterPress || '0');
  const moisture = props.isTrailer
    ? booking.value?.trailerMoisture
      ? parseFloat(booking.value.trailerMoisture)
      : 0
    : booking.value?.moisture
      ? parseFloat(booking.value.moisture)
      : 0;

  if (beforePress && basket && afterPress) {
    const uss = beforePress - basket;
    if (uss > 0) {
      // Formula: %CP = (After Press / USS) * (100 - Moisture)
      const percentCp = (afterPress / uss) * (100 - moisture);
      sample.percentCp = percentCp.toFixed(2);
    }
  }
};

// Fetch Data
const fetchData = async () => {
  console.log('Fetching data for Booking ID:', props.bookingId);
  if (!props.bookingId) return;
  isLoading.value = true;
  try {
    const [bookingData, samplesData, typesData] = await Promise.all([
      bookingsApi.getById(props.bookingId),
      bookingsApi.getSamples(props.bookingId),
      rubberTypesApi.getAll(),
    ]);

    booking.value = {
      ...bookingData,
      lotNo: props.isTrailer ? bookingData.trailerLotNo || '' : bookingData.lotNo || '',
      moisture: props.isTrailer ? bookingData.trailerMoisture || 0 : bookingData.moisture || 0,
      drcEst: props.isTrailer ? bookingData.trailerDrcEst || 0 : bookingData.drcEst || 0,
      drcRequested: props.isTrailer
        ? bookingData.trailerDrcRequested || 0
        : bookingData.drcRequested || 0,
      drcActual: props.isTrailer ? bookingData.trailerDrcActual || 0 : bookingData.drcActual || 0,
    };
    originalLotNo.value = booking.value.lotNo;
    samples.value = samplesData.filter((s: any) => s.isTrailer === props.isTrailer);
    rubberTypes.value = typesData;
  } catch (error) {
    console.error('Failed to load data:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    isLoading.value = false;
  }
};

// Calculate USS (Before - Basket) -- Similar to Cuplump calculation
const calculateUss = (before: number, basket: number) => {
  return Math.max(0, before - basket).toFixed(2);
};

const handleSaveAllSamples = async () => {
  // Filter for rows that have some data (not just the default basket weight)
  const populatedSamples = newSamples.value.filter(
    (s) => s.beforePress || s.afterPress || s.beforeBaking1 || s.beforeBaking2 || s.beforeBaking3
  );

  // If we have populated samples, they MUST be valid (must have beforePress and afterPress)
  const allValid = populatedSamples.every((s) => s.beforePress && s.afterPress);

  if (populatedSamples.length > 0 && !allValid) {
    toast.error(
      t('uss.enterRequiredFields') || 'Please enter both Before Press and After Press for all items'
    );
    return;
  }

  // Check if count > 0, show confirm. If count == 0, just save header info silently
  if (populatedSamples.length === 0) {
    // Just save header info
    await saveHeaderInfoOnly();
    return;
  }

  showSaveConfirm.value = true;
};

const confirmSaveSamples = async () => {
  showSaveConfirm.value = false;

  // Re-filter
  const populatedSamples = newSamples.value.filter(
    (s) => s.beforePress || s.afterPress || s.beforeBaking1 || s.beforeBaking2 || s.beforeBaking3
  );

  isSaving.value = true;
  try {
    // Execute sequentially to prevent race conditions on sampleNo generation
    for (const sample of populatedSamples) {
      // Logic for Percent CP if not already set (safety)
      if (!sample.percentCp) calculatePercentCp(sample);

      await bookingsApi.saveSample(props.bookingId, {
        ...sample,
        beforePress: parseFloat(sample.beforePress),
        afterPress: parseFloat(sample.afterPress),
        percentCp: parseFloat(sample.percentCp),
        basketWeight: parseFloat(sample.basket),
        beforeBaking1: sample.beforeBaking1 ? parseFloat(sample.beforeBaking1) : null,
        beforeBaking2: sample.beforeBaking2 ? parseFloat(sample.beforeBaking2) : null,
        beforeBaking3: sample.beforeBaking3 ? parseFloat(sample.beforeBaking3) : null,
        isTrailer: props.isTrailer,
        cuplumpWeight: parseFloat(sample.beforePress) - parseFloat(sample.basket),
      });
    }

    // ALSO save the main booking info in case anything was changed in the popovers
    const updateData: any = {};
    if (props.isTrailer) {
      updateData.trailerLotNo = booking.value.lotNo;
      updateData.trailerMoisture = booking.value.moisture;
      updateData.trailerDrcEst = booking.value.drcEst;
      updateData.trailerDrcRequested = booking.value.drcRequested;
      updateData.trailerDrcActual = booking.value.drcActual;
    } else {
      updateData.lotNo = booking.value.lotNo;
      updateData.moisture = booking.value.moisture;
      updateData.drcEst = booking.value.drcEst;
      updateData.drcRequested = booking.value.drcRequested;
      updateData.drcActual = booking.value.drcActual;
    }

    await bookingsApi.update(props.bookingId, updateData);

    toast.success(t('uss.sampleSaved'));
    emit('update');

    // Reset and Reload
    newSamples.value = [];
    fetchData();
  } catch (error) {
    console.error('Failed to save samples:', error);
    toast.error(t('uss.failedToSave')); // Changed locale key
  } finally {
    isSaving.value = false;
  }
};

const saveHeaderInfoOnly = async () => {
  isSaving.value = true;
  try {
    const updateData: any = {};
    if (props.isTrailer) {
      updateData.trailerLotNo = booking.value.lotNo;
      updateData.trailerMoisture = booking.value.moisture;
      updateData.trailerDrcEst = booking.value.drcEst;
      updateData.trailerDrcRequested = booking.value.drcRequested;
      updateData.trailerDrcActual = booking.value.drcActual;
    } else {
      updateData.lotNo = booking.value.lotNo;
      updateData.moisture = booking.value.moisture;
      updateData.drcEst = booking.value.drcEst;
      updateData.drcRequested = booking.value.drcRequested;
      updateData.drcActual = booking.value.drcActual;
    }

    await bookingsApi.update(props.bookingId, updateData);
    toast.success(t('common.saved'));
    emit('update');
  } catch (error) {
    console.error('Failed to save header info:', error);
    toast.error(t('common.errorSaving'));
  } finally {
    isSaving.value = false;
  }
};

const handleDeleteSample = async (sampleId: string) => {
  if (!confirm(t('uss.confirmDelete'))) return; // Changed locale key
  try {
    await bookingsApi.deleteSample(props.bookingId, sampleId);
    toast.success(t('uss.sampleDeleted')); // Changed locale key
    emit('update');
    fetchData();
  } catch (e) {
    toast.error(t('uss.failedToDelete')); // Changed locale key
  }
};

const validateLotInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const rawValue = input.value;
  const cleanedValue = rawValue.replace(/\D/g, '');

  if (rawValue !== cleanedValue) {
    lotNoError.value = t('uss.numericOnly'); // Changed locale key
    booking.value.lotNo = cleanedValue;
    input.value = cleanedValue;
  } else {
    lotNoError.value = '';
    booking.value.lotNo = cleanedValue;
  }
};

const saveBookingInfo = async () => {
  try {
    const updateData: any = {};
    if (props.isTrailer) {
      updateData.trailerLotNo = booking.value.lotNo;
      updateData.trailerMoisture = booking.value.moisture;
      updateData.trailerDrcEst = booking.value.drcEst;
      updateData.trailerDrcRequested = booking.value.drcRequested;
      updateData.trailerDrcActual = booking.value.drcActual;
    } else {
      updateData.lotNo = booking.value.lotNo;
      updateData.moisture = booking.value.moisture;
      updateData.drcEst = booking.value.drcEst;
      updateData.drcRequested = booking.value.drcRequested;
      updateData.drcActual = booking.value.drcActual;
    }

    await bookingsApi.update(props.bookingId, updateData);
    originalLotNo.value = booking.value.lotNo;
    toast.success(t('common.saved'));
    emit('update');
  } catch (error) {
    console.error('Failed to update Main Info:', error);
    toast.error(t('common.errorSaving'));
    booking.value.lotNo = originalLotNo.value;
  }
};

const handleUpdateLotNo = async () => {
  if (!booking.value) return;

  if (booking.value.lotNo && !/^\d+$/.test(booking.value.lotNo)) {
    lotNoError.value = t('uss.numericOnly'); // Changed locale key
    return;
  }

  if (!booking.value.lotNo || booking.value.lotNo === originalLotNo.value) {
    if (!booking.value.lotNo) booking.value.lotNo = originalLotNo.value;
    lotNoError.value = '';
    return;
  }

  lotNoError.value = '';
  await saveBookingInfo();
  isLotNoOpen.value = false;
};

const handleSaveDrc = async () => {
  if (!booking.value) return;

  try {
    const drcData = {
      drcEst: parseFloat(drcForm.value.drcEst) || 0,
      drcRequested: parseFloat(drcForm.value.drcRequested) || 0,
      drcActual: parseFloat(drcForm.value.drcActual) || 0,
    };

    const updateData: any = {
      lotNo: booking.value.lotNo,
    };

    if (props.isTrailer) {
      updateData.trailerDrcEst = drcData.drcEst;
      updateData.trailerDrcRequested = drcData.drcRequested;
      updateData.trailerDrcActual = drcData.drcActual;
    } else {
      updateData.drcEst = drcData.drcEst;
      updateData.drcRequested = drcData.drcRequested;
      updateData.drcActual = drcData.drcActual;
    }

    await bookingsApi.update(props.bookingId, updateData);

    // Update local model
    if (props.isTrailer) {
      booking.value.trailerDrcEst = drcData.drcEst;
      booking.value.trailerDrcRequested = drcData.drcRequested;
      booking.value.trailerDrcActual = drcData.drcActual;
    } else {
      booking.value.drcEst = drcData.drcEst;
      booking.value.drcRequested = drcData.drcRequested;
      booking.value.drcActual = drcData.drcActual;
    }

    toast.success(t('common.saved'));
    emit('update');
  } catch (error) {
    console.error('Failed to update DRC:', error);
    toast.error(t('common.errorSaving'));
  }
  isDrcOpen.value = false;
};

const handleSaveMoisture = async () => {
  if (!booking.value) return;

  try {
    const moistureVal = parseFloat(moistureForm.value) || 0;
    const updateData: any = {
      lotNo: booking.value.lotNo,
    };

    if (props.isTrailer) {
      updateData.trailerMoisture = moistureVal;
    } else {
      updateData.moisture = moistureVal;
    }

    await bookingsApi.update(props.bookingId, updateData);

    if (props.isTrailer) {
      booking.value.trailerMoisture = moistureVal;
    } else {
      booking.value.moisture = moistureVal;
    }

    toast.success(t('common.saved'));
    emit('update');
  } catch (error) {
    console.error('Failed to update Moisture:', error);
    toast.error(t('common.errorSaving'));
  }
  isMoistureOpen.value = false;
};

// Mock Stats from Samples
const averageCp = computed(() => {
  if (!samples.value.length) return 0;
  const sum = samples.value.reduce((acc, s) => acc + (s.percentCp || 0), 0);
  return (sum / samples.value.length).toFixed(2);
});

watch(
  () => props.bookingId,
  () => {
    fetchData();
  }
);

onMounted(async () => {
  await fetchData();
  // Auto-initialize first row if nothing exists
  if (samples.value.length === 0 && newSamples.value.length === 0) {
    addNewSampleRow();
    // Focus the first input of the newly added row
    setTimeout(() => {
      const firstInput = document.querySelector(
        'input:not([readonly]):not([disabled])'
      ) as HTMLElement;
      if (firstInput) firstInput.focus();
    }, 100);
  }
});
</script>

<template>
  <div class="h-full flex flex-col">
    <div v-if="isLoading" class="flex items-center justify-center p-12">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"
        ></div>
        <div class="text-sm font-medium text-muted-foreground">Loading information...</div>
      </div>
    </div>

    <template v-else-if="booking">
      <!-- Section 1: Identification Header -->
      <div class="flex items-center justify-between pb-4 border-b">
        <div class="min-w-0 flex-1">
          <div class="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">
            {{ t('uss.supplier') }}
          </div>
          <h1 class="text-xl font-bold tracking-tight truncate flex items-center gap-2">
            <span class="text-primary">{{ booking.supplierCode }}</span>
            <span class="text-muted-foreground/30 font-light">|</span>
            <span class="truncate">{{ booking.supplierName }}</span>
          </h1>
        </div>

        <div class="flex flex-col items-end pr-6">
          <div class="flex flex-col items-center min-w-[6rem]">
            <div class="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">
              {{ t('uss.lotNo') }}
            </div>
            <Popover v-model:open="isLotNoOpen">
              <PopoverTrigger as-child>
                <div
                  class="cursor-pointer flex items-center justify-center font-bold tracking-tight hover:text-primary transition-colors min-w-full h-8"
                  :class="[
                    displayLotNo !== '-'
                      ? displayLotNo.length > 10
                        ? 'text-lg'
                        : 'text-xl'
                      : 'text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 rounded-md px-3',
                    { 'text-destructive': lotNoError },
                  ]"
                >
                  <template v-if="displayLotNo !== '-'">
                    {{ displayLotNo }}
                  </template>
                  <template v-else>
                    <div class="flex items-center gap-1.5 opacity-70 group-hover:opacity-100">
                      <Plus class="w-3.5 h-3.5" />
                      <span>{{ t('common.add') || 'Add' }}</span>
                    </div>
                  </template>
                </div>
              </PopoverTrigger>
              <PopoverContent class="w-60">
                <div class="grid gap-4">
                  <div class="space-y-2">
                    <h4 class="font-medium leading-none">{{ t('uss.lotNo') }}</h4>
                    <p class="text-xs text-muted-foreground">Enter the Lot Number.</p>
                  </div>
                  <div class="flex gap-2">
                    <Input
                      v-model="booking.lotNo"
                      class="h-8 font-bold text-center"
                      :class="{ 'border-destructive focus-visible:ring-destructive': lotNoError }"
                      @keydown.enter="handleUpdateLotNo"
                      @input="validateLotInput"
                    />
                  </div>
                  <div class="flex justify-end">
                    <Button size="sm" class="h-8 gap-1.5" @click="handleUpdateLotNo">
                      <Save class="w-3.5 h-3.5" />
                      {{ t('common.save') }}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto pr-2 space-y-4 pt-4">
        <!-- Section 2: Key Metrics Dashboard (Final Results) -->
        <div class="grid grid-cols-2 lg:grid-cols-7 gap-3">
          <div
            class="px-3 py-2.5 rounded-xl bg-slate-50/50 border border-slate-100 dark:bg-slate-900/20 dark:border-slate-800 flex flex-col justify-center min-h-[70px]"
          >
            <div
              class="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5"
            >
              {{ t('uss.rubberType') }}
            </div>
            <div
              class="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight truncate"
            >
              {{ displayRubberType }}
            </div>
          </div>

          <div
            class="hidden md:grid grid-cols-3 px-6 py-2.5 rounded-xl bg-gradient-to-br from-blue-50/50 to-green-50/50 border border-blue-100/50 dark:from-blue-900/10 dark:to-green-900/10 dark:border-blue-800 items-center justify-between min-h-[70px] relative overflow-hidden group divide-x divide-slate-200/50 dark:divide-slate-700/50"
          >
            <!-- Weight In (Left) -->
            <div class="flex flex-col items-center">
              <div
                class="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5"
              >
                Weight In
              </div>
              <div
                class="text-2xl font-black text-blue-900 dark:text-blue-100 leading-none tracking-tight"
              >
                {{ displayWeightIn }}
                <span class="text-[10px] font-medium opacity-60 ml-0.5">Kg</span>
              </div>
            </div>

            <!-- Gross Weight (Center) -->
            <div class="flex flex-col items-center">
              <div
                class="text-[9px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-0.5"
              >
                {{ t('uss.grossWeight') }}
              </div>
              <div
                class="text-2xl font-black text-green-900 dark:text-green-100 leading-none tracking-tight"
              >
                {{ displayNetWeight }}
                <span class="text-[10px] font-medium opacity-60 ml-0.5">Kg</span>
              </div>
            </div>

            <!-- Net Weight (Right - New/Empty) -->
            <div class="flex flex-col items-center">
              <div
                class="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-0.5"
              >
                {{ t('uss.netWeight') }}
              </div>
              <div
                class="text-2xl font-black text-red-900 dark:text-red-100 leading-none tracking-tight"
              >
                -
                <span class="text-[10px] font-medium opacity-60 ml-0.5">Kg</span>
              </div>
            </div>
          </div>

          <!-- Mobile Fallback (Separate Cards) -->
          <div
            class="md:hidden px-3 py-2.5 rounded-xl bg-blue-50/50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 flex flex-col justify-center min-h-[70px]"
          >
            <div
              class="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5"
            >
              Weight In
            </div>
            <div class="text-xl font-black text-blue-900 dark:text-blue-100 leading-none">
              {{ displayWeightIn }}
              <span class="text-[10px] font-medium opacity-60 ml-0.5">Kg</span>
            </div>
          </div>

          <div
            class="md:hidden px-3 py-2.5 rounded-xl bg-green-50/50 border border-green-100 dark:bg-green-900/20 dark:border-green-800 flex flex-col justify-center min-h-[70px]"
          >
            <div
              class="text-[9px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-0.5"
            >
              {{ t('uss.grossWeight') }}
            </div>
            <div class="text-xl font-black text-green-900 dark:text-green-100 leading-none">
              {{ displayNetWeight }}
              <span class="text-[10px] font-medium opacity-60 ml-0.5">Kg</span>
            </div>
          </div>

          <div
            class="md:hidden px-3 py-2.5 rounded-xl bg-red-50/50 border border-red-100 dark:bg-red-900/20 dark:border-red-800 flex flex-col justify-center min-h-[70px]"
          >
            <div
              class="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-0.5"
            >
              {{ t('uss.netWeight') }}
            </div>
            <div class="text-xl font-black text-red-900 dark:text-red-100 leading-none">
              -
              <span class="text-[10px] font-medium opacity-60 ml-0.5">Kg</span>
            </div>
          </div>

          <div
            class="px-3 py-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 flex flex-col justify-center items-center text-center min-h-[70px]"
          >
            <div
              class="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-0.5"
            >
              {{ t('uss.avgCp') }}
            </div>
            <div class="text-xl font-black text-indigo-900 dark:text-indigo-100 leading-none">
              {{ averageCp }}%
            </div>
          </div>

          <Popover v-model:open="isMoistureOpen">
            <PopoverTrigger as-child>
              <div
                class="cursor-pointer px-3 py-2.5 rounded-xl bg-amber-50/50 border border-amber-100 dark:bg-amber-900/20 dark:border-amber-800 flex flex-col justify-center items-center text-center min-h-[70px] hover:bg-amber-100/50 transition-colors"
              >
                <div
                  class="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5"
                >
                  {{ t('uss.moisture') }}
                </div>
                <div class="text-2xl font-black text-orange-700 leading-none">
                  {{ (booking.moisture || 0).toFixed(1) }}%
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent class="w-60">
              <div class="grid gap-4">
                <div class="space-y-2">
                  <h4 class="font-medium leading-none">{{ t('uss.moisture') }}</h4>
                  <p class="text-xs text-muted-foreground">Adjust moisture percentage.</p>
                </div>
                <div class="flex gap-2 items-center">
                  <Input
                    v-model="moistureForm"
                    type="number"
                    step="0.01"
                    class="h-8 font-bold text-center"
                    @keydown.enter="handleSaveMoisture"
                  />
                  <span class="text-sm font-bold text-muted-foreground">%</span>
                </div>
                <div class="flex justify-end">
                  <Button size="sm" class="h-8 gap-1.5" @click="handleSaveMoisture">
                    <Save class="w-3.5 h-3.5" />
                    {{ t('common.save') }}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover v-model:open="isDrcOpen">
            <PopoverTrigger as-child>
              <div
                class="col-span-2 cursor-pointer px-1 py-1 rounded-xl bg-teal-50/50 border border-teal-100 dark:bg-teal-900/20 dark:border-teal-800 shadow-sm ring-1 ring-teal-500/10 flex flex-col justify-center items-center text-center min-h-[70px] transition-all hover:bg-teal-100/50"
              >
                <div class="flex items-center justify-between h-full w-full px-1 gap-1">
                  <!-- Est -->
                  <div class="flex flex-col items-center flex-1">
                    <div
                      class="text-[7px] font-bold text-teal-600/70 dark:text-teal-400/70 uppercase tracking-wide mb-0.5"
                    >
                      Est.
                    </div>
                    <div class="text-sm font-bold text-teal-900 dark:text-teal-100 leading-none">
                      {{ booking.drcEst || '-' }}%
                    </div>
                  </div>
                  <!-- Divider -->
                  <div class="w-px h-6 bg-teal-200/50 dark:bg-teal-700/50 flex-none"></div>
                  <!-- Req -->
                  <div class="flex flex-col items-center flex-1">
                    <div
                      class="text-[7px] font-bold text-teal-600/70 dark:text-teal-400/70 uppercase tracking-wide mb-0.5"
                    >
                      Req.
                    </div>
                    <div class="text-sm font-bold text-teal-900 dark:text-teal-100 leading-none">
                      {{ booking.drcRequested || '-' }}%
                    </div>
                  </div>
                  <!-- Divider -->
                  <div class="w-px h-6 bg-teal-200/50 dark:bg-teal-700/50 flex-none"></div>
                  <!-- Actual -->
                  <div class="flex flex-col items-center flex-1">
                    <div
                      class="text-[7px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-0.5"
                    >
                      Actual
                    </div>
                    <span class="text-2xl font-black text-teal-700">
                      {{ (booking.drcActual || 0).toFixed(1) }}%
                    </span>
                  </div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent class="w-80">
              <div class="grid gap-4">
                <div class="space-y-2">
                  <h4 class="font-medium leading-none">DRC Management</h4>
                  <p class="text-sm text-muted-foreground">Adjust DRC values for this booking.</p>
                </div>
                <div class="grid gap-3">
                  <div class="grid grid-cols-3 items-center gap-4">
                    <Label for="drcEst">{{ t('uss.drcEst') }}</Label>
                    <Input
                      id="drcEst"
                      v-model="drcForm.drcEst"
                      type="number"
                      step="0.01"
                      class="col-span-2 h-8"
                      @keydown.enter="handleSaveDrc"
                    />
                  </div>
                  <div class="grid grid-cols-3 items-center gap-4">
                    <Label for="drcReq">DRC Req.</Label>
                    <Input
                      id="drcReq"
                      v-model="drcForm.drcRequested"
                      type="number"
                      step="0.01"
                      class="col-span-2 h-8"
                      @keydown.enter="handleSaveDrc"
                    />
                  </div>
                  <div class="grid grid-cols-3 items-center gap-4">
                    <Label for="drcActual">DRC Actual</Label>
                    <Input
                      id="drcActual"
                      v-model="drcForm.drcActual"
                      type="number"
                      step="0.01"
                      class="col-span-2 h-8"
                      @keydown.enter="handleSaveDrc"
                    />
                  </div>
                </div>

                <div class="flex justify-end pt-2">
                  <Button size="sm" class="h-8 gap-1.5" @click="handleSaveDrc">
                    <Save class="w-3.5 h-3.5" />
                    {{ t('common.save') }}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <!-- Section 4: Data Entry Table -->
        <div class="space-y-2 pb-6">
          <div class="flex items-center justify-between px-1">
            <h3
              class="text-xs font-bold flex items-center gap-2 uppercase tracking-wide text-muted-foreground"
            >
              {{ t('uss.recordedItems') }}
              <span class="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px]">{{
                samples.length
              }}</span>
            </h3>
            <Button
              size="sm"
              class="h-7 text-xs gap-1.5 px-3 rounded-lg shadow-sm"
              @click="addNewSampleRow"
              :disabled="isSaving"
            >
              <Plus class="w-3 h-3" />
              {{ t('common.add') }}
            </Button>
          </div>

          <div class="border rounded-xl overflow-hidden bg-background shadow-sm">
            <Table>
              <TableHeader
                class="bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10"
              >
                <TableRow
                  class="hover:bg-transparent border-b border-slate-200 dark:border-slate-800"
                >
                  <TableHead
                    class="w-[40px] h-9 text-[9px] uppercase font-bold text-center text-muted-foreground"
                    >#</TableHead
                  >
                  <TableHead
                    class="h-9 text-[9px] uppercase font-bold text-center text-muted-foreground"
                    >{{ t('uss.beforePress') }}</TableHead
                  >
                  <TableHead
                    class="h-9 text-[9px] uppercase font-bold text-center text-muted-foreground"
                    >{{ t('uss.basket') }}</TableHead
                  >
                  <TableHead
                    class="h-9 text-[9px] uppercase font-bold text-primary text-center bg-blue-50/30 dark:bg-blue-900/10"
                    >{{ t('uss.uss') }}</TableHead
                  >
                  <TableHead
                    class="h-9 text-[9px] uppercase font-bold text-center text-muted-foreground"
                    >{{ t('uss.afterPress') }}</TableHead
                  >
                  <TableHead
                    class="h-9 text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-400 text-center bg-indigo-50/30 dark:bg-indigo-900/10"
                    >{{ t('uss.percentCp') }}</TableHead
                  >
                  <TableHead
                    class="h-9 text-[9px] uppercase font-bold text-center text-muted-foreground"
                    >Bake 1</TableHead
                  >
                  <TableHead
                    class="h-9 text-[9px] uppercase font-bold text-center text-muted-foreground"
                    >Bake 2</TableHead
                  >
                  <TableHead
                    class="h-9 text-[9px] uppercase font-bold text-center text-muted-foreground"
                    >Bake 3</TableHead
                  >
                  <TableHead class="w-[40px] h-9"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <!-- New Samples -->
                <TableRow
                  v-for="(sample, index) in newSamples"
                  :key="sample.id"
                  class="bg-blue-50/20 hover:bg-blue-50/30 transition-colors border-b border-blue-100/50 dark:border-blue-900/30"
                >
                  <TableCell class="text-center font-bold text-primary py-1.5 text-xs">{{
                    samples.length + index + 1
                  }}</TableCell>
                  <TableCell class="py-1.5"
                    ><Input
                      v-model="sample.beforePress"
                      type="text"
                      placeholder="เช่น 12.23"
                      class="h-7 w-32 mx-auto p-1 text-center font-bold text-xs bg-white/80 dark:bg-slate-800/80 shadow-sm"
                      @keydown.enter="focusNextInput"
                      @input="handleNumericInput(sample, 'beforePress', sample.beforePress)"
                  /></TableCell>
                  <TableCell class="py-1.5"
                    ><Input
                      v-model="sample.basket"
                      type="text"
                      placeholder="1.4"
                      class="h-7 w-24 mx-auto p-1 text-center font-semibold text-xs bg-white/80 dark:bg-slate-800/80 shadow-sm"
                      data-skip-enter="true"
                      @keydown.enter="focusNextInput"
                      @input="handleNumericInput(sample, 'basket', sample.basket)"
                  /></TableCell>
                  <TableCell
                    class="text-center bg-blue-50/30 dark:bg-blue-900/5 p-1.5 font-black text-primary text-xs tracking-tight"
                  >
                    {{
                      calculateUss(
                        parseFloat(sample.beforePress || '0'),
                        parseFloat(sample.basket || '0')
                      )
                    }}
                  </TableCell>
                  <TableCell class="py-1.5"
                    ><Input
                      v-model="sample.afterPress"
                      type="text"
                      placeholder="เช่น 10.72"
                      class="h-7 w-32 mx-auto p-1 text-center font-semibold text-xs bg-white/80 dark:bg-slate-800/80 shadow-sm"
                      @keydown.enter="focusNextInput"
                      @input="handleNumericInput(sample, 'afterPress', sample.afterPress)"
                  /></TableCell>
                  <TableCell class="py-1.5"
                    ><Input
                      v-model="sample.percentCp"
                      type="number"
                      class="h-7 w-28 mx-auto p-1 text-center font-semibold text-xs bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                      placeholder="Auto"
                      readonly
                  /></TableCell>
                  <TableCell class="py-1.5"
                    ><Input
                      v-model="sample.beforeBaking1"
                      type="text"
                      placeholder="0.210"
                      class="h-7 w-28 mx-auto p-1 text-center text-xs"
                      @keydown.enter="focusNextInput"
                      @input="handleNumericInput(sample, 'beforeBaking1', sample.beforeBaking1)"
                  /></TableCell>
                  <TableCell class="py-1.5"
                    ><Input
                      v-model="sample.beforeBaking2"
                      type="text"
                      placeholder="0.220"
                      class="h-7 w-28 mx-auto p-1 text-center text-xs"
                      @keydown.enter="focusNextInput"
                      @input="handleNumericInput(sample, 'beforeBaking2', sample.beforeBaking2)"
                  /></TableCell>
                  <TableCell class="py-1.5"
                    ><Input
                      v-model="sample.beforeBaking3"
                      type="text"
                      placeholder="0.230"
                      class="h-7 w-28 mx-auto p-1 text-center text-xs"
                      @keydown.enter="focusNextInput"
                      @input="handleNumericInput(sample, 'beforeBaking3', sample.beforeBaking3)"
                  /></TableCell>
                  <TableCell class="py-1.5 text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      class="h-6 w-6 text-muted-foreground hover:text-destructive"
                      @click="removeNewSampleRow(index)"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>

                <!-- Existing Samples -->
                <TableRow
                  v-for="(sample, index) in samples"
                  :key="sample.id"
                  class="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-b border-slate-100 dark:border-slate-800"
                >
                  <TableCell class="text-center font-medium text-muted-foreground text-xs">{{
                    index + 1
                  }}</TableCell>
                  <TableCell class="text-center font-bold text-xs w-32">{{
                    sample.beforePress || '-'
                  }}</TableCell>
                  <TableCell class="text-center text-xs text-muted-foreground font-medium w-24">{{
                    sample.basketWeight || '-'
                  }}</TableCell>
                  <TableCell class="text-center font-bold text-primary text-xs">{{
                    sample.cuplumpWeight || '-'
                  }}</TableCell>
                  <TableCell class="text-center text-xs text-muted-foreground w-32">{{
                    sample.afterPress || '-'
                  }}</TableCell>
                  <TableCell
                    class="text-center font-bold text-indigo-600 dark:text-indigo-400 text-xs w-28"
                    >{{ sample.percentCp || '-' }}%</TableCell
                  >
                  <TableCell class="text-center text-xs text-muted-foreground w-28">{{
                    sample.beforeBaking1 || '-'
                  }}</TableCell>
                  <TableCell class="text-center text-xs text-muted-foreground w-28">{{
                    sample.beforeBaking2 || '-'
                  }}</TableCell>
                  <TableCell class="text-center text-xs text-muted-foreground w-28">{{
                    sample.beforeBaking3 || '-'
                  }}</TableCell>
                  <TableCell class="py-1.5 text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      @click="handleDeleteSample(sample.id)"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>

                <TableRow v-if="samples.length === 0 && newSamples.length === 0">
                  <TableCell colspan="10" class="h-24 text-center">
                    <div class="flex flex-col items-center justify-center text-muted-foreground">
                      <p class="text-xs">{{ t('uss.noSamples') }}</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div v-if="newSamples.length > 0" class="flex justify-end pt-2">
            <Button
              size="sm"
              class="bg-green-600 hover:bg-green-700 h-8 text-xs gap-1.5 shadow-sm px-4"
              :disabled="isSaving"
              @click="handleSaveAllSamples"
            >
              <Save class="w-3.5 h-3.5" />
              {{ t('common.save') }} ({{ populatedCount }})
            </Button>
          </div>
        </div>
      </div>
    </template>

    <AlertDialog :open="showSaveConfirm" @update:open="showSaveConfirm = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2">
            <AlertTriangle class="h-5 w-5 text-yellow-500" />
            {{ t('common.confirm') }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            <!-- Note: accessing t('common.confirmSaveAll') directly or duplicate keys from prev edit -->
            {{ t('uss.confirmSaveAll', { count: populatedCount }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="showSaveConfirm = false">{{
            t('common.cancel')
          }}</AlertDialogCancel>
          <AlertDialogAction @click="confirmSaveSamples">{{
            t('common.confirm')
          }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
