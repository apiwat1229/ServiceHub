<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { LucideCheck } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  data: any;
}>();

const grades = ['P0263', 'P0251', 'H0276', 'P0241'];
const palletTypes = ['MB3', 'MB4', 'MB5', 'Blue Pallet', 'GPS', 'CIMC', 'Steel Pallet'];

const formattedDate = computed(() => {
  if (!props.data?.qaDate) return '';
  return format(new Date(props.data.qaDate), 'dd / MMM / yy');
});

const productionDateFormatted = computed(() => {
  if (!props.data?.productionDate) return '';
  return format(new Date(props.data.productionDate), 'dd, MMM, yyyy');
});

// Helper to fill table rows (up to 3 blocks of 2 shifts = 6 rows as in image)
const tableRows = computed(() => {
  const rows = [...(props.data.logs || [])];
  while (rows.length < 3) {
    rows.push({ date: '', shift: '', lotStart: '', lotEnd: '', quantity: null, sign: '' });
  }
  return rows;
});
</script>

<template>
  <div
    class="print-container bg-white text-slate-900 font-sans p-2 border border-slate-900 shadow-sm mx-auto overflow-hidden"
  >
    <!-- Header Row -->
    <div class="relative flex justify-center items-start mb-1 pt-0">
      <div class="text-center flex-1">
        <h1 class="text-lg font-black uppercase flex flex-col">
          <span>JOB ORDER (ใบสั่งงาน)</span>
        </h1>
      </div>
      <div class="absolute top-0 right-0 text-[8px] font-normal tracking-tighter opacity-70">
        FM-QAC-39 Rev 00 (Effective date 15 Aug 2022) *C
      </div>
    </div>

    <!-- Top Details -->
    <div class="grid grid-cols-12 gap-y-1 text-[11px] leading-tight mb-2">
      <!-- Row 1 -->
      <div class="col-span-5 flex items-baseline gap-1">
        <span class="shrink-0">Job Order No. :</span>
        <span class="border-b border-dotted border-slate-700 flex-1 px-1 font-bold text-blue-800">{{
          data.jobOrderNo
        }}</span>
      </div>
      <div class="col-span-1"></div>
      <div class="col-span-6 flex items-baseline gap-1">
        <span class="shrink-0 ml-4 whitespace-nowrap">Contract no. (เลขที่สัญญา) :</span>
        <span class="border-b border-dotted border-slate-700 flex-1 px-1 font-bold text-blue-800">{{
          data.contractNo
        }}</span>
      </div>

      <!-- Row 2: Grade & Qty/Pallet & Pallet Type -->
      <div class="col-span-5 flex flex-wrap items-center gap-x-3">
        <span>Grade :</span>
        <div v-for="grade in grades" :key="grade" class="flex items-center gap-1">
          <div
            class="w-3.5 h-3.5 border border-slate-700 flex items-center justify-center relative"
          >
            <LucideCheck
              v-if="data.grade === grade"
              class="w-4 h-4 text-blue-600 absolute -top-1"
            />
          </div>
          <span class="text-[10px]">{{ grade }}</span>
        </div>
      </div>

      <div class="col-span-3 flex flex-col gap-1 border-l border-slate-300 pl-4 ml-2">
        <span>Quantity / Pallet :</span>
        <div class="flex gap-4">
          <div class="flex items-center gap-1">
            <div
              class="w-3.5 h-3.5 border border-slate-700 flex items-center justify-center relative"
            >
              <LucideCheck v-if="data.quantityBale === 35" class="w-4 h-4 text-blue-600 absolute" />
            </div>
            <span class="text-[10px]">35 Bale</span>
          </div>
          <div class="flex items-center gap-1">
            <div
              class="w-3.5 h-3.5 border border-slate-700 flex items-center justify-center relative"
            >
              <LucideCheck v-if="data.quantityBale === 36" class="w-4 h-4 text-blue-600 absolute" />
            </div>
            <span class="text-[10px]">36 Bales</span>
          </div>
        </div>
      </div>

      <div class="col-span-4 flex flex-col gap-1 border-l border-slate-300 pl-4">
        <span class="font-bold underline text-[9px] mb-0.5">Pallet Type (บรรจุภัณฑ์) :</span>
        <div class="grid grid-cols-2 gap-x-2 gap-y-0.5">
          <div
            v-for="p in palletTypes"
            :key="p"
            class="flex items-center gap-1 scale-[0.9] origin-left"
          >
            <div
              class="w-3.5 h-3.5 border border-slate-700 flex items-center justify-center relative shrink-0"
            >
              <LucideCheck v-if="data.palletType === p" class="w-4 h-4 text-blue-600 absolute" />
            </div>
            <span class="whitespace-nowrap text-[10px]">{{ p }}</span>
          </div>
        </div>
      </div>

      <!-- Row 3 -->
      <div class="col-span-4 flex items-baseline gap-1 mt-1">
        <span>Order Quantity (จำนวน) :</span>
        <span
          class="border-b border-dotted border-slate-700 flex-1 px-1 font-black text-center text-blue-800"
          >{{ data.orderQuantity }}</span
        >
        <span class="shrink-0">Pallets.</span>
      </div>

      <div class="col-span-4 flex items-center gap-2 ml-4">
        <span>Pallet Marking Attach :</span>
        <div class="flex gap-3">
          <div class="flex items-center gap-1">
            <div
              class="w-3.5 h-3.5 border border-slate-700 flex items-center justify-center relative"
            >
              <LucideCheck v-if="data.palletMarking" class="w-4 h-4 text-blue-600 absolute" />
            </div>
            <span class="text-[10px]">Yes</span>
          </div>
          <div class="flex items-center gap-1">
            <div
              class="w-3.5 h-3.5 border border-slate-700 flex items-center justify-center relative"
            >
              <LucideCheck v-if="!data.palletMarking" class="w-4 h-4 text-blue-600 absolute" />
            </div>
            <span class="text-[10px]">No</span>
          </div>
        </div>
      </div>

      <div class="col-span-4"></div>

      <!-- Note Area -->
      <div class="col-span-8 flex items-baseline gap-1 mt-1">
        <span>Note :</span>
        <span class="border-b border-dotted border-slate-700 flex-1 px-1 font-bold">{{
          data.note || ''
        }}</span>
      </div>
      <div class="col-span-4 flex justify-end gap-1 items-baseline">
        <span class="shrink-0">QA :</span>
        <span
          class="border-b border-dotted border-slate-700 flex-1 px-1 font-bold text-blue-800 text-center"
          >{{ data.qaName }}</span
        >
        <span class="shrink-0 ml-1">Date :</span>
        <span
          class="border-b border-dotted border-slate-700 w-24 px-1 font-bold text-blue-800 text-center"
          >{{ formattedDate }}</span
        >
      </div>
    </div>

    <!-- For Production Table Section -->
    <div class="border border-slate-900 mt-2 rounded-sm overflow-hidden">
      <div class="bg-slate-50 border-b border-slate-900 px-2 py-0.5 text-[10px] font-black italic">
        For production (สำหรับฝ่ายผลิต)
      </div>
      <Table class="border-collapse w-full">
        <TableHeader>
          <TableRow class="bg-slate-100 hover:bg-slate-100 border-b border-slate-900">
            <TableHead
              rowspan="2"
              class="border-r border-slate-900 text-center p-1 font-black text-slate-800 text-[10px] w-24"
              >Date</TableHead
            >
            <TableHead
              rowspan="2"
              class="border-r border-slate-900 text-center p-1 font-black text-slate-800 text-[10px] w-12"
              >Shift</TableHead
            >
            <TableHead
              colspan="2"
              class="border-r border-slate-900 text-center p-1 font-black text-slate-800 text-[10px]"
              >Lot # Pallet</TableHead
            >
            <TableHead
              rowspan="2"
              class="border-r border-slate-900 text-center p-1 font-black text-slate-800 text-[10px] w-28"
              >Quantity (Pallet)</TableHead
            >
            <TableHead
              rowspan="2"
              class="text-center p-1 font-black text-slate-800 text-[10px] w-20"
              >Sign</TableHead
            >
          </TableRow>
          <TableRow class="bg-slate-50 hover:bg-slate-50 border-b border-slate-900 text-[9px]">
            <TableHead class="border-r border-slate-900 text-center p-0.5 font-bold text-slate-700"
              >Start</TableHead
            >
            <TableHead class="border-r border-slate-900 text-center p-0.5 font-bold text-slate-700"
              >End</TableHead
            >
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-for="(row, idx) in tableRows" :key="idx">
            <!-- Row for Shift 1 -->
            <TableRow class="border-b border-slate-900 h-7">
              <TableCell
                rowspan="2"
                class="border-r border-slate-900 p-1 text-center text-[10px] font-bold text-blue-800 align-middle"
              >
                {{ row.date ? format(new Date(row.date), 'dd MMM yy') : '' }}
              </TableCell>
              <TableCell
                class="border-r border-b border-slate-900 p-0 text-center text-[9px] align-middle"
              >
                <span class="opacity-40 font-bold">1<sup class="text-[7px]">st</sup></span>
              </TableCell>
              <TableCell
                class="border-r border-b border-slate-900 p-1 text-center text-[10px] font-bold text-blue-800 align-middle"
              >
                {{ row.lotStart || '' }}
              </TableCell>
              <TableCell
                class="border-r border-b border-slate-900 p-1 text-center text-[10px] font-bold text-blue-800 align-middle"
              >
                {{ row.lotEnd || '' }}
              </TableCell>
              <TableCell
                class="border-r border-b border-slate-900 p-1 text-center text-sm font-black text-blue-800 align-middle"
              >
                {{ row.quantity || '' }}
              </TableCell>
              <TableCell
                class="p-1 border-b border-slate-900 text-center align-middle text-[9px] italic"
              >
                {{ row.sign || '' }}
              </TableCell>
            </TableRow>
            <!-- Row for Shift 2 -->
            <TableRow class="border-b border-slate-900 h-7">
              <TableCell class="border-r border-slate-900 p-0 text-center text-[9px] align-middle">
                <span class="opacity-40 font-bold">2<sup class="text-[7px]">nd</sup></span>
              </TableCell>
              <TableCell class="border-r border-slate-900 p-1 text-center align-middle"></TableCell>
              <TableCell class="border-r border-slate-900 p-1 text-center align-middle"></TableCell>
              <TableCell class="border-r border-slate-900 p-1 text-center align-middle"></TableCell>
              <TableCell class="p-1 text-center align-middle"></TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Footer Part -->
    <div class="mt-2 text-[11px] leading-tight">
      <div class="flex flex-col gap-1.5">
        <!-- Note line -->
        <div class="flex flex-col gap-0.5">
          <div class="flex items-baseline gap-1">
            <span class="font-bold shrink-0">Note :</span>
            <span class="border-b border-dotted border-slate-700 flex-1 h-3.5"></span>
          </div>
          <div class="flex items-baseline w-full pl-[38px]">
            <span class="border-b border-dotted border-slate-700 flex-1 h-3"></span>
          </div>
        </div>

        <!-- Closed status & Production info grouped together -->
        <div class="flex items-start justify-between mt-1 pl-1">
          <div class="flex flex-col gap-1.5 pt-0.5">
            <div class="flex items-center gap-4">
              <span class="font-bold shrink-0">Closed job order</span>
              <div class="flex items-center gap-1.5">
                <div
                  class="w-3.5 h-3.5 border border-slate-700 flex items-center justify-center relative bg-white"
                >
                  <LucideCheck
                    v-if="data.isClosed === true"
                    class="w-4 h-4 text-blue-600 absolute"
                  />
                </div>
                <span class="text-[10px] font-black">YES</span>
              </div>
              <div class="flex items-center gap-1.5 ml-4">
                <div
                  class="w-3.5 h-3.5 border border-slate-700 flex items-center justify-center relative bg-white"
                >
                  <LucideCheck
                    v-if="data.isClosed === false"
                    class="w-4 h-4 text-blue-600 absolute"
                  />
                </div>
                <span class="text-[10px] font-black mr-1">No.</span>
                <span
                  class="border-b border-dotted border-slate-700 w-40 h-3.5 text-center font-bold text-blue-800"
                  >{{ data.noReason || '' }}</span
                >
              </div>
            </div>
          </div>

          <div class="flex flex-col items-end gap-1.5 pr-2 overflow-visible">
            <div class="flex items-baseline gap-1">
              <span class="font-bold whitespace-nowrap">Production (Dryer & Packing) :</span>
              <div class="relative w-40 text-center">
                <span
                  class="absolute -top-3 left-0 right-0 font-bold text-blue-800 italic h-4 whitespace-nowrap"
                  >{{ data.productionName || '' }}</span
                >
                <span class="block border-b border-dotted border-slate-700 w-full h-3.5"></span>
              </div>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="font-bold">Date :</span>
              <div class="relative w-48 text-center">
                <span
                  class="absolute -top-3 left-0 right-0 font-bold text-blue-800 h-4 whitespace-nowrap"
                  >{{ productionDateFormatted }}</span
                >
                <span class="block border-b border-dotted border-slate-700 w-full h-3.5"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.print-container {
  width: 210mm;
  height: 148mm;
  padding: 4mm;
  background-image: radial-gradient(circle at 50px 20px, rgba(0, 0, 0, 0.01) 1px, transparent 1px);
  background-size: 100% 30px;
}

@media print {
  @page {
    size: A5 landscape;
    margin: 0;
  }
  .print-container {
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    width: 210mm !important;
    height: 148mm !important;
    padding: 4mm !important;
  }
}

/* Custom Table Styles to match layout */
:deep(th),
:deep(td) {
  border-color: #0f172a !important; /* slate-900 */
}
</style>
