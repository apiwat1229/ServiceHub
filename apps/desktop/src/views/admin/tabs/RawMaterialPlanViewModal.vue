<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/services/api';
import { format } from 'date-fns';
import { Loader2, Printer, X } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';

const props = defineProps<{
  planId: string | null;
  open: boolean;
}>();

const emit = defineEmits(['update:open']);

const plan = ref<any>(null);
const isLoading = ref(false);

const fetchPlanDetails = async (id: string) => {
  isLoading.value = true;
  try {
    const response = await api.get(`/raw-material-plans/${id}`);
    plan.value = response.data;
  } catch (error) {
    console.error('Failed to fetch plan details:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  if (props.planId) {
    fetchPlanDetails(props.planId);
  }
});

const handlePrint = () => {
  window.print();
};

const formatDate = (date: string | Date) => {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd-MMM-yy');
  } catch (e) {
    return typeof date === 'string' && date.includes('T') ? date.split('T')[0] : date;
  }
};

const getGradeColor = (grade: string) => {
  if (!grade) return '';
  const g = grade.toUpperCase();
  if (g.includes('AA')) return 'bg-emerald-50 text-emerald-700';
  if (g.includes('A')) return 'bg-blue-50 text-blue-700';
  if (g.includes('B')) return 'bg-amber-50 text-amber-700';
  if (g.includes('C')) return 'bg-orange-50 text-orange-700';
  return 'bg-slate-50 text-slate-600';
};
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="max-w-[98vw] w-full h-[96vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl"
    >
      <DialogHeader class="sr-only">
        <DialogTitle>Raw Material Plan View</DialogTitle>
        <DialogDescription>
          Detailed view of the Raw Material Plan for printing and verification.
        </DialogDescription>
      </DialogHeader>
      <!-- Non-printable Header -->
      <div
        class="sticky top-0 z-50 flex items-center justify-between p-4 bg-white border-b no-print"
      >
        <div class="flex items-center gap-3">
          <Badge
            variant="outline"
            class="font-black py-1 px-3 uppercase tracking-widest text-[10px]"
          >
            Preview Mode (A4 Landscape)
          </Badge>
        </div>
        <div class="flex items-center gap-2">
          <Button
            @click="handlePrint"
            variant="default"
            class="h-9 gap-2 font-bold px-6 bg-blue-600 hover:bg-blue-700"
          >
            <Printer class="w-4 h-4" />
            Print This Plan
          </Button>
          <Button @click="emit('update:open', false)" variant="ghost" size="icon" class="h-9 w-9">
            <X class="w-4 h-4" />
          </Button>
        </div>
      </div>

      <!-- Printable Content Area -->
      <div class="p-[10mm] bg-slate-50 min-h-full print:bg-white print:p-0">
        <div v-if="isLoading" class="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 class="w-10 h-10 animate-spin text-primary/40" />
          <span class="text-sm font-bold text-slate-400 animate-pulse">Fetching Plan Data...</span>
        </div>

        <div
          v-else-if="plan"
          class="a4-container bg-white shadow-xl mx-auto print:shadow-none print:w-full"
        >
          <div class="p-8 space-y-6">
            <!-- Header Segment -->
            <div class="flex items-start justify-between">
              <div class="space-y-1">
                <h1 class="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                  Raw Material Plan
                </h1>
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  YTRC Rubber Production Control
                </p>
              </div>
              <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-right">
                <div class="flex flex-col">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                    >Plan No.</span
                  >
                  <span class="text-sm font-black text-blue-600">{{ plan.planNo }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                    >Revision</span
                  >
                  <span class="text-sm font-black text-slate-700 font-mono"
                    >#{{ plan.revisionNo }}</span
                  >
                </div>
                <div class="flex flex-col">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                    >Issued Date</span
                  >
                  <span class="text-xs font-bold text-slate-800">{{
                    formatDate(plan.issuedDate)
                  }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                    >Ref. Production</span
                  >
                  <span class="text-xs font-bold text-slate-600">{{ plan.refProductionNo }}</span>
                </div>
              </div>
            </div>

            <!-- Main Table -->
            <div class="overflow-hidden border border-slate-950 rounded-[4px]">
              <Table class="border-collapse text-[10px]">
                <TableHeader>
                  <TableRow class="bg-slate-950 hover:bg-slate-950 border-none h-8">
                    <TableHead
                      colspan="4"
                      class="text-center text-white font-black border-r border-slate-700 uppercase tracking-widest bg-amber-600/90"
                      >Production Plan</TableHead
                    >
                    <TableHead
                      colspan="3"
                      class="text-center text-white font-black border-r border-slate-700 uppercase tracking-widest bg-slate-600/90"
                      >Ratios</TableHead
                    >
                    <TableHead
                      colspan="3"
                      class="text-center text-white font-black border-r border-slate-700 uppercase tracking-widest bg-slate-700/90"
                      >Targets</TableHead
                    >
                    <TableHead
                      colspan="6"
                      class="text-center text-white font-black border-r border-slate-700 uppercase tracking-widest bg-blue-700/90"
                      >CL Allocation Plan</TableHead
                    >
                    <TableHead
                      colspan="2"
                      class="text-center text-white font-black border-r border-slate-700 uppercase tracking-widest bg-indigo-700/90"
                      >Cutting</TableHead
                    >
                    <TableHead
                      class="text-center text-white font-black uppercase tracking-widest bg-slate-800/90"
                      >Docs</TableHead
                    >
                  </TableRow>
                  <TableRow
                    class="bg-slate-50 hover:bg-slate-50 text-[9px] font-black text-slate-600 align-middle"
                  >
                    <TableHead class="border-r border-slate-950 w-24 text-center">Date</TableHead>
                    <TableHead class="border-r border-slate-950 w-10 text-center px-1"
                      >Day</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-12 text-center">Shift</TableHead>
                    <TableHead
                      class="border-r border-slate-950 w-20 text-center font-black text-slate-900"
                      >Grade</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-12 text-center">USS</TableHead>
                    <TableHead class="border-r border-slate-950 w-12 text-center">CL</TableHead>
                    <TableHead class="border-r border-slate-950 w-12 text-center">BK</TableHead>
                    <TableHead class="border-r border-slate-950 w-14 text-center">Target</TableHead>
                    <TableHead class="border-r border-slate-950 w-14 text-center px-0.5"
                      >CL Cons.</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-14 text-center px-0.5"
                      >Ratio B/C</TableHead
                    >
                    <TableHead
                      colspan="2"
                      class="border-r border-slate-950 text-center bg-blue-50/50"
                      >#1 (P/S)</TableHead
                    >
                    <TableHead
                      colspan="2"
                      class="border-r border-slate-950 text-center bg-blue-50/50"
                      >#2 (P/S)</TableHead
                    >
                    <TableHead
                      colspan="2"
                      class="border-r border-slate-950 text-center bg-blue-50/50"
                      >#3 (P/S)</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-14 text-center">%</TableHead>
                    <TableHead class="border-r border-slate-950 w-14 text-center px-0.5"
                      >Plt/Shft</TableHead
                    >
                    <TableHead class="text-center">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="(row, idx) in plan.rows"
                    :key="idx"
                    class="h-7 hover:bg-transparent border-b border-slate-950 last:border-0"
                  >
                    <TableCell
                      v-if="Number(idx) % 2 === 0"
                      class="border-r border-slate-950 text-center font-bold px-1"
                      rowspan="2"
                    >
                      {{ formatDate(row.date) }}
                    </TableCell>
                    <TableCell
                      v-if="Number(idx) % 2 === 0"
                      class="border-r border-slate-950 text-center font-bold text-slate-400"
                      rowspan="2"
                    >
                      {{ row.dayOfWeek }}
                    </TableCell>
                    <TableCell
                      class="border-r border-slate-950 text-center font-black text-[9px]"
                      :class="row.shift === '1st' ? 'text-blue-600' : 'text-orange-600'"
                    >
                      {{ row.shift }}
                    </TableCell>
                    <TableCell
                      class="border-r border-slate-950 text-center font-black"
                      :class="getGradeColor(row.grade)"
                    >
                      {{ row.grade || '-' }}
                    </TableCell>
                    <TableCell class="border-r border-slate-100 text-center">{{
                      row.ratioUSS
                    }}</TableCell>
                    <TableCell class="border-r border-slate-100 text-center font-bold">{{
                      row.ratioCL
                    }}</TableCell>
                    <TableCell class="border-r border-slate-950 text-center">{{
                      row.ratioBK
                    }}</TableCell>
                    <TableCell class="border-r border-slate-100 text-center">{{
                      row.productTarget
                    }}</TableCell>
                    <TableCell class="border-r border-slate-100 text-center">{{
                      row.clConsumption
                    }}</TableCell>
                    <TableCell class="border-r border-slate-950 text-center">{{
                      row.ratioBorC
                    }}</TableCell>
                    <TableCell class="border-r border-slate-100 text-center bg-blue-50/10">{{
                      row.plan1Pool
                    }}</TableCell>
                    <TableCell
                      class="border-r border-slate-950 text-center font-bold text-blue-700 bg-blue-50/10"
                      >{{ row.plan1Scoops }}</TableCell
                    >
                    <TableCell class="border-r border-slate-100 text-center bg-blue-50/10">{{
                      row.plan2Pool
                    }}</TableCell>
                    <TableCell
                      class="border-r border-slate-950 text-center font-bold text-blue-700 bg-blue-50/10"
                      >{{ row.plan2Scoops }}</TableCell
                    >
                    <TableCell class="border-r border-slate-100 text-center bg-blue-50/10">{{
                      row.plan3Pool
                    }}</TableCell>
                    <TableCell
                      class="border-r border-slate-950 text-center font-bold text-blue-700 bg-blue-50/10"
                      >{{ row.plan3Scoops }}</TableCell
                    >
                    <TableCell class="border-r border-slate-100 text-center">{{
                      row.cuttingPercent
                    }}</TableCell>
                    <TableCell class="border-r border-slate-950 text-center font-bold">{{
                      row.cuttingPalette
                    }}</TableCell>
                    <TableCell class="px-2 italic text-slate-500">{{
                      row.remarks || '-'
                    }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <!-- Pool Details Segment -->
            <div class="space-y-3 pt-4">
              <h4
                class="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2"
              >
                <span class="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Pool Properties & Validation
              </h4>
              <div class="overflow-hidden border border-slate-950 rounded-[4px] w-fit">
                <Table class="text-[9px]">
                  <TableHeader class="bg-slate-50">
                    <TableRow class="h-7 border-b border-slate-950">
                      <TableHead
                        class="w-14 border-r border-slate-950 font-black text-center text-slate-900"
                        >Pool No.</TableHead
                      >
                      <TableHead
                        class="w-16 border-r border-slate-950 font-black text-center text-slate-900"
                        >Gross (T)</TableHead
                      >
                      <TableHead
                        class="w-16 border-r border-slate-950 font-black text-center text-slate-900"
                        >Net (T)</TableHead
                      >
                      <TableHead
                        class="w-12 border-r border-slate-950 font-black text-center text-slate-900"
                        >DRC %</TableHead
                      >
                      <TableHead
                        class="w-12 border-r border-slate-950 font-black text-center text-slate-900"
                        >Moist</TableHead
                      >
                      <TableHead
                        class="w-12 border-r border-slate-950 font-black text-center text-slate-900"
                        >P0</TableHead
                      >
                      <TableHead
                        class="w-12 border-r border-slate-950 font-black text-center text-slate-900"
                        >PRI</TableHead
                      >
                      <TableHead
                        class="w-20 border-r border-slate-950 font-black text-center text-slate-900"
                        >Clear Date</TableHead
                      >
                      <TableHead class="w-24 font-black text-center text-slate-900"
                        >Grade</TableHead
                      >
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow
                      v-for="(p, idx) in plan.poolDetails"
                      :key="idx"
                      class="h-6 hover:bg-transparent border-b border-slate-950 last:border-0"
                    >
                      <TableCell
                        class="border-r border-slate-950 text-center font-black text-blue-700"
                        >{{ p.poolNo }}</TableCell
                      >
                      <TableCell class="border-r border-slate-950 text-center">{{
                        p.grossWeight
                      }}</TableCell>
                      <TableCell class="border-r border-slate-950 text-center font-bold">{{
                        p.netWeight
                      }}</TableCell>
                      <TableCell class="border-r border-slate-950 text-center">{{
                        p.drc
                      }}</TableCell>
                      <TableCell class="border-r border-slate-950 text-center">{{
                        p.moisture
                      }}</TableCell>
                      <TableCell class="border-r border-slate-950 text-center">{{
                        p.p0
                      }}</TableCell>
                      <TableCell class="border-r border-slate-950 text-center">{{
                        p.pri
                      }}</TableCell>
                      <TableCell class="border-r border-slate-950 text-center">{{
                        p.clearDate || '-'
                      }}</TableCell>
                      <TableCell class="text-center font-bold px-2">{{
                        p.grade ? (Array.isArray(p.grade) ? p.grade.join(' + ') : p.grade) : '-'
                      }}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <!-- Signatures etc -->
            <div class="flex items-center justify-between pt-10 px-2">
              <div
                class="flex flex-col items-center gap-1 border-t border-slate-300 pt-1 w-48 text-center leading-tight"
              >
                <span class="text-xs font-bold text-slate-800">{{ plan.creator }}</span>
                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                  >Issued By</span
                >
              </div>
              <div
                class="flex flex-col items-center gap-1 border-t border-slate-300 pt-1 w-48 text-center leading-tight"
              >
                <span class="text-xs font-bold text-slate-300 italic">Waiting Approval</span>
                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                  >Verified By</span
                >
              </div>
              <div
                class="flex flex-col items-center gap-1 border-t border-slate-300 pt-1 w-48 text-center leading-tight"
              >
                <span class="text-xs font-bold text-slate-300 opacity-0">.</span>
                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                  >Factory Manager</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.a4-container {
  width: 100%;
  max-width: 297mm;
  min-height: 210mm;
  background: white;
  position: relative;
}

@media print {
  @page {
    size: A4 landscape;
    margin: 0;
  }

  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .no-print {
    display: none !important;
  }

  .print\:shadow-none {
    box-shadow: none !important;
  }

  .print\:p-0 {
    padding: 0 !important;
  }

  .bg-slate-50 {
    background-color: #f8fafc !important;
  }
}

:deep(table) {
  border-collapse: collapse !important;
}

:deep(th),
:deep(td) {
  padding: 0 !important;
  border-color: #000 !important;
}
</style>
