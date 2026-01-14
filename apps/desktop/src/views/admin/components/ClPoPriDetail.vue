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
import { Save } from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';

// No translation functions needed in this scope currently

const props = defineProps<{
  bookingId: string;
  isTrailer?: boolean;
}>();

const emit = defineEmits(['close', 'update']);

// State
const booking = ref<any>(null);
const samples = ref<any[]>([]);
const rubberTypes = ref<any[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const showDeleteConfirm = ref(false);
const sampleToDeleteId = ref<string | null>(null);
const isDeleting = ref(false);

// New Samples are disabled for QA

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
        beforePress: s.beforePress?.toString() || '',
        afterPress: s.afterPress?.toString() || '',
        p0: s.p0?.toString() || '',
        p30: s.p30?.toString() || '',
        pri: s.pri?.toString() || '',
      }));
    rubberTypes.value = typesData;
  } catch (error) {
    console.error('Failed to load data:', error);
    toast.error('Error loading data');
  } finally {
    isLoading.value = false;
  }
};

// addNewSampleRow removed to prevent manual adding in QA

const calculatePri = (sample: any) => {
  const p0 = parseFloat(sample.p0);
  const p30 = parseFloat(sample.p30);
  if (p0 && p30 && p0 > 0) {
    sample.pri = ((p30 / p0) * 100).toFixed(2);
  } else {
    sample.pri = '';
  }
};

const handleNumericInput = (sample: any, field: string, value: string) => {
  let cleaned = value.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');

  sample[field] = cleaned;

  if (field === 'p0' || field === 'p30') {
    calculatePri(sample);
  }
};

const saveAll = async () => {
  isSaving.value = true;
  try {
    const all = samples.value.filter((s) => s.beforePress || s.afterPress || s.p0 || s.p30);

    for (const s of all) {
      await bookingsApi.saveSample(props.bookingId, {
        ...s,
        beforePress: parseFloat(s.beforePress) || null,
        afterPress: parseFloat(s.afterPress) || null,
        p0: parseFloat(s.p0) || null,
        p30: parseFloat(s.p30) || null,
        pri: parseFloat(s.pri) || null,
        isTrailer: props.isTrailer || false,
      });
    }

    toast.success('Data saved successfully');
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
  if (e.key !== 'Enter') return;
  const target = e.target as HTMLInputElement;

  const form = target.closest('div.overflow-y-auto');
  if (!form) return;

  const inputs = Array.from(
    form.querySelectorAll('input:not([readonly]):not([disabled])')
  ) as HTMLInputElement[];
  const index = inputs.indexOf(target);

  if (index > -1 && index < inputs.length - 1) {
    inputs[index + 1].focus();
    inputs[index + 1].select();
  } else if (index === inputs.length - 1) {
    saveAll();
  }
};

const deleteSample = async () => {
  if (!sampleToDeleteId.value) return;
  isDeleting.value = true;
  try {
    await bookingsApi.deleteSample(props.bookingId, sampleToDeleteId.value);
    toast.success('Sample deleted');
    fetchData();
    emit('update');
  } catch (error) {
    toast.error('Failed to delete sample');
  } finally {
    isDeleting.value = false;
    showDeleteConfirm.value = false;
    sampleToDeleteId.value = null;
  }
};

const focusFirstInput = () => {
  nextTick(() => {
    const firstInput = document.querySelector(
      '.overflow-y-auto input:not([readonly]):not([disabled])'
    ) as HTMLInputElement;
    if (firstInput) {
      firstInput.focus();
      firstInput.select();
    }
  });
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

onMounted(async () => {
  await fetchData();
  focusFirstInput();
});
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-full"
  >
    <!-- Header Section -->
    <div class="p-6 border-b border-slate-100 bg-slate-50/50">
      <div class="flex flex-wrap items-center gap-y-4 gap-x-8">
        <div class="flex flex-col">
          <span class="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest mb-1"
            >Date</span
          >
          <span class="text-sm font-bold text-slate-900">{{
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
          <span class="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest mb-1"
            >Lot Number</span
          >
          <span class="text-sm font-bold text-blue-600">{{ booking?.lotNo || '-' }}</span>
        </div>

        <div class="flex flex-col">
          <span class="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest mb-1"
            >Supplier</span
          >
          <span class="text-sm font-bold text-slate-900"
            >{{ booking?.supplierCode }} : {{ booking?.supplierName }}</span
          >
        </div>

        <div class="flex flex-col">
          <span class="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest mb-1"
            >Rubber Type</span
          >
          <Badge
            variant="outline"
            class="w-fit bg-white text-blue-600 border-blue-200 uppercase text-[10px] h-5 px-2"
            >{{ displayRubberType }}</Badge
          >
        </div>

        <div class="flex flex-col">
          <span class="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest mb-1"
            >DRC Est.</span
          >
          <span class="text-sm font-bold text-purple-600"
            >{{ (props.isTrailer ? booking?.trailerDrcEst : booking?.drcEst) || '-' }}%</span
          >
        </div>

        <div class="flex flex-col">
          <span class="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest mb-1"
            >Net Weight</span
          >
          <span class="text-sm font-bold text-blue-600">{{ displayNetWeight }} kg</span>
        </div>
      </div>
    </div>

    <!-- Samples List -->
    <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
      <div
        v-for="(sample, index) in samples"
        :key="sample.id"
        class="group relative flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-md transition-all"
      >
        <!-- Sample Label -->
        <div
          class="flex flex-col items-center justify-center min-w-[80px] h-10 bg-slate-200 rounded-lg text-slate-600"
        >
          <span class="text-[10px] font-bold uppercase">Sample</span>
          <span class="text-sm font-black leading-none">{{ index + 1 }}</span>
        </div>

        <!-- Inputs Grid -->
        <div class="flex-1 grid grid-cols-5 gap-6">
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase">Before Press</label>
            <div class="flex items-center gap-2">
              <Input
                v-model="sample.beforePress"
                readonly
                class="h-9 bg-slate-100 border-slate-200 font-bold text-slate-500 cursor-not-allowed"
                @input="handleNumericInput(sample, 'beforePress', $event.target.value)"
              />

              <span class="text-xs font-bold text-slate-400">kg</span>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase">After Press</label>
            <div class="flex items-center gap-2">
              <Input
                v-model="sample.afterPress"
                readonly
                class="h-9 bg-slate-100 border-slate-200 font-bold text-slate-500 cursor-not-allowed"
                @input="handleNumericInput(sample, 'afterPress', $event.target.value)"
              />

              <span class="text-xs font-bold text-slate-400">kg</span>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase">PO</label>
            <Input
              v-model="sample.p0"
              class="h-9 bg-white border-slate-200 font-bold text-slate-700"
              placeholder="PO"
              @input="handleNumericInput(sample, 'p0', $event.target.value)"
              @keydown="handleEnter"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase">P30</label>
            <Input
              v-model="sample.p30"
              class="h-9 bg-white border-slate-200 font-bold text-slate-700"
              placeholder="P30"
              @input="handleNumericInput(sample, 'p30', $event.target.value)"
              @keydown="handleEnter"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase">PRI</label>
            <div
              class="h-9 flex items-center px-3 bg-slate-100/50 rounded-md border border-slate-200 font-bold text-slate-500"
            >
              {{ sample.pri || '-' }}
            </div>
          </div>
        </div>

        <!-- Deleted Trash/X Buttons as editing/deleting is disabled in QA -->
      </div>

      <!-- Add Sample button removed as requested -->
    </div>

    <!-- Footer Action -->
    <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
      <Button variant="outline" @click="emit('close')">Cancel</Button>
      <Button
        class="bg-primary hover:bg-primary/90 min-w-[120px]"
        :disabled="isSaving"
        @click="saveAll"
      >
        <Save v-if="!isSaving" class="w-4 h-4 mr-2" />
        <div
          v-else
          class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"
        ></div>
        Save Data
      </Button>
    </div>

    <!-- Delete Confirmation -->
    <AlertDialog :open="showDeleteConfirm" @update:open="showDeleteConfirm = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Sample</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this sample? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction class="bg-red-600 hover:bg-red-700" @click="deleteSample">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
