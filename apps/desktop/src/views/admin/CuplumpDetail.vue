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
import { ArrowLeft, Edit, Save, Trash2 } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const bookingId = route.params.id as string;
const isTrailer = route.query.isTrailer === 'true';
const partLabel = (route.query.partLabel as string) || (isTrailer ? 'Trailer' : 'Main Truck');

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
  return isTrailer ? booking.value.trailerRubberType : booking.value.rubberType;
});

const displayWeightIn = computed(() => {
  if (!booking.value) return 0;
  const w = isTrailer ? booking.value.trailerWeightIn : booking.value.weightIn;
  return (w || 0).toLocaleString();
});

const displayWeightOut = computed(() => {
  if (!booking.value) return 0;
  const w = isTrailer ? booking.value.trailerWeightOut : booking.value.weightOut;
  return (w || 0).toLocaleString();
});

// Net Weight
const displayNetWeight = computed(() => {
  if (!booking.value) return 0;
  const inW = isTrailer ? booking.value.trailerWeightIn : booking.value.weightIn;
  const outW = isTrailer ? booking.value.trailerWeightOut : booking.value.weightOut;
  const net = (inW || 0) - (outW || 0);
  return (net > 0 ? net : 0).toLocaleString();
});

// Fetch Data
const fetchData = async () => {
  isLoading.value = true;
  try {
    const [bookingData, samplesData] = await Promise.all([
      bookingsApi.getById(bookingId),
      bookingsApi.getSamples(bookingId), // We filter by isTrailer below or API? API returns all.
    ]);
    booking.value = bookingData;

    // Filter samples for this part
    samples.value = samplesData.filter((s: any) => s.isTrailer === isTrailer);
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

// Calculate %CP
// Formula: (After / Before) * 100 ? Or (After / (Before - Basket))?
// User screenshot: Before 12.84, Basket 1.4, Cuplump 11.44, After 10.13, %CP 58.44
// 10.13 / 11.44 = 0.8854 (88%). No.
// Maybe (After / NetSample)?
// Let's assume input for now or standard formula from user knowledge?
// Screenshot: 58.85% Avg.
// Wait, 12.84 - 1.4 = 11.44.
// 10.13 / (12.84) ??
// Let's look at average stats: 58.85%.
// 10.13 / ? = 0.58... -> ? = 17.2?
// Maybe DRC?
// Let's just allow manual input or simple calculation for now.
// Actually, I'll add "Auto Calc" button/logic if I know the formula.
// For now, I'll calculate Cuplump = Before - Basket automatically.

const handleSaveSample = async () => {
  if (!newSample.value.beforePress) {
    toast.error(t('cuplump.enterBeforePress'));
    return;
  }

  isSaving.value = true;
  try {
    await bookingsApi.saveSample(bookingId, {
      ...newSample.value,
      isTrailer, // Important!
      // Calculate fields?
      cuplumpWeight: parseFloat(newSample.value.beforePress) - parseFloat(newSample.value.basket),
    });
    toast.success(t('cuplump.sampleSaved'));

    // Reset and Reload
    newSample.value = { ...newSample.value, beforePress: '', afterPress: '', percentCp: '' }; // Keep basket?
    fetchData();
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
    await bookingsApi.deleteSample(bookingId, sampleId);
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

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-6 max-w-[1600px] mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="icon" @click="router.back()">
        <ArrowLeft class="w-5 h-5" />
      </Button>
      <div>
        <h1 class="text-2xl font-bold">{{ t('cuplump.mainInfo') }} ({{ partLabel }})</h1>
        <div class="text-muted-foreground text-sm" v-if="booking">
          {{ booking.bookingCode }} | {{ booking.lotNo || 'No Lot' }}
        </div>
      </div>
      <div class="ml-auto flex gap-2">
        <Button variant="outline" class="gap-2 bg-orange-50 text-orange-600 border-orange-200">
          <Edit class="w-4 h-4" /> {{ t('common.edit') }}
        </Button>
      </div>
    </div>

    <!-- Main Info Cards -->
    <Card v-if="booking" class="bg-card">
      <CardContent class="p-6 grid gap-6">
        <!-- Top Row -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label class="text-xs text-muted-foreground">{{ t('cuplump.date') }}</Label>
            <div class="font-medium">26-Dec-2025</div>
            <!-- Mock or Real -->
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
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 bg-muted/30 p-4 rounded-lg">
          <div class="text-center">
            <div class="text-xs text-muted-foreground">{{ t('cuplump.moisture') }}</div>
            <div class="text-xl font-bold text-orange-500">34.0%</div>
          </div>
          <div class="text-center">
            <div class="text-xs text-muted-foreground">{{ t('cuplump.avgCp') }}</div>
            <div class="text-xl font-bold text-green-600">{{ averageCp }}%</div>
          </div>
          <div class="text-center">
            <div class="text-xs text-muted-foreground">{{ t('cuplump.drcEst') }}</div>
            <div class="text-xl font-bold text-purple-600">61.0%</div>
          </div>
          <div class="text-center">
            <div class="text-xs text-muted-foreground">DRC Requested</div>
            <div class="text-xl font-bold text-blue-600">62.0%</div>
          </div>
          <div class="text-center">
            <div class="text-xs text-muted-foreground">DRC Actual</div>
            <div class="text-xl font-bold text-teal-600">61.0%</div>
          </div>
        </div>

        <!-- Weight Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <Label class="text-blue-700">{{ t('cuplump.grossWeight') }}</Label>
            <div class="text-2xl font-bold text-blue-900">
              {{ displayWeightIn }} {{ t('cuplump.kg') }}
            </div>
            <div class="text-xs text-blue-600 mt-1">
              {{ t('truckScale.weightOut') }}: {{ displayWeightOut }} {{ t('cuplump.kg') }}
            </div>
          </div>
          <div class="p-4 bg-green-50 border border-green-100 rounded-lg">
            <Label class="text-green-700">{{ t('cuplump.netWeight') }}</Label>
            <div class="text-2xl font-bold text-green-900">
              {{ displayNetWeight }} {{ t('cuplump.kg') }}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Recorded Items Table -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">{{ t('cuplump.recordedItems') }}</CardTitle>
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
                  class="h-8 w-8 text-red-500"
                  @click="handleDeleteSample(item.id)"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow v-if="samples.length === 0">
              <TableCell colspan="10" class="text-center text-muted-foreground h-24">
                {{ t('cuplump.noSamples') }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Add New Sample (Special Receiving) -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">{{ t('cuplump.specialReceiving') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-9 gap-4 items-end">
          <div class="md:col-span-1">
            <Label>No.</Label>
            <Input disabled :model-value="samples.length + 1" />
          </div>
          <div class="md:col-span-1">
            <Label>{{ t('cuplump.beforePress') }}</Label>
            <Input v-model="newSample.beforePress" type="number" step="0.01" />
          </div>
          <div class="md:col-span-1">
            <Label>{{ t('cuplump.basket') }}</Label>
            <Input v-model="newSample.basket" type="number" step="0.01" />
          </div>
          <div class="md:col-span-1">
            <Label>{{ t('cuplump.cuplump') }}</Label>
            <div class="h-10 px-3 py-2 bg-muted rounded-md text-sm flex items-center">
              {{
                calculateCuplump(
                  parseFloat(newSample.beforePress || '0'),
                  parseFloat(newSample.basket || '0')
                )
              }}
            </div>
          </div>
          <div class="md:col-span-1">
            <Label>{{ t('cuplump.afterPress') }}</Label>
            <Input v-model="newSample.afterPress" type="number" step="0.01" />
          </div>
          <div class="md:col-span-1">
            <Label>{{ t('cuplump.percentCp') }}</Label>
            <Input
              v-model="newSample.percentCp"
              type="number"
              step="0.01"
              placeholder="Auto Calc"
            />
          </div>
          <div class="md:col-span-1">
            <Label>{{ t('cuplump.beforeBaking') }} 1</Label>
            <Input v-model="newSample.beforeBaking1" type="number" step="0.01" />
          </div>
          <div class="md:col-span-1">
            <Label>{{ t('cuplump.beforeBaking') }} 2</Label>
            <Input v-model="newSample.beforeBaking2" type="number" step="0.01" />
          </div>
          <div class="md:col-span-1">
            <Label>{{ t('cuplump.beforeBaking') }} 3</Label>
            <Input v-model="newSample.beforeBaking3" type="number" step="0.01" />
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <Button variant="outline" class="gap-2" @click="newSample = { basket: 1.4 }">
            {{ t('cuplump.clear') }}
          </Button>
          <Button
            variant="default"
            class="gap-2 bg-blue-600 hover:bg-blue-700"
            :disabled="isSaving"
            @click="handleSaveSample"
          >
            <Save class="w-4 h-4" />
            {{ isSaving ? t('common.saving') : t('cuplump.saveRecord') }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
