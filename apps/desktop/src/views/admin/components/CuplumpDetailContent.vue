<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { bookingsApi } from '@/services/bookings';
import { format } from 'date-fns';
import { Save, Trash2 } from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();

// Refs for inputs
const inputBeforePress = ref<any>(null);
const inputBasket = ref<any>(null);
const inputAfterPress = ref<any>(null);
const inputPercentCp = ref<any>(null);
const inputBeforeBaking1 = ref<any>(null);
const inputBeforeBaking2 = ref<any>(null);
const inputBeforeBaking3 = ref<any>(null);

const focusNext = (nextField: string) => {
  nextTick(() => {
    switch (nextField) {
      case 'basket':
        inputBasket.value?.$el?.querySelector('input')?.focus();
        break;
      case 'afterPress':
        inputAfterPress.value?.$el?.querySelector('input')?.focus();
        break;
      case 'percentCp':
        inputPercentCp.value?.$el?.querySelector('input')?.focus();
        break;
      case 'beforeBaking1':
        inputBeforeBaking1.value?.$el?.querySelector('input')?.focus();
        break;
      case 'beforeBaking2':
        inputBeforeBaking2.value?.$el?.querySelector('input')?.focus();
        break;
      case 'beforeBaking3':
        inputBeforeBaking3.value?.$el?.querySelector('input')?.focus();
        break;
    }
  });
};

const props = defineProps<{
  bookingId: string;
  isTrailer: boolean;
  partLabel: string;
}>();

const emit = defineEmits(['close']);

// State
const booking = ref<any>(null);
const samples = ref<any[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);

// New Sample Form
const newSample = ref<any>({
  beforePress: '',
  basket: 1.4, // Default per screenshot
  afterPress: '',
  percentCp: '', // Auto calc
  beforeBaking1: '',
  beforeBaking2: '',
  beforeBaking3: '',
});

// Computed Fields for Form
const displayRubberType = computed(() => {
  if (!booking.value) return '-';
  return props.isTrailer ? booking.value.trailerRubberType : booking.value.rubberType;
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
    const [bookingData, samplesData] = await Promise.all([
      bookingsApi.getById(props.bookingId),
      bookingsApi.getSamples(props.bookingId),
    ]);

    booking.value = bookingData;
    samples.value = samplesData.filter((s: any) => s.isTrailer === props.isTrailer);
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

const handleSaveSample = async () => {
  if (!newSample.value.beforePress) {
    toast.error(t('cuplump.enterBeforePress'));
    return;
  }

  isSaving.value = true;
  try {
    await bookingsApi.saveSample(props.bookingId, {
      ...newSample.value,
      isTrailer: props.isTrailer, // Important!
      // Calculate fields?
      cuplumpWeight: parseFloat(newSample.value.beforePress) - parseFloat(newSample.value.basket),
    });
    toast.success(t('cuplump.sampleSaved'));

    // Reset and Reload
    newSample.value = { ...newSample.value, beforePress: '', afterPress: '', percentCp: '' }; // Keep basket?
    fetchData();

    // Focus first input for rapid entry
    nextTick(() => {
      inputBeforePress.value?.$el?.querySelector('input')?.focus();
    });
  } catch (error) {
    console.error('Failed to save sample:', error);
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
    fetchData();
  } catch (e) {
    toast.error(t('cuplump.failedToDelete'));
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
  <div class="h-full flex flex-col space-y-6">
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

    <div v-else class="space-y-6 overflow-y-auto max-h-[80vh] pr-2">
      <!-- Main Info Cards -->
      <Card v-if="booking" class="bg-card">
        <CardContent class="p-4 grid gap-4">
          <!-- Top Row -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label class="text-xs text-muted-foreground">{{ t('cuplump.date') }}</Label>
              <div class="font-medium">{{ format(new Date(booking.date), 'dd-MMM-yyyy') }}</div>
            </div>
            <div>
              <Label class="text-xs text-muted-foreground">{{ t('cuplump.lotNo') }}</Label>
              <div class="font-medium">{{ booking.lotNo || '1251226-583/1' }}</div>
            </div>
            <div>
              <Label class="text-xs text-muted-foreground">{{ t('cuplump.supplier') }}</Label>
              <div class="font-medium">{{ booking.supplierCode }} : {{ booking.supplierName }}</div>
            </div>
            <div>
              <Label class="text-xs text-muted-foreground">{{ t('cuplump.rubberType') }}</Label>
              <div class="font-medium">{{ displayRubberType }}</div>
            </div>
          </div>

          <!-- Stats Row -->
          <!-- Stats & Weight Row -->
          <div
            class="grid grid-cols-2 lg:grid-cols-7 gap-4 bg-muted/30 p-4 rounded-lg items-center"
          >
            <!-- Stats -->
            <div class="text-center">
              <div class="text-[10px] text-muted-foreground uppercase tracking-wider">
                {{ t('cuplump.moisture') }}
              </div>
              <div class="text-lg font-bold text-orange-500">34.0%</div>
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
              <div class="text-lg font-bold text-purple-600">61.0%</div>
            </div>
            <div class="text-center">
              <div class="text-[10px] text-muted-foreground uppercase tracking-wider">
                DRC Requested
              </div>
              <div class="text-lg font-bold text-blue-600">62.0%</div>
            </div>
            <div class="text-center">
              <div class="text-[10px] text-muted-foreground uppercase tracking-wider">
                DRC Actual
              </div>
              <div class="text-lg font-bold text-teal-600">61.0%</div>
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
        <CardHeader class="pb-2 flex flex-row items-center justify-between">
          <CardTitle class="text-lg">{{ t('cuplump.recordedItems') }}</CardTitle>
          <Button
            size="sm"
            class="gap-2 bg-blue-600 hover:bg-blue-700"
            :disabled="isSaving"
            @click="handleSaveSample"
          >
            <Plus class="w-4 h-4" />
            {{ t('common.add') }}
          </Button>
        </CardHeader>
        <CardContent>
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

              <!-- New Sample Row -->
              <TableRow class="bg-muted/30 hover:bg-muted/50">
                <TableCell class="font-medium text-muted-foreground">{{
                  samples.length + 1
                }}</TableCell>
                <TableCell>
                  <Input
                    ref="inputBeforePress"
                    v-model="newSample.beforePress"
                    type="number"
                    step="0.01"
                    class="h-8 w-full min-w-[80px]"
                    @keydown.enter.prevent="focusNext('basket')"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    ref="inputBasket"
                    v-model="newSample.basket"
                    type="number"
                    step="0.01"
                    class="h-8 w-full min-w-[80px]"
                    @keydown.enter.prevent="focusNext('afterPress')"
                  />
                </TableCell>
                <TableCell>
                  <div class="px-2 py-1 bg-muted rounded text-sm text-center">
                    {{
                      calculateCuplump(
                        parseFloat(newSample.beforePress || '0'),
                        parseFloat(newSample.basket || '0')
                      )
                    }}
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    ref="inputAfterPress"
                    v-model="newSample.afterPress"
                    type="number"
                    step="0.01"
                    class="h-8 w-full min-w-[80px]"
                    @keydown.enter.prevent="focusNext('percentCp')"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    ref="inputPercentCp"
                    v-model="newSample.percentCp"
                    type="number"
                    step="0.01"
                    placeholder="Auto"
                    class="h-8 w-full min-w-[80px]"
                    @keydown.enter.prevent="focusNext('beforeBaking1')"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    ref="inputBeforeBaking1"
                    v-model="newSample.beforeBaking1"
                    type="number"
                    step="0.01"
                    class="h-8 w-full min-w-[80px]"
                    @keydown.enter.prevent="focusNext('beforeBaking2')"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    ref="inputBeforeBaking2"
                    v-model="newSample.beforeBaking2"
                    type="number"
                    step="0.01"
                    class="h-8 w-full min-w-[80px]"
                    @keydown.enter.prevent="focusNext('beforeBaking3')"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    ref="inputBeforeBaking3"
                    v-model="newSample.beforeBaking3"
                    type="number"
                    step="0.01"
                    class="h-8 w-full min-w-[80px]"
                    @keydown.enter.prevent="handleSaveSample"
                  />
                </TableCell>
                <TableCell class="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-blue-600"
                    :disabled="isSaving"
                    @click="handleSaveSample"
                  >
                    <Save class="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
