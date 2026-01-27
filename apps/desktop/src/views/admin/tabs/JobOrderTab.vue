<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { jobOrdersApi, type JobOrder } from '@/services/jobOrders';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { CheckCircle2, Clock, Edit, FileText, Package } from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import JobOrderPrint from '../components/JobOrderPrint.vue';

const { t } = useI18n();

const props = defineProps<{
  searchQuery: string;
  date: string;
}>();

const emit = defineEmits<{
  (e: 'edit', jobOrder: JobOrder): void;
  (e: 'view', jobOrder: JobOrder): void;
}>();

// Helper to parse string date back to CalendarDate-like object
const parseDateString = (dateStr: string) => {
  if (!dateStr) return null;
  try {
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [year, month, day] = cleanDate.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new CalendarDate(year, month, day);
  } catch (e) {
    return null;
  }
};

const jobOrders = ref<JobOrder[]>([]);
const isLoading = ref(false);
const selectedJobOrder = ref<JobOrder | null>(null);

// Initialize from props
const searchQuery = ref(props.searchQuery || '');
const selectedDate = ref<any>(parseDateString(props.date) || today(getLocalTimeZone()));
const isPrintDialogOpen = ref(false);

// Watch props
watch(
  () => props.searchQuery,
  (newVal) => {
    searchQuery.value = newVal;
  }
);

watch(
  () => props.date,
  (newVal) => {
    if (newVal) {
      selectedDate.value = parseDateString(newVal);
    }
  }
);

const filteredJobOrders = computed(() => {
  let filtered = jobOrders.value;

  // Filter by date
  if (selectedDate.value) {
    const targetDate = `${selectedDate.value.year}-${String(selectedDate.value.month).padStart(2, '0')}-${String(selectedDate.value.day).padStart(2, '0')}`;
    filtered = filtered.filter((order) => {
      const orderDate = order.qaDate ? order.qaDate.split('T')[0] : '';
      return orderDate === targetDate;
    });
  }

  // Filter by search query
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (order) =>
        order.jobOrderNo.toLowerCase().includes(q) ||
        order.contractNo.toLowerCase().includes(q) ||
        order.grade.toLowerCase().includes(q)
    );
  }

  return filtered;
});

const fetchJobOrders = async () => {
  isLoading.value = true;
  try {
    const data = await jobOrdersApi.getAll();
    jobOrders.value = data;
  } catch (error) {
    console.error('Failed to fetch job orders:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    isLoading.value = false;
  }
};

const handleView = (jobOrder: JobOrder) => {
  emit('view', jobOrder);
};

const handleEdit = (jobOrder: JobOrder) => {
  emit('edit', jobOrder);
};

const handlePrint = (jobOrder: JobOrder) => {
  selectedJobOrder.value = jobOrder;
  isPrintDialogOpen.value = true;
};

const triggerPrint = () => {
  window.print();
};

// Save and Delete logic moved to parent (QualityAssurance)

onMounted(() => {
  fetchJobOrders();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Search, Date (Removed Button) -->
    <!-- Button removed as user requested moving Create to Tab -->

    <!-- Job Orders Table -->
    <Card class="border shadow-sm overflow-hidden">
      <div class="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-3 border-b">
        <div class="flex items-center justify-between">
          <h3 class="font-black text-slate-700 flex items-center gap-2">
            <Package class="w-4 h-4" />
            {{ t('qa.jobOrderMgmt.tableTitle') }}
          </h3>

          <div class="flex items-center gap-4">
            <!-- Divider Line -->
            <div class="h-8 w-px bg-slate-300"></div>

            <!-- Summary Stats Cards -->
            <div class="flex items-center gap-2">
              <div
                class="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border-l-2 border-blue-500 rounded"
              >
                <FileText class="w-3.5 h-3.5 text-blue-600" />
                <div class="flex items-center gap-1">
                  <span class="text-[10px] font-bold text-slate-500 uppercase">{{
                    t('qa.jobOrderMgmt.total')
                  }}</span>
                  <span class="text-sm font-black text-blue-600">{{
                    filteredJobOrders.length
                  }}</span>
                </div>
              </div>

              <div
                class="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border-l-2 border-emerald-500 rounded"
              >
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
                <div class="flex items-center gap-1">
                  <span class="text-[10px] font-bold text-slate-500 uppercase">{{
                    t('qa.jobOrderMgmt.completed')
                  }}</span>
                  <span class="text-sm font-black text-emerald-600">{{
                    filteredJobOrders.filter((j) => j.isClosed).length
                  }}</span>
                </div>
              </div>

              <div
                class="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border-l-2 border-amber-500 rounded"
              >
                <Clock class="w-3.5 h-3.5 text-amber-600" />
                <div class="flex items-center gap-1">
                  <span class="text-[10px] font-bold text-slate-500 uppercase">{{
                    t('qa.jobOrderMgmt.inProgress')
                  }}</span>
                  <span class="text-sm font-black text-amber-600">{{
                    filteredJobOrders.filter((j) => !j.isClosed).length
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="overflow-x-auto">
        <Table>
          <TableHeader class="bg-slate-50/50">
            <TableRow class="hover:bg-transparent border-b-2">
              <TableHead class="font-black text-slate-700">
                {{ t('qa.jobOrderMgmt.cols.no') }}
              </TableHead>
              <TableHead class="font-black text-slate-700">{{
                t('qa.jobOrderMgmt.cols.contract')
              }}</TableHead>
              <TableHead class="font-black text-slate-700">{{
                t('qa.jobOrderMgmt.cols.grade')
              }}</TableHead>
              <TableHead class="font-black text-slate-700">{{
                t('qa.jobOrderMgmt.cols.palletSpecs')
              }}</TableHead>
              <TableHead class="font-black text-slate-700">{{
                t('qa.jobOrderMgmt.cols.status')
              }}</TableHead>
              <TableHead class="w-[100px] text-center font-black text-slate-700">{{
                t('qa.jobOrderMgmt.cols.action')
              }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading" v-for="i in 3" :key="i" class="animate-pulse">
              <TableCell v-for="j in 7" :key="j">
                <div class="h-4 bg-slate-100 rounded"></div>
              </TableCell>
            </TableRow>

            <TableRow v-else-if="jobOrders.length === 0">
              <TableCell colspan="7" class="h-64 text-center">
                <div class="flex flex-col items-center justify-center text-muted-foreground">
                  <div class="bg-slate-100 p-6 rounded-full mb-4">
                    <FileText class="w-12 h-12 text-slate-300" />
                  </div>
                  <p class="font-bold text-slate-400 text-lg mb-2">
                    {{ t('qa.jobOrderMgmt.noOrders') }}
                  </p>
                </div>
              </TableCell>
            </TableRow>

            <TableRow
              v-for="order in filteredJobOrders"
              :key="order.id"
              class="group hover:bg-slate-50/50 transition-all cursor-pointer border-b"
              @click="handleView(order)"
            >
              <TableCell class="font-black text-slate-900 py-3">
                <div class="flex items-center gap-2">
                  <div
                    class="w-2 h-2 rounded-full"
                    :class="
                      order.isClosed
                        ? 'bg-emerald-500 shadow-emerald-200 shadow-lg'
                        : 'bg-amber-500 shadow-amber-200 shadow-lg'
                    "
                  ></div>
                  {{ order.jobOrderNo }}
                </div>
              </TableCell>
              <TableCell class="font-bold text-slate-700">{{ order.contractNo }}</TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  class="font-bold bg-blue-100 text-blue-700 border-blue-200"
                >
                  {{ order.grade === 'Other' ? order.otherGrade : order.grade }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="text-xs flex flex-col gap-0.5">
                  <span class="font-bold text-slate-700">{{ order.palletType }}</span>
                  <span class="text-slate-600"
                    >{{ order.orderQuantity }} {{ t('qa.jobOrderMgmt.palletsCount') }} •
                    {{ order.quantityBale }} {{ t('qa.jobOrderMgmt.balesCount') }}</span
                  >
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  v-if="order.isClosed"
                  class="bg-emerald-500 text-white border-0 shadow-sm font-bold"
                >
                  <CheckCircle2 class="w-3 h-3 mr-1" />
                  {{ t('qa.jobOrderMgmt.completed') }}
                </Badge>
                <Badge v-else class="bg-amber-500 text-white border-0 shadow-sm font-bold">
                  <Clock class="w-3 h-3 mr-1" />
                  {{ t('qa.jobOrderMgmt.inProgress') }}
                </Badge>
              </TableCell>
              <TableCell class="text-center">
                <div class="flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-9 w-9 text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                    @click.stop="handleEdit(order)"
                  >
                    <Edit class="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-9 w-9 text-primary hover:bg-primary/10 transition-colors"
                    @click.stop="handlePrint(order)"
                  >
                    <FileText class="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>

    <!-- Form Dialog Removed -->

    <!-- Print Preview Dialog -->
    <Dialog v-model:open="isPrintDialogOpen">
      <DialogContent class="max-w-[1000px] p-0 bg-slate-900/10 border-none shadow-none">
        <DialogHeader
          class="absolute -top-12 left-0 right-0 flex-row justify-between items-center text-white px-4"
        >
          <DialogTitle class="text-lg font-bold">Print Preview</DialogTitle>
          <DialogDescription class="sr-only"
            >Preview of the job order for printing</DialogDescription
          >
          <Button @click="triggerPrint" class="bg-emerald-500 hover:bg-emerald-600 font-bold px-6">
            Print Job Order
          </Button>
        </DialogHeader>
        <div class="flex justify-center p-8 bg-slate-100/50 rounded-xl">
          <JobOrderPrint v-if="selectedJobOrder" :data="selectedJobOrder" />
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
