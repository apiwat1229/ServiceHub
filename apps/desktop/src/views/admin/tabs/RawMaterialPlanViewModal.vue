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
import { Download, Loader2, Printer, X } from 'lucide-vue-next';
import { nextTick, onMounted, ref } from 'vue';

const props = defineProps<{
  planId: string | null;
  open: boolean;
  autoPrint?: boolean;
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
    if (plan.value && props.autoPrint) {
      nextTick(() => {
        handlePrint();
      });
    }
  }
};

onMounted(() => {
  if (props.planId) {
    fetchPlanDetails(props.planId);
  }
});

const handlePrint = () => {
  if (props.autoPrint) {
    window.onafterprint = () => {
      emit('update:open', false);
      window.onafterprint = null;
    };
  }
  // Small delay to ensure rendering completion before print dialog opens
  setTimeout(() => {
    window.print();
  }, 500);
};

const isDownloading = ref(false);
const handleDownload = async () => {
  if (!plan.value) return;
  isDownloading.value = true;
  try {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const element = document.querySelector('.raw-material-plan-print-preview') as HTMLElement;
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Raw-Material-Plan-${plan.value.planNo}.pdf`);
  } catch (error) {
    console.error('Failed to download PDF:', error);
  } finally {
    isDownloading.value = false;
  }
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
      :class="`max-w-[850px] w-full h-[96vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl transition-opacity duration-300 ${autoPrint && !isLoading ? 'pointer-events-none' : ''}`"
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
            Preview Mode (A4 Portrait)
          </Badge>
        </div>
        <div class="flex items-center gap-2">
          <Button
            @click="handleDownload"
            variant="outline"
            :disabled="isDownloading"
            class="h-9 gap-2 font-bold px-4 border-blue-200 hover:bg-blue-50 text-blue-700"
          >
            <Loader2 v-if="isDownloading" class="w-4 h-4 animate-spin" />
            <Download v-else class="w-4 h-4" />
            Download
          </Button>
          <Button
            @click="handlePrint"
            variant="default"
            class="h-9 gap-2 font-bold px-6 bg-blue-600 hover:bg-blue-700"
          >
            <Printer class="w-4 h-4" />
            Print
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
                    <TableHead class="border-r border-slate-950 w-[65px] text-center px-1"
                      >Date</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-[25px] text-center px-0.5"
                      >Day</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-[30px] text-center px-0.5"
                      >Shift</TableHead
                    >
                    <TableHead
                      class="border-r border-slate-950 w-[60px] text-center font-black text-slate-900 px-1"
                      >Grade</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-[25px] text-center px-0.5"
                      >USS</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-[25px] text-center px-0.5"
                      >CL</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-[25px] text-center px-0.5"
                      >BK</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-[35px] text-center px-0.5"
                      >Target</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-[35px] text-center px-0.5"
                      >CL Cons.</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-[35px] text-center px-0.5"
                      >Ratio B/C</TableHead
                    >
                    <TableHead
                      colspan="2"
                      class="border-r border-slate-950 text-center bg-blue-50/50 min-w-[80px]"
                      >#1 (P/S)</TableHead
                    >
                    <TableHead
                      colspan="2"
                      class="border-r border-slate-950 text-center bg-blue-50/50 min-w-[80px]"
                      >#2 (P/S)</TableHead
                    >
                    <TableHead
                      colspan="2"
                      class="border-r border-slate-950 text-center bg-blue-50/50 min-w-[80px]"
                      >#3 (P/S)</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-[30px] text-center px-0.5"
                      >%</TableHead
                    >
                    <TableHead class="border-r border-slate-950 w-[40px] text-center px-0.5"
                      >Plt/Shft</TableHead
                    >
                    <TableHead class="text-center min-w-[100px]">Remarks</TableHead>
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
                      class="border-r border-slate-950 text-center font-bold px-1 relative !overflow-visible"
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
                      class="border-r border-slate-950 text-center p-0 transition-colors duration-200"
                      :class="getGradeColor(row.grade)"
                    >
                      <div
                        class="h-full flex items-center justify-center min-h-[24px] font-black"
                        :class="row.productionMode === 'holiday' ? 'text-slate-400' : ''"
                      >
                        {{ row.grade || '-' }}
                      </div>
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
                    <TableCell
                      class="border-r border-slate-100 text-center bg-blue-50/10 text-[9px] px-0.5"
                      >{{ getPlanPoolLabel(row, 1) }}</TableCell
                    >
                    <TableCell
                      class="border-r border-slate-950 text-center font-bold text-blue-700 bg-blue-50/10 w-[25px]"
                      >{{ row.plan1Scoops }}</TableCell
                    >
                    <TableCell
                      class="border-r border-slate-100 text-center bg-blue-50/10 text-[9px] px-0.5"
                      >{{ getPlanPoolLabel(row, 2) }}</TableCell
                    >
                    <TableCell
                      class="border-r border-slate-950 text-center font-bold text-blue-700 bg-blue-50/10 w-[25px]"
                      >{{ row.plan2Scoops }}</TableCell
                    >
                    <TableCell
                      class="border-r border-slate-100 text-center bg-blue-50/10 text-[9px] px-0.5"
                      >{{ getPlanPoolLabel(row, 3) }}</TableCell
                    >
                    <TableCell
                      class="border-r border-slate-950 text-center font-bold text-blue-700 bg-blue-50/10 w-[25px]"
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
</style>

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
    width: 290mm !important; /* Design width */
    zoom: 0.72 !important; /* 290mm * 0.72 = ~209mm (A4) */
    transform-origin: top left;
    margin: 0 !important;
    padding: 2mm !important;
    box-shadow: none !important;
    border: none !important;
    background: white !important;
  }

  .raw-material-plan-print-preview table {
    width: 100% !important;
    table-layout: fixed !important;
    border-collapse: collapse !important;
  }

  .raw-material-plan-print-preview table th,
  .raw-material-plan-print-preview table td {
    padding: 2px 1px !important;
    font-size: 12px !important; /* ~8.6px after zoom */
    border: 1px solid #000 !important;
    word-break: break-all !important;
    height: auto !important;
  }

  /* Full 19-column precise calculation for A4 Portrait (290mm design width) */
  .raw-material-plan-print-preview table th:nth-child(1),
  .raw-material-plan-print-preview table td:nth-child(1) {
    width: 17mm !important;
  } /* Date */
  .raw-material-plan-print-preview table th:nth-child(2),
  .raw-material-plan-print-preview table td:nth-child(2) {
    width: 5mm !important;
  } /* Day */
  .raw-material-plan-print-preview table th:nth-child(3),
  .raw-material-plan-print-preview table td:nth-child(3) {
    width: 5mm !important;
  } /* Shift */
  .raw-material-plan-print-preview table th:nth-child(4),
  .raw-material-plan-print-preview table td:nth-child(4) {
    width: 13mm !important;
  } /* Grade */

  .raw-material-plan-print-preview table th:nth-child(5),
  .raw-material-plan-print-preview table td:nth-child(5) {
    width: 5mm !important;
  } /* USS */
  .raw-material-plan-print-preview table th:nth-child(6),
  .raw-material-plan-print-preview table td:nth-child(6) {
    width: 5mm !important;
  } /* CL */
  .raw-material-plan-print-preview table th:nth-child(7),
  .raw-material-plan-print-preview table td:nth-child(7) {
    width: 5mm !important;
  } /* BK */

  .raw-material-plan-print-preview table th:nth-child(8),
  .raw-material-plan-print-preview table td:nth-child(8) {
    width: 8mm !important;
  } /* Target */
  .raw-material-plan-print-preview table th:nth-child(9),
  .raw-material-plan-print-preview table td:nth-child(9) {
    width: 8mm !important;
  } /* CL Cons */
  .raw-material-plan-print-preview table th:nth-child(10),
  .raw-material-plan-print-preview table td:nth-child(10) {
    width: 8mm !important;
  } /* Ratio B/C */

  /* Allocation plan sets EXPANDED for V3 */
  .raw-material-plan-print-preview table th:nth-child(11),
  .raw-material-plan-print-preview table td:nth-child(11),
  .raw-material-plan-print-preview table th:nth-child(13),
  .raw-material-plan-print-preview table td:nth-child(13),
  .raw-material-plan-print-preview table th:nth-child(15),
  .raw-material-plan-print-preview table td:nth-child(15) {
    width: 37mm !important;
  } /* Pool Label */

  .raw-material-plan-print-preview table th:nth-child(12),
  .raw-material-plan-print-preview table td:nth-child(12),
  .raw-material-plan-print-preview table th:nth-child(14),
  .raw-material-plan-print-preview table td:nth-child(14),
  .raw-material-plan-print-preview table th:nth-child(16),
  .raw-material-plan-print-preview table td:nth-child(16) {
    width: 8mm !important;
  } /* Scoops */

  /* Cutting & Docs */
  .raw-material-plan-print-preview table th:nth-child(17),
  .raw-material-plan-print-preview table td:nth-child(17) {
    width: 10mm !important;
  } /* % */
  .raw-material-plan-print-preview table th:nth-child(18),
  .raw-material-plan-print-preview table td:nth-child(18) {
    width: 12mm !important;
  } /* Plt/Shft */
  .raw-material-plan-print-preview table th:nth-child(19),
  .raw-material-plan-print-preview table td:nth-child(19) {
    width: auto !important;
  } /* Remarks */

  .no-print {
    display: none !important;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
