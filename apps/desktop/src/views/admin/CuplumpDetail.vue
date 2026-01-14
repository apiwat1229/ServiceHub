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

// Route Params
const bookingId = computed(() => route.params.id as string);
const isTrailer = computed(() => route.query.isTrailer === 'true');

// State
const booking = ref<any>(null);
const samples = ref<any[]>([]);
const rubberTypes = ref<any[]>([]);

const originalLotNo = ref(''); // Track original lot no to prevent unnecessary updates
const lotNoError = ref(''); // Validation error message
const isLoading = ref(false);
const isSaving = ref(false);

const isDrcOpen = ref(false);
const isMoistureOpen = ref(false);
const isWeightsOpen = ref(false);
const showSaveConfirm = ref(false);
const showDeleteConfirm = ref(false);
const sampleToDeleteId = ref<string | null>(null);
const isDeleting = ref(false);
const editingSampleId = ref<string | null>(null);

const weightForm = ref({
  weightIn: '',
  weightOut: '',
});

watch(isWeightsOpen, (newVal) => {
  if (newVal && booking.value) {
    weightForm.value = {
      weightIn:
        (isTrailer.value ? booking.value.trailerWeightIn : booking.value.weightIn)?.toString() ||
        '',
      weightOut:
        (isTrailer.value ? booking.value.trailerWeightOut : booking.value.weightOut)?.toString() ||
        '',
    };
  }
});

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

const drcEstRef = ref<any>(null);
const drcReqRef = ref<any>(null);
const drcActualRef = ref<any>(null);

const onDrcKeydown = (e: KeyboardEvent, nextField: 'req' | 'actual' | 'save') => {
  if (e.key === 'Enter') {
    console.log('DRC Keydown Enter (CuplumpDetail.vue) triggered for:', nextField);
    e.preventDefault();
    e.stopPropagation();

    if (nextField === 'save') {
      handleSaveDrc('enter_key');
      return;
    }

    const targetRef = nextField === 'req' ? drcReqRef : drcActualRef;
    if (targetRef.value) {
      const el =
        targetRef.value.$el?.querySelector('input') || targetRef.value.$el || targetRef.value;
      if (el) {
        console.log('Shifting focus to:', nextField);
        el.focus();
        if (el.select) el.select();
      } else {
        console.warn('Input element not found for focus shift');
      }
    }
  }
};

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
    beforePress: '',
    basket: 1.4,
    afterPress: '',
    percentCp: '',
    beforeBaking1: '',
    beforeBaking2: '',
    beforeBaking3: '',
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
      // If the current field is beforeBaking3 AND the next element is not in a table row (e.g. Save button)
      // we should add a row instead of jumping to the Save button.
      const dataField = target.getAttribute('data-field');
      const nextInput = inputs[nextIndex];

      if (dataField === 'beforeBaking3' && (!nextInput || !nextInput.closest('tr'))) {
        event.preventDefault();
        addNewSampleRow();
        return;
      }

      event.preventDefault();
      inputs[nextIndex].focus();
    } else {
      // If we are at the very last field of the entire form
      const isLastField = currentIndex === inputs.length - 1;
      const dataField = target.getAttribute('data-field');

      if (dataField === 'beforeBaking3') {
        event.preventDefault();
        addNewSampleRow();
        return;
      }

      if (isLastField) {
        event.preventDefault();
        handleSaveAllSamples();
      }
    }
  }
};

// Number validation and cleaning
const handleNumericInput = (sample: any, field: string, value: string) => {
  // Allow only numbers and one decimal point
  let cleaned = value.replace(/[^0-9.]/g, '');

  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  // AUTO-DECIMAL LOGIC
  // If dot is NOT present, check length for auto-insertion
  if (parts.length === 1 && cleaned.length > 0) {
    if (['beforePress', 'afterPress'].includes(field)) {
      // 2 digits -> Auto add dot
      if (cleaned.length === 2 && !value.endsWith('.')) {
        // Checking raw value to allow backspace deletion of dot
        cleaned += '.';
      }
    } else if (field.startsWith('beforeBaking')) {
      // 1 digit -> Auto add dot
      if (cleaned.length === 1 && !value.endsWith('.')) {
        cleaned += '.';
      }
    }
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

  // Get moisture value from header, default to 32% if not set (based on RECEIVE CL formula)
  const moisture = isTrailer.value
    ? booking.value?.trailerMoisture !== undefined && booking.value?.trailerMoisture !== null
      ? parseFloat(booking.value.trailerMoisture)
      : 32
    : booking.value?.moisture !== undefined && booking.value?.moisture !== null
      ? parseFloat(booking.value.moisture)
      : 32;

  if (beforePress && basket && afterPress) {
    const cuplump = beforePress - basket;
    if (cuplump > 0) {
      // Formula: %CP = (After Press / Cuplump) × (100 - Moisture)
      // Example: (9.87 / 11.10) × (100 - 32) = 60.46%
      const percentCp = (afterPress / cuplump) * (100 - moisture);
      sample.percentCp = percentCp.toFixed(2);
    }
  }
};

const populatedCount = computed(() => {
  const allSamples = [...samples.value, ...newSamples.value];
  return allSamples.filter(
    (s) => s.beforePress || s.afterPress || s.beforeBaking1 || s.beforeBaking2 || s.beforeBaking3
  ).length;
});

const removeNewSampleRow = (index: number) => {
  newSamples.value.splice(index, 1);
};

// Computed Fields for Form
const displayRubberType = computed(() => {
  if (!booking.value) return '-';
  const code = isTrailer.value ? booking.value.trailerRubberType : booking.value.rubberType;
  const type = rubberTypes.value.find((t) => t.code === code);
  return type ? type.name : code;
});

// Weight display logic
const displayGrossWeight = computed(() => {
  if (!booking.value) return '-';
  const inW = isTrailer.value ? booking.value.trailerWeightIn || 0 : booking.value.weightIn || 0;
  const outW = isTrailer.value ? booking.value.trailerWeightOut || 0 : booking.value.weightOut || 0;
  const net = Math.max(0, inW - outW);
  return net.toLocaleString();
});

// Net Weight calculation (Dry Weight = Gross * DRC%)
const displayNetWeight = computed(() => {
  if (!booking.value) return '0';
  const inW = isTrailer.value ? booking.value.trailerWeightIn || 0 : booking.value.weightIn || 0;
  const outW = isTrailer.value ? booking.value.trailerWeightOut || 0 : booking.value.weightOut || 0;
  const gross = Math.max(0, inW - outW);
  const drc = parseFloat(booking.value.drcActual) || 0;

  if (gross === 0 || drc === 0) return '0';

  const dryWeight = Math.round(gross * (drc / 100));
  return dryWeight.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
});

// Fetch Data
const fetchData = async () => {
  console.log('Fetching data for Booking ID:', bookingId.value);
  if (!bookingId.value) return;
  isLoading.value = true;
  try {
    const [bookingData, samplesData, typesData] = await Promise.all([
      bookingsApi.getById(bookingId.value),
      bookingsApi.getSamples(bookingId.value),
      rubberTypesApi.getAll(),
    ]);

    booking.value = {
      ...bookingData,
      lotNo: isTrailer.value ? bookingData.trailerLotNo || '' : bookingData.lotNo || '',
      moisture: isTrailer.value ? bookingData.trailerMoisture || 0 : bookingData.moisture || 0,
      drcEst: isTrailer.value ? bookingData.trailerDrcEst || 0 : bookingData.drcEst || 0,
      drcRequested: isTrailer.value
        ? bookingData.trailerDrcRequested || 0
        : bookingData.drcRequested || 0,
      drcActual: isTrailer.value ? bookingData.trailerDrcActual || 0 : bookingData.drcActual || 0,
    };
    originalLotNo.value = booking.value.lotNo;
    samples.value = samplesData
      .filter((s: any) => s.isTrailer === isTrailer.value)
      .map((s: any) => {
        const mapped = {
          ...s,
          beforePress: s.beforePress?.toString() || '',
          basket: s.basketWeight?.toString() || '1.4',
          afterPress: s.afterPress?.toString() || '',
          percentCp: s.percentCp?.toString() || '',
          beforeBaking1: s.beforeBaking1?.toString() || '',
          beforeBaking2: s.beforeBaking2?.toString() || '',
          beforeBaking3: s.beforeBaking3?.toString() || '',
        };
        calculatePercentCp(mapped);
        return mapped;
      });

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
  // We save both updated existing samples AND newly added samples
  const allSamples = [...samples.value, ...newSamples.value];
  const populatedSamples = allSamples.filter(
    (s) => s.beforePress || s.afterPress || s.beforeBaking1 || s.beforeBaking2 || s.beforeBaking3
  );

  // Validation
  const allValid = populatedSamples.every((s) => s.beforePress && s.afterPress);

  if (populatedSamples.length > 0 && !allValid) {
    toast.error(
      t('cuplump.enterRequiredFields') ||
        'Please enter both Before Press and After Press for all items'
    );
    return;
  }

  if (populatedSamples.length === 0) {
    // Just save header info
    await saveHeaderInfoOnly();
    return;
  }

  showSaveConfirm.value = true;
};

const confirmSaveSamples = async () => {
  showSaveConfirm.value = false;

  const allSamples = [...samples.value, ...newSamples.value];
  const populatedSamples = allSamples.filter(
    (s) => s.beforePress || s.afterPress || s.beforeBaking1 || s.beforeBaking2 || s.beforeBaking3
  );

  isSaving.value = true;
  try {
    // Execute sequentially to prevent race conditions on sampleNo generation
    for (const sample of populatedSamples) {
      // Logic for Percent CP if not already set (safety)
      if (!sample.percentCp) calculatePercentCp(sample);

      await bookingsApi.saveSample(bookingId.value, {
        ...sample,
        beforePress: parseFloat(sample.beforePress),
        afterPress: parseFloat(sample.afterPress),
        percentCp: parseFloat(sample.percentCp),
        basketWeight: parseFloat(sample.basket),
        beforeBaking1: sample.beforeBaking1 ? parseFloat(sample.beforeBaking1) : null,
        beforeBaking2: sample.beforeBaking2 ? parseFloat(sample.beforeBaking2) : null,
        beforeBaking3: sample.beforeBaking3 ? parseFloat(sample.beforeBaking3) : null,
        isTrailer: isTrailer.value,
        cuplumpWeight: parseFloat(sample.beforePress) - parseFloat(sample.basket),
      });
    }

    // ALSO save the main booking info in case anything was changed in the popovers
    const updateData: any = {};
    if (isTrailer.value) {
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

    await bookingsApi.update(bookingId.value, updateData);

    toast.success(t('cuplump.sampleSaved'));

    // Reset and Reload
    newSamples.value = [];
    fetchData();
  } catch (error: any) {
    console.error('Failed to save samples:', error);
    toast.error(error.response?.data?.message || t('cuplump.failedToSave'));
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
    await bookingsApi.deleteSample(bookingId.value, sampleToDeleteId.value);
    toast.success(t('cuplump.sampleDeleted'));
    await fetchData();
  } catch (e) {
    toast.error(t('cuplump.failedToDelete'));
  } finally {
    isDeleting.value = false;
    showDeleteConfirm.value = false;
    sampleToDeleteId.value = null;
  }
};

// Prefix Logic for Lot No
const lotNoPrefix = computed(() => {
  // Prefer booking date if available, else current date
  const dateStr =
    booking.value?.date || booking.value?.entryDate || booking.value?.createdAt || new Date();
  const now = new Date(dateStr);

  // Safety check for invalid date
  if (isNaN(now.getTime())) return '';

  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  return `1${yy}${mm}${dd}-`;
});

// Computed Suffix for Input Binding
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

  // Clean suffix (keep digits, / and -)
  const cleanedSuffix = rawSuffix.replace(/[^0-9/-]/g, '');

  if (rawSuffix !== cleanedSuffix) {
    lotNoError.value = t('cuplump.invalidChar') || 'Only numbers, / and - allowed';
    lotNoSuffix.value = cleanedSuffix; // Update via setter
    input.value = cleanedSuffix;
  } else {
    lotNoError.value = '';
    lotNoSuffix.value = cleanedSuffix; // Update via setter
  }
};

const saveHeaderInfoOnly = async () => {
  isSaving.value = true;
  try {
    const updateData: any = {};
    if (isTrailer.value) {
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

    await bookingsApi.update(bookingId.value, updateData);
    toast.success(t('common.saved'));
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
    if (isTrailer.value) {
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

    await bookingsApi.update(bookingId.value, updateData);
    originalLotNo.value = booking.value.lotNo; // Update original value on success
    toast.success(t('common.saved'));
  } catch (error) {
    console.error('Failed to update Main Info:', error);
    toast.error(t('common.errorSaving'));
    // Revert on error
    booking.value.lotNo = originalLotNo.value;
  }
};

const handleUpdateLotNo = async () => {
  if (!booking.value) return;

  // Validation: Allow digits, / and -
  const currentSuffix = lotNoSuffix.value;
  if (currentSuffix && !/^[0-9/\-]+$/.test(currentSuffix)) {
    lotNoError.value = t('cuplump.invalidChar') || 'Only numbers, / and - allowed';
    return;
  }

  // Skip update if empty or unchanged
  if (!booking.value.lotNo || booking.value.lotNo === originalLotNo.value) {
    // Revert if invalid/empty if needed, but for now just don't save.
    if (!booking.value.lotNo) booking.value.lotNo = originalLotNo.value;
    lotNoError.value = '';
    return;
  }

  // Check for uniqueness
  // Note: Uniqueness check across ALL bookings is harder without full list passed as prop.
  // We'll trust backend to error or just skip this client check for now to simplify.
  // OR we could fetch recent bookings... For now, let's proceed with save.

  lotNoError.value = '';
  await saveBookingInfo();
};

const handleSaveDrc = async (source = 'button_click') => {
  console.log('handleSaveDrc (CuplumpDetail.vue) called from source:', source);
  if (!booking.value) return;

  try {
    const drcData = {
      drcEst: parseFloat(drcForm.value.drcEst) || 0,
      drcRequested: parseFloat(drcForm.value.drcRequested) || 0,
      drcActual: parseFloat(drcForm.value.drcActual) || 0,
    };

    const updateData: any = {};
    if (isTrailer.value) {
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

    await bookingsApi.update(bookingId.value, updateData);

    // Update local model
    if (isTrailer.value) {
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
    const updateData: any = {};
    if (isTrailer.value) {
      updateData.trailerLotNo = booking.value.lotNo;
      updateData.trailerMoisture = moistureVal;
    } else {
      updateData.lotNo = booking.value.lotNo;
      updateData.moisture = moistureVal;
    }

    await bookingsApi.update(bookingId.value, updateData);

    // Update local model
    if (isTrailer.value) {
      booking.value.trailerMoisture = moistureVal;
    } else {
      booking.value.moisture = moistureVal;
    }

    // Recalculate %CP for all samples
    samples.value.forEach((s) => calculatePercentCp(s));
    newSamples.value.forEach((s) => calculatePercentCp(s));

    toast.success(t('common.saved'));
  } catch (error) {
    console.error('Failed to update Moisture:', error);
    toast.error(t('common.errorSaving'));
  }
  isMoistureOpen.value = false;
};

const handleSaveWeights = async () => {
  if (!booking.value) return;

  try {
    const wIn = parseFloat(weightForm.value.weightIn) || 0;
    const wOut = parseFloat(weightForm.value.weightOut) || 0;
    const updateData: any = {};

    if (isTrailer.value) {
      updateData.trailerLotNo = booking.value.lotNo;
      updateData.trailerWeightIn = wIn;
      updateData.trailerWeightOut = wOut;
    } else {
      updateData.lotNo = booking.value.lotNo;
      updateData.weightIn = wIn;
      updateData.weightOut = wOut;
    }

    await bookingsApi.update(bookingId.value, updateData);

    // Update local model
    if (isTrailer.value) {
      booking.value.trailerWeightIn = wIn;
      booking.value.trailerWeightOut = wOut;
    } else {
      booking.value.weightIn = wIn;
      booking.value.weightOut = wOut;
    }

    toast.success(t('common.saved'));
  } catch (error) {
    console.error('Failed to update Weights:', error);
    toast.error(t('common.errorSaving'));
  }
  isWeightsOpen.value = false;
};

// Stats
const averageCp = computed(() => {
  const allSamples = [...(samples.value ?? []), ...(newSamples.value ?? [])];
  const validSamples = allSamples.filter((s) => {
    const cp = parseFloat(s.percentCp);
    return !isNaN(cp) && cp > 0;
  });

  if (!validSamples.length) return '0.00';

  const sum = validSamples.reduce((acc, s) => {
    const cp = parseFloat(s.percentCp);
    return acc + cp;
  }, 0);

  return (sum / validSamples.length).toFixed(2);
});

// Init
onMounted(async () => {
  await fetchData();
  // Auto-initialize first row if nothing exists
  if (samples.value.length === 0 && newSamples.value.length === 0) {
    await addNewSampleRow();
  }
});
</script>

<template>
  <div class="h-full flex flex-col p-6 max-w-[1600px] mx-auto space-y-6">
    <!-- Main Content Card -->
    <Card class="flex-1 overflow-hidden border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
      <CardContent class="p-0 h-full flex flex-col">
        <div v-if="isLoading" class="flex items-center justify-center p-12 h-full">
          <div class="text-center">
            <div
              class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"
            ></div>
            <div class="text-sm font-medium text-muted-foreground">Loading information...</div>
          </div>
        </div>

        <template v-else-if="booking">
          <div class="p-6 border-b">
            <!-- Section 1: Identification Header -->
            <div class="flex items-center justify-between">
              <div class="min-w-0 flex-1">
                <div
                  class="text-[0.625rem] text-slate-500 font-bold uppercase tracking-widest mb-1"
                >
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

              <!-- Section 1.5: Centered Weights -->
              <div class="flex items-center gap-8 px-8">
                <Popover v-model:open="isWeightsOpen">
                  <PopoverTrigger as-child>
                    <div
                      class="flex flex-col items-center cursor-pointer hover:bg-blue-50/50 rounded-lg p-1 transition-colors group"
                    >
                      <span
                        class="text-[0.625rem] font-bold text-blue-600 uppercase tracking-tighter mb-1 relative"
                      >
                        {{ t('cuplump.grossWeight') }}
                        <Pencil
                          class="w-2 h-2 absolute -right-3 top-0 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </span>
                      <div class="flex items-baseline gap-1">
                        <span class="text-2xl font-black text-blue-700 leading-none">{{
                          displayGrossWeight
                        }}</span>
                        <span class="text-[0.625rem] text-muted-foreground font-bold">Kg</span>
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent class="w-80">
                    <div class="grid gap-4">
                      <div class="space-y-2">
                        <h4
                          class="font-medium leading-none text-blue-700 font-bold uppercase tracking-tight"
                        >
                          Weight Management
                        </h4>
                        <p class="text-xs text-muted-foreground">
                          Adjust inbound and outbound weights.
                        </p>
                      </div>
                      <div class="grid gap-3">
                        <div class="grid grid-cols-3 items-center gap-4">
                          <Label class="text-xs uppercase font-bold text-slate-600">{{
                            t('cuplump.weightIn')
                          }}</Label>
                          <Input
                            v-model="weightForm.weightIn"
                            type="number"
                            class="col-span-2 h-8 font-bold"
                          />
                        </div>
                        <div class="grid grid-cols-3 items-center gap-4">
                          <Label class="text-xs uppercase font-bold text-slate-600">{{
                            t('cuplump.weightOut')
                          }}</Label>
                          <Input
                            v-model="weightForm.weightOut"
                            type="number"
                            class="col-span-2 h-8 font-bold"
                            @keydown.enter="handleSaveWeights"
                          />
                        </div>

                        <div class="pt-2 border-t flex justify-end">
                          <Button
                            size="sm"
                            class="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                            @click="handleSaveWeights"
                          >
                            <Save class="w-3.5 h-3.5" />
                            {{ t('common.save') }}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <div class="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>

                <div class="flex flex-col items-center">
                  <span
                    class="text-[0.625rem] font-bold text-green-600 uppercase tracking-tighter mb-1"
                    >{{ t('cuplump.netWeight') }}</span
                  >
                  <div class="flex items-baseline gap-1">
                    <span class="text-2xl font-black text-green-700 leading-none">{{
                      displayNetWeight
                    }}</span>
                    <span
                      v-if="displayNetWeight"
                      class="text-[0.625rem] text-muted-foreground font-bold"
                      >Kg</span
                    >
                  </div>
                </div>
              </div>

              <div class="flex flex-col items-end pr-6">
                <div class="flex flex-col items-center min-w-[8rem]">
                  <div
                    class="text-[0.625rem] text-slate-500 font-bold uppercase tracking-widest mb-1"
                  >
                    {{ t('cuplump.lotNo') }}
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
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Section 2: Key Metrics Dashboard -->
            <div class="grid grid-cols-6 gap-2">
              <!-- Rubber Type -->
              <div
                class="px-3 py-3 rounded-xl bg-slate-50/50 border border-slate-100 dark:bg-slate-900/20 dark:border-slate-800 flex flex-col justify-center min-h-[4.5rem]"
              >
                <div
                  class="text-[0.625rem] font-bold text-slate-500 uppercase tracking-widest mb-1.5 leading-none"
                >
                  {{ t('cuplump.rubberType') }}
                </div>
                <div class="text-xs font-black text-slate-900 dark:text-slate-100 leading-tight">
                  {{ displayRubberType }}
                </div>
              </div>

              <!-- Ave. %CP -->
              <div
                class="p-2 rounded-xl bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 flex flex-col justify-center items-center text-center min-h-[4.5rem]"
              >
                <div
                  class="text-[0.5625rem] font-bold text-indigo-600 uppercase tracking-tighter mb-1.5 leading-none"
                >
                  {{ t('cuplump.avgCp') }}
                </div>
                <div class="text-xl font-black text-indigo-700 leading-none">{{ averageCp }}%</div>
              </div>

              <!-- Moisture -->
              <Popover v-model:open="isMoistureOpen">
                <PopoverTrigger as-child>
                  <div
                    class="cursor-pointer p-2 rounded-xl bg-orange-50/50 border border-orange-100 dark:bg-orange-900/20 dark:border-orange-800 flex flex-col justify-center items-center text-center min-h-[4.5rem] hover:bg-orange-100/50 transition-colors"
                  >
                    <div
                      class="text-[0.5625rem] font-bold text-orange-600 uppercase tracking-tighter mb-1.5 leading-none"
                    >
                      {{ t('cuplump.moisture') }}
                    </div>
                    <div class="text-xl font-black text-orange-700 leading-none">
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
                    <div class="flex justify-end pt-2 border-t">
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

              <!-- DRC Dashboard -->
              <div
                @click="isDrcOpen = true"
                class="cursor-pointer p-2 rounded-xl bg-teal-50/50 border border-teal-100 dark:bg-teal-900/20 dark:border-teal-800 flex flex-col justify-center items-center text-center min-h-[4.5rem] hover:bg-teal-100/50 transition-colors"
              >
                <div
                  class="text-[0.5625rem] font-bold text-teal-600 uppercase tracking-tighter mb-1.5 leading-none"
                >
                  EST.
                </div>
                <div class="text-xl font-black text-teal-700 leading-none">
                  {{ (booking.drcEst || 0).toFixed(1) }}%
                </div>
              </div>

              <div
                @click="isDrcOpen = true"
                class="cursor-pointer p-2 rounded-xl bg-teal-50/50 border border-teal-100 dark:bg-teal-900/20 dark:border-teal-800 flex flex-col justify-center items-center text-center min-h-[4.5rem] hover:bg-teal-100/50 transition-colors"
              >
                <div
                  class="text-[0.5625rem] font-bold text-teal-600 uppercase tracking-tighter mb-1.5 leading-none"
                >
                  DRC % REQ.
                </div>
                <div class="text-xl font-black text-teal-700 leading-none">
                  {{ (booking.drcRequested || 0).toFixed(1) }}%
                </div>
              </div>

              <Popover v-model:open="isDrcOpen">
                <PopoverTrigger as-child>
                  <div
                    class="cursor-pointer p-2 rounded-xl bg-teal-50/50 border border-teal-100 dark:bg-teal-900/20 dark:border-teal-800 flex flex-col justify-center items-center text-center min-h-[4.5rem] hover:bg-teal-100/50 transition-colors"
                  >
                    <div
                      class="text-[0.5625rem] font-bold text-teal-600 uppercase tracking-tighter mb-1.5 leading-none"
                    >
                      ACTUAL
                    </div>
                    <div class="text-xl font-black text-teal-700 leading-none">
                      {{ (booking.drcActual || 0).toFixed(1) }}%
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent class="w-80">
                  <div class="grid gap-4">
                    <div class="space-y-2">
                      <h4 class="font-medium leading-none text-teal-700">DRC % Management</h4>
                      <p class="text-xs text-muted-foreground">
                        Adjust estimation, requested, and actual values.
                      </p>
                    </div>
                    <div class="grid gap-3" @keydown.enter.stop>
                      <div class="grid grid-cols-3 items-center gap-4">
                        <Label for="drcEst" class="text-xs uppercase font-bold text-teal-600">{{
                          t('cuplump.drcEst')
                        }}</Label>
                        <Input
                          ref="drcEstRef"
                          id="drcEst"
                          v-model="drcForm.drcEst"
                          type="number"
                          step="0.01"
                          class="col-span-2 h-8 font-bold"
                          @keydown.enter.prevent.stop="onDrcKeydown($event, 'req')"
                        />
                      </div>
                      <div class="grid grid-cols-3 items-center gap-4">
                        <Label for="drcReq" class="text-xs uppercase font-bold text-teal-600">{{
                          t('cuplump.drcReq')
                        }}</Label>
                        <Input
                          ref="drcReqRef"
                          id="drcReq"
                          v-model="drcForm.drcRequested"
                          type="number"
                          step="0.01"
                          class="col-span-2 h-8 font-bold"
                          @keydown.enter.prevent.stop="onDrcKeydown($event, 'actual')"
                        />
                      </div>
                      <div class="grid grid-cols-3 items-center gap-4">
                        <Label for="drcActual" class="text-xs uppercase font-bold text-teal-600">{{
                          t('cuplump.drcActual')
                        }}</Label>
                        <Input
                          ref="drcActualRef"
                          id="drcActual"
                          v-model="drcForm.drcActual"
                          type="number"
                          step="0.01"
                          class="col-span-2 h-8 font-bold"
                          @keydown.enter.prevent.stop="onDrcKeydown($event, 'save')"
                        />
                      </div>
                    </div>
                    <div class="flex justify-end pt-2 border-t mt-2">
                      <Button
                        type="button"
                        size="sm"
                        class="h-8 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                        @click="handleSaveDrc('button_click')"
                      >
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
                  <span
                    class="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[0.5625rem]"
                    >{{ samples.length }}</span
                  >
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
                        class="w-[30px] h-8 text-[0.5rem] uppercase font-bold text-center text-muted-foreground"
                        >#</TableHead
                      >
                      <TableHead
                        class="h-8 text-[0.5rem] uppercase font-bold text-center text-muted-foreground w-24"
                        >{{ t('cuplump.beforePress') }}</TableHead
                      >
                      <TableHead
                        class="h-8 text-[0.5rem] uppercase font-bold text-center text-muted-foreground w-16"
                        >{{ t('cuplump.basket') }}</TableHead
                      >
                      <TableHead
                        class="h-8 text-[0.5rem] uppercase font-bold text-primary text-center bg-blue-50/30 dark:bg-blue-900/10 w-16"
                        >{{ t('cuplump.cuplump') }}</TableHead
                      >
                      <TableHead
                        class="h-8 text-[0.5rem] uppercase font-bold text-center text-muted-foreground w-24"
                        >{{ t('cuplump.afterPress') }}</TableHead
                      >
                      <TableHead
                        class="h-8 text-[0.5rem] uppercase font-bold text-indigo-600 dark:text-indigo-400 text-center bg-indigo-50/30 dark:bg-indigo-900/10 w-20"
                        >{{ t('cuplump.percentCp') }}</TableHead
                      >
                      <TableHead
                        class="h-8 text-[0.5rem] uppercase font-bold text-center text-muted-foreground w-20"
                        >{{ t('cuplump.beforeBaking1') }}</TableHead
                      >
                      <TableHead
                        class="h-8 text-[0.5rem] uppercase font-bold text-center text-muted-foreground w-20"
                        >{{ t('cuplump.beforeBaking2') }}</TableHead
                      >
                      <TableHead
                        class="h-8 text-[0.5rem] uppercase font-bold text-center text-muted-foreground w-20"
                        >{{ t('cuplump.beforeBaking3') }}</TableHead
                      >
                      <TableHead
                        class="w-[50px] h-8 text-[0.5rem] uppercase font-bold text-center text-muted-foreground"
                        >{{ t('cuplump.action') }}</TableHead
                      >
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <!-- Saved Samples -->
                    <TableRow
                      v-for="sample in samples"
                      :key="sample.id"
                      :data-row-id="sample.id"
                      class="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <TableCell
                        class="text-center font-medium text-xs text-muted-foreground py-1.5"
                        >{{ sample.sampleNo }}</TableCell
                      >
                      <TableCell class="py-1.5 px-1">
                        <Input
                          v-model="sample.beforePress"
                          type="text"
                          :readonly="editingSampleId !== sample.id"
                          class="h-7 w-24 mx-auto p-1 text-center font-bold text-xs rounded-sm focus-visible:ring-1 shadow-sm transition-all relative z-10"
                          :class="[
                            editingSampleId === sample.id
                              ? 'bg-white border-primary ring-1 ring-primary/20 cursor-text'
                              : 'bg-slate-50/50 border-transparent cursor-default',
                          ]"
                          @keydown.enter="focusNextInput"
                          @input="handleNumericInput(sample, 'beforePress', sample.beforePress)"
                        />
                      </TableCell>
                      <TableCell class="py-1.5 px-1">
                        <Input
                          v-model="sample.basket"
                          type="text"
                          :readonly="editingSampleId !== sample.id"
                          class="h-7 w-16 mx-auto p-1 text-center font-semibold text-xs rounded-sm focus-visible:ring-1 shadow-sm transition-all relative z-10"
                          :class="[
                            editingSampleId === sample.id
                              ? 'bg-white border-primary ring-1 ring-primary/20 cursor-text'
                              : 'bg-slate-50/50 border-transparent cursor-default',
                          ]"
                          data-skip-enter="true"
                          @keydown.enter="focusNextInput"
                          @input="handleNumericInput(sample, 'basket', sample.basket)"
                        />
                      </TableCell>
                      <TableCell
                        class="text-center font-black text-primary text-xs py-1.5 bg-blue-50/30 shadow-none border-x border-blue-100/50"
                      >
                        {{
                          calculateCuplump(
                            parseFloat(sample.beforePress || '0'),
                            parseFloat(sample.basket || '0')
                          )
                        }}
                      </TableCell>
                      <TableCell class="py-1.5 px-1">
                        <Input
                          v-model="sample.afterPress"
                          type="text"
                          :readonly="editingSampleId !== sample.id"
                          class="h-7 w-24 mx-auto p-1 text-center font-bold text-xs rounded-sm focus-visible:ring-1 shadow-sm transition-all relative z-10"
                          :class="[
                            editingSampleId === sample.id
                              ? 'bg-white border-primary ring-1 ring-primary/20 cursor-text'
                              : 'bg-slate-50/50 border-transparent cursor-default',
                          ]"
                          @keydown.enter="focusNextInput"
                          @input="handleNumericInput(sample, 'afterPress', sample.afterPress)"
                        />
                      </TableCell>
                      <TableCell
                        class="text-center font-black text-indigo-600 text-xs py-1.5 bg-indigo-50/30"
                      >
                        <Input
                          v-model="sample.percentCp"
                          type="text"
                          class="h-7 w-20 mx-auto p-1 text-center font-bold text-xs bg-transparent border-none focus-visible:ring-0 shadow-none pointer-events-none"
                          readonly
                        />
                      </TableCell>
                      <TableCell class="py-1.5 px-1">
                        <Input
                          v-model="sample.beforeBaking1"
                          type="text"
                          :readonly="editingSampleId !== sample.id"
                          class="h-7 w-20 mx-auto p-1 text-center text-xs rounded-sm focus-visible:ring-1 shadow-sm transition-all relative z-10"
                          :class="[
                            editingSampleId === sample.id
                              ? 'bg-white border-primary/30 ring-1 ring-primary/10 cursor-text'
                              : 'bg-slate-50/30 border-transparent cursor-default',
                          ]"
                          @keydown.enter="focusNextInput"
                          @input="handleNumericInput(sample, 'beforeBaking1', sample.beforeBaking1)"
                        />
                      </TableCell>
                      <TableCell class="py-1.5 px-1">
                        <Input
                          v-model="sample.beforeBaking2"
                          type="text"
                          :readonly="editingSampleId !== sample.id"
                          class="h-7 w-20 mx-auto p-1 text-center text-xs rounded-sm focus-visible:ring-1 shadow-sm transition-all relative z-10"
                          :class="[
                            editingSampleId === sample.id
                              ? 'bg-white border-primary/30 ring-1 ring-primary/10 cursor-text'
                              : 'bg-slate-50/30 border-transparent cursor-default',
                          ]"
                          @keydown.enter="focusNextInput"
                          @input="handleNumericInput(sample, 'beforeBaking2', sample.beforeBaking2)"
                        />
                      </TableCell>
                      <TableCell class="py-1.5 px-1">
                        <Input
                          v-model="sample.beforeBaking3"
                          type="text"
                          :readonly="editingSampleId !== sample.id"
                          class="h-7 w-20 mx-auto p-1 text-center text-xs rounded-sm focus-visible:ring-1 shadow-sm transition-all relative z-10"
                          :class="[
                            editingSampleId === sample.id
                              ? 'bg-white border-primary/30 ring-1 ring-primary/10 cursor-text'
                              : 'bg-slate-50/30 border-transparent cursor-default',
                          ]"
                          @keydown.enter="focusNextInput"
                          data-field="beforeBaking3"
                          @input="handleNumericInput(sample, 'beforeBaking3', sample.beforeBaking3)"
                        />
                      </TableCell>
                      <TableCell class="text-center py-1.5">
                        <div class="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            class="h-6 w-6 rounded-full transition-all"
                            :class="[
                              editingSampleId === sample.id
                                ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                : 'text-slate-400 hover:text-primary hover:bg-primary/10',
                            ]"
                            @click="toggleEdit(sample.id)"
                          >
                            <component
                              :is="editingSampleId === sample.id ? Check : Pencil"
                              class="w-3 h-3"
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            class="h-6 w-6 text-destructive hover:bg-destructive/10 rounded-full"
                            @click="handleDeleteSample(sample.id)"
                          >
                            <Trash2 class="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    <!-- New Samples -->
                    <TableRow
                      v-for="(sample, index) in newSamples"
                      :key="sample.id"
                      :data-row-id="sample.id"
                    >
                      <TableCell
                        class="text-center font-medium text-xs text-muted-foreground py-1.5"
                        >New</TableCell
                      >
                      <TableCell class="py-1.5 px-1"
                        ><Input
                          v-model="sample.beforePress"
                          type="text"
                          placeholder="เช่น 12.23"
                          class="h-7 w-24 mx-auto p-1 text-center font-bold text-xs bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-sm focus-visible:ring-1 focus-visible:ring-primary shadow-sm hover:bg-slate-50 transition-all relative z-10 cursor-text"
                          @keydown.enter="focusNextInput"
                          @input="handleNumericInput(sample, 'beforePress', sample.beforePress)"
                      /></TableCell>
                      <TableCell class="py-1.5 px-1"
                        ><Input
                          v-model="sample.basket"
                          type="text"
                          placeholder="1.4"
                          class="h-7 w-16 mx-auto p-1 text-center font-semibold text-xs bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-sm focus-visible:ring-1 focus-visible:ring-primary shadow-sm hover:bg-slate-50 transition-all relative z-10 cursor-text"
                          data-skip-enter="true"
                          @keydown.enter="focusNextInput"
                          @input="handleNumericInput(sample, 'basket', sample.basket)"
                      /></TableCell>
                      <TableCell
                        class="text-center bg-blue-50/20 dark:bg-blue-900/10 p-1.5 font-black text-primary text-xs tracking-tight border-x border-blue-100/30"
                      >
                        {{
                          calculateCuplump(
                            parseFloat(sample.beforePress || '0'),
                            parseFloat(sample.basket || '0')
                          )
                        }}
                      </TableCell>
                      <TableCell class="py-1.5 px-1"
                        ><Input
                          v-model="sample.afterPress"
                          type="text"
                          placeholder="เช่น 10.72"
                          class="h-7 w-24 mx-auto p-1 text-center font-bold text-xs bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-sm focus-visible:ring-1 focus-visible:ring-primary shadow-sm hover:bg-slate-50 transition-all relative z-10 cursor-text"
                          @keydown.enter="focusNextInput"
                          @input="handleNumericInput(sample, 'afterPress', sample.afterPress)"
                      /></TableCell>
                      <TableCell class="py-1.5 px-0.5"
                        ><Input
                          v-model="sample.percentCp"
                          type="text"
                          class="h-7 w-20 mx-auto p-1 text-center font-bold text-xs bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 pointer-events-none"
                          placeholder="Auto"
                          @keydown.enter="focusNextInput"
                          readonly
                      /></TableCell>
                      <TableCell class="py-1.5 px-1"
                        ><Input
                          v-model="sample.beforeBaking1"
                          type="text"
                          placeholder="0.210"
                          class="h-7 w-20 mx-auto p-1 text-center text-xs bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 rounded-sm focus-visible:ring-1 shadow-sm hover:bg-slate-50 transition-all relative z-10 cursor-text"
                          @keydown.enter="focusNextInput"
                          @input="
                            handleNumericInput(sample, 'beforeBaking1', sample.beforeBaking1)
                          "
                      /></TableCell>
                      <TableCell class="py-1.5 px-1"
                        ><Input
                          v-model="sample.beforeBaking2"
                          type="text"
                          placeholder="0.220"
                          class="h-7 w-20 mx-auto p-1 text-center text-xs bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 rounded-sm focus-visible:ring-1 shadow-sm hover:bg-slate-50 transition-all relative z-10 cursor-text"
                          @keydown.enter="focusNextInput"
                          @input="
                            handleNumericInput(sample, 'beforeBaking2', sample.beforeBaking2)
                          "
                      /></TableCell>
                      <TableCell class="py-1.5 px-1"
                        ><Input
                          v-model="sample.beforeBaking3"
                          type="text"
                          placeholder="0.230"
                          class="h-7 w-20 mx-auto p-1 text-center text-xs bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 rounded-sm focus-visible:ring-1 shadow-sm hover:bg-slate-50 transition-all relative z-10 cursor-text"
                          @keydown.enter="focusNextInput"
                          data-field="beforeBaking3"
                          @input="
                            handleNumericInput(sample, 'beforeBaking3', sample.beforeBaking3)
                          "
                      /></TableCell>
                      <TableCell class="text-center py-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-6 w-6 text-destructive hover:bg-destructive/10 rounded-full"
                          @click="removeNewSampleRow(index)"
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

              <div class="flex justify-end pt-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  class="h-8 text-xs gap-1.5 px-4"
                  @click="router.back()"
                >
                  <ArrowLeft class="w-3.5 h-3.5" />
                  {{ t('common.back') }}
                </Button>
                <Button
                  v-if="populatedCount > 0"
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
      </CardContent>
    </Card>

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

    <AlertDialog :open="showDeleteConfirm" @update:open="showDeleteConfirm = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2">
            <Trash2 class="h-5 w-5 text-destructive" />
            {{ t('cuplump.confirmDelete') }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{
              t('cuplump.confirmDeleteMsg') ||
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
  </div>
</template>
