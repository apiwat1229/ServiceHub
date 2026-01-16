<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
  Plus,
} from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
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

const fetchJobOrders = async () => {
  isLoading.value = true;
  try {
    // In a real app, we'd pass filters to the API
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
      toast.success('Job order updated successfully');
    } else {
      await jobOrdersApi.create(formData);
      toast.success('Job order created successfully');
    }
    isFormOpen.value = false;
    fetchJobOrders();
  } catch (error) {
    console.error('Failed to save job order:', error);
    toast.error('Failed to save job order');
  }
};

onMounted(() => {
  fetchJobOrders();
});
</script>

<template>
  <div class="space-y-4">
    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card class="bg-primary/5 border-primary/20">
        <CardContent class="p-4 flex items-center gap-4">
          <div class="bg-primary/10 p-2 rounded-lg">
            <FileText class="w-5 h-5 text-primary" />
          </div>
          <div>
            <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Orders
            </p>
            <p class="text-2xl font-black text-primary">{{ jobOrders.length }}</p>
          </div>
        </CardContent>
      </Card>

      <Card class="bg-emerald-50 border-emerald-100">
        <CardContent class="p-4 flex items-center gap-4">
          <div class="bg-emerald-100 p-2 rounded-lg">
            <CheckCircle2 class="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Completed
            </p>
            <p class="text-2xl font-black text-emerald-600">
              {{ jobOrders.filter((j) => j.isClosed).length }}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card class="bg-amber-50 border-amber-100">
        <CardContent class="p-4 flex items-center gap-4">
          <div class="bg-amber-100 p-2 rounded-lg">
            <Clock class="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              In Progress
            </p>
            <p class="text-2xl font-black text-amber-600">
              {{ jobOrders.filter((j) => !j.isClosed).length }}
            </p>
          </div>
        </CardContent>
      </Card>

      <div class="flex items-end justify-end">
        <Button
          @click="handleCreate"
          class="w-full md:w-auto h-12 px-8 bg-primary hover:bg-primary/90 shadow-lg gap-2 text-base font-black uppercase"
        >
          <Plus class="w-5 h-5" />
          New Job Order
        </Button>
      </div>
    </div>

    <!-- Job Orders Table -->
    <div class="border rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-200">
      <Table>
        <TableHeader class="bg-slate-50">
          <TableRow class="hover:bg-transparent">
            <TableHead class="font-bold text-slate-800">Job Order No.</TableHead>
            <TableHead class="font-bold text-slate-800">Date</TableHead>
            <TableHead class="font-bold text-slate-800">Contract No.</TableHead>
            <TableHead class="font-bold text-slate-800">Grade</TableHead>
            <TableHead class="font-bold text-slate-800">Pallet Specs</TableHead>
            <TableHead class="font-bold text-slate-800">Status</TableHead>
            <TableHead class="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading" v-for="i in 3" :key="i" class="animate-pulse">
            <TableCell v-for="j in 6" :key="j">
              <div class="h-4 bg-slate-100 rounded"></div>
            </TableCell>
          </TableRow>

          <TableRow v-else-if="jobOrders.length === 0">
            <TableCell colspan="7" class="h-64 text-center">
              <div class="flex flex-col items-center justify-center text-muted-foreground">
                <FileText class="w-12 h-12 mb-4 opacity-20" />
                <p class="font-bold text-slate-400">No job orders found</p>
                <Button variant="link" @click="handleCreate" class="text-primary font-bold"
                  >Create your first order</Button
                >
              </div>
            </TableCell>
          </TableRow>

          <TableRow
            v-for="order in jobOrders"
            :key="order.id"
            class="group hover:bg-slate-50 transition-colors cursor-pointer"
            @click="handleEdit(order)"
          >
            <TableCell class="font-black text-slate-900">
              <div class="flex items-center gap-2">
                <div
                  class="w-2 h-2 rounded-full"
                  :class="order.isClosed ? 'bg-emerald-500' : 'bg-amber-500'"
                ></div>
                {{ order.jobOrderNo }}
              </div>
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-2 text-slate-500">
                <CalendarIcon class="w-3.5 h-3.5 opacity-50" />
                {{ format(new Date(order.qaDate), 'dd MMM yyyy') }}
              </div>
            </TableCell>
            <TableCell class="font-medium text-slate-600">{{ order.contractNo }}</TableCell>
            <TableCell>
              <Badge variant="secondary" class="font-bold bg-slate-100 text-slate-700">
                {{ order.grade === 'Other' ? order.otherGrade : order.grade }}
              </Badge>
            </TableCell>
            <TableCell>
              <div class="text-xs flex flex-col gap-0.5">
                <span class="font-bold">{{ order.palletType }}</span>
                <span class="text-slate-400"
                  >{{ order.orderQuantity }} Pallets ({{ order.quantityBale }} bales ea.)</span
                >
              </div>
            </TableCell>
            <TableCell>
              <Badge
                v-if="order.isClosed"
                class="bg-emerald-100 text-emerald-700 border-emerald-200"
              >
                Completed
              </Badge>
              <Badge v-else class="bg-amber-100 text-amber-700 border-amber-200">
                In Progress
              </Badge>
            </TableCell>
            <TableCell>
              <div
                class="flex justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 hover:bg-white border hover:shadow-sm"
                >
                  <Eye class="w-4 h-4 text-slate-600" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Form Dialog -->
    <Dialog v-model:open="isFormOpen">
      <DialogContent
        class="max-w-[70vw] h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none"
      >
        <div class="bg-white rounded-2xl overflow-hidden shadow-2xl m-4">
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
