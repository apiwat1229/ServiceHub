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
import { bookingsApi } from '@/services/bookings';
import { rubberTypesApi } from '@/services/rubberTypes';
import { Pencil, Save, Trash2 } from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';

// No translation functions needed in this scope currently

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
const showDeleteConfirm = ref(false);
const sampleToDeleteId = ref<string | null>(null);
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
        p0: s.p0 !== null && s.p0 !== undefined ? Number(s.p0).toFixed(2) : '',
        p30: s.p30 !== null && s.p30 !== undefined ? Number(s.p30).toFixed(2) : '',
        pri: s.pri !== null && s.pri !== undefined ? Number(s.pri).toFixed(2) : '',
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

const displayLocation = computed(() => {
  if (!booking.value) return '-';
  return props.isTrailer
    ? booking.value.trailerRubberSource || booking.value.rubberSource || '-'
    : booking.value.rubberSource || '-';
});

const displayNetWeight = computed(() => {
  if (!booking.value) return '0';
  const inW = props.isTrailer ? booking.value.trailerWeightIn || 0 : booking.value.weightIn || 0;
  const outW = props.isTrailer ? booking.value.trailerWeightOut || 0 : booking.value.weightOut || 0;
  return Math.max(0, inW - outW).toLocaleString();
});

const displayGrossWeight = computed(() => {
  if (!booking.value) return '0';
  const inW = props.isTrailer ? booking.value.trailerWeightIn || 0 : booking.value.weightIn || 0;
  return inW.toLocaleString();
});

const averagePo = computed(() => {
  const valid = samples.value.map((s) => parseFloat(s.p0)).filter((v) => !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
});

const averagePri = computed(() => {
  const valid = samples.value.map((s) => parseFloat(s.pri)).filter((v) => !isNaN(v));
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

onMounted(async () => {
  await fetchData();
  focusFirstInput();
});
</script>

<template>
  <div
    class="bg-card rounded-xl shadow-lg border border-border overflow-hidden flex flex-col h-full relative"
  >
    <!-- Header Section -->
    <div class="p-6 border-b border-border bg-muted/30">
      <div class="flex flex-wrap items-center gap-y-4 gap-x-8">
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
          <span class="text-sm font-bold text-primary">{{ booking?.lotNo || '-' }}</span>
        </div>

        <div class="flex flex-col max-w-[200px]">
          <div class="flex flex-col gap-1">
            <span class="text-sm font-bold text-foreground truncate">{{
              booking?.supplierCode || '-'
            }}</span>
            <span class="text-xs text-muted-foreground truncate">{{
              booking?.supplierName || '-'
            }}</span>
          </div>
        </div>

        <div class="flex flex-col">
          <div class="flex flex-col gap-1">
            <span class="text-[10px] font-bold text-primary uppercase h-5 flex items-center">
              {{ displayRubberType }}
            </span>
            <span class="text-xs font-medium text-primary truncate max-w-[120px]">{{
              displayLocation
            }}</span>
          </div>
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
            >Grade</span
          >
          <div
            class="flex items-center justify-center border-2 border-border rounded px-2 h-6 min-w-[3rem] bg-card"
          >
            <span class="text-sm font-black text-foreground">{{ calculatedGrade }}</span>
          </div>
        </div>

        <div class="flex flex-col">
          <span class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
            >Gross Weight</span
          >
          <span class="text-sm font-bold text-foreground">{{ displayGrossWeight }} kg</span>
        </div>

        <div class="flex flex-col">
          <span class="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1"
            >Net Weight</span
          >
          <span class="text-sm font-bold text-blue-600">{{ displayNetWeight }} kg</span>
        </div>
      </div>
    </div>

    <!-- Samples List -->
    <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-card">
      <div
        v-for="(sample, index) in samples"
        :key="sample.id"
        class="group relative flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 hover:shadow-md transition-all"
      >
        <!-- Sample Label -->
        <div
          class="flex flex-col items-center justify-center min-w-[80px] h-10 bg-muted rounded-lg text-muted-foreground"
        >
          <span class="text-[10px] font-bold uppercase">Sample</span>
          <span class="text-sm font-black leading-none">{{ index + 1 }}</span>
        </div>

        <!-- Inputs Grid -->
        <div class="flex-1 grid grid-cols-5 gap-6">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-muted-foreground uppercase">Before Press</label>
            <div class="flex items-center gap-2">
              <Input
                v-model="sample.beforePress"
                readonly
                class="h-9 bg-muted border-border font-bold text-muted-foreground cursor-not-allowed"
                @input="handleNumericInput(sample, 'beforePress', $event.target.value)"
              />

              <span class="text-xs font-bold text-muted-foreground">kg</span>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-muted-foreground uppercase">After Press</label>
            <div class="flex items-center gap-2">
              <Input
                v-model="sample.afterPress"
                readonly
                class="h-9 bg-muted border-border font-bold text-muted-foreground cursor-not-allowed"
                @input="handleNumericInput(sample, 'afterPress', $event.target.value)"
              />

              <span class="text-xs font-bold text-muted-foreground">kg</span>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-muted-foreground uppercase">PO</label>
            <Input
              v-model="sample.p0"
              class="h-9 border-border font-bold"
              :class="!isEditing ? 'bg-muted text-muted-foreground' : 'bg-card text-foreground'"
              placeholder="PO"
              @input="handleNumericInput(sample, 'p0', $event.target.value)"
              @keydown="handleEnter"
              :disabled="!isEditing"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-muted-foreground uppercase">P30</label>
            <Input
              v-model="sample.p30"
              class="h-9 border-border font-bold"
              :class="!isEditing ? 'bg-muted text-muted-foreground' : 'bg-card text-foreground'"
              placeholder="P30"
              @input="handleNumericInput(sample, 'p30', $event.target.value)"
              @keydown="handleEnter"
              :disabled="!isEditing"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-muted-foreground uppercase">PRI</label>
            <div
              class="h-9 flex items-center px-3 bg-muted rounded-md border border-border font-bold text-muted-foreground"
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
    <div class="p-6 border-t border-border bg-muted/30 flex justify-between items-center gap-3">
      <!-- Left: Delete Button -->
      <Button
        variant="ghost"
        class="text-destructive hover:text-destructive hover:bg-destructive/10"
        @click="showBookingDeleteConfirm = true"
      >
        <Trash2 class="w-4 h-4 mr-2" />
        Delete Booking
      </Button>

      <!-- Right: Action Buttons -->
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
          Save Data
        </Button>
      </div>
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
          <AlertDialogAction
            class="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            @click="deleteSample"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

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
