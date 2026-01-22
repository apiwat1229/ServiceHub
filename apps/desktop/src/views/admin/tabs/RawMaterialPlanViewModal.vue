<script setup lang="ts">
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
import { Loader2, X } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  planId: string | null;
  open: boolean;
  autoPrint?: boolean;
}>();

const emit = defineEmits(['update:open']);

const plan = ref<any>(null);
const isLoading = ref(false);
const isProcessing = ref(false);

const planUrl = computed(() => {
  if (!plan.value?.id) return '';
  return `${window.location.origin}/#/admin/qa?tab=raw-material-plan-list&id=${plan.value.id}`;
});

const fetchPlanDetails = async (id: string) => {
  isLoading.value = true;
  if (props.autoPrint) {
    isProcessing.value = true;
  }
  try {
    const response = await api.get(`/raw-material-plans/${id}`);
    plan.value = response.data;
  } catch (error) {
    console.error('Failed to fetch plan details:', error);
  } finally {
    isLoading.value = false;
    if (plan.value && props.autoPrint) {
      nextTick(() => {
        handlePrint();
      });
    }
  }
};

watch(
  () => props.planId,
  (newId) => {
    if (newId) {
      fetchPlanDetails(newId);
    }
  }
);

onMounted(() => {
  if (props.planId) {
    fetchPlanDetails(props.planId);
  }
});

const handlePrint = async () => {
  if (props.autoPrint) {
    isProcessing.value = true;
  }

  // Small delay to ensure rendering completion before print dialog opens
  setTimeout(async () => {
    // @ts-ignore
    if (window.ipcRenderer) {
      // @ts-ignore
      const title = props.planId ? plan.value?.planNo : 'Raw Material Plan';

      // Temporarily change document title for PDF metadata (appears in PDF viewer toolbar)
      const originalTitle = document.title;
      document.title = 'Preview';

      // @ts-ignore
      const success = await window.ipcRenderer.invoke('preview-window', title);

      // Restore original title
      document.title = originalTitle;

      if (success && props.autoPrint) {
        emit('update:open', false);
      }
      isProcessing.value = false;
    } else {
      window.print();
      isProcessing.value = false;
      if (props.autoPrint) {
        window.onafterprint = () => {
          emit('update:open', false);
          window.onafterprint = null;
        };
      }
    }
  }, 500);
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
  if (!grade) return 'font-black';
  const g = grade.toUpperCase();
  if (g.includes('P0241')) return 'bg-[#ff00ff] text-white font-black';
  if (g.includes('P0263')) return 'bg-[#b3d9ff] text-slate-900 font-black';
  if (g.includes('P0251')) return 'bg-[#c3e6cb] text-emerald-900 font-black';
  if (g.includes('H0276')) return 'bg-[#ffeeba] text-amber-900 font-black';

  // Fallbacks for generic grades
  if (g.includes('AA')) return 'bg-[#c3e6cb] text-emerald-900 font-black';
  if (g.includes('A')) return 'bg-[#b3d9ff] text-slate-900 font-black';
  if (g.includes('B')) return 'bg-[#ffeeba] text-amber-900 font-black';
  if (g.includes('C')) return 'bg-[#f8d7da] text-red-900 font-black';
  return 'font-black';
};

const getPlanPoolLabel = (row: any, planIndex: number) => {
  const pools = row[`plan${planIndex}Pool`];
  const grades = row[`plan${planIndex}Grades`];

  let poolStr = '';
  if (typeof pools === 'string') {
    poolStr = pools;
  } else if (Array.isArray(pools)) {
    poolStr = pools.join(' / ');
  }

  if (!poolStr) return '-';

  let gradeStr = '';
  if (typeof grades === 'string' && grades) {
    gradeStr = ` (${grades})`;
  } else if (Array.isArray(grades) && grades.length) {
    gradeStr = ` (${grades.join('+')})`;
  }

  return `${poolStr}${gradeStr}`;
};
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      :class="`max-w-[850px] w-full h-[96vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl transition-opacity duration-300 ${autoPrint ? 'invisible pointer-events-none' : ''}`"
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
          <h3 class="text-lg font-black text-slate-800 uppercase tracking-tight">
            Preview {{ plan?.planNo }}
          </h3>
        </div>
        <div class="flex items-center gap-2">
          <Button @click="emit('update:open', false)" variant="ghost" size="icon" class="h-9 w-9">
            <X class="w-4 h-4" />
          </Button>
        </div>
      </div>

      <!-- Printable Content Area -->
      <div class="p-[10mm] bg-slate-50 min-h-full print:bg-white print:p-0">
        <div
          v-if="isLoading"
          class="flex flex-col items-center justify-center h-64 gap-3 print:hidden"
        >
          <Loader2 class="w-10 h-10 animate-spin text-primary/40" />
          <span class="text-sm font-bold text-slate-400 animate-pulse">
            Fetching Plan Data...
          </span>
        </div>

        <div
          v-if="plan"
          class="a4-container bg-white shadow-xl mx-auto print:shadow-none print:w-full raw-material-plan-print-preview"
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
                      class="text-center text-white font-black border-r border-slate-700 uppercase tracking-widest bg-amber-600"
                      >Production Plan</TableHead
                    >
                    <TableHead
                      colspan="3"
                      class="text-center text-white font-black border-r border-slate-700 uppercase tracking-widest bg-slate-600"
                      >Ratios</TableHead
                    >
                    <TableHead
                      colspan="3"
                      class="text-center text-white font-black border-r border-slate-700 uppercase tracking-widest bg-slate-700"
                      >Targets</TableHead
                    >
                    <TableHead
                      colspan="6"
                      class="text-center text-white font-black border-r border-slate-700 uppercase tracking-widest bg-blue-700"
                      >CL Allocation Plan</TableHead
                    >
                    <TableHead
                      colspan="2"
                      class="text-center text-white font-black border-r border-slate-700 uppercase tracking-widest bg-indigo-700"
                      >Cutting</TableHead
                    >
                    <TableHead
                      class="text-center text-white font-black uppercase tracking-widest bg-slate-800"
                      >Docs</TableHead
                    >
                  </TableRow>
                  <TableRow
                    class="bg-slate-50 hover:bg-slate-50 text-[9px] font-black text-slate-600 align-middle"
                  >
                    <TableHead class="border-r border-slate-950 w-[65px] text-center px-1 col-date"
                      >Date</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-[25px] text-center px-0.5 col-day"
                      >Day</TableHead
                    >
                    <TableHead
                      class="border-r border-slate-950 w-[30px] text-center px-0.5 col-shift"
                      >Shift</TableHead
                    >
                    <TableHead
                      class="border-r border-slate-950 w-[60px] text-center font-black text-slate-900 px-1 col-grade"
                      >Grade</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-[25px] text-center px-0.5 col-uss"
                      >USS</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-[25px] text-center px-0.5 col-cl"
                      >CL</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-[25px] text-center px-0.5 col-bk"
                      >BK</TableHead
                    >
                    <TableHead
                      class="border-r border-slate-950 w-[35px] text-center px-0.5 col-target"
                      >Target</TableHead
                    >
                    <TableHead
                      class="border-r border-slate-950 w-[35px] text-center px-0.5 col-cons"
                      >CL Cons.</TableHead
                    >
                    <TableHead
                      class="border-r border-slate-950 w-[35px] text-center px-0.5 col-ratio-bc"
                      >Ratio B/C</TableHead
                    >
                    <TableHead
                      colspan="2"
                      class="border-r border-slate-950 text-center bg-blue-50/50 min-w-[80px] col-plan-header"
                      >#1 (P/S)</TableHead
                    >
                    <TableHead
                      colspan="2"
                      class="border-r border-slate-950 text-center bg-blue-50/50 min-w-[80px] col-plan-header"
                      >#2 (P/S)</TableHead
                    >
                    <TableHead
                      colspan="2"
                      class="border-r border-slate-950 text-center bg-blue-50/50 min-w-[80px] col-plan-header"
                      >#3 (P/S)</TableHead
                    >
                    <TableHead
                      class="border-r border-slate-950 w-[30px] text-center px-0.5 col-percent"
                      >%</TableHead
                    >
                    <TableHead
                      class="border-r border-slate-950 w-[40px] text-center px-0.5 col-pallet"
                      >Plt/Shft</TableHead
                    >
                    <TableHead class="text-center min-w-[100px] col-remarks">Remarks</TableHead>
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
                      class="border-r border-slate-950 text-center font-bold px-1 relative !overflow-visible col-date"
                      rowspan="2"
                    >
                      <div class="py-1">
                        {{ formatDate(row.date) }}
                      </div>

                      <!-- Production Mode Indicator: Centered on the horizontal line between days -->
                      <!-- Fixed for both Preview and Print visibility -->
                      <div
                        v-if="row.productionMode !== 'normal'"
                        class="absolute bottom-0 left-0 w-full flex justify-center translate-y-1/2 z-[100]"
                      >
                        <div
                          v-if="row.productionMode === 'mode24Hr'"
                          class="bg-yellow-400 text-black text-[7.5px] font-black px-2 py-0.5 uppercase shadow-sm border border-yellow-500 whitespace-nowrap"
                          style="-webkit-print-color-adjust: exact; print-color-adjust: exact"
                        >
                          24 Hour
                        </div>
                        <div
                          v-else-if="row.productionMode === 'holiday'"
                          class="bg-red-500 text-white text-[7.5px] font-black px-2 py-0.5 uppercase shadow-sm border border-red-600 whitespace-nowrap"
                          style="-webkit-print-color-adjust: exact; print-color-adjust: exact"
                        >
                          Holiday
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      v-if="Number(idx) % 2 === 0"
                      class="border-r border-slate-950 text-center font-bold text-slate-400 col-day"
                      rowspan="2"
                    >
                      {{ row.dayOfWeek }}
                    </TableCell>

                    <TableCell
                      class="border-r border-slate-950 text-center font-black text-[9px] col-shift"
                      :class="row.shift === '1st' ? 'text-blue-600' : 'text-orange-600'"
                    >
                      {{ row.shift }}
                    </TableCell>
                    <TableCell
                      class="border-r border-slate-950 text-center p-0 transition-colors duration-200 col-grade"
                      :class="getGradeColor(row.grade)"
                    >
                      <div
                        class="h-full flex items-center justify-center min-h-[24px] font-black"
                        :class="row.productionMode === 'holiday' ? 'text-slate-400' : ''"
                      >
                        {{ row.grade || '-' }}
                      </div>
                    </TableCell>
                    <TableCell class="border-r border-slate-100 text-center col-uss">{{
                      row.ratioUSS
                    }}</TableCell>
                    <TableCell class="border-r border-slate-100 text-center font-bold col-cl">{{
                      row.ratioCL
                    }}</TableCell>
                    <TableCell class="border-r border-slate-950 text-center col-bk">{{
                      row.ratioBK
                    }}</TableCell>
                    <TableCell class="border-r border-slate-100 text-center col-target">{{
                      row.productTarget
                    }}</TableCell>
                    <TableCell class="border-r border-slate-100 text-center col-cons">{{
                      row.clConsumption
                    }}</TableCell>
                    <TableCell class="border-r border-slate-950 text-center col-ratio-bc">{{
                      row.ratioBorC
                    }}</TableCell>
                    <TableCell
                      class="border-r border-slate-100 text-center bg-blue-50/10 text-[9px] px-0.5 col-plan-label"
                      >{{ getPlanPoolLabel(row, 1) }}</TableCell
                    >
                    <TableCell
                      class="border-r border-slate-950 text-center font-bold text-blue-700 bg-blue-50/10 w-[25px] col-plan-scoops"
                      >{{ row.plan1Scoops }}</TableCell
                    >
                    <TableCell
                      class="border-r border-slate-100 text-center bg-blue-50/10 text-[9px] px-0.5 col-plan-label"
                      >{{ getPlanPoolLabel(row, 2) }}</TableCell
                    >
                    <TableCell
                      class="border-r border-slate-950 text-center font-bold text-blue-700 bg-blue-50/10 w-[25px] col-plan-scoops"
                      >{{ row.plan2Scoops }}</TableCell
                    >
                    <TableCell
                      class="border-r border-slate-100 text-center bg-blue-50/10 text-[9px] px-0.5 col-plan-label"
                      >{{ getPlanPoolLabel(row, 3) }}</TableCell
                    >
                    <TableCell
                      class="border-r border-slate-950 text-center font-bold text-blue-700 bg-blue-50/10 w-[25px] col-plan-scoops"
                      >{{ row.plan3Scoops }}</TableCell
                    >
                    <TableCell class="border-r border-slate-100 text-center col-percent">{{
                      row.cuttingPercent
                    }}</TableCell>
                    <TableCell class="border-r border-slate-950 text-center font-bold col-pallet">{{
                      row.cuttingPalette
                    }}</TableCell>
                    <TableCell class="px-2 italic text-slate-500 col-remarks text-center">{{
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
              <div
                class="overflow-hidden border border-slate-950 rounded-[4px] w-full pool-prop-container"
              >
                <Table class="text-[9px] pool-prop-table">
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
            <div class="flex items-end justify-between pt-10 px-2 min-h-[180px]">
              <div class="flex flex-col items-center w-52 text-center">
                <div class="flex flex-col items-center justify-end h-40 w-full leading-tight">
                  <div class="w-full border-t border-slate-300 pt-3 flex flex-col items-center">
                    <span class="text-xs font-bold text-slate-800">{{ plan.creator }}</span>
                    <span
                      class="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1"
                      >Issued By</span
                    >
                    <span class="text-[8px] text-slate-400 mt-1"
                      >Date: {{ formatDate(plan.issuedDate) }}</span
                    >
                  </div>
                </div>
              </div>
              <div class="flex flex-col items-center w-52 text-center">
                <div class="flex flex-col items-center justify-end h-40 w-full leading-tight">
                  <div class="w-full border-t border-slate-300 pt-3 flex flex-col items-center">
                    <span class="text-xs font-bold text-slate-300 italic">Waiting Approval</span>
                    <span
                      class="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1"
                      >Verified By</span
                    >
                    <span class="text-[8px] text-slate-400 mt-1"
                      >Date: ................................</span
                    >
                  </div>
                </div>
              </div>
              <div class="flex flex-col items-center w-36 text-center no-print-margin">
                <div class="flex flex-col items-center justify-center h-40">
                  <div class="p-1.5 bg-white border border-slate-100 shadow-sm rounded-sm mb-4">
                    <QrcodeVue :value="planUrl" :size="120" level="H" render-as="svg" />
                  </div>
                  <span class="text-[8px] text-slate-400 uppercase tracking-widest"
                    >Scan for Details</span
                  >
                </div>
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
  width: 210mm;
  min-height: 297mm;
  background: white;
  position: relative;
  zoom: 0.8; /* Visual scale for preview modal */
  transform-origin: top center;
}

@media print {
  .no-print {
    display: none !important;
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

/* Shared column styles for Export and Print */
@media print {
  .raw-material-plan-print-preview table {
    width: 100% !important;
    table-layout: fixed !important; /* Force fixed layout for perfect alignment */
    border-collapse: collapse !important;
  }

  .col-date {
    width: 23mm !important;
  }
  .col-day,
  .col-shift {
    width: 9mm !important;
  }
  .col-grade {
    width: 21mm !important;
  }
  .col-uss,
  .col-cl,
  .col-bk {
    width: 9mm !important;
  }
  .col-target,
  .col-cons,
  .col-ratio-bc {
    width: 9mm !important;
  }
  .col-plan-label {
    width: 20mm !important;
  }
  .col-plan-scoops {
    width: 6mm !important;
  }
  .col-percent {
    width: 10mm !important;
  }
  .col-pallet {
    width: 14mm !important;
  }
  .col-remarks {
    width: 76mm !important;
    white-space: nowrap !important;
  }

  .raw-material-plan-print-preview table th,
  .raw-material-plan-print-preview table td {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    padding: 2px 1px !important;
    font-size: 12px !important;
    border: 1px solid #000 !important;
    word-break: break-all !important;
    height: auto !important;
  }

  .pool-prop-container {
    width: 100% !important;
  }
  .pool-prop-table {
    width: 100% !important;
    table-layout: fixed !important;
  }
}
</style>

<style>
@media print {
  @page {
    size: A4 portrait !important;
    margin: 1.5mm !important;
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
  .raw-material-plan-print-preview,
  .raw-material-plan-print-preview * {
    visibility: visible !important;
    opacity: 1 !important;
  }

  .raw-material-plan-print-preview {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    display: block !important;
    width: 294mm !important; /* Design width (maximized) */
    zoom: 0.71 !important; /* ~209.5mm total width */
    transform-origin: top left;
    margin: 0 !important;
    padding: 1.5mm !important;
    box-shadow: none !important;
    border: none !important;
    background: white !important;
  }

  /* Column widths and cell styles are inherited from the shared block above */

  .no-print {
    display: none !important;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
