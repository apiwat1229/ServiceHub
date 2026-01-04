<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { format } from 'date-fns';
import { Pencil, Plus, Save, Trash2 } from 'lucide-vue-next';
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

const isEditingLotNo = ref(false); // New state for edit mode
const lotNoError = ref(''); // Validation error message
const isLoading = ref(false);
const isSaving = ref(false);

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

const displayWeightOut = computed(() => {
  if (!booking.value) return 0;
  const w = props.isTrailer ? booking.value.trailerWeightOut : booking.value.weightOut;
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

const handleUpdateLotNo = async () => {
  if (!booking.value) return;

  // Validation: Numeric only for LotNo
  if (booking.value.lotNo && !/^\d+$/.test(booking.value.lotNo)) {
    lotNoError.value = t('cuplump.numericOnly');
    return;
  }
  lotNoError.value = '';

  try {
    await bookingsApi.update(props.bookingId, {
      lotNo: booking.value.lotNo,
      moisture: booking.value.moisture,
      drcEst: booking.value.drcEst,
      drcRequested: booking.value.drcRequested,
      drcActual: booking.value.drcActual,
    });
    isEditingLotNo.value = false; // Switch back to view mode
    toast.success(t('common.saved'));
    emit('update');
  } catch (error) {
    console.error('Failed to update Main Info:', error);
    toast.error(t('common.errorSaving'));
  }
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
  <div class="h-full flex flex-col space-y-3">
    <!-- Header (Optional simpler header for Modal) -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold">{{ t('cuplump.mainInfo') }} ({{ partLabel }})</h1>
        <div class="text-muted-foreground text-sm" v-if="booking">
          {{ booking.bookingCode }} | {{ booking.lotNo || 'No Lot' }} |
          {{ format(new Date(booking.date), 'dd-MMM-yyyy') }}
        </div>
      </div>
      <!-- Close Button handled by Dialog usually, but can add explicit one or actions -->
    </div>

    <div v-if="isLoading" class="flex justify-center p-8">Loading...</div>

    <div v-else class="space-y-3 overflow-y-auto max-h-[80vh] pr-2">
      <!-- Main Info Cards -->
      <Card v-if="booking" class="bg-card">
        <CardContent class="p-3 grid gap-3">
          <!-- Top Row (Single Line) -->
          <div class="flex items-center justify-between gap-4">
            <!-- Supplier (Left) -->
            <div class="flex flex-col">
              <span class="text-[10px] text-muted-foreground uppercase tracking-wider">{{
                t('cuplump.supplier')
              }}</span>
              <span class="font-medium text-lg leading-none"
                >{{ booking.supplierCode }} : {{ booking.supplierName }}</span
              >
            </div>

            <!-- Lot No (Right, Editable with Toggle) -->
            <div class="flex flex-col items-end relative">
              <span class="text-[10px] text-muted-foreground uppercase tracking-wider">{{
                t('cuplump.lotNo')
              }}</span>
              <div
                class="flex items-center gap-2 h-7"
                :class="{ 'mb-4': isEditingLotNo && lotNoError }"
              >
                <template v-if="isEditingLotNo">
                  <div class="relative">
                    <Input
                      v-model="booking.lotNo"
                      class="h-7 w-[140px] text-right font-medium px-2 py-1 transition-colors"
                      :class="{ 'border-red-500 focus-visible:ring-red-500': lotNoError }"
                      placeholder="Lot No."
                      @keydown.enter="handleUpdateLotNo"
                      @input="validateLotInput"
                    />
                    <span
                      v-if="lotNoError"
                      class="absolute top-8 right-0 text-[10px] text-red-500 whitespace-nowrap bg-red-50 px-1 rounded border border-red-100"
                    >
                      {{ lotNoError }}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    class="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="!!lotNoError"
                    @click="handleUpdateLotNo"
                  >
                    <Save class="w-4 h-4" />
                  </Button>
                </template>
                <template v-else>
                  <span class="font-medium text-lg leading-none">{{ booking.lotNo || '-' }}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    class="h-7 w-7 text-muted-foreground hover:text-primary"
                    @click="isEditingLotNo = true"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </Button>
                </template>
              </div>
            </div>
          </div>

          <!-- Stats Row -->
          <!-- Stats & Weight Row -->
          <!-- Stats Row -->
          <div
            class="grid grid-cols-2 lg:grid-cols-8 gap-2 bg-muted/30 p-2 rounded-lg items-center"
          >
            <!-- Rubber Type (Moved here) -->
            <div class="text-center">
              <div class="text-[10px] text-muted-foreground uppercase tracking-wider">
                {{ t('cuplump.rubberType') }}
              </div>
              <div
                class="text-sm font-bold text-foreground truncate px-1"
                :title="displayRubberType"
              >
                {{ displayRubberType }}
              </div>
            </div>
            <!-- Stats -->
            <div class="text-center">
              <div class="text-[10px] text-muted-foreground uppercase tracking-wider">
                {{ t('cuplump.moisture') }}
              </div>
              <Input
                v-model="booking.moisture"
                type="number"
                step="0.01"
                class="h-7 w-20 text-center font-bold text-orange-500 mx-auto px-1"
                placeholder="%"
                @keydown.enter="handleUpdateLotNo"
              />
            </div>
            <div class="text-center">
              <div class="text-[10px] text-muted-foreground uppercase tracking-wider">
                {{ t('cuplump.avgCp') }}
              </div>
              <div class="text-lg font-bold text-green-600">{{ averageCp }}%</div>
            </div>
            <div class="text-center">
              <div class="text-[10px] text-muted-foreground uppercase tracking-wider">
                {{ t('cuplump.drcEst') }}
              </div>
              <Input
                v-model="booking.drcEst"
                type="number"
                step="0.01"
                class="h-7 w-20 text-center font-bold text-purple-600 mx-auto px-1"
                placeholder="%"
                @keydown.enter="handleUpdateLotNo"
              />
            </div>
            <div class="text-center">
              <div class="text-[10px] text-muted-foreground uppercase tracking-wider">
                DRC Requested
              </div>
              <Input
                v-model="booking.drcRequested"
                type="number"
                step="0.01"
                class="h-7 w-20 text-center font-bold text-blue-600 mx-auto px-1"
                placeholder="%"
                @keydown.enter="handleUpdateLotNo"
              />
            </div>
            <div class="text-center">
              <div class="text-[10px] text-muted-foreground uppercase tracking-wider">
                DRC Actual
              </div>
              <Input
                v-model="booking.drcActual"
                type="number"
                step="0.01"
                class="h-7 w-20 text-center font-bold text-teal-600 mx-auto px-1"
                placeholder="%"
                @keydown.enter="handleUpdateLotNo"
              />
            </div>

            <!-- Weights (Merged) -->
            <div
              class="text-center bg-blue-50/50 p-2 rounded border border-blue-100/50 col-span-2 lg:col-span-1 lg:border-l lg:border-t-0 lg:border-b-0 lg:border-r-0 lg:border-border/50 lg:rounded-none lg:bg-transparent lg:pl-4"
            >
              <div class="text-[10px] text-blue-700/70 uppercase tracking-wider">
                {{ t('cuplump.grossWeight') }}
              </div>
              <div class="text-lg font-bold text-blue-700">
                {{ displayWeightIn }}
                <span class="text-[10px] font-normal text-muted-foreground">Kg.</span>
              </div>
              <div class="text-[10px] text-blue-400">Out: {{ displayWeightOut }}</div>
            </div>
            <div
              class="text-center bg-green-50/50 p-2 rounded border border-green-100/50 col-span-2 lg:col-span-1 lg:border-none lg:bg-transparent lg:p-0"
            >
              <div class="text-[10px] text-green-700/70 uppercase tracking-wider">
                {{ t('cuplump.netWeight') }}
              </div>
              <div class="text-lg font-bold text-green-700">
                {{ displayNetWeight }}
                <span class="text-[10px] font-normal text-muted-foreground">Kg.</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Recorded Items Table with Inline Add -->
      <Card>
        <CardHeader class="p-3 pb-2 flex flex-row items-center justify-between">
          <CardTitle class="text-lg">{{ t('cuplump.recordedItems') }}</CardTitle>
          <Button
            size="sm"
            class="gap-2 bg-blue-600 hover:bg-blue-700"
            :disabled="isSaving"
            @click="addNewSampleRow"
          >
            <Plus class="w-4 h-4" />
            {{ t('common.add') }}
          </Button>
        </CardHeader>
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[50px]">No.</TableHead>
                <TableHead>{{ t('cuplump.beforePress') }}</TableHead>
                <TableHead>{{ t('cuplump.basket') }}</TableHead>
                <TableHead>{{ t('cuplump.cuplump') }}</TableHead>
                <TableHead>{{ t('cuplump.afterPress') }}</TableHead>
                <TableHead>{{ t('cuplump.percentCp') }}</TableHead>
                <TableHead>{{ t('cuplump.beforeBaking') }} 1</TableHead>
                <TableHead>{{ t('cuplump.beforeBaking') }} 2</TableHead>
                <TableHead>{{ t('cuplump.beforeBaking') }} 3</TableHead>
                <TableHead class="text-right">{{ t('common.actions') }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <!-- Existing Samples -->
              <TableRow v-for="item in samples" :key="item.id">
                <TableCell>{{ item.sampleNo }}</TableCell>
                <TableCell>{{ item.beforePress }}</TableCell>
                <TableCell>{{ item.basketWeight }}</TableCell>
                <TableCell>{{ item.cuplumpWeight?.toFixed(2) }}</TableCell>
                <TableCell>{{ item.afterPress }}</TableCell>
                <TableCell>{{ item.percentCp }}</TableCell>
                <TableCell>{{ item.beforeBaking1 }}</TableCell>
                <TableCell>{{ item.beforeBaking2 }}</TableCell>
                <TableCell>{{ item.beforeBaking3 }}</TableCell>
                <TableCell class="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-destructive"
                    @click="handleDeleteSample(item.id)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>

              <!-- New Samples Rows (Drafts) -->
              <TableRow
                v-for="(sample, index) in newSamples"
                :key="sample.id"
                class="bg-blue-50/30 hover:bg-blue-50/50"
              >
                <TableCell class="font-medium text-blue-600">{{
                  samples.length + index + 1
                }}</TableCell>
                <TableCell>
                  <Input
                    v-model="sample.beforePress"
                    type="number"
                    step="0.01"
                    class="h-8 w-full min-w-[80px]"
                    placeholder="0.00"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    v-model="sample.basket"
                    type="number"
                    step="0.01"
                    class="h-8 w-full min-w-[80px]"
                  />
                </TableCell>
                <TableCell>
                  <div class="px-2 py-1 bg-muted rounded text-sm text-center">
                    {{
                      calculateCuplump(
                        parseFloat(sample.beforePress || '0'),
                        parseFloat(sample.basket || '0')
                      )
                    }}
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    v-model="sample.afterPress"
                    type="number"
                    step="0.01"
                    class="h-8 w-full min-w-[80px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    v-model="sample.percentCp"
                    type="number"
                    step="0.01"
                    placeholder="Auto"
                    class="h-8 w-full min-w-[80px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    v-model="sample.beforeBaking1"
                    type="number"
                    step="0.01"
                    class="h-8 w-full min-w-[80px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    v-model="sample.beforeBaking2"
                    type="number"
                    step="0.01"
                    class="h-8 w-full min-w-[80px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    v-model="sample.beforeBaking3"
                    type="number"
                    step="0.01"
                    class="h-8 w-full min-w-[80px]"
                  />
                </TableCell>
                <TableCell class="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-muted-foreground hover:text-destructive"
                    @click="removeNewSampleRow(index)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <!-- Bottom Action Bar -->
          <div v-if="newSamples.length > 0" class="p-3 border-t bg-muted/20 flex justify-end">
            <Button
              class="gap-2 bg-green-600 hover:bg-green-700 text-white"
              :disabled="isSaving"
              @click="handleSaveAllSamples"
            >
              <Save class="w-4 h-4" />
              {{ t('common.save') }} ({{ newSamples.length }})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
