<script setup lang="ts">
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
import { Plus, Save, Trash2 } from 'lucide-vue-next';
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

const drcForm = ref({
  drcEst: '',
  drcRequested: '',
  drcActual: '',
});

const moistureForm = ref('');

watch(isMoistureOpen, (newVal) => {
  if (newVal && booking.value) {
    moistureForm.value = booking.value.moisture;
  }
});

watch(isDrcOpen, (newVal) => {
  if (newVal && booking.value) {
    drcForm.value = {
      drcEst: booking.value.drcEst,
      drcRequested: booking.value.drcRequested,
      drcActual: booking.value.drcActual,
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

const displayWeightIn = computed(() => {
  if (!booking.value) return 0;
  const w = props.isTrailer ? booking.value.trailerWeightIn : booking.value.weightIn;
  return (w || 0).toLocaleString();
});

// Net Weight
const displayNetWeight = computed(() => {
  if (!booking.value) return 0;
  const inW = props.isTrailer ? booking.value.trailerWeightIn : booking.value.weightIn;
  const outW = props.isTrailer ? booking.value.trailerWeightOut : booking.value.weightOut;
  const net = (inW || 0) - (outW || 0);
  return (net > 0 ? net : 0).toLocaleString();
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

    booking.value = bookingData;
    originalLotNo.value = bookingData.lotNo || ''; // Initialize original value
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
  if (newSamples.value.length === 0) return;

  // Validation
  const valid = newSamples.value.every((s) => s.beforePress);
  if (!valid) {
    toast.error(t('cuplump.enterBeforePress'));
    return;
  }

  if (!confirm(t('cuplump.confirmSaveAll', { count: newSamples.value.length }) + '?')) return;

  isSaving.value = true;
  try {
    const promises = newSamples.value.map((sample) => {
      return bookingsApi.saveSample(props.bookingId, {
        ...sample,
        basketWeight: parseFloat(sample.basket), // Map frontend 'basket' to backend 'basketWeight'
        isTrailer: props.isTrailer,
        cuplumpWeight: parseFloat(sample.beforePress) - parseFloat(sample.basket),
      });
    });

    await Promise.all(promises);
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

const saveBookingInfo = async () => {
  try {
    await bookingsApi.update(props.bookingId, {
      lotNo: booking.value.lotNo,
      moisture: booking.value.moisture,
      drcEst: booking.value.drcEst,
      drcRequested: booking.value.drcRequested,
      drcActual: booking.value.drcActual,
    });
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
    await bookingsApi.update(props.bookingId, {
      lotNo: booking.value.lotNo,
      moisture: booking.value.moisture,
      drcEst: parseFloat(drcForm.value.drcEst) || 0,
      drcRequested: parseFloat(drcForm.value.drcRequested) || 0,
      drcActual: parseFloat(drcForm.value.drcActual) || 0,
    });
    // Update local model on success
    Object.assign(booking.value, drcForm.value);
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
    await bookingsApi.update(props.bookingId, {
      lotNo: booking.value.lotNo,
      moisture: parseFloat(moistureForm.value) || 0,
      drcEst: booking.value.drcEst,
      drcRequested: booking.value.drcRequested,
      drcActual: booking.value.drcActual,
    });
    // Update local model on success
    booking.value.moisture = parseFloat(moistureForm.value) || 0;
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

onMounted(() => {
  fetchData();
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
            {{ t('cuplump.supplier') }}
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
              {{ t('cuplump.lotNo') }}
            </div>
            <Popover v-model:open="isLotNoOpen">
              <PopoverTrigger as-child>
                <div
                  class="cursor-pointer flex items-center justify-center font-bold tracking-tight hover:text-primary transition-colors min-w-full h-8"
                  :class="[
                    booking.lotNo
                      ? 'text-xl'
                      : 'text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 rounded-md px-3',
                    { 'text-destructive': lotNoError },
                  ]"
                >
                  <template v-if="booking.lotNo">
                    {{ booking.lotNo }}
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
        <div class="grid grid-cols-2 lg:grid-cols-7 gap-3">
          <div
            class="px-3 py-2.5 rounded-xl bg-slate-50/50 border border-slate-100 dark:bg-slate-900/20 dark:border-slate-800 flex flex-col justify-center min-h-[70px]"
          >
            <div
              class="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5"
            >
              {{ t('cuplump.rubberType') }}
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
                {{ t('cuplump.grossWeight') }}
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
                {{ t('cuplump.netWeight') }}
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
              {{ t('cuplump.grossWeight') }}
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
              {{ t('cuplump.netWeight') }}
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
              {{ t('cuplump.avgCp') }}
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
                  {{ t('cuplump.moisture') }}
                </div>
                <div class="text-xl font-black text-amber-900 dark:text-amber-100 leading-none">
                  {{ booking.moisture || '-' }}
                  <span class="text-[10px] font-medium opacity-60 ml-0.5">%</span>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent class="w-60">
              <div class="grid gap-4">
                <div class="space-y-2">
                  <h4 class="font-medium leading-none">{{ t('cuplump.moisture') }}</h4>
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
                    <div class="text-lg font-black text-teal-900 dark:text-teal-100 leading-none">
                      {{ booking.drcActual || '-' }}%
                    </div>
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
                      type="number"
                      class="h-7 w-20 mx-auto p-1 text-center font-bold text-xs bg-white/80 dark:bg-slate-800/80 shadow-sm"
                  /></TableCell>
                  <TableCell class="py-1.5"
                    ><Input
                      v-model="sample.basket"
                      type="number"
                      class="h-7 w-20 mx-auto p-1 text-center font-semibold text-xs bg-white/80 dark:bg-slate-800/80 shadow-sm"
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
                      type="number"
                      class="h-7 w-20 mx-auto p-1 text-center font-semibold text-xs bg-white/80 dark:bg-slate-800/80 shadow-sm"
                  /></TableCell>
                  <TableCell class="py-1.5"
                    ><Input
                      v-model="sample.percentCp"
                      type="number"
                      class="h-7 w-20 mx-auto p-1 text-center font-semibold text-xs bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                      placeholder="Auto"
                  /></TableCell>
                  <TableCell class="py-1.5"
                    ><Input
                      v-model="sample.beforeBaking1"
                      type="number"
                      class="h-7 w-16 mx-auto p-1 text-center text-xs"
                  /></TableCell>
                  <TableCell class="py-1.5"
                    ><Input
                      v-model="sample.beforeBaking2"
                      type="number"
                      class="h-7 w-16 mx-auto p-1 text-center text-xs"
                  /></TableCell>
                  <TableCell class="py-1.5"
                    ><Input
                      v-model="sample.beforeBaking3"
                      type="number"
                      class="h-7 w-16 mx-auto p-1 text-center text-xs"
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
                  <TableCell class="text-center font-bold text-xs py-2">{{
                    item.beforePress?.toFixed(2)
                  }}</TableCell>
                  <TableCell class="text-center text-xs text-muted-foreground py-2">{{
                    item.basketWeight?.toFixed(2)
                  }}</TableCell>
                  <TableCell
                    class="text-center bg-blue-50/30 dark:bg-blue-900/5 font-black text-primary text-xs py-2"
                    >{{ item.cuplumpWeight?.toFixed(2) }}</TableCell
                  >
                  <TableCell class="text-center font-semibold text-xs py-2">{{
                    item.afterPress?.toFixed(2)
                  }}</TableCell>
                  <TableCell
                    class="text-center bg-indigo-50/30 dark:bg-indigo-900/5 font-bold text-indigo-600 dark:text-indigo-400 text-xs py-2"
                    >{{ item.percentCp?.toFixed(2) }}%</TableCell
                  >
                  <TableCell class="text-center text-xs py-2 text-muted-foreground">{{
                    item.beforeBaking1 || '-'
                  }}</TableCell>
                  <TableCell class="text-center text-xs py-2 text-muted-foreground">{{
                    item.beforeBaking2 || '-'
                  }}</TableCell>
                  <TableCell class="text-center text-xs py-2 text-muted-foreground">{{
                    item.beforeBaking3 || '-'
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
              {{ t('common.save') }} ({{ newSamples.length }})
            </Button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
```
