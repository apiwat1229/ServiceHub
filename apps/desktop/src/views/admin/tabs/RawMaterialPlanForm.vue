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
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { addDays, format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  FileEdit,
  PlusCircle,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

const props = defineProps<{
  initialData?: any;
}>();

const emit = defineEmits(['cancel']);

const { t } = useI18n();
const authStore = useAuthStore();
const router = useRouter();

const isEditMode = computed(() => !!props.initialData?.id);
const isDeleteAlertOpen = ref(false);
const isResetAlertOpen = ref(false);

const handleCancel = () => {
  emit('cancel');
  router.push({ query: { tab: 'raw-material-plan-list' } });
};

const getDefaultPlan = () => ({
  planNo: '',
  revisionNo: '',
  refProductionNo: '',
  issuedDate: format(new Date(), 'dd MMM yy'),
  rows: Array.from({ length: 14 }, (_, idx) => {
    const startDate = new Date();
    const currentDate = addDays(startDate, Math.floor(idx / 2));

    return {
      date: idx % 2 === 0 ? format(currentDate, 'dd MMM yy') : '',
      dayOfWeek: idx % 2 === 0 ? format(currentDate, 'eee') : '',
      shift: idx % 2 === 0 ? '1st' : '2nd',
      productionMode: 'normal',
      grade: '',
      gradeColor: '',
      ratioUSS: '0',
      ratioCL: '0',
      ratioBK: '0',
      productTarget: '0',
      clConsumption: '0',
      ratioBorC: '0',
      plan1Pool: [] as string[],
      plan1Scoops: 0,
      plan1Grades: [] as string[],
      plan2Pool: [] as string[],
      plan2Scoops: 0,
      plan2Grades: [] as string[],
      plan3Pool: [] as string[],
      plan3Scoops: 0,
      plan3Grades: [] as string[],
      cuttingPercent: '0',
      cuttingPalette: '',
      remarks: '',
    };
  }),
  poolDetails: Array.from({ length: 7 }, () => ({
    poolNo: '0',
    grossWeight: '0',
    netWeight: '0',
    drc: '0',
    moisture: '0',
    p0: '0',
    pri: '0',
    clearDate: '',
    grade: [] as string[],
  })),
});

const handleReset = () => {
  if (isEditMode.value && props.initialData) {
    // Reset to initial edited data
    const data = props.initialData;
    // ... (Reuse the mapping logic from onMounted ideally, but for now copying is fine or we can extract it)
    // To avoid duplication, I'll just reload the page or re-run the mount logic function if I extract it.
    // For simplicity, let's just reset to initialData by calling the same logic.
    initializeData(data);
  } else {
    // Reset to default
    plan.value = getDefaultPlan();
  }
  isResetAlertOpen.value = false;
  toast.info('Form has been reset.');
};

const handleDelete = async () => {
  if (!props.initialData?.id) return;

  try {
    isSubmitting.value = true;
    await api.delete(`/raw-material-plans/${props.initialData.id}`);
    toast.success('Plan deleted successfully');
    isDeleteAlertOpen.value = false;
    handleCancel(); // Redirect
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Unknown error occurred';
    toast.error(`Failed to delete plan: ${errorMsg}`);
  } finally {
    isSubmitting.value = false;
  }
};

const initializeData = (data: any) => {
  plan.value.planNo = data.planNo || '';
  plan.value.revisionNo = data.revisionNo || '';
  plan.value.refProductionNo = data.refProductionNo || '';
  if (data.issuedDate) {
    plan.value.issuedDate = format(new Date(data.issuedDate), 'dd MMM yy');
  }

  if (data.rows && data.rows.length > 0) {
    plan.value.rows = data.rows.map((r: any) => {
      return {
        ...r,
        date: r.date ? format(new Date(r.date), 'dd MMM yy') : '',
        plan1Pool:
          typeof r.plan1Pool === 'string'
            ? r.plan1Pool.split(',').filter(Boolean)
            : r.plan1Pool || [],
        plan1Grades:
          typeof r.plan1Grades === 'string'
            ? r.plan1Grades.split(',').filter(Boolean)
            : r.plan1Grades || [],
        plan2Pool:
          typeof r.plan2Pool === 'string'
            ? r.plan2Pool.split(',').filter(Boolean)
            : r.plan2Pool || [],
        plan2Grades:
          typeof r.plan2Grades === 'string'
            ? r.plan2Grades.split(',').filter(Boolean)
            : r.plan2Grades || [],
        plan3Pool:
          typeof r.plan3Pool === 'string'
            ? r.plan3Pool.split(',').filter(Boolean)
            : r.plan3Pool || [],
        plan3Grades:
          typeof r.plan3Grades === 'string'
            ? r.plan3Grades.split(',').filter(Boolean)
            : r.plan3Grades || [],
        ratioUSS: String(r.ratioUSS ?? '0'),
        ratioCL: String(r.ratioCL ?? '0'),
        ratioBK: String(r.ratioBK ?? '0'),
        productTarget: String(r.productTarget ?? '0'),
        clConsumption: String(r.clConsumption ?? '0'),
        ratioBorC: String(r.ratioBorC ?? '0'),
        cuttingPercent: String(r.cuttingPercent ?? '0'),
        cuttingPalette: String(r.cuttingPalette ?? ''),
      };
    });
  }

  if (data.poolDetails && data.poolDetails.length > 0) {
    plan.value.poolDetails = data.poolDetails.map((p: any) => ({
      ...p,
      clearDate: p.clearDate ? format(new Date(p.clearDate), 'dd MMM yy') : '',
      grade: typeof p.grade === 'string' ? p.grade.split(',').filter(Boolean) : p.grade || [],
      grossWeight: String(p.grossWeight ?? '0'),
      netWeight: String(p.netWeight ?? '0'),
      drc: String(p.drc ?? '0'),
      moisture: String(p.moisture ?? '0'),
      p0: String(p.p0 ?? '0'),
      pri: String(p.pri ?? '0'),
    }));
  }
};

const validPoolGrades = ['AA', 'A', 'B', 'C', 'D'];

const togglePoolGrade = (pool: any, grade: string) => {
  if (pool.grade.includes(grade)) {
    pool.grade = pool.grade.filter((g: string) => g !== grade);
  } else {
    // Sort logic: use validPoolGrades index
    const newGrades = [...pool.grade, grade];
    newGrades.sort((a, b) => validPoolGrades.indexOf(a) - validPoolGrades.indexOf(b));
    pool.grade = newGrades;
  }
};

// Mock initial state for a 7-day plan (14 shifts)
const plan = ref(getDefaultPlan());

const fetchNextPlanNo = async () => {
  try {
    const response = await api.get('/raw-material-plans/next-plan-no');
    if (response.data) {
      plan.value.planNo = response.data;
    }
  } catch (error) {
    console.error('Failed to fetch next plan number:', error);
  }
};

onMounted(() => {
  if (props.initialData) {
    initializeData(props.initialData);
  } else {
    // New plan: auto generate plan no.
    fetchNextPlanNo();
  }
});

const plainPoolOptions = computed(() => {
  return Array.from({ length: 23 }, (_, i) => String(i + 1));
});

const getPlanPoolLabel = (row: any, planIndex: number) => {
  const pools = row[`plan${planIndex}Pool`];
  const grades = row[`plan${planIndex}Grades`];
  if (!pools || pools.length === 0) return '';
  const poolStr = pools.join(' / ');
  const gradeStr = grades && grades.length ? ` (${grades.join('+')})` : '';
  return `${poolStr}${gradeStr}`;
};

const togglePlanPool = (row: any, planIndex: number, pool: string) => {
  const key = `plan${planIndex}Pool`;
  if (row[key].includes(pool)) {
    row[key] = row[key].filter((p: string) => p !== pool);
  } else {
    const newPools = [...row[key], pool];
    newPools.sort((a: string, b: string) => parseInt(a) - parseInt(b));
    row[key] = newPools;
  }
};

const togglePlanGrade = (row: any, planIndex: number, grade: string) => {
  const key = `plan${planIndex}Grades`;
  if (row[key].includes(grade)) {
    row[key] = row[key].filter((g: string) => g !== grade);
  } else {
    const newGrades = [...row[key], grade];
    newGrades.sort((a, b) => validPoolGrades.indexOf(a) - validPoolGrades.indexOf(b));
    row[key] = newGrades;
  }
};

const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'P0241':
      return 'bg-[#ff00ff] text-white font-black';
    case 'P0263':
      return 'bg-[#b3d9ff] text-slate-900 font-black';
    case 'P0251':
      return 'bg-[#c3e6cb] text-emerald-900 font-black';
    case 'H0276':
      return 'bg-[#ffeeba] text-amber-900 font-black';
    default:
      return 'font-black';
  }
};

const grades = ref(['P0263', 'P0251', 'H0276', 'P0241']);

const formatDate = (date: any) => {
  if (!date) return '';
  return format(new Date(date.toString()), 'dd MMM yy');
};

const handleDateUpdate = (newDate: any) => {
  if (!newDate) return;
  const startDate = new Date(newDate);

  // Update all rows (assuming 7 days / 14 shifts)
  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(startDate, i);
    const dateStr = format(currentDate, 'dd MMM yy');
    const dayStr = format(currentDate, 'eee');

    // 1st Shift (Even Rows)
    if (i * 2 < plan.value.rows.length) {
      const row = plan.value.rows[i * 2];
      row.date = dateStr;
      row.dayOfWeek = dayStr;
    }

    // 2nd Shift (Odd Rows) - Optional: Sync dayOfWeek if needed, though usually visually implicit
    // Assuming 2nd shift shares the same day logic
    if (i * 2 + 1 < plan.value.rows.length) {
      const rowOdd = plan.value.rows[i * 2 + 1];
      // rowOdd.date = ''; // Keep empty as it's the 24h toggle slot
      rowOdd.dayOfWeek = ''; // Keep empty or replicate dayStr if design changes
    }
  }
};

const isSubmitting = ref(false); // Added based on instruction's usage

const handleSave = async () => {
  if (!plan.value.planNo) {
    toast.error('Please enter Plan No.');
    return;
  }

  try {
    isSubmitting.value = true;
    // Format the payload
    const payload = {
      ...plan.value,
      issueBy: authStore.user?.displayName || authStore.user?.username || 'System',
      verifiedBy: null, // Pending verification
      // Ensure numeric fields are numbers
      rows: plan.value.rows.map((row) => ({
        ...row,
        plan1Scoops: Number(row.plan1Scoops) || 0,
        plan2Scoops: Number(row.plan2Scoops) || 0,
        plan3Scoops: Number(row.plan3Scoops) || 0,
      })),
      poolDetails: plan.value.poolDetails.map((pool) => ({
        ...pool,
        grossWeight: Number(pool.grossWeight) || 0,
        netWeight: Number(pool.netWeight) || 0,
        drc: Number(pool.drc) || 0,
        moisture: Number(pool.moisture) || 0,
        p0: Number(pool.p0) || 0,
        pri: Number(pool.pri) || 0,
        clearDate: pool.clearDate || null,
      })),
    };

    console.log('[RawMaterialPlanForm] Saving payload:', payload);

    if (props.initialData?.id) {
      await api.patch(`/raw-material-plans/${props.initialData.id}`, payload);
      toast.success('Successfully updated Raw Material Plan');
    } else {
      await api.post('/raw-material-plans', payload);
      toast.success('Successfully created Raw Material Plan');
    }

    // Redirect back to list
    handleCancel();
  } catch (error: any) {
    console.error('Failed to save plan:', error);
    const errorMsg = error.response?.data?.message || error.message || 'Unknown error occurred';
    toast.error(`Failed to save plan: ${errorMsg}`);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="raw-material-plan-print-container">
    <div class="space-y-6 max-w-[1600px] mx-auto p-4 bg-white rounded-xl shadow-sm border">
      <!-- Plan Header Segment -->
      <div class="grid grid-cols-3 gap-8 pb-4 border-b border-slate-100">
        <div class="space-y-4">
          <div>
            <h2
              class="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"
            >
              <span v-if="isEditMode" class="flex items-center gap-2">
                <FileEdit class="w-6 h-6 text-blue-600" />
                Edit Plan: <span class="text-blue-600">{{ plan.planNo }}</span>
              </span>
              <span v-else class="flex items-center gap-2">
                <PlusCircle class="w-6 h-6 text-emerald-600" />
                Create Raw Material Plan
              </span>
            </h2>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              {{ t('qa.productionPlanningAllocation') }}
            </p>
          </div>
        </div>

        <div class="col-span-2 grid grid-cols-2 gap-4">
          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-400 uppercase">{{
                t('qa.fields.planNo')
              }}</label>
              <Input
                v-model="plan.planNo"
                class="h-8 text-xs font-bold border-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-400 uppercase">{{
                t('qa.fields.revision')
              }}</label>
              <Input
                v-model="plan.revisionNo"
                class="h-8 text-xs font-bold border-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-400 uppercase">{{
                t('qa.fields.issuedDate')
              }}</label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    class="h-8 w-full text-xs font-bold border-slate-200 justify-start px-3 bg-white hover:bg-slate-50"
                    :class="!plan.issuedDate && 'text-muted-foreground'"
                  >
                    <CalendarIcon class="mr-2 h-3 w-3 text-slate-400" />
                    {{ plan.issuedDate || t('common.selectDate') }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    @update:model-value="(val: any) => (plan.issuedDate = formatDate(val))"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-400 uppercase">{{
                t('qa.fields.refProduction')
              }}</label>
              <Input
                v-model="plan.refProductionNo"
                class="h-8 text-xs font-bold border-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Main Entry Grid -->
      <div class="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
        <Table class="border-collapse text-[11px]">
          <TableHeader>
            <!-- Primary Header Rows -->
            <TableRow class="bg-slate-800 hover:bg-slate-800 border-none">
              <TableHead
                colspan="4"
                class="text-center text-white font-black border-r border-slate-700 h-8 uppercase tracking-widest bg-amber-500/90"
                >{{ t('qa.headers.productionPlan') }}</TableHead
              >
              <TableHead
                colspan="3"
                class="text-center text-white font-black border-r border-slate-700 h-8 uppercase tracking-widest bg-slate-400/90"
                >{{ t('qa.headers.ratios') }}</TableHead
              >
              <TableHead
                colspan="3"
                class="text-center text-white font-black border-r border-slate-700 h-8 uppercase tracking-widest bg-slate-500/90"
                >{{ t('qa.headers.productionTargets') }}</TableHead
              >
              <TableHead
                colspan="6"
                class="text-center text-white font-black border-r border-slate-700 h-8 uppercase tracking-widest bg-blue-500/90"
                >{{ t('qa.headers.clAllocationPlan') }}</TableHead
              >
              <TableHead
                colspan="2"
                class="text-center text-white font-black border-r border-slate-700 h-8 uppercase tracking-widest bg-indigo-500/90"
                >{{ t('qa.headers.cutting') }}</TableHead
              >
              <TableHead class="text-center text-white font-black h-8 bg-slate-600/90">{{
                t('qa.headers.docs')
              }}</TableHead>
            </TableRow>

            <TableRow
              class="bg-slate-50 hover:bg-slate-50 text-[10px] font-black text-slate-500 align-middle"
            >
              <TableHead class="border-r border-slate-200 w-20 text-center">Date</TableHead>
              <TableHead class="border-r border-slate-200 w-10 text-center px-0.5">Day</TableHead>
              <TableHead class="border-r border-slate-200 w-12 text-center">Shift</TableHead>
              <TableHead class="border-r border-slate-200 w-20 text-center">Grade</TableHead>

              <TableHead class="border-r border-slate-200 w-14 text-center">USS</TableHead>
              <TableHead class="border-r border-slate-200 w-14 text-center">CL</TableHead>
              <TableHead class="border-r border-slate-200 w-14 text-center">BK</TableHead>

              <TableHead class="border-r border-slate-200 w-16 text-center">Target</TableHead>
              <TableHead class="border-r border-slate-200 w-16 text-center">CL Cons.</TableHead>
              <TableHead class="border-r border-slate-200 w-16 text-center">Ratio B/C</TableHead>

              <TableHead colspan="2" class="border-r border-slate-200 text-center bg-blue-50/50">
                <div class="flex flex-col items-center justify-center leading-tight py-1">
                  <span class="font-black text-[10px]">#1 (P/S)</span>
                </div>
              </TableHead>
              <TableHead colspan="2" class="border-r border-slate-200 text-center bg-blue-50/50">
                <div class="flex flex-col items-center justify-center leading-tight py-1">
                  <span class="font-black text-[10px]">#2 (P/S)</span>
                </div>
              </TableHead>
              <TableHead colspan="2" class="border-r border-slate-200 text-center bg-blue-50/50">
                <div class="flex flex-col items-center justify-center leading-tight py-1">
                  <span class="font-black text-[10px]">#3 (P/S)</span>
                </div>
              </TableHead>

              <TableHead class="border-r border-slate-200 w-20 text-center">%</TableHead>
              <TableHead class="border-r border-slate-200 w-20 text-center">Pallet/Shift</TableHead>

              <TableHead class="text-center">Remarks</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow
              v-for="(row, idx) in plan.rows"
              :key="idx"
              class="h-8 hover:bg-slate-50/80 transition-colors"
            >
              <!-- Date/Meta -->
              <TableCell
                v-if="idx % 2 === 0"
                class="border-r border-slate-100 p-0 text-center relative"
                rowspan="2"
              >
                <!-- First Row: Date Picker (Driver) -->
                <Popover v-if="idx === 0">
                  <PopoverTrigger as-child>
                    <Button
                      variant="ghost"
                      class="h-7 w-full text-[10px] border-none shadow-none font-bold justify-center px-1 hover:bg-blue-50 text-blue-700"
                    >
                      {{ row.date || 'Select Date' }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      @update:model-value="(val: any) => handleDateUpdate(val)"
                    />
                  </PopoverContent>
                </Popover>

                <!-- Other Even Rows: Read-only Date -->
                <div
                  v-else
                  class="h-7 flex items-center justify-center text-[10px] font-bold text-slate-600 bg-slate-50/50"
                >
                  {{ row.date }}
                </div>

                <!-- Centered Production Mode Selector on bottom line -->
                <div
                  class="absolute bottom-0 left-0 w-full flex justify-center translate-y-1/2 z-50 px-1"
                >
                  <Select v-model="row.productionMode">
                    <SelectTrigger
                      class="h-5 w-auto min-w-[50px] text-[8px] font-black border-none justify-center px-1.5 rounded-none z-10 uppercase tracking-tighter transition-all bg-white shadow-sm"
                      :class="{
                        'bg-yellow-400 hover:bg-yellow-500 text-black border border-yellow-500':
                          row.productionMode === 'mode24Hr',
                        'bg-red-500 hover:bg-red-600 text-white border border-red-600':
                          row.productionMode === 'holiday',
                        'text-slate-300 hover:text-slate-500 border border-slate-200':
                          row.productionMode === 'normal',
                      }"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">{{ t('qa.productionModes.normal') }}</SelectItem>
                      <SelectItem value="mode24Hr">{{
                        t('qa.productionModes.mode24Hr')
                      }}</SelectItem>
                      <SelectItem value="holiday">{{ t('qa.productionModes.holiday') }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TableCell>

              <TableCell
                v-if="idx % 2 === 0"
                class="border-r border-slate-100 text-center p-1 text-slate-400"
                rowspan="2"
              >
                {{ row.dayOfWeek }}
              </TableCell>
              <TableCell
                class="border-r border-slate-100 text-center p-1 font-black"
                :class="row.shift === '1st' ? 'text-blue-600' : 'text-orange-600'"
                >{{ row.shift }}</TableCell
              >
              <TableCell
                class="border-r border-slate-100 p-0 transition-colors duration-200"
                :class="getGradeColor(row.grade)"
              >
                <Select v-model="row.grade">
                  <SelectTrigger
                    class="h-6 w-full text-[10px] border-none shadow-none text-center justify-center font-bold focus:ring-0 focus:ring-offset-0 bg-transparent px-1"
                    :class="row.productionMode === 'holiday' ? 'text-slate-400' : ''"
                  >
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="g in grades" :key="g" :value="g">
                      {{ g }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <!-- Ratios -->
              <TableCell class="border-r border-slate-100 p-0"
                ><Input
                  v-model="row.ratioUSS"
                  class="h-6 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
              /></TableCell>
              <TableCell class="border-r border-slate-100 p-0"
                ><Input
                  v-model="row.ratioCL"
                  class="h-6 text-[10px] border-none shadow-none text-center font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
              /></TableCell>
              <TableCell class="border-r border-slate-100 p-0"
                ><Input
                  v-model="row.ratioBK"
                  class="h-6 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
              /></TableCell>

              <!-- Targets -->
              <TableCell class="border-r border-slate-100 p-0"
                ><Input
                  v-model="row.productTarget"
                  class="h-6 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
              /></TableCell>
              <TableCell class="border-r border-slate-100 p-0"
                ><Input
                  v-model="row.clConsumption"
                  class="h-6 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
              /></TableCell>
              <TableCell class="border-r border-slate-100 p-0"
                ><Input
                  v-model="row.ratioBorC"
                  class="h-6 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
              /></TableCell>

              <!-- Plans -->
              <!-- Plans -->
              <TableCell class="border-r border-slate-100 p-0 w-44 bg-blue-50/20">
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="ghost"
                      class="h-6 w-full text-[10px] border-none shadow-none justify-center px-1 font-black text-blue-700"
                      :class="!getPlanPoolLabel(row, 1) && 'text-slate-400 font-normal'"
                    >
                      {{ getPlanPoolLabel(row, 1) || 'Select' }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-48 p-2" align="start">
                    <div class="space-y-2">
                      <div class="space-y-1">
                        <label class="text-xs font-bold text-slate-500">Pool</label>
                        <div class="grid grid-cols-4 gap-1">
                          <div
                            v-for="opt in plainPoolOptions"
                            :key="opt"
                            class="flex items-center gap-1.5 px-0.5 py-1 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                            @click.stop="togglePlanPool(row, 1, opt)"
                          >
                            <Checkbox
                              :checked="row.plan1Pool.includes(opt)"
                              @update:checked="() => {}"
                              class="h-3 w-3 rounded-full data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 flex-shrink-0"
                            />
                            <span
                              class="text-[10px] font-medium leading-none"
                              :class="
                                row.plan1Pool.includes(opt)
                                  ? 'font-bold text-blue-600'
                                  : 'text-slate-600'
                              "
                            >
                              {{ opt }}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="space-y-1">
                        <label class="text-xs font-bold text-slate-500">Grades</label>
                        <div class="grid grid-cols-2 gap-1">
                          <div
                            v-for="g in validPoolGrades"
                            :key="g"
                            class="flex items-center gap-2 px-1 py-1 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                            @click.stop="togglePlanGrade(row, 1, g)"
                          >
                            <Checkbox
                              :checked="row.plan1Grades.includes(g)"
                              @update:checked="() => {}"
                              class="h-4 w-4 rounded-full data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <span
                              class="text-[10px] font-medium leading-none"
                              :class="
                                row.plan1Grades.includes(g)
                                  ? 'font-bold text-blue-600'
                                  : 'text-slate-600'
                              "
                            >
                              {{ g }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>
              <TableCell class="border-r border-slate-100 p-0 w-24 bg-blue-50/20">
                <NumberField v-model="row.plan1Scoops" :min="0" class="w-full">
                  <NumberFieldContent>
                    <NumberFieldDecrement
                      class="h-6 w-6 p-0 flex items-center justify-center text-slate-400 hover:text-blue-600 border-r border-slate-100 rounded-none bg-transparent z-20"
                    />
                    <NumberFieldInput
                      class="h-6 text-[10px] border-none shadow-none text-center justify-center text-slate-500 font-bold focus-visible:ring-0 bg-transparent px-2"
                    />
                    <NumberFieldIncrement
                      class="h-6 w-6 p-0 flex items-center justify-center text-slate-400 hover:text-blue-600 border-l border-slate-100 rounded-none bg-transparent z-20"
                    />
                  </NumberFieldContent>
                </NumberField>
              </TableCell>

              <!-- Plan 2 -->
              <TableCell class="border-r border-slate-100 p-0 w-44 bg-blue-50/20">
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="ghost"
                      class="h-6 w-full text-[10px] border-none shadow-none justify-center px-1 font-black text-blue-700"
                      :class="!getPlanPoolLabel(row, 2) && 'text-slate-400 font-normal'"
                    >
                      {{ getPlanPoolLabel(row, 2) || 'Select' }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-48 p-2" align="start">
                    <div class="space-y-2">
                      <div class="space-y-1">
                        <label class="text-xs font-bold text-slate-500">Pool</label>
                        <div class="grid grid-cols-4 gap-1">
                          <div
                            v-for="opt in plainPoolOptions"
                            :key="opt"
                            class="flex items-center gap-1.5 px-0.5 py-1 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                            @click.stop="togglePlanPool(row, 2, opt)"
                          >
                            <Checkbox
                              :checked="row.plan2Pool.includes(opt)"
                              @update:checked="() => {}"
                              class="h-3 w-3 rounded-full data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 flex-shrink-0"
                            />
                            <span
                              class="text-[10px] font-medium leading-none"
                              :class="
                                row.plan2Pool.includes(opt)
                                  ? 'font-bold text-blue-600'
                                  : 'text-slate-600'
                              "
                            >
                              {{ opt }}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="space-y-1">
                        <label class="text-xs font-bold text-slate-500">Grades</label>
                        <div class="grid grid-cols-2 gap-1">
                          <div
                            v-for="g in validPoolGrades"
                            :key="g"
                            class="flex items-center gap-2 px-1 py-1 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                            @click.stop="togglePlanGrade(row, 2, g)"
                          >
                            <Checkbox
                              :checked="row.plan2Grades.includes(g)"
                              @update:checked="() => {}"
                              class="h-4 w-4 rounded-full data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <span
                              class="text-[10px] font-medium leading-none"
                              :class="
                                row.plan2Grades.includes(g)
                                  ? 'font-bold text-blue-600'
                                  : 'text-slate-600'
                              "
                            >
                              {{ g }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>
              <TableCell class="border-r border-slate-100 p-0 w-24 bg-blue-50/20">
                <NumberField v-model="row.plan2Scoops" :min="0" class="w-full">
                  <NumberFieldContent>
                    <NumberFieldDecrement
                      class="h-6 w-6 p-0 flex items-center justify-center text-slate-400 hover:text-blue-600 border-r border-slate-100 rounded-none bg-transparent z-20"
                    />
                    <NumberFieldInput
                      class="h-6 text-[10px] border-none shadow-none text-center justify-center text-slate-500 font-bold focus-visible:ring-0 bg-transparent px-2"
                    />
                    <NumberFieldIncrement
                      class="h-6 w-6 p-0 flex items-center justify-center text-slate-400 hover:text-blue-600 border-l border-slate-100 rounded-none bg-transparent z-20"
                    />
                  </NumberFieldContent>
                </NumberField>
              </TableCell>

              <!-- Plan 3 -->
              <TableCell class="border-r border-slate-100 p-0 w-44 bg-blue-50/20">
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="ghost"
                      class="h-6 w-full text-[10px] border-none shadow-none justify-center px-1 font-black text-blue-700"
                      :class="!getPlanPoolLabel(row, 3) && 'text-slate-400 font-normal'"
                    >
                      {{ getPlanPoolLabel(row, 3) || 'Select' }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-48 p-2" align="start">
                    <div class="space-y-2">
                      <div class="space-y-1">
                        <label class="text-xs font-bold text-slate-500">Pool</label>
                        <div class="grid grid-cols-4 gap-1">
                          <div
                            v-for="opt in plainPoolOptions"
                            :key="opt"
                            class="flex items-center gap-1.5 px-0.5 py-1 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                            @click.stop="togglePlanPool(row, 3, opt)"
                          >
                            <Checkbox
                              :checked="row.plan3Pool.includes(opt)"
                              @update:checked="() => {}"
                              class="h-3 w-3 rounded-full data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 flex-shrink-0"
                            />
                            <span
                              class="text-[10px] font-medium leading-none"
                              :class="
                                row.plan3Pool.includes(opt)
                                  ? 'font-bold text-blue-600'
                                  : 'text-slate-600'
                              "
                            >
                              {{ opt }}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="space-y-1">
                        <label class="text-xs font-bold text-slate-500">Grades</label>
                        <div class="grid grid-cols-2 gap-1">
                          <div
                            v-for="g in validPoolGrades"
                            :key="g"
                            class="flex items-center gap-2 px-1 py-1 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                            @click.stop="togglePlanGrade(row, 3, g)"
                          >
                            <Checkbox
                              :checked="row.plan3Grades.includes(g)"
                              @update:checked="() => {}"
                              class="h-4 w-4 rounded-full data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <span
                              class="text-[10px] font-medium leading-none"
                              :class="
                                row.plan3Grades.includes(g)
                                  ? 'font-bold text-blue-600'
                                  : 'text-slate-600'
                              "
                            >
                              {{ g }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>
              <TableCell class="border-r border-slate-100 p-0 w-24 bg-blue-50/20">
                <NumberField v-model="row.plan3Scoops" :min="0" class="w-full">
                  <NumberFieldContent>
                    <NumberFieldDecrement
                      class="h-6 w-6 p-0 flex items-center justify-center text-slate-400 hover:text-blue-600 border-r border-slate-100 rounded-none bg-transparent z-20"
                    />
                    <NumberFieldInput
                      class="h-6 text-[10px] border-none shadow-none text-center justify-center text-slate-500 font-bold focus-visible:ring-0 bg-transparent px-2"
                    />
                    <NumberFieldIncrement
                      class="h-6 w-6 p-0 flex items-center justify-center text-slate-400 hover:text-blue-600 border-l border-slate-100 rounded-none bg-transparent z-20"
                    />
                  </NumberFieldContent>
                </NumberField>
              </TableCell>

              <!-- Cutting -->
              <TableCell class="border-r border-slate-100 p-0"
                ><Input
                  v-model="row.cuttingPercent"
                  class="h-6 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
              /></TableCell>
              <TableCell class="border-r border-slate-100 p-0"
                ><Input
                  v-model="row.cuttingPalette"
                  class="h-6 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
              /></TableCell>

              <TableCell class="p-0 px-2"
                ><Input
                  v-model="row.remarks"
                  class="h-6 text-[10px] border-none shadow-none italic focus-visible:ring-0 focus-visible:ring-offset-0"
              /></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Pooling Detail Table (Segment 2) -->
      <div class="mt-8 space-y-4">
        <div class="flex items-center gap-2">
          <div class="w-1 h-5 bg-blue-500 rounded-full"></div>
          <h4 class="text-xs font-black uppercase tracking-widest text-slate-700">
            {{ t('qa.sections.poolPropertiesValidation') }}
          </h4>
        </div>

        <div class="overflow-hidden border border-slate-200 rounded-lg shadow-sm max-w-4xl">
          <Table class="text-[10px]">
            <TableHeader class="bg-slate-50">
              <TableRow>
                <TableHead class="w-16 border-r border-slate-200 font-black text-center">{{
                  t('qa.columns.poolNo')
                }}</TableHead>
                <TableHead class="w-20 border-r border-slate-200 font-black text-center">{{
                  t('qa.columns.grossTon')
                }}</TableHead>
                <TableHead class="w-20 border-r border-slate-200 font-black text-center">{{
                  t('qa.columns.netTon')
                }}</TableHead>
                <TableHead class="w-16 border-r border-slate-200 font-black text-center">{{
                  t('qa.columns.drc')
                }}</TableHead>
                <TableHead class="w-16 border-r border-slate-200 font-black text-center">{{
                  t('qa.columns.moist')
                }}</TableHead>
                <TableHead class="w-16 border-r border-slate-200 font-black text-center">{{
                  t('qa.columns.po')
                }}</TableHead>
                <TableHead class="w-16 border-r border-slate-200 font-black text-center">{{
                  t('qa.columns.pri')
                }}</TableHead>
                <TableHead class="w-24 border-r border-slate-200 font-black text-center">{{
                  t('qa.columns.date')
                }}</TableHead>
                <TableHead class="w-16 font-black text-center">{{
                  t('qa.columns.grade')
                }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="(p, idx) in plan.poolDetails"
                :key="idx"
                class="h-8 group hover:bg-blue-50/30"
              >
                <TableCell class="border-r border-slate-100 p-0"
                  ><Input
                    v-model="p.poolNo"
                    class="h-7 text-[10px] border-none shadow-none text-center font-black text-blue-600 focus-visible:ring-0 focus-visible:ring-offset-0"
                /></TableCell>
                <TableCell class="border-r border-slate-100 p-0"
                  ><Input
                    v-model="p.grossWeight"
                    class="h-7 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
                /></TableCell>
                <TableCell class="border-r border-slate-100 p-0"
                  ><Input
                    v-model="p.netWeight"
                    class="h-7 text-[10px] border-none shadow-none text-center font-bold text-slate-700 focus-visible:ring-0 focus-visible:ring-offset-0"
                /></TableCell>
                <TableCell class="border-r border-slate-100 p-0"
                  ><Input
                    v-model="p.drc"
                    class="h-7 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
                /></TableCell>
                <TableCell class="border-r border-slate-100 p-0"
                  ><Input
                    v-model="p.moisture"
                    class="h-7 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
                /></TableCell>
                <TableCell class="border-r border-slate-100 p-0"
                  ><Input
                    v-model="p.p0"
                    class="h-7 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
                /></TableCell>
                <TableCell class="border-r border-slate-100 p-0"
                  ><Input
                    v-model="p.pri"
                    class="h-7 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
                /></TableCell>
                <TableCell class="border-r border-slate-100 p-0 text-center">
                  <Popover>
                    <PopoverTrigger as-child>
                      <Button
                        variant="ghost"
                        class="h-7 w-full text-[10px] border-none shadow-none font-normal justify-center px-1"
                        :class="!p.clearDate && 'text-muted-foreground'"
                      >
                        {{ p.clearDate || 'Select' }}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        @update:model-value="(val: any) => (p.clearDate = formatDate(val))"
                      />
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell class="p-0 px-1">
                  <Popover>
                    <PopoverTrigger as-child>
                      <Button
                        variant="ghost"
                        class="h-7 w-full text-[10px] border-none shadow-none font-bold justify-center px-1"
                        :class="!p.grade?.length && 'text-slate-400'"
                      >
                        {{ p.grade?.length ? p.grade.join(' + ') : 'Select Grade' }}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-32 p-1" align="end">
                      <div class="space-y-0.5">
                        <div
                          v-for="g in validPoolGrades"
                          :key="g"
                          class="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                          @click.stop="togglePoolGrade(p, g)"
                        >
                          <Checkbox
                            :checked="p.grade.includes(g)"
                            @update:checked="() => {}"
                            class="h-4 w-4 rounded-full data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                          <span
                            class="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            :class="
                              p.grade.includes(g) ? 'font-bold text-blue-600' : 'text-slate-600'
                            "
                          >
                            {{ g }}
                          </span>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <!-- Actions Footer -->
      <div class="flex items-center justify-between pt-6 border-t border-slate-100">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2 border-r border-slate-200 pr-6">
            <label class="text-[10px] font-black text-slate-400 uppercase">{{
              t('qa.footer.issueBy')
            }}</label>
            <Input
              class="h-8 w-40 text-xs font-bold bg-slate-50 border-none"
              :model-value="authStore.user?.displayName || authStore.user?.username || '-'"
              readonly
            />
          </div>
          <div class="flex items-center gap-2">
            <label class="text-[10px] font-black text-slate-400 uppercase">{{
              t('qa.footer.verifiedBy')
            }}</label>
            <Input
              class="h-8 w-40 text-xs font-bold bg-slate-50 border-none"
              model-value="รอการอนุมัติ"
              readonly
            />
          </div>
        </div>

        <div class="flex items-center gap-3 no-print">
          <Button variant="ghost" class="h-10 gap-2 text-slate-500" @click="handleCancel">
            <X class="w-4 h-4" />
            Cancel
          </Button>

          <Button
            variant="outline"
            class="h-10 gap-2 text-slate-600 border-dashed"
            @click="isResetAlertOpen = true"
          >
            <RotateCcw class="w-4 h-4" />
            Reset
          </Button>

          <div class="flex-1"></div>

          <Button
            v-if="isEditMode"
            variant="destructive"
            class="h-10 gap-2 mr-2"
            @click="isDeleteAlertOpen = true"
            :disabled="isSubmitting"
          >
            <Trash2 class="w-4 h-4" />
            Delete
          </Button>
          <Button
            @click="handleSave"
            :disabled="isSubmitting"
            class="h-10 gap-2 font-bold px-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
          >
            <Save class="w-4 h-4" />
            {{ isSubmitting ? t('common.loading') : isEditMode ? 'Update Changes' : 'Create Plan' }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="isDeleteAlertOpen" @update:open="isDeleteAlertOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the Raw Material Plan
            <span class="font-bold text-red-600">{{ plan.planNo }}</span> and remove data from our
            servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            @click="handleDelete"
            class="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            Delete Plan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <!-- Reset Confirmation Dialog -->
    <AlertDialog :open="isResetAlertOpen" @update:open="isResetAlertOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Form?</AlertDialogTitle>
          <AlertDialogDescription>
            This will revert all fields to their {{ isEditMode ? 'initial' : 'default' }} values.
            Any unsaved changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="handleReset"> Continue Reset </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
}

/* Force border collapsing for table looks */
:deep(table) {
  border-collapse: collapse;
}

:deep(th),
:deep(td) {
  padding: 0;
}

/* Chrome/Safari Hide scrollbar arrows/buttons if desired */
::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
</style>

<!-- Global print styles to force portrait and scaling -->
<style>
@media print {
  @page {
    size: A4 portrait !important;
    margin: 3mm !important;
  }

  /* Hide everything by default */
  html,
  body {
    width: 210mm !important;
    height: 297mm !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    visibility: hidden !important;
    background: white !important;
  }

  /* Only show our target area */
  .raw-material-plan-print-container,
  .raw-material-plan-print-container * {
    visibility: visible !important;
  }

  .raw-material-plan-print-container {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    display: block !important;
    width: 290mm !important; /* Design width */
    zoom: 0.72 !important; /* Scaling to fit A4 */
    transform-origin: top left;
    margin: 0 !important;
    padding: 2mm !important;
    box-shadow: none !important;
    border: none !important;
    background: white !important;
    max-width: none !important;
  }

  /* Force table layout to fit the zoomed width */
  .raw-material-plan-print-container table {
    width: 100% !important;
    table-layout: fixed !important;
    border-collapse: collapse !important;
  }

  .raw-material-plan-print-container th,
  .raw-material-plan-print-container td {
    padding: 2px 1px !important;
    font-size: 12px !important;
    border: 1px solid #000 !important;
    word-break: break-all !important;
    height: auto !important;
  }

  /* Full 19-column precise calculation for A4 Portrait (290mm design width) */
  .raw-material-plan-print-container table th:nth-child(1),
  .raw-material-plan-print-container table td:nth-child(1) {
    width: 17mm !important;
  } /* Date */
  .raw-material-plan-print-container table th:nth-child(2),
  .raw-material-plan-print-container table td:nth-child(2) {
    width: 5mm !important;
  } /* Day */
  .raw-material-plan-print-container table th:nth-child(3),
  .raw-material-plan-print-container table td:nth-child(3) {
    width: 5mm !important;
  } /* Shift */
  .raw-material-plan-print-container table th:nth-child(4),
  .raw-material-plan-print-container table td:nth-child(4) {
    width: 13mm !important;
  } /* Grade */

  .raw-material-plan-print-container table th:nth-child(5),
  .raw-material-plan-print-container table td:nth-child(5) {
    width: 5mm !important;
  } /* USS */
  .raw-material-plan-print-container table th:nth-child(6),
  .raw-material-plan-print-container table td:nth-child(6) {
    width: 5mm !important;
  } /* CL */
  .raw-material-plan-print-container table th:nth-child(7),
  .raw-material-plan-print-container table td:nth-child(7) {
    width: 5mm !important;
  } /* BK */

  .raw-material-plan-print-container table th:nth-child(8),
  .raw-material-plan-print-container table td:nth-child(8) {
    width: 8mm !important;
  } /* Target */
  .raw-material-plan-print-container table th:nth-child(9),
  .raw-material-plan-print-container table td:nth-child(9) {
    width: 8mm !important;
  } /* CL Cons */
  .raw-material-plan-print-container table th:nth-child(10),
  .raw-material-plan-print-container table td:nth-child(10) {
    width: 8mm !important;
  } /* Ratio B/C */

  /* Allocation plan sets EXPANDED for V3 */
  .raw-material-plan-print-container table th:nth-child(11),
  .raw-material-plan-print-container table td:nth-child(11),
  .raw-material-plan-print-container table th:nth-child(13),
  .raw-material-plan-print-container table td:nth-child(13),
  .raw-material-plan-print-container table th:nth-child(15),
  .raw-material-plan-print-container table td:nth-child(15) {
    width: 37mm !important;
  } /* Pool Label */

  .raw-material-plan-print-container table th:nth-child(12),
  .raw-material-plan-print-container table td:nth-child(12),
  .raw-material-plan-print-container table th:nth-child(14),
  .raw-material-plan-print-container table td:nth-child(14),
  .raw-material-plan-print-container table th:nth-child(16),
  .raw-material-plan-print-container table td:nth-child(16) {
    width: 8mm !important;
  } /* Scoops */

  /* Cutting & Docs */
  .raw-material-plan-print-container table th:nth-child(17),
  .raw-material-plan-print-container table td:nth-child(17) {
    width: 10mm !important;
  } /* % */
  .raw-material-plan-print-container table th:nth-child(18),
  .raw-material-plan-print-container table td:nth-child(18) {
    width: 12mm !important;
  } /* Plt/Shft */
  .raw-material-plan-print-container table th:nth-child(19),
  .raw-material-plan-print-container table td:nth-child(19) {
    width: auto !important;
  } /* Remarks */

  /* Inputs as text in print */
  .raw-material-plan-print-container input,
  .raw-material-plan-print-container select {
    border: none !important;
    background: transparent !important;
    height: auto !important;
    min-height: 0 !important;
    padding: 0 !important;
    font-size: 12px !important;
  }

  .raw-material-plan-print-container button {
    border: none !important;
    background: transparent !important;
    padding: 0 !important;
    box-shadow: none !important;
    justify-content: center !important;
    font-size: 11px !important;
  }

  /* Adjust header backgrounds for print */
  .raw-material-plan-print-container thead tr:first-child th {
    background-color: #3b82f6 !important;
    color: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
