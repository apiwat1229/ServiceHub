<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { jobOrdersApi, type JobOrder } from '@/services/jobOrders';
import { productionReportsApi, type ProductionReport } from '@/services/productionReports';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Link as LinkIcon,
  Package,
  Plus,
  Trash2,
  User,
} from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();

const props = defineProps<{
  jobOrder: JobOrder;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'updated', jobOrder: JobOrder): void;
}>();

const localJobOrder = ref<JobOrder>({ ...props.jobOrder });
const availableReports = ref<ProductionReport[]>([]);
const mappingQuantities = ref<Record<string, number>>({});
const isLoadingReports = ref(false);
const isAddDialogOpen = ref(false);

const totalMappedPallets = computed(() => {
  return (localJobOrder.value.logs || []).reduce((sum, log) => sum + (log.quantity || 0), 0);
});

const progressPercent = computed(() => {
  if (!localJobOrder.value.orderQuantity) return 0;
  return Math.min(
    Math.round((totalMappedPallets.value / localJobOrder.value.orderQuantity) * 100),
    100
  );
});

const getReportPalletCount = (report: ProductionReport) => {
  return (report.rows || []).reduce((sum, row) => {
    let count = 0;
    if (row.weight1) count++;
    if (row.weight2) count++;
    if (row.weight3) count++;
    if (row.weight4) count++;
    if (row.weight5) count++;
    return sum + count;
  }, 0);
};

const fetchAvailableReports = async () => {
  isLoadingReports.value = true;
  try {
    const reports = await productionReportsApi.getAll();
    // Filter reports by:
    // 1. Same grade
    // 2. Status is SUBMITTED
    availableReports.value = reports.filter(
      (r) =>
        (r.grade === localJobOrder.value.grade || r.grade === localJobOrder.value.otherGrade) &&
        r.status === 'SUBMITTED'
    );

    // Initialize mapping quantities
    availableReports.value.forEach((r) => {
      if (r.id) {
        mappingQuantities.value[r.id] = getReportPalletCount(r);
      }
    });
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    isLoadingReports.value = false;
  }
};

const handleMapReport = (report: ProductionReport) => {
  const qty = mappingQuantities.value[report.id!] || 0;
  const maxQty = getReportPalletCount(report);

  if (qty <= 0) {
    toast.error('Please enter a quantity greater than 0');
    return;
  }

  if (qty > maxQty) {
    toast.error(`Quantity cannot exceed total pallets in report (${maxQty})`);
    return;
  }

  const lotNo = report.rows?.[0]?.lotNo || 'N/A';

  const newLog = {
    date:
      typeof report.productionDate === 'string'
        ? report.productionDate
        : report.productionDate.toISOString(),
    shift: report.shift === '1st' || report.shift === '1' ? ('1st' as any) : ('2nd' as any),
    lotStart: lotNo,
    lotEnd: lotNo,
    quantity: qty,
  };

  if (!localJobOrder.value.logs) localJobOrder.value.logs = [];
  localJobOrder.value.logs.push(newLog);

  saveUpdate();
  isAddDialogOpen.value = false;
};

const removeLog = (index: number) => {
  localJobOrder.value.logs.splice(index, 1);
  saveUpdate();
};

const saveUpdate = async () => {
  try {
    if (localJobOrder.value.id) {
      const updated = await jobOrdersApi.update(localJobOrder.value.id, {
        logs: localJobOrder.value.logs,
      });
      localJobOrder.value = updated;
      emit('updated', updated);
      toast.success(t('common.updateSuccess'));
    }
  } catch (error) {
    console.error('Failed to update mapping:', error);
    toast.error(t('common.errorSave'));
  }
};

onMounted(() => {
  fetchAvailableReports();
});
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-6">
      <!-- Top Row: Full-width Job Order Info -->
      <Card class="border shadow-sm overflow-hidden">
        <CardHeader class="bg-slate-50 border-b py-3 px-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                @click="emit('back')"
                class="h-8 w-8 text-slate-400 hover:text-primary transition-colors"
              >
                <ArrowLeft class="w-4 h-4" />
              </Button>
              <CardTitle class="text-xs font-black flex items-center gap-2 text-slate-700">
                JOB ORDER INFO
              </CardTitle>
            </div>

            <!-- Middle: Production Status -->
            <div class="hidden md:flex flex-1 items-center justify-center gap-8 px-8">
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <div class="flex items-center gap-2 mb-0.5 justify-end">
                    <div class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span class="text-[9px] font-black text-primary uppercase tracking-wider"
                      >Live Tracking</span
                    >
                  </div>
                  <div class="text-xl font-black text-slate-900 leading-none">
                    {{ progressPercent }}%
                  </div>
                </div>
                <div class="h-8 w-px bg-slate-200" />
                <div class="flex gap-4">
                  <div>
                    <p
                      class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none"
                    >
                      Completed
                    </p>
                    <p class="text-sm font-black text-slate-900">
                      {{ totalMappedPallets }}
                      <span class="text-[8px] font-bold text-slate-500 uppercase">Pallets</span>
                    </p>
                  </div>
                  <div>
                    <p
                      class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none"
                    >
                      Target
                    </p>
                    <p class="text-sm font-black text-slate-900">
                      {{ localJobOrder.orderQuantity }}
                      <span class="text-[8px] font-bold text-slate-500 uppercase">Pallets</span>
                    </p>
                  </div>
                </div>
              </div>
              <div class="w-32 lg:w-48">
                <Progress :model-value="progressPercent" class="h-2 bg-slate-200" />
              </div>
            </div>

            <div class="flex items-center gap-2">
              <Badge
                v-if="localJobOrder.isClosed"
                class="bg-emerald-500 text-white border-0 shadow-sm font-black px-3 py-1 text-[10px]"
              >
                <CheckCircle2 class="w-3 h-3 mr-1" />
                {{ t('qa.jobOrderMgmt.completed') }}
              </Badge>
              <Badge
                v-else
                class="bg-amber-500 text-white border-0 shadow-sm font-black px-3 py-1 text-[10px]"
              >
                <Clock class="w-3 h-3 mr-1" />
                {{ t('qa.jobOrderMgmt.inProgress') }}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent class="p-4">
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div>
              <Label
                class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block"
                >Job Order No.</Label
              >
              <p class="font-black text-slate-900 leading-tight">{{ localJobOrder.jobOrderNo }}</p>
            </div>
            <div>
              <Label
                class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block"
                >Contract No.</Label
              >
              <p class="font-bold text-slate-700 leading-tight">{{ localJobOrder.contractNo }}</p>
            </div>
            <div>
              <Label
                class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block"
                >Grade</Label
              >
              <Badge
                variant="secondary"
                class="font-black bg-blue-100 text-blue-700 border-blue-200"
              >
                {{
                  localJobOrder.grade === 'Other' ? localJobOrder.otherGrade : localJobOrder.grade
                }}
              </Badge>
            </div>
            <div>
              <Label
                class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block"
                >Pallet Type</Label
              >
              <p class="font-bold text-slate-700 leading-tight">{{ localJobOrder.palletType }}</p>
            </div>
            <div>
              <Label
                class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block"
                >Qty/Pallet</Label
              >
              <p class="font-bold text-slate-700 leading-tight">
                {{ localJobOrder.quantityBale || 35 }} Bales
              </p>
            </div>
            <div>
              <Label
                class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block"
                >Target Quantity</Label
              >
              <p class="font-black text-primary leading-tight">
                {{ localJobOrder.orderQuantity }} Pallets
              </p>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-y-2">
            <div class="flex flex-wrap items-center gap-x-8 gap-y-2">
              <div class="flex items-center gap-2">
                <Label class="text-[10px] font-black text-slate-400 uppercase tracking-wider block"
                  >Date:</Label
                >
                <span class="text-sm font-bold text-slate-600 flex items-center gap-1.5">
                  <CalendarDays class="w-3.5 h-3.5 text-slate-400" />
                  {{ format(new Date(localJobOrder.qaDate), 'dd-MMM-yyyy') }}
                </span>
              </div>
              <div v-if="localJobOrder.note" class="flex items-center gap-2">
                <Label class="text-[10px] font-black text-slate-400 uppercase tracking-wider block"
                  >Note:</Label
                >
                <span class="text-xs italic text-slate-500">"{{ localJobOrder.note }}"</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Label class="text-[10px] font-black text-slate-400 uppercase tracking-wider block"
                >Creator:</Label
              >
              <span class="text-sm font-bold text-slate-600 flex items-center gap-1.5">
                <User class="w-3.5 h-3.5 text-slate-400" />
                {{ localJobOrder.qaName }}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid grid-cols-1 gap-6">
        <!-- Mapping Table -->
        <div class="space-y-6">
          <!-- Mapping Table -->
          <Card class="border shadow-sm overflow-hidden">
            <div class="px-6 py-4 bg-white flex items-center justify-between border-b">
              <h3 class="font-black text-slate-700 flex items-center gap-2">
                <LinkIcon class="w-4 h-4 text-primary" />
                PRODUCTION MAPPINGS
              </h3>

              <Dialog v-model:open="isAddDialogOpen">
                <DialogTrigger as-child>
                  <Button size="sm" class="font-black gap-2 shadow-lg h-9 px-4">
                    <Plus class="w-4 h-4" />
                    MAP PRODUCTION DATA
                  </Button>
                </DialogTrigger>
                <DialogContent class="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle class="font-black text-2xl flex items-center gap-2">
                      <FileText class="w-6 h-6 text-primary" />
                      Select Production Report
                    </DialogTitle>
                    <DialogDescription class="font-bold text-slate-500">
                      Listing completed (Submitted) reports for
                      <span class="text-primary">{{ localJobOrder.grade }}</span>
                    </DialogDescription>
                  </DialogHeader>

                  <div class="max-h-[500px] overflow-y-auto rounded-xl border mt-4">
                    <Table>
                      <TableHeader class="bg-slate-50 sticky top-0 shadow-sm z-10">
                        <TableRow>
                          <TableHead class="font-black text-[10px] uppercase"
                            >Record Data</TableHead
                          >
                          <TableHead class="font-black text-[10px] uppercase">Shift</TableHead>
                          <TableHead class="font-black text-[10px] uppercase text-center"
                            >Total Pallets</TableHead
                          >
                          <TableHead class="font-black text-[10px] uppercase text-center w-[120px]"
                            >Select Pallets</TableHead
                          >
                          <TableHead class="font-black text-[10px] uppercase">Creator</TableHead>
                          <TableHead class="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow v-if="isLoadingReports" v-for="i in 3" :key="i">
                          <TableCell colspan="6"
                            ><div class="h-10 bg-slate-50 animate-pulse rounded-md"
                          /></TableCell>
                        </TableRow>
                        <TableRow v-else-if="availableReports.length === 0">
                          <TableCell colspan="6" class="py-12 text-center text-slate-400 font-bold">
                            <div class="flex flex-col items-center gap-3">
                              <Package class="w-12 h-12 opacity-10" />
                              No submitted reports found for this grade.
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow
                          v-for="report in availableReports"
                          :key="report.id"
                          class="hover:bg-slate-50/50"
                        >
                          <TableCell>
                            <div class="font-black text-slate-900">
                              {{ format(new Date(report.productionDate), 'dd-MMM-yyyy') }}
                            </div>
                            <div class="font-mono text-[9px] text-slate-400">
                              LOT: {{ report.rows?.[0]?.lotNo }}
                            </div>
                          </TableCell>
                          <TableCell
                            ><Badge variant="outline" class="font-bold border-slate-200">{{
                              report.shift
                            }}</Badge></TableCell
                          >
                          <TableCell class="text-center font-bold text-slate-500">
                            {{ getReportPalletCount(report) }}
                          </TableCell>
                          <TableCell class="text-center">
                            <div class="flex items-center justify-center">
                              <input
                                v-model.number="mappingQuantities[report.id!]"
                                type="number"
                                min="1"
                                :max="getReportPalletCount(report)"
                                class="w-16 h-8 text-center font-black rounded border border-slate-200 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                              />
                            </div>
                          </TableCell>
                          <TableCell class="text-xs font-bold text-slate-500">{{
                            report.issuedBy || 'N/A'
                          }}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              class="font-black w-full"
                              variant="outline"
                              @click="handleMapReport(report)"
                            >
                              Map
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div class="overflow-x-auto">
              <Table>
                <TableHeader class="bg-slate-50/50">
                  <TableRow>
                    <TableHead class="font-black text-[10px] uppercase">Mapped Date</TableHead>
                    <TableHead class="font-black text-[10px] uppercase">Shift</TableHead>
                    <TableHead class="font-black text-[10px] uppercase">Lot Reference</TableHead>
                    <TableHead class="font-black text-[10px] uppercase text-center"
                      >Pallets</TableHead
                    >
                    <TableHead class="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-if="!localJobOrder.logs?.length">
                    <TableCell colspan="5" class="h-48 text-center bg-slate-50/30">
                      <div class="flex flex-col items-center justify-center gap-3 text-slate-300">
                        <LinkIcon class="w-10 h-10 opacity-20" />
                        <p class="font-bold text-slate-400">
                          No production data mapped to this job.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow
                    v-for="(log, idx) in localJobOrder.logs"
                    :key="idx"
                    class="group hover:bg-slate-50/30 transition-colors"
                  >
                    <TableCell class="font-black text-slate-900">{{
                      format(new Date(log.date), 'dd-MMM-yyyy')
                    }}</TableCell>
                    <TableCell
                      ><Badge variant="secondary" class="font-black">{{
                        log.shift
                      }}</Badge></TableCell
                    >
                    <TableCell class="font-mono text-xs text-slate-500">{{
                      log.lotStart
                    }}</TableCell>
                    <TableCell class="text-center font-black text-slate-900">{{
                      log.quantity
                    }}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                        @click="removeLog(idx)"
                      >
                        <Trash2 class="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
