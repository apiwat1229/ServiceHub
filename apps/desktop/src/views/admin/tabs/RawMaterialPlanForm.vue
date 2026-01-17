<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
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
import { format } from 'date-fns';
import { Printer, Save } from 'lucide-vue-next';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Mock initial state for a 7-day plan (14 shifts)
const plan = ref({
  planNo: '2024#PL03',
  revisionNo: '01',
  refProductionNo: '2024#P03',
  issuedDate: '17-Jan-24',
  rows: Array.from({ length: 14 }, (_, idx) => {
    const isHoliday = idx === 12 || idx === 13;
    return {
      date: idx % 2 === 0 ? (idx < 12 ? `${17 + idx / 2} Jan 26` : '23 Jan 26') : '',
      dayOfWeek: idx % 2 === 0 ? ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][idx / 2] : '',
      shift: idx % 2 === 0 ? '1st' : '2nd',
      is24hr: idx === 1 || idx === 3 || idx === 5,
      isHoliday,
      grade: isHoliday ? 'Holiday' : idx < 2 ? 'P0241' : 'P0263',
      gradeColor: isHoliday ? '' : idx < 2 ? 'bg-fuchsia-400' : 'bg-blue-300',
      ratioUSS: isHoliday ? 0 : 0,
      ratioCL: isHoliday ? 0 : 100,
      ratioBK: isHoliday ? 0 : 0,
      productTarget: isHoliday ? 0 : 156,
      clConsumption: isHoliday ? 0 : 156,
      ratioBorC: 0,
      plan1Pool: isHoliday ? '' : idx === 1 ? '7 (AA)' : '13 (AA)',
      plan1Note: isHoliday ? '' : '3 ตัก',
      plan2Pool: isHoliday ? '' : '1 (A)',
      plan2Note: isHoliday ? '' : '2 ตัก',
      plan3Pool: '',
      plan3Note: '',
      cuttingPercent: 0,
      cuttingPalette: 0,
      remarks: '',
    };
  }),
  poolDetails: [
    {
      poolNo: '12',
      grossWeight: 443,
      netWeight: 278,
      drc: 66.1,
      moisture: 26.0,
      p0: 40.8,
      pri: 36.4,
      clearDate: '2 Dec 25',
      grade: 'B+C',
    },
    {
      poolNo: '8',
      grossWeight: 159,
      netWeight: 99,
      drc: 69.6,
      moisture: 22.0,
      p0: 35.7,
      pri: 29.5,
      clearDate: '8 Jan 26',
      grade: 'C',
    },
    {
      poolNo: '16',
      grossWeight: 605,
      netWeight: 375,
      drc: 67.9,
      moisture: 23.6,
      p0: 35.3,
      pri: 29.7,
      clearDate: '19 Dec 25',
      grade: 'C',
    },
    {
      poolNo: '7',
      grossWeight: 291,
      netWeight: 187,
      drc: 69.9,
      moisture: 23.0,
      p0: 45.4,
      pri: 64.5,
      clearDate: '19 Dec 25',
      grade: 'AA',
    },
    {
      poolNo: '13',
      grossWeight: 416,
      netWeight: 267,
      drc: 66.7,
      moisture: 25.7,
      p0: 44.6,
      pri: 71.2,
      clearDate: '13 Oct 25',
      grade: 'AA',
    },
    {
      poolNo: '3',
      grossWeight: 425,
      netWeight: 271,
      drc: 65.7,
      moisture: 27.2,
      p0: 46.5,
      pri: 64.3,
      clearDate: '18 Nov 25',
      grade: 'AA',
    },
    {
      poolNo: '1',
      grossWeight: 394,
      netWeight: 268,
      drc: 74.9,
      moisture: 19.5,
      p0: 44.4,
      pri: 53.3,
      clearDate: '14 Jan 26',
      grade: 'A',
    },
  ],
});

const grades = ref(['P0263', 'P0251', 'H0276', 'P0241', 'AA', 'A', 'B+C', 'C', 'Holiday']);

const formatDate = (date: any) => {
  if (!date) return '';
  return format(new Date(date.toString()), 'dd-MMM-yyyy');
};

const handleSave = () => {
  // Save logic here
  console.log('Saving plan...', plan.value);
};
</script>

<template>
  <div class="space-y-6 max-w-[1600px] mx-auto p-4 bg-white rounded-xl shadow-sm border">
    <!-- Plan Header Segment -->
    <div class="grid grid-cols-3 gap-8 pb-4 border-b border-slate-100">
      <div class="space-y-4">
        <div>
          <h2 class="text-2xl font-black text-slate-800 uppercase tracking-tight">
            {{ t('qa.rawMaterialPlan') }}
          </h2>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            Production Planning & Allocation
          </p>
        </div>
      </div>

      <div class="col-span-2 grid grid-cols-2 gap-4">
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-400 uppercase">Plan No</label>
            <Input
              v-model="plan.planNo"
              class="h-8 text-xs font-bold border-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-400 uppercase">Revision</label>
            <Input
              v-model="plan.revisionNo"
              class="h-8 text-xs font-bold border-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-400 uppercase">Issued Date</label>
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="h-8 w-full text-xs font-bold border-slate-200 justify-start px-3 bg-white hover:bg-slate-50"
                  :class="!plan.issuedDate && 'text-muted-foreground'"
                >
                  <CalendarIcon class="mr-2 h-3 w-3 text-slate-400" />
                  {{ plan.issuedDate || 'Select Date' }}
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
            <label class="text-[10px] font-black text-slate-400 uppercase">Ref. Production</label>
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
              >Production Plan</TableHead
            >
            <TableHead
              colspan="3"
              class="text-center text-white font-black border-r border-slate-700 h-8 uppercase tracking-widest bg-slate-400/90"
              >Ratios (%)</TableHead
            >
            <TableHead
              colspan="3"
              class="text-center text-white font-black border-r border-slate-700 h-8 uppercase tracking-widest bg-slate-500/90"
              >Production Targets</TableHead
            >
            <TableHead
              colspan="6"
              class="text-center text-white font-black border-r border-slate-700 h-8 uppercase tracking-widest bg-blue-500/90"
              >CL Allocation Plan</TableHead
            >
            <TableHead
              colspan="2"
              class="text-center text-white font-black border-r border-slate-700 h-8 uppercase tracking-widest bg-indigo-500/90"
              >Cutting</TableHead
            >
            <TableHead class="text-center text-white font-black h-8 bg-slate-600/90"
              >Docs</TableHead
            >
          </TableRow>

          <TableRow
            class="bg-slate-50 hover:bg-slate-50 text-[10px] font-black text-slate-500 align-middle"
          >
            <TableHead class="border-r border-slate-200 w-16 text-center">Date</TableHead>
            <TableHead class="border-r border-slate-200 w-8 text-center px-1">Day</TableHead>
            <TableHead class="border-r border-slate-200 w-10 text-center">Shift</TableHead>
            <TableHead class="border-r border-slate-200 w-16 text-center">Grade</TableHead>

            <TableHead class="border-r border-slate-200 w-10 text-center">USS</TableHead>
            <TableHead class="border-r border-slate-200 w-10 text-center">CL</TableHead>
            <TableHead class="border-r border-slate-200 w-10 text-center">BK</TableHead>

            <TableHead class="border-r border-slate-200 w-16 text-center">Output</TableHead>
            <TableHead class="border-r border-slate-200 w-16 text-center">CL Cons.</TableHead>
            <TableHead class="border-r border-slate-200 w-16 text-center">Ratio B/C</TableHead>

            <TableHead colspan="2" class="border-r border-slate-200 text-center bg-blue-50/50"
              >#1 Pool / Note</TableHead
            >
            <TableHead colspan="2" class="border-r border-slate-200 text-center bg-blue-50/50"
              >#2 Pool / Note</TableHead
            >
            <TableHead colspan="2" class="border-r border-slate-200 text-center bg-blue-50/50"
              >#3 Pool / Note</TableHead
            >

            <TableHead class="border-r border-slate-200 w-10 text-center">%</TableHead>
            <TableHead class="border-r border-slate-200 w-10 text-center">Pallet</TableHead>

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
            <TableCell class="border-r border-slate-100 p-0 text-center">
              <Popover>
                <PopoverTrigger as-child>
                  <Button
                    variant="ghost"
                    class="h-7 w-full text-[10px] border-none shadow-none font-bold justify-center px-1"
                  >
                    {{ row.date || 'Select' }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    @update:model-value="(val: any) => (row.date = formatDate(val))"
                  />
                </PopoverContent>
              </Popover>
            </TableCell>
            <TableCell class="border-r border-slate-100 text-center p-1 text-slate-400 relative">
              <div
                v-if="row.is24hr"
                class="absolute -left-3 top-1/2 -translate-y-1/2 bg-yellow-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm z-10 whitespace-nowrap border border-yellow-500 uppercase tracking-tighter"
              >
                24 hr
              </div>
              {{ row.dayOfWeek }}
            </TableCell>
            <TableCell
              class="border-r border-slate-100 text-center p-1 font-black"
              :class="row.shift === '1st' ? 'text-blue-600' : 'text-orange-600'"
              >{{ row.shift }}</TableCell
            >
            <TableCell class="border-r border-slate-100 p-0 px-1" :class="row.gradeColor">
              <Select v-model="row.grade">
                <SelectTrigger
                  class="h-6 text-[10px] border-none shadow-none text-center font-bold focus:ring-0 focus:ring-offset-0 bg-transparent px-1"
                  :class="row.isHoliday ? 'text-slate-400' : 'text-slate-900'"
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
                v-model.number="row.ratioUSS"
                class="h-6 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
            /></TableCell>
            <TableCell class="border-r border-slate-100 p-0"
              ><Input
                v-model.number="row.ratioCL"
                class="h-6 text-[10px] border-none shadow-none text-center font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
            /></TableCell>
            <TableCell class="border-r border-slate-100 p-0"
              ><Input
                v-model.number="row.ratioBK"
                class="h-6 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
            /></TableCell>

            <!-- Targets -->
            <TableCell class="border-r border-slate-100 p-0"
              ><Input
                v-model.number="row.productTarget"
                class="h-6 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
            /></TableCell>
            <TableCell class="border-r border-slate-100 p-0"
              ><Input
                v-model.number="row.clConsumption"
                class="h-6 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
            /></TableCell>
            <TableCell class="border-r border-slate-100 p-0"
              ><Input
                v-model.number="row.ratioBorC"
                class="h-6 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
            /></TableCell>

            <!-- Plans -->
            <TableCell class="border-r border-slate-100 p-0 w-12 bg-blue-50/20"
              ><Input
                v-model="row.plan1Pool"
                class="h-6 text-[10px] border-none shadow-none text-center font-black text-blue-700 focus-visible:ring-0 focus-visible:ring-offset-0"
            /></TableCell>
            <TableCell class="border-r border-slate-100 p-0 bg-blue-50/20"
              ><Input
                v-model="row.plan1Note"
                class="h-6 text-[10px] border-none shadow-none text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
            /></TableCell>

            <TableCell class="border-r border-slate-100 p-0 w-12 bg-blue-50/20"
              ><Input
                v-model="row.plan2Pool"
                class="h-6 text-[10px] border-none shadow-none text-center font-black text-blue-700 focus-visible:ring-0 focus-visible:ring-offset-0"
            /></TableCell>
            <TableCell class="border-r border-slate-100 p-0 bg-blue-50/20"
              ><Input
                v-model="row.plan2Note"
                class="h-6 text-[10px] border-none shadow-none text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
            /></TableCell>

            <TableCell class="border-r border-slate-100 p-0 w-12 bg-blue-50/20"
              ><Input
                v-model="row.plan3Pool"
                class="h-6 text-[10px] border-none shadow-none text-center font-black text-blue-700 focus-visible:ring-0 focus-visible:ring-offset-0"
            /></TableCell>
            <TableCell class="border-r border-slate-100 p-0 bg-blue-50/20"
              ><Input
                v-model="row.plan3Note"
                class="h-6 text-[10px] border-none shadow-none text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
            /></TableCell>

            <!-- Cutting -->
            <TableCell class="border-r border-slate-100 p-0"
              ><Input
                v-model.number="row.cuttingPercent"
                class="h-6 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
            /></TableCell>
            <TableCell class="border-r border-slate-100 p-0"
              ><Input
                v-model.number="row.cuttingPalette"
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
          Pool Properties & Validation
        </h4>
      </div>

      <div class="overflow-hidden border border-slate-200 rounded-lg shadow-sm max-w-4xl">
        <Table class="text-[10px]">
          <TableHeader class="bg-slate-50">
            <TableRow>
              <TableHead class="w-16 border-r border-slate-200 font-black text-center"
                >Pool No.</TableHead
              >
              <TableHead class="w-20 border-r border-slate-200 font-black text-center"
                >Gross (Ton)</TableHead
              >
              <TableHead class="w-20 border-r border-slate-200 font-black text-center"
                >Net (Ton)</TableHead
              >
              <TableHead class="w-16 border-r border-slate-200 font-black text-center"
                >DRC</TableHead
              >
              <TableHead class="w-16 border-r border-slate-200 font-black text-center"
                >Moist.</TableHead
              >
              <TableHead class="w-16 border-r border-slate-200 font-black text-center"
                >P0</TableHead
              >
              <TableHead class="w-16 border-r border-slate-200 font-black text-center"
                >PRI</TableHead
              >
              <TableHead class="w-24 border-r border-slate-200 font-black text-center"
                >Date</TableHead
              >
              <TableHead class="w-16 font-black text-center">Grade</TableHead>
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
                  v-model.number="p.grossWeight"
                  class="h-7 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
              /></TableCell>
              <TableCell class="border-r border-slate-100 p-0"
                ><Input
                  v-model.number="p.netWeight"
                  class="h-7 text-[10px] border-none shadow-none text-center font-bold text-slate-700 focus-visible:ring-0 focus-visible:ring-offset-0"
              /></TableCell>
              <TableCell class="border-r border-slate-100 p-0"
                ><Input
                  v-model.number="p.drc"
                  class="h-7 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
              /></TableCell>
              <TableCell class="border-r border-slate-100 p-0"
                ><Input
                  v-model.number="p.moisture"
                  class="h-7 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
              /></TableCell>
              <TableCell class="border-r border-slate-100 p-0"
                ><Input
                  v-model.number="p.p0"
                  class="h-7 text-[10px] border-none shadow-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
              /></TableCell>
              <TableCell class="border-r border-slate-100 p-0"
                ><Input
                  v-model.number="p.pri"
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
                <Select v-model="p.grade">
                  <SelectTrigger
                    class="h-7 text-[10px] border-none shadow-none font-bold focus:ring-0 focus:ring-offset-0 bg-transparent text-center px-1"
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
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <!-- Actions Footer -->
    <div class="flex items-center justify-between pt-6 border-t border-slate-100">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2 border-r border-slate-200 pr-6">
          <label class="text-[10px] font-black text-slate-400 uppercase">Issue By</label>
          <Input
            class="h-8 w-40 text-xs font-bold bg-slate-50 border-none"
            value="ระบบบริหารจัดการ"
            readonly
          />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-[10px] font-black text-slate-400 uppercase">Verified By</label>
          <Input
            class="h-8 w-40 text-xs font-bold bg-slate-50 border-none"
            value="รอการอนุมัติ"
            readonly
          />
        </div>
      </div>

      <div class="flex items-center gap-3">
        <Button variant="outline" class="h-10 gap-2 font-bold text-slate-600 shadow-sm">
          <Printer class="w-4 h-4" />
          Print Plan
        </Button>
        <Button
          @click="handleSave"
          class="h-10 gap-2 font-bold px-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
        >
          <Save class="w-4 h-4" />
          Save Changes
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
