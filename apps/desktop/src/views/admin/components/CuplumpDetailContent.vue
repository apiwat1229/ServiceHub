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

// Refs for inputs
// Refs for inputs (Removed unused refs and focusNext)

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

// New Sample Form
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

// Focus next input on Enter
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
    // We search for the next input that doesn't have data-skip-enter,
    // UNLESS the current target ITSELF is a skip field (to allow moving out of it).
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
          // If we added a row, the "next" logical input is at currentIndex + 1
          // but we might need to skip the basket in the new row too
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

// Calculate %CP automatically
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
    // Only update if it actually changed to avoid cursor jumping
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
    const cuplump = beforePress - basket;
    if (cuplump > 0) {
      // Formula: %CP = (After Press / Cuplump) * (100 - Moisture)
      const percentCp = (afterPress / cuplump) * (100 - moisture);
      sample.percentCp = percentCp.toFixed(2);
    }
  }
};

const populatedCount = computed(() => {
  return newSamples.value.filter(
    (s) => s.beforePress || s.afterPress || s.beforeBaking1 || s.beforeBaking2 || s.beforeBaking3
  ).length;
});

const removeNewSampleRow = (index: number) => {
  newSamples.value.splice(index, 1);
};

// Computed Fields for Form
const displayRubberType = computed(() => {
  if (!booking.value) return '-';
  const code = props.isTrailer ? booking.value.trailerRubberType : booking.value.rubberType;
  const type = rubberTypes.value.find((t) => t.code === code);
  return type ? type.name : code;
});

// Weight display logic
const displayGrossWeight = computed(() => {
  if (!booking.value) return '-';
  const inW = props.isTrailer ? booking.value.trailerWeightIn || 0 : booking.value.weightIn || 0;
  const outW = props.isTrailer ? booking.value.trailerWeightOut || 0 : booking.value.weightOut || 0;

  // If both are 0, it might mean the data isn't fully entered yet
  if (inW === 0 && outW === 0) return '0';

  const cargoWeight = Math.abs(inW - outW);
  return cargoWeight.toLocaleString();
});

// Lot Number Display Logic
const displayLotNo = computed(() => {
  if (!booking.value) return '-';
  // If we have a lotNo on the object (either from DB or unsaved edit)
  const lot = props.isTrailer
    ? booking.value.trailerLotNo || booking.value.lotNo
    : booking.value.lotNo;
  if (lot) return lot;

  // Fallback for trailer as seen in Cuplump.vue
  if (props.isTrailer) {
    return '1251226-' + (booking.value.queueNo || '0') + '/2';
  }
  return '-';
});

// Net Weight calculation
const displayNetWeight = computed(() => {
  if (!booking.value) return '0';
  const inW = props.isTrailer ? booking.value.trailerWeightIn || 0 : booking.value.weightIn || 0;
  const outW = props.isTrailer ? booking.value.trailerWeightOut || 0 : booking.value.weightOut || 0;
  const net = Math.max(0, inW - outW);
  return net.toLocaleString();
});

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

// Calculate Cuplump (Before - Basket)
const calculateCuplump = (before: number, basket: number) => {
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
      t('cuplump.enterRequiredFields') ||
        'Please enter both Before Press and After Press for all items'
    );
    return;
  }
  // If no populated samples, nothing to save (but we still might want to save header info?
  // For now let's assume the button is primary for samples, but saving header is a side effect.
  // Actually, if samples list is empty, we force save header updates immediately without confirm?
  // Or we just block? User said "Save (0)" is weird.
  // Let's stick to: if count > 0, show confirm. If count == 0, just save header info silently?
  // The User wanted "Save" to save everything.

  if (populatedSamples.length === 0) {
    // Just save header info
    await saveHeaderInfoOnly();
    return;
  }

  showSaveConfirm.value = true;
};

const confirmSaveSamples = async () => {
  showSaveConfirm.value = false;

  // Re-filter to be safe (though state shouldn't have changed much)
  const populatedSamples = newSamples.value.filter(
    (s) => s.beforePress || s.afterPress || s.beforeBaking1 || s.beforeBaking2 || s.beforeBaking3
  );

  isSaving.value = true;
  try {
    const promises = populatedSamples.map((sample) => {
      // Logic for Percent CP if not already set (safety)
      if (!sample.percentCp) calculatePercentCp(sample);

      return bookingsApi.saveSample(props.bookingId, {
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
    });

    await Promise.all(promises);

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

    toast.success(t('cuplump.sampleSaved'));
    emit('update'); // Notify parent to refresh

    // Reset and Reload
    newSamples.value = [];
    fetchData();
  } catch (error) {
    console.error('Failed to save samples:', error);
    toast.error(t('cuplump.failedToSave'));
  } finally {
    isSaving.value = false;
  }
};

const handleDeleteSample = async (sampleId: string) => {
  if (!confirm(t('cuplump.confirmDelete'))) return;
  try {
    await bookingsApi.deleteSample(props.bookingId, sampleId);
    toast.success(t('cuplump.sampleDeleted'));
    emit('update');
    fetchData();
  } catch (e) {
    toast.error(t('cuplump.failedToDelete'));
  }
};

const validateLotInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const rawValue = input.value;

  // Clean value (keep only digits)
  const cleanedValue = rawValue.replace(/\D/g, '');

  if (rawValue !== cleanedValue) {
    // If characters were stripped, show error
    lotNoError.value = t('cuplump.numericOnly');
    booking.value.lotNo = cleanedValue; // Force update model

    // v-model sync might need nextTick or direct value update if it lags,
    // but usually updating the reactive ref is enough.
    // However, to ensure visual input update immediately for the user:
    input.value = cleanedValue;
  } else {
    // If input is clean, clear error
    lotNoError.value = '';
    // Model is already updated by v-model, but ensuring consistency:
    booking.value.lotNo = cleanedValue;
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
    originalLotNo.value = booking.value.lotNo; // Update original value on success
    toast.success(t('common.saved'));
    emit('update');
  } catch (error) {
    console.error('Failed to update Main Info:', error);
    toast.error(t('common.errorSaving'));
    // Revert on error
    booking.value.lotNo = originalLotNo.value;
  }
};

const handleUpdateLotNo = async () => {
  if (!booking.value) return;

  // Validation: Numeric only for LotNo
  if (booking.value.lotNo && !/^\d+$/.test(booking.value.lotNo)) {
    lotNoError.value = t('cuplump.numericOnly');
    return;
  }

  // Skip update if empty or unchanged
  if (!booking.value.lotNo || booking.value.lotNo === originalLotNo.value) {
    // Revert if invalid/empty if needed, but for now just don't save.
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

    const updateData: any = {};
    if (props.isTrailer) {
      updateData.trailerLotNo = booking.value.lotNo;
      updateData.trailerDrcEst = drcData.drcEst;
      updateData.trailerDrcRequested = drcData.drcRequested;
      updateData.trailerDrcActual = drcData.drcActual;
    } else {
      updateData.lotNo = booking.value.lotNo;
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
    const updateData: any = {};
    if (props.isTrailer) {
      updateData.trailerLotNo = booking.value.lotNo;
      updateData.trailerMoisture = moistureVal;
    } else {
      updateData.lotNo = booking.value.lotNo;
      updateData.moisture = moistureVal;
    }

    await bookingsApi.update(props.bookingId, updateData);

    // Update local model
    if (props.isTrailer) {
      booking.value.trailerMoisture = moistureVal;
    } else {
      booking.value.moisture = moistureVal;
    }

    // Recalculate %CP for all new samples
    newSamples.value.forEach((s) => calculatePercentCp(s));

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

// Watch bookingId change if modal context changes (though likely re-mounted)
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
          <div class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
            {{ t('cuplump.supplier') }}
          </div>
          <h1
            class="text-xl font-black tracking-tight truncate flex items-center gap-2 text-slate-900 dark:text-slate-100"
          >
            <span class="text-primary">{{ booking.supplierCode }}</span>
            <span class="text-slate-300 dark:text-slate-700 font-light">|</span>
            <span class="truncate">{{ booking.supplierName }}</span>
          </h1>
        </div>

        <div class="flex flex-col items-end pr-6">
          <div class="flex flex-col items-center min-w-[8rem]">
            <div class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
              {{ t('cuplump.lotNo') }}
            </div>
            <Popover v-model:open="isLotNoOpen">
              <PopoverTrigger as-child>
                <div
                  class="cursor-pointer flex items-center justify-center font-black tracking-tight hover:text-primary transition-colors min-w-full h-8 text-slate-900 dark:text-slate-100"
                  :class="[
                    displayLotNo !== '-'
                      ? displayLotNo.length > 10
                        ? 'text-lg'
                        : 'text-2xl'
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
                    <h4 class="font-medium leading-none">{{ t('cuplump.lotNo') }}</h4>
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
        <div class="grid grid-cols-12 gap-3">
          <!-- Rubber Type -->
          <div
            class="col-span-2 px-4 py-3 rounded-xl bg-slate-50/50 border border-slate-100 dark:bg-slate-900/20 dark:border-slate-800 flex flex-col justify-center min-h-[4.5rem]"
          >
            <div class="text-[0.625rem] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              {{ t('cuplump.rubberType') }}
            </div>
            <div class="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">
              {{ displayRubberType }}
            </div>
          </div>

          <!-- Gross Weight -->
          <div
            class="col-span-2 p-2 rounded-xl bg-blue-50/50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 flex flex-col justify-center items-center text-center min-h-[4.5rem]"
          >
            <div
              class="text-[0.5625rem] font-bold text-blue-600 uppercase tracking-tighter mb-1.5 leading-none"
            >
              {{ t('cuplump.grossWeight') }}
            </div>
            <div class="text-2xl font-black text-blue-700 leading-none">
              {{ displayGrossWeight }}
              <span class="text-[0.5625rem] text-muted-foreground ml-0.5">Kg</span>
            </div>
          </div>

          <!-- Net Weight -->
          <div
            class="col-span-2 p-2 rounded-xl bg-green-50/50 border border-green-100 dark:bg-green-900/20 dark:border-green-800 flex flex-col justify-center items-center text-center min-h-[4.5rem]"
          >
            <div
              class="text-[0.5625rem] font-bold text-green-600 uppercase tracking-tighter mb-1.5 leading-none"
            >
              {{ t('cuplump.netWeight') }}
            </div>
            <div class="text-2xl font-black text-green-700 leading-none">
              {{ displayNetWeight }}
              <span class="text-[0.5625rem] text-muted-foreground ml-0.5">Kg</span>
            </div>
          </div>

          <!-- Ave. %CP -->
          <div
            class="col-span-1 p-2 rounded-xl bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 flex flex-col justify-center items-center text-center min-h-[4.5rem]"
          >
            <div
              class="text-[0.5625rem] font-bold text-indigo-600 uppercase tracking-tighter mb-1.5"
            >
              {{ t('cuplump.avgCp') }}
            </div>
            <div class="text-2xl font-black text-indigo-700 leading-none">{{ averageCp }}%</div>
          </div>

          <!-- Moisture -->
          <Popover v-model:open="isMoistureOpen">
            <PopoverTrigger as-child>
              <div
                class="col-span-1 cursor-pointer p-2 rounded-xl bg-orange-50/50 border border-orange-100 dark:bg-orange-900/20 dark:border-orange-800 flex flex-col justify-center items-center text-center min-h-[4.5rem] hover:bg-orange-100/50 transition-colors"
              >
                <div
                  class="text-[0.5625rem] font-bold text-orange-600 uppercase tracking-tighter mb-1.5"
                >
                  {{ t('cuplump.moisture') }}
                </div>
                <div class="text-2xl font-black text-orange-700 leading-none">
                  {{ (booking.moisture || 0).toFixed(1) }}%
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent class="w-60">
              <div class="grid gap-4">
                <div class="space-y-2">
                  <h4 class="font-medium leading-none">{{ t('cuplump.moisture') }}</h4>
                  <p class="text-xs text-muted-foreground">{{ t('cuplump.adjustMoisture') }}</p>
                </div>
                <div class="flex gap-2 items-center">
                  <Input
                    v-model="moistureForm"
                    type="number"
                    step="0.1"
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
          <!-- DRC Dashboard Group (Item 6) -->
          <Popover v-model:open="isDrcOpen">
            <PopoverTrigger as-child>
              <div
                class="col-span-4 cursor-pointer p-3 rounded-xl bg-teal-50/50 border border-teal-100 dark:bg-teal-900/20 dark:border-teal-800 flex flex-col min-h-[4.5rem] hover:bg-teal-100/50 transition-colors group relative"
              >
                <!-- Main Header -->
                <div
                  class="text-[0.625rem] font-bold text-teal-600 uppercase tracking-widest text-center absolute top-2 left-0 right-0"
                >
                  DRC %
                </div>

                <div class="flex flex-1 items-center justify-between mt-4 px-0.5">
                  <!-- EST -->
                  <div class="flex-1 flex flex-col items-center">
                    <span
                      class="text-[0.5625rem] font-bold text-teal-600/70 uppercase tracking-widest mb-1"
                      >{{ t('cuplump.drcEstShort') }}</span
                    >
                    <span class="text-2xl font-black text-teal-700">
                      {{ (booking.drcEst || 0).toFixed(1) }}%
                    </span>
                  </div>

                  <div class="w-px h-10 bg-teal-200/50 mx-1"></div>

                  <!-- REQ -->
                  <div class="flex-1 flex flex-col items-center">
                    <span
                      class="text-[0.5625rem] font-bold text-teal-600/70 uppercase tracking-widest mb-1"
                      >{{ t('cuplump.drcReqShort') }}</span
                    >
                    <span class="text-2xl font-black text-teal-700">
                      {{ (booking.drcRequested || 0).toFixed(1) }}%
                    </span>
                  </div>

                  <div class="w-px h-10 bg-teal-200/50 mx-1"></div>

                  <!-- ACTUAL -->
                  <div class="flex-1 flex flex-col items-center">
                    <span
                      class="text-[0.5625rem] font-bold text-teal-600/70 uppercase tracking-widest mb-1"
                      >{{ t('cuplump.drcActualShort') }}</span
                    >
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
                  <h4 class="font-medium leading-none">{{ t('cuplump.drcManagement') }}</h4>
                  <p class="text-sm text-muted-foreground">{{ t('cuplump.adjustDrcValues') }}</p>
                </div>
                <div class="grid gap-3">
                  <div class="grid grid-cols-3 items-center gap-4">
                    <Label for="drcEst">{{ t('cuplump.drcEst') }}</Label>
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
                    <Label for="drcReq">{{ t('cuplump.drcReq') }}</Label>
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
                    <Label for="drcActual">{{ t('cuplump.drcActual') }}</Label>
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
              {{ t('cuplump.recordedItems') }}
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
                    >{{ t('cuplump.beforePress') }}</TableHead
                  >
                  <TableHead
                    class="h-9 text-[9px] uppercase font-bold text-center text-muted-foreground"
                    >{{ t('cuplump.basket') }}</TableHead
                  >
                  <TableHead
                    class="h-9 text-[9px] uppercase font-bold text-primary text-center bg-blue-50/30 dark:bg-blue-900/10"
                    >{{ t('cuplump.cuplump') }}</TableHead
                  >
                  <TableHead
                    class="h-9 text-[9px] uppercase font-bold text-center text-muted-foreground"
                    >{{ t('cuplump.afterPress') }}</TableHead
                  >
                  <TableHead
                    class="h-9 text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-400 text-center bg-indigo-50/30 dark:bg-indigo-900/10"
                    >{{ t('cuplump.percentCp') }}</TableHead
                  >
                  <TableHead
                    class="h-9 text-[9px] uppercase font-bold text-center text-muted-foreground"
                    >{{ t('cuplump.beforeBaking1') }}</TableHead
                  >
                  <TableHead
                    class="h-9 text-[9px] uppercase font-bold text-center text-muted-foreground"
                    >{{ t('cuplump.beforeBaking2') }}</TableHead
                  >
                  <TableHead
                    class="h-9 text-[9px] uppercase font-bold text-center text-muted-foreground"
                    >{{ t('cuplump.beforeBaking3') }}</TableHead
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
                      calculateCuplump(
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
                      @keydown.enter="focusNextInput"
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
                  <TableCell class="text-center py-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                      @click="removeNewSampleRow(index)"
                    >
                      <Trash2 class="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>

                <!-- Saved Samples -->
                <TableRow
                  v-for="item in samples"
                  :key="item.id"
                  class="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <TableCell class="text-center font-medium text-xs text-muted-foreground py-2">{{
                    item.sampleNo
                  }}</TableCell>
                  <TableCell class="text-center font-bold text-xs py-2 w-32">{{
                    item.beforePress?.toFixed(2)
                  }}</TableCell>
                  <TableCell class="text-center text-xs py-2 w-24">{{
                    item.basketWeight?.toFixed(2)
                  }}</TableCell>
                  <TableCell class="text-center font-black text-primary text-xs py-2">{{
                    item.cuplumpWeight?.toFixed(2)
                  }}</TableCell>
                  <TableCell class="text-center font-bold text-xs py-2 font-mono w-32">{{
                    item.afterPress?.toFixed(2)
                  }}</TableCell>
                  <TableCell
                    class="text-center font-black text-indigo-600 text-xs py-2 bg-indigo-50/30 w-28"
                  >
                    {{ item.percentCp?.toFixed(2) }}%
                  </TableCell>
                  <TableCell class="text-center text-muted-foreground text-[11px] py-2 w-28">{{
                    item.beforeBaking1?.toFixed(3)
                  }}</TableCell>
                  <TableCell class="text-center text-muted-foreground text-[11px] py-2 w-28">{{
                    item.beforeBaking2?.toFixed(3)
                  }}</TableCell>
                  <TableCell class="text-center text-muted-foreground text-[11px] py-2 w-28">{{
                    item.beforeBaking3?.toFixed(3)
                  }}</TableCell>
                  <TableCell class="text-center py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-6 w-6 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-full"
                      @click="handleDeleteSample(item.id)"
                    >
                      <Trash2 class="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>

                <TableRow v-if="samples.length === 0 && newSamples.length === 0">
                  <TableCell colspan="10" class="h-24 text-center">
                    <div class="text-xs text-muted-foreground flex flex-col items-center gap-1">
                      <div class="p-2 rounded-full bg-slate-100 dark:bg-slate-800 mb-1">
                        <Plus class="w-4 h-4 opacity-50" />
                      </div>
                      {{ t('common.noData') }}
                      <Button
                        variant="link"
                        size="sm"
                        class="h-auto p-0 text-xs"
                        @click="addNewSampleRow"
                        >{{ t('cuplump.addFirstSample') }}</Button
                      >
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
            {{ t('cuplump.confirmSaveAll', { count: populatedCount }) }}
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
```
