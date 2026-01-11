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
import { Card, CardContent } from '@/components/ui/card';
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
import { AlertTriangle, ArrowLeft, Check, Pencil, Plus, Save, Trash2 } from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

// Route Params & Query
const bookingId = route.params.id as string;
const isTrailer = route.query.isTrailer === 'true';
const partLabel = (route.query.partLabel as string) || (isTrailer ? 'Trailer' : 'Main Truck');

// State
const booking = ref<any>(null);
const samples = ref<any[]>([]);
const rubberTypes = ref<any[]>([]);

const originalLotNo = ref('');
const lotNoError = ref('');
const isLoading = ref(false);
const isSaving = ref(false);

const isDrcOpen = ref(false);
const isMoistureOpen = ref(false);
const showSaveConfirm = ref(false);
const showDeleteConfirm = ref(false);
const sampleToDeleteId = ref<string | null>(null);
const isDeleting = ref(false);
const editingSampleId = ref<string | null>(null);

const toggleEdit = async (id: string) => {
  const isEditing = editingSampleId.value === id;
  editingSampleId.value = isEditing ? null : id;

  if (!isEditing) {
    await nextTick();
    const targetRow = document.querySelector(`[data-row-id="${id}"]`);
    if (targetRow) {
      const firstInput = targetRow.querySelector('input:not([readonly])') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    }
  }
};

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

const addNewSampleRow = async () => {
  const tempId = 'temp-' + Date.now();
  newSamples.value.push({
    id: tempId,
    totalWeight: '',
    palletWeight: '2.4',
    grossWeight: '',
    spgr: '',
  });

  await nextTick();
  const targetRow = document.querySelector(`[data-row-id="${tempId}"]`);
  if (targetRow) {
    const firstInput = targetRow.querySelector('input') as HTMLInputElement;
    if (firstInput) {
      firstInput.focus();
    }
  }
};

const populatedCount = computed(() => {
  const allSamples = [...samples.value, ...newSamples.value];
  return allSamples.filter((s) => s.totalWeight || s.palletWeight || s.spgr).length;
});

const removeNewSampleRow = (index: number) => {
  newSamples.value.splice(index, 1);
};

const focusNextInput = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement;
  const inputs = Array.from(
    document.querySelectorAll(
      'input:not([readonly]):not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([readonly]):not([disabled])'
    )
  ) as HTMLElement[];
  const currentIndex = inputs.indexOf(target);

  if (currentIndex >= 0) {
    const nextIndex = currentIndex + 1;
    if (nextIndex < inputs.length) {
      event.preventDefault();
      inputs[nextIndex].focus();
    } else {
      const isLastField = currentIndex === inputs.length - 1;
      if (isLastField) {
        event.preventDefault();
        handleSaveAllSamples();
      }
    }
  }
};

const displayRubberType = computed(() => {
  if (!booking.value) return '-';
  const code = isTrailer ? booking.value.trailerRubberType : booking.value.rubberType;
  const type = rubberTypes.value.find((t) => t.code === code);
  return type ? type.name : code;
});

const displayNetWeight = computed(() => {
  if (!booking.value) return 0;
  const inW = isTrailer ? booking.value.trailerWeightIn : booking.value.weightIn;
  const outW = isTrailer ? booking.value.trailerWeightOut : booking.value.weightOut;
  const net = (inW || 0) - (outW || 0);
  return (net > 0 ? net : 0).toLocaleString();
});

const handleNumericInput = (sample: any, field: string, value: string) => {
  let cleaned = value.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  if (cleaned !== value) {
    sample[field] = cleaned;
  } else {
    sample[field] = value;
  }

  if (['totalWeight', 'palletWeight'].includes(field)) {
    calculateGrossWeight(sample);
  }
};

const calculateGrossWeight = (sample: any) => {
  const total = parseFloat(sample.totalWeight || '0');
  const pallet = parseFloat(sample.palletWeight || '0');

  if (total && pallet) {
    const gross = total - pallet;
    sample.grossWeight = gross > 0 ? gross.toFixed(2) : '0.00';
  } else {
    sample.grossWeight = '';
  }
};

const fetchData = async () => {
  if (!bookingId) return;
  isLoading.value = true;
  try {
    const [bookingData, samplesData, typesData] = await Promise.all([
      bookingsApi.getById(bookingId),
      bookingsApi.getSamples(bookingId),
      rubberTypesApi.getAll(),
    ]);

    booking.value = {
      ...bookingData,
      lotNo: isTrailer ? bookingData.trailerLotNo || '' : bookingData.lotNo || '',
      moisture: isTrailer ? bookingData.trailerMoisture || 0 : bookingData.moisture || 0,
      drcEst: isTrailer ? bookingData.trailerDrcEst || 0 : bookingData.drcEst || 0,
      drcRequested: isTrailer
        ? bookingData.trailerDrcRequested || 0
        : bookingData.drcRequested || 0,
      drcActual: isTrailer ? bookingData.trailerDrcActual || 0 : bookingData.drcActual || 0,
    };
    originalLotNo.value = booking.value.lotNo;
    samples.value = samplesData
      .filter((s: any) => s.isTrailer === isTrailer)
      .map((s: any) => ({
        ...s,
        totalWeight: s.beforePress?.toString() || '',
        palletWeight: s.basketWeight?.toString() || '2.4',
        grossWeight: s.afterPress?.toString() || '',
        spgr: s.percentCp?.toString() || '',
      }));
    rubberTypes.value = typesData;
  } catch (error) {
    console.error('Failed to load data:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    isLoading.value = false;
  }
};

const saveHeaderInfoOnly = async () => {
  isSaving.value = true;
  try {
    const updateData: any = {};
    if (isTrailer) {
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

    await bookingsApi.update(bookingId, updateData);
    toast.success(t('common.saved'));
    fetchData(); // Refresh to ensure sync
  } catch (error) {
    console.error('Failed to save header info:', error);
    toast.error(t('common.errorSaving'));
  } finally {
    isSaving.value = false;
  }
};

const handleSaveAllSamples = async () => {
  const allSamples = [...samples.value, ...newSamples.value];
  const populatedSamples = allSamples.filter((s) => s.beforePress || s.afterPress);

  const allValid = populatedSamples.every((s) => s.totalWeight && s.palletWeight);

  if (populatedSamples.length > 0 && !allValid) {
    toast.error(t('uss.enterRequiredFields'));
    return;
  }

  if (populatedSamples.length === 0) {
    await saveHeaderInfoOnly();
    return;
  }

  showSaveConfirm.value = true;
};

const confirmSaveSamples = async () => {
  showSaveConfirm.value = false;

  const allSamples = [...samples.value, ...newSamples.value];
  const populatedSamples = allSamples.filter((s) => s.totalWeight || s.palletWeight || s.spgr);

  isSaving.value = true;
  try {
    for (const sample of populatedSamples) {
      if (!sample.grossWeight) calculateGrossWeight(sample);

      await bookingsApi.saveSample(bookingId, {
        ...sample,
        beforePress: parseFloat(sample.totalWeight),
        afterPress: parseFloat(sample.grossWeight),
        percentCp: parseFloat(sample.spgr || '0'),
        basketWeight: parseFloat(sample.palletWeight),
        isTrailer: isTrailer,
      });
    }

    const updateData: any = {};
    if (isTrailer) {
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

    await bookingsApi.update(bookingId, updateData);

    toast.success(t('uss.sampleSaved'));
    newSamples.value = [];
    fetchData();
  } catch (error: any) {
    console.error('Failed to save samples:', error);
    toast.error(error.response?.data?.message || t('uss.failedToSave'));
  } finally {
    isSaving.value = false;
  }
};

const handleDeleteSample = (sampleId: string) => {
  sampleToDeleteId.value = sampleId;
  showDeleteConfirm.value = true;
};

const confirmDeleteSample = async () => {
  if (!sampleToDeleteId.value) return;
  isDeleting.value = true;
  try {
    await bookingsApi.deleteSample(bookingId, sampleToDeleteId.value);
    toast.success(t('uss.sampleDeleted'));
    await fetchData();
  } catch (e) {
    toast.error(t('uss.failedToDelete'));
  } finally {
    isDeleting.value = false;
    showDeleteConfirm.value = false;
    sampleToDeleteId.value = null;
  }
};

const lotNoPrefix = computed(() => {
  const dateStr =
    booking.value?.date || booking.value?.entryDate || booking.value?.createdAt || new Date();
  const now = new Date(dateStr);

  if (isNaN(now.getTime())) return '';

  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  return `2${yy}${mm}${dd}-`;
});

const lotNoSuffix = computed({
  get() {
    if (!booking.value?.lotNo) return '';
    const prefix = lotNoPrefix.value;
    if (booking.value.lotNo.startsWith(prefix)) {
      return booking.value.lotNo.slice(prefix.length);
    }
    return booking.value.lotNo;
  },
  set(val: string) {
    if (!booking.value) return;
    booking.value.lotNo = lotNoPrefix.value + val;
  },
});

const validateLotInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const rawSuffix = input.value;
  const cleanedSuffix = rawSuffix.replace(/[^0-9/-]/g, '');

  if (rawSuffix !== cleanedSuffix) {
    lotNoError.value = t('uss.invalidChar') || 'Only numbers, / and - allowed';
    lotNoSuffix.value = cleanedSuffix;
    input.value = cleanedSuffix;
  } else {
    lotNoError.value = '';
    lotNoSuffix.value = cleanedSuffix;
  }
};

const handleUpdateLotNo = async () => {
  if (!booking.value) return;

  if (booking.value.lotNo && !/^[0-9/\-]+$/.test(booking.value.lotNo)) {
    lotNoError.value = t('uss.invalidChar') || 'Only numbers, / and - allowed';
    return;
  }

  if (!booking.value.lotNo || booking.value.lotNo === originalLotNo.value) {
    if (!booking.value.lotNo) booking.value.lotNo = originalLotNo.value;
    lotNoError.value = '';
    return;
  }

  // NOTE: Validation for duplicate can be added nicely here if we have an API for it.
  // For now, relies on backend constraint or user awareness.

  lotNoError.value = '';
  await saveHeaderInfoOnly();
  // Manually update originalLotNo after successful save in saveHeaderInfoOnly
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

    if (isTrailer) {
      updateData.trailerDrcEst = drcData.drcEst;
      updateData.trailerDrcRequested = drcData.drcRequested;
      updateData.trailerDrcActual = drcData.drcActual;
    } else {
      updateData.drcEst = drcData.drcEst;
      updateData.drcRequested = drcData.drcRequested;
      updateData.drcActual = drcData.drcActual;
    }

    await bookingsApi.update(bookingId, updateData);

    if (isTrailer) {
      booking.value.trailerDrcEst = drcData.drcEst;
      booking.value.trailerDrcRequested = drcData.drcRequested;
      booking.value.trailerDrcActual = drcData.drcActual;
    } else {
      booking.value.drcEst = drcData.drcEst;
      booking.value.drcRequested = drcData.drcRequested;
      booking.value.drcActual = drcData.drcActual;
    }

    toast.success(t('common.saved'));
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

    if (isTrailer) {
      updateData.trailerMoisture = moistureVal;
    } else {
      updateData.moisture = moistureVal;
    }

    await bookingsApi.update(bookingId, updateData);

    if (isTrailer) {
      booking.value.trailerMoisture = moistureVal;
    } else {
      booking.value.moisture = moistureVal;
    }

    toast.success(t('common.saved'));
  } catch (error) {
    console.error('Failed to update Moisture:', error);
    toast.error(t('common.errorSaving'));
  }
  isMoistureOpen.value = false;
};

onMounted(async () => {
  await fetchData();
  if (samples.value.length === 0 && newSamples.value.length === 0) {
    await addNewSampleRow();
  } else {
    await nextTick();
    const firstEditable = document.querySelector(
      'input:not([readonly]):not([disabled])'
    ) as HTMLInputElement;
    if (firstEditable) {
      firstEditable.focus();
      if (firstEditable.value) firstEditable.select();
    }
  }
});
</script>

<template>
  <div class="p-6 max-w-[1600px] mx-auto space-y-6">
    <!-- Header with Back Button -->
    <div class="flex items-center gap-4">
      <Button variant="outline" size="icon" @click="router.back()">
        <ArrowLeft class="w-4 h-4" />
      </Button>
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          {{ t('uss.detailTitle') || 'USS Details' }}
        </h1>
        <p class="text-sm text-muted-foreground" v-if="booking">
          {{ partLabel }} - Booking #{{ booking.bookingCode }}
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <Card class="flex-1 overflow-hidden border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
      <CardContent class="p-6 h-full flex flex-col">
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
              <div
                class="text-[0.625rem] text-muted-foreground font-bold uppercase tracking-widest mb-1"
              >
                {{ t('uss.supplier') }}
              </div>
              <h1 class="text-xl font-bold tracking-tight truncate flex items-center gap-2">
                <span class="text-primary">{{ booking.supplierCode }}</span>
                <span class="text-muted-foreground/30 font-light">|</span>
                <span class="truncate">{{ booking.supplierName }}</span>
              </h1>
            </div>

            <!-- Section 1.5: Centered Weights -->
            <div class="flex items-center gap-8 px-8">
              <div class="flex flex-col items-center">
                <span
                  class="text-[0.625rem] font-bold text-blue-600 uppercase tracking-tighter mb-1"
                  >{{ t('uss.grossWeight') }}</span
                >
                <div class="flex items-baseline gap-1">
                  <span class="text-2xl font-black text-blue-700 leading-none">{{
                    displayNetWeight
                  }}</span>
                  <span class="text-[0.625rem] text-muted-foreground font-bold">Kg</span>
                </div>
              </div>
              <div class="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
              <div class="flex flex-col items-center">
                <span
                  class="text-[0.625rem] font-bold text-green-600 uppercase tracking-tighter mb-1"
                  >{{ t('uss.netWeight') }}</span
                >
                <div class="flex items-baseline gap-1">
                  <span class="text-2xl font-black text-green-700 leading-none">-</span>
                  <span class="text-[0.625rem] text-muted-foreground font-bold">Kg</span>
                </div>
              </div>
            </div>

            <div class="flex flex-col items-end pr-6">
              <div class="flex flex-col items-center min-w-[8rem]">
                <div
                  class="text-[0.625rem] text-muted-foreground font-bold uppercase tracking-widest mb-1"
                >
                  {{ t('uss.lotNo') }}
                </div>
                <div class="flex items-center gap-1">
                  <div
                    class="flex items-center w-56 h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus-within:ring-2 focus-within:ring-primary shadow-sm ring-offset-background transition-colors"
                    :class="{ 'border-destructive focus-within:ring-destructive': lotNoError }"
                  >
                    <span
                      class="text-lg font-black text-slate-900 dark:text-slate-100 whitespace-nowrap select-none"
                      >{{ lotNoPrefix }}</span
                    >
                    <input
                      v-model="lotNoSuffix"
                      class="flex-1 bg-transparent border-none outline-none focus:ring-0 font-black text-lg p-0 h-full ml-0.5"
                      @keydown.enter="handleUpdateLotNo"
                      @blur="handleUpdateLotNo"
                      @input="validateLotInput"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto pr-2 space-y-4 pt-4">
            <!-- Section 2: Key Metrics Dashboard (Final Results) -->
            <div class="grid grid-cols-5 gap-2">
              <!-- Rubber Type -->
              <div
                class="px-3 py-3 rounded-xl bg-slate-50/50 border border-slate-100 dark:bg-slate-900/20 dark:border-slate-800 flex flex-col justify-center min-h-[4.5rem]"
              >
                <div
                  class="text-[0.625rem] font-bold text-slate-500 uppercase tracking-widest mb-1.5 leading-none"
                >
                  {{ t('uss.rubberType') }}
                </div>
                <div class="text-xs font-black text-slate-900 dark:text-slate-100 leading-tight">
                  {{ displayRubberType }}
                </div>
              </div>

              <!-- Before Dryer (Formerly Moisture) -->
              <Popover v-model:open="isMoistureOpen">
                <PopoverTrigger as-child>
                  <div
                    class="cursor-pointer p-2 rounded-xl bg-orange-50/50 border border-orange-100 dark:bg-orange-900/20 dark:border-orange-800 flex flex-col justify-center items-center text-center min-h-[4.5rem] hover:bg-orange-100/50 transition-colors"
                  >
                    <div
                      class="text-[0.625rem] font-bold text-orange-600 uppercase tracking-tighter mb-1.5 leading-none"
                    >
                      {{ t('uss.beforeDryer') }}
                    </div>
                    <div class="text-xl font-black text-orange-700 leading-none">
                      {{ (booking?.moisture || 0).toFixed(1) }}%
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent class="w-60">
                  <div class="grid gap-4">
                    <div class="space-y-2">
                      <h4 class="font-medium leading-none">{{ t('uss.beforeDryer') }}</h4>
                      <p class="text-xs text-muted-foreground">Adjust Before Dryer percentage.</p>
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
                    <div class="flex justify-end pt-2 border-t mt-2">
                      <Button
                        size="sm"
                        class="h-8 gap-1.5 bg-orange-600 hover:bg-orange-700 text-white"
                        @click="handleSaveMoisture"
                      >
                        <Save class="w-3.5 h-3.5" />
                        {{ t('common.save') }}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <!-- DRC Est -->
              <div
                @click="isDrcOpen = true"
                class="cursor-pointer p-2 rounded-xl bg-teal-50/50 border border-teal-100 dark:bg-teal-900/20 dark:border-teal-800 flex flex-col justify-center items-center text-center min-h-[4.5rem] hover:bg-teal-100/50 transition-colors"
              >
                <div
                  class="text-[0.5625rem] font-bold text-teal-600 uppercase tracking-tighter mb-1.5 leading-none"
                >
                  Est.
                </div>
                <div class="text-xl font-black text-teal-700 leading-none">
                  {{ (booking.drcEst || 0).toFixed(1) }}%
                </div>
              </div>

              <!-- DRC Req -->
              <div
                @click="isDrcOpen = true"
                class="cursor-pointer p-2 rounded-xl bg-teal-50/50 border border-teal-100 dark:bg-teal-900/20 dark:border-teal-800 flex flex-col justify-center items-center text-center min-h-[4.5rem] hover:bg-teal-100/50 transition-colors"
              >
                <div
                  class="text-[0.5625rem] font-bold text-teal-600 uppercase tracking-tighter mb-1.5 leading-none"
                >
                  Req.
                </div>
                <div class="text-xl font-black text-teal-700 leading-none">
                  {{ (booking.drcRequested || 0).toFixed(1) }}%
                </div>
              </div>

              <!-- DRC Actual (Trigger) -->
              <Popover v-model:open="isDrcOpen">
                <PopoverTrigger as-child>
                  <div
                    class="cursor-pointer p-2 rounded-xl bg-teal-50/50 border border-teal-100 dark:bg-teal-900/20 dark:border-teal-800 flex flex-col justify-center items-center text-center min-h-[4.5rem] hover:bg-teal-100/50 transition-colors"
                  >
                    <div
                      class="text-[0.5625rem] font-bold text-teal-600 uppercase tracking-tighter mb-1.5 leading-none"
                    >
                      Actual
                    </div>
                    <div class="text-xl font-black text-teal-700 leading-none">
                      {{ (booking.drcActual || 0).toFixed(1) }}%
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent class="w-80">
                  <div class="grid gap-4">
                    <div class="space-y-2">
                      <h4 class="font-medium leading-none text-teal-700">DRC % Details</h4>
                      <p class="text-xs text-muted-foreground">
                        Adjust DRC estimated, requested, and actual values.
                      </p>
                    </div>
                    <div class="grid gap-3">
                      <div class="grid grid-cols-3 items-center gap-4">
                        <Label for="drcEst" class="text-xs uppercase font-bold text-teal-600">{{
                          t('uss.drcEst')
                        }}</Label>
                        <Input
                          id="drcEst"
                          v-model="drcForm.drcEst"
                          type="number"
                          step="0.01"
                          class="col-span-2 h-8 font-bold"
                          @keydown.enter="handleSaveDrc"
                        />
                      </div>
                      <div class="grid grid-cols-3 items-center gap-4">
                        <Label for="drcReq" class="text-xs uppercase font-bold text-teal-600"
                          >DRC Req.</Label
                        >
                        <Input
                          id="drcReq"
                          v-model="drcForm.drcRequested"
                          type="number"
                          step="0.01"
                          class="col-span-2 h-8 font-bold"
                          @keydown.enter="handleSaveDrc"
                        />
                      </div>
                      <div class="grid grid-cols-3 items-center gap-4">
                        <Label for="drcActual" class="text-xs uppercase font-bold text-teal-600"
                          >DRC Actual</Label
                        >
                        <Input
                          id="drcActual"
                          v-model="drcForm.drcActual"
                          type="number"
                          step="0.01"
                          class="col-span-2 h-8 font-bold"
                          @keydown.enter="handleSaveDrc"
                        />
                      </div>
                    </div>
                    <div class="flex justify-end pt-2 border-t mt-2">
                      <Button
                        size="sm"
                        class="h-8 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                        @click="handleSaveDrc"
                      >
                        <Save class="w-3.5 h-3.5" />
                        {{ t('common.save') }}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <!-- Section 3: Recorded Balances Table -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <h3 class="text-xs font-black uppercase tracking-widest text-slate-400">
                    {{ t('uss.recordedItems') }}
                  </h3>
                  <Badge variant="secondary" class="h-5 px-1.5 text-[0.625rem] font-bold">
                    {{ populatedCount }}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  @click="addNewSampleRow"
                  class="h-7 gap-1 px-3 text-[0.625rem] font-bold bg-blue-600 hover:bg-blue-700"
                >
                  <Plus class="w-3 h-3" />
                  Add Pallet
                </Button>
              </div>

              <div
                class="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm"
              >
                <Table>
                  <TableHeader class="bg-slate-50/50 dark:bg-slate-800/50">
                    <TableRow class="hover:bg-transparent border-slate-100 dark:border-slate-800">
                      <TableHead
                        class="w-[80px] text-[0.625rem] font-black uppercase text-center"
                        >{{ t('uss.palletNumber') }}</TableHead
                      >
                      <TableHead class="text-[0.625rem] font-black uppercase text-center">{{
                        t('uss.palletWeight')
                      }}</TableHead>
                      <TableHead class="text-[0.625rem] font-black uppercase text-center">{{
                        t('uss.totalWeight')
                      }}</TableHead>
                      <TableHead
                        class="text-[0.625rem] font-black uppercase text-center text-blue-600"
                        >{{ t('uss.grossWeight') }}</TableHead
                      >
                      <TableHead class="text-[0.625rem] font-black uppercase text-center">{{
                        t('uss.spgr')
                      }}</TableHead>
                      <TableHead class="w-[100px] text-[0.625rem] font-black uppercase text-center"
                        >Action</TableHead
                      >
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <!-- Existing Samples -->
                    <TableRow
                      v-for="(sample, index) in samples"
                      :key="sample.id"
                      :data-row-id="sample.id"
                      class="group border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/30 transition-colors"
                    >
                      <TableCell class="text-center font-bold text-xs text-slate-400">
                        {{ index + 1 }}
                      </TableCell>

                      <!-- Pallet Weight -->
                      <TableCell class="text-center">
                        <div v-if="editingSampleId === sample.id" class="flex justify-center">
                          <Input
                            v-model="sample.palletWeight"
                            class="h-8 w-24 text-center font-bold text-xs"
                            @input="handleNumericInput(sample, 'palletWeight', $event.target.value)"
                            @keydown.enter="focusNextInput"
                          />
                        </div>
                        <span v-else class="font-bold text-slate-600">{{
                          sample.palletWeight
                        }}</span>
                      </TableCell>

                      <!-- Total Weight -->
                      <TableCell class="text-center">
                        <div v-if="editingSampleId === sample.id" class="flex justify-center">
                          <Input
                            v-model="sample.totalWeight"
                            class="h-8 w-24 text-center font-bold text-xs"
                            @input="handleNumericInput(sample, 'totalWeight', $event.target.value)"
                            @keydown.enter="focusNextInput"
                          />
                        </div>
                        <span v-else class="font-bold text-slate-900">{{
                          sample.totalWeight
                        }}</span>
                      </TableCell>

                      <!-- Gross Weight (Calculated) -->
                      <TableCell class="text-center">
                        <span class="font-bold text-blue-600">{{ sample.grossWeight }}</span>
                      </TableCell>

                      <!-- SPGR -->
                      <TableCell class="text-center">
                        <div
                          v-if="editingSampleId === sample.id"
                          class="flex justify-center group/calc relative"
                        >
                          <Input
                            v-model="sample.spgr"
                            class="h-8 w-24 text-center font-bold text-xs text-green-600 bg-green-50"
                            @input="handleNumericInput(sample, 'spgr', $event.target.value)"
                            @keydown.enter="focusNextInput"
                          />
                        </div>
                        <span v-else class="font-bold text-green-600">{{ sample.spgr }}</span>
                      </TableCell>

                      <TableCell class="text-center">
                        <div
                          class="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            class="h-7 w-7"
                            @click="toggleEdit(sample.id)"
                          >
                            <component
                              :is="editingSampleId === sample.id ? Check : Pencil"
                              class="w-3.5 h-3.5"
                              :class="
                                editingSampleId === sample.id ? 'text-green-600' : 'text-slate-400'
                              "
                            />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            class="h-7 w-7 text-red-500 hover:text-red-600"
                            @click="handleDeleteSample(sample.id)"
                          >
                            <Trash2 class="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    <!-- New Samples Rows -->
                    <TableRow
                      v-for="(sample, index) in newSamples"
                      :key="sample.id"
                      :data-row-id="sample.id"
                      class="bg-blue-50/20 dark:bg-blue-900/5"
                    >
                      <TableCell class="text-center font-bold text-xs text-blue-400">New</TableCell>

                      <!-- Pallet Weight -->
                      <TableCell class="text-center">
                        <Input
                          v-model="sample.palletWeight"
                          class="h-8 w-24 text-center font-bold text-xs mx-auto"
                          @input="handleNumericInput(sample, 'palletWeight', $event.target.value)"
                          @keydown.enter="focusNextInput"
                        />
                      </TableCell>

                      <!-- Total Weight -->
                      <TableCell class="text-center">
                        <Input
                          v-model="sample.totalWeight"
                          class="h-8 w-24 text-center font-bold text-xs mx-auto"
                          @input="handleNumericInput(sample, 'totalWeight', $event.target.value)"
                          @keydown.enter="focusNextInput"
                        />
                      </TableCell>

                      <!-- Gross Weight -->
                      <TableCell class="text-center">
                        <span class="font-bold text-blue-600">{{ sample.grossWeight }}</span>
                      </TableCell>

                      <!-- SPGR -->
                      <TableCell class="text-center">
                        <Input
                          v-model="sample.spgr"
                          class="h-8 w-24 text-center font-bold text-xs mx-auto"
                          @input="handleNumericInput(sample, 'spgr', $event.target.value)"
                          @keydown.enter="focusNextInput"
                        />
                      </TableCell>

                      <TableCell class="text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          class="h-7 w-7 text-red-400 hover:text-red-500"
                          @click="removeNewSampleRow(index)"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>

                    <!-- Totals Row -->
                    <TableRow class="bg-slate-100/50 dark:bg-slate-800/50 font-black border-t-2">
                      <TableCell class="text-center text-[0.625rem] uppercase">Totals</TableCell>
                      <TableCell class="text-center">{{
                        samples
                          .reduce((sum, s) => sum + parseFloat(s.palletWeight || 0), 0)
                          .toLocaleString(undefined, { minimumFractionDigits: 1 })
                      }}</TableCell>
                      <TableCell class="text-center">{{
                        samples
                          .reduce((sum, s) => sum + parseFloat(s.totalWeight || 0), 0)
                          .toLocaleString(undefined, { minimumFractionDigits: 1 })
                      }}</TableCell>
                      <TableCell class="text-center text-blue-600">{{
                        samples
                          .reduce((sum, s) => sum + parseFloat(s.grossWeight || 0), 0)
                          .toLocaleString(undefined, { minimumFractionDigits: 1 })
                      }}</TableCell>
                      <TableCell class="text-center"></TableCell>
                      <TableCell class="text-center"></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
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

        <AlertDialog :open="showDeleteConfirm" @update:open="showDeleteConfirm = $event">
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle class="flex items-center gap-2">
                <Trash2 class="h-5 w-5 text-destructive" />
                {{ t('uss.confirmDelete') }}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {{
                  t('uss.confirmDeleteMsg') ||
                  'This action cannot be undone. This sample row will be permanently deleted.'
                }}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel @click="showDeleteConfirm = false">{{
                t('common.cancel')
              }}</AlertDialogCancel>
              <AlertDialogAction
                class="bg-destructive hover:bg-destructive/90"
                :disabled="isDeleting"
                @click="confirmDeleteSample"
              >
                {{ isDeleting ? t('common.deleting') : t('common.confirm') }}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  </div>
</template>
