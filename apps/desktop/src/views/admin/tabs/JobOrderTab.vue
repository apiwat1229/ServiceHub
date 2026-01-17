<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { jobOrdersApi, type JobOrder } from '@/services/jobOrders';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Package,
  Plus,
  Search,
} from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import JobOrderForm from '../components/JobOrderForm.vue';

const { t } = useI18n();

const props = defineProps<{
  searchQuery: string;
  date: string;
}>();

const jobOrders = ref<JobOrder[]>([]);
const isLoading = ref(false);
const isFormOpen = ref(false);
const selectedJobOrder = ref<JobOrder | null>(null);
const searchQuery = ref('');
const selectedDate = ref<any>(null);

const dateDisplay = computed(() => {
  if (!selectedDate.value) return format(new Date(), 'dd-MMM-yyyy');
  const date = new Date(
    selectedDate.value.year,
    selectedDate.value.month - 1,
    selectedDate.value.day
  );
  return format(date, 'dd-MMM-yyyy');
});

const handleDateChange = (date: any) => {
  selectedDate.value = date;
};

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

const handleCreate = () => {
  selectedJobOrder.value = null;
  isFormOpen.value = true;
};

const handleEdit = (jobOrder: JobOrder) => {
  selectedJobOrder.value = jobOrder;
  isFormOpen.value = true;
};

const handleSave = async (formData: JobOrder) => {
  try {
    if (selectedJobOrder.value?.id) {
      await jobOrdersApi.update(selectedJobOrder.value.id, formData);
      toast.success(t('qa.jobOrderForm.updateSuccess') || 'Job order updated successfully');
    } else {
      await jobOrdersApi.create(formData);
      toast.success(t('qa.jobOrderForm.createSuccess') || 'Job order created successfully');
    }
    isFormOpen.value = false;
    fetchJobOrders();
  } catch (error) {
    console.error('Failed to save job order:', error);
    toast.error(t('common.errorSave') || 'Failed to save job order');
  }
};

onMounted(() => {
  fetchJobOrders();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Search, Date, and Button in One Row -->
    <div class="flex items-center justify-between gap-4">
      <!-- Left: Title -->
      <div>
        <h2 class="text-xl font-black text-slate-800 flex items-center gap-2">
          <div class="w-1 h-6 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
          {{ t('qa.jobOrderMgmt.title') }}
        </h2>
        <p class="text-xs text-slate-500 mt-0.5 ml-4">
          {{ t('qa.jobOrderMgmt.subtitle') }}
        </p>
      </div>

      <!-- Right: Search, Date Picker, and New Button -->
      <div class="flex items-center gap-3">
        <div class="relative w-64">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            v-model="searchQuery"
            :placeholder="t('qa.searchPlaceholder')"
            class="pl-9 h-10 bg-white border-slate-200"
          />
        </div>

        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              class="h-10 px-4 justify-start text-left font-normal bg-white min-w-[160px]"
            >
              <CalendarIcon class="mr-2 h-4 w-4 text-slate-500" />
              <span class="text-slate-700">{{ dateDisplay }}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start">
            <Calendar v-model="selectedDate" @update:model-value="handleDateChange" />
          </PopoverContent>
        </Popover>

        <Button
          @click="handleCreate"
          class="h-10 px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg gap-2 font-black"
        >
          <Plus class="w-5 h-5" />
          {{ t('qa.jobOrderMgmt.newOrder') }}
        </Button>
      </div>
    </div>

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
                  <span class="text-sm font-black text-blue-600">{{ jobOrders.length }}</span>
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
                    jobOrders.filter((j) => j.isClosed).length
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
                    jobOrders.filter((j) => !j.isClosed).length
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
              <TableHead class="font-black text-slate-700">{{
                t('qa.jobOrderMgmt.cols.no')
              }}</TableHead>
              <TableHead class="font-black text-slate-700">{{
                t('qa.jobOrderMgmt.cols.date')
              }}</TableHead>
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
                  <Button variant="link" @click="handleCreate" class="text-primary font-bold">
                    <Plus class="w-4 h-4 mr-2" />
                    {{ t('qa.jobOrderMgmt.createFirst') }}
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            <TableRow
              v-for="order in jobOrders"
              :key="order.id"
              class="group hover:bg-slate-50/50 transition-all cursor-pointer border-b"
              @click="handleEdit(order)"
            >
              <TableCell class="font-black text-slate-900">
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
              <TableCell>
                <div class="flex items-center gap-2 text-slate-600">
                  <CalendarIcon class="w-3.5 h-3.5 opacity-50" />
                  <span class="font-medium">{{
                    format(new Date(order.qaDate), 'dd MMM yyyy')
                  }}</span>
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
                  <span class="text-slate-400"
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
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
                >
                  <Eye class="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>

    <!-- Form Dialog -->
    <Dialog v-model:open="isFormOpen">
      <DialogContent
        hide-close
        class="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none"
      >
        <DialogTitle class="sr-only">{{ t('qa.jobOrderMgmt.srTitle') }}</DialogTitle>
        <DialogDescription class="sr-only">{{ t('qa.jobOrderMgmt.srDesc') }}</DialogDescription>
        <div class="bg-white rounded-2xl overflow-hidden shadow-2xl">
          <JobOrderForm
            :initial-data="selectedJobOrder || undefined"
            @save="handleSave"
            @cancel="isFormOpen = false"
          />
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
