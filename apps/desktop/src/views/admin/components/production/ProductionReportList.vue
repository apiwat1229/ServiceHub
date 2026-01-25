<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePermissions } from '@/composables/usePermissions';
import { productionReportsApi, type ProductionReport } from '@/services/productionReports';
import { CalendarDate } from '@internationalized/date';
import { format } from 'date-fns';
import { Edit2, FileText, Loader2 } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();
const { hasPermission, isAdmin } = usePermissions();

const canUpdate = computed(() => isAdmin.value || hasPermission('production:update'));

const reports = ref<ProductionReport[]>([]);
const isLoading = ref(false);

const props = defineProps<{
  searchQuery?: string;
  date?: string;
}>();

const emit = defineEmits(['edit']);

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

const filteredReports = computed(() => {
  let filtered = reports.value;

  // Filter by date
  if (props.date) {
    const targetDateObj = parseDateString(props.date);
    if (targetDateObj) {
      const targetDateStr = `${targetDateObj.year}-${String(targetDateObj.month).padStart(2, '0')}-${String(targetDateObj.day).padStart(2, '0')}`;
      filtered = filtered.filter((report) => {
        const dateVal =
          report.productionDate instanceof Date
            ? report.productionDate.toISOString()
            : report.productionDate;
        const reportDate = dateVal ? dateVal.split('T')[0] : '';
        return reportDate === targetDateStr;
      });
    }
  }

  // Filter by search query
  if (props.searchQuery) {
    const q = props.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (report) =>
        report.grade?.toLowerCase().includes(q) ||
        report.bookNo?.toLowerCase().includes(q) ||
        report.pageNo?.toLowerCase().includes(q)
    );
  }

  return filtered;
});

const fetchReports = async () => {
  isLoading.value = true;
  try {
    reports.value = await productionReportsApi.getAll();
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchReports);
</script>

<template>
  <div class="rounded-xl border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="text-center">{{ t('production.productionDate') }}</TableHead>
          <TableHead class="text-center">{{ t('production.shift') }}</TableHead>
          <TableHead class="text-center">{{ t('production.grade') }}</TableHead>
          <TableHead class="text-center"
            >{{ t('production.bookNo') }}/{{ t('production.pageNo') }}</TableHead
          >
          <TableHead class="text-center">{{ t('common.status') }}</TableHead>
          <TableHead class="text-right">{{ t('common.actions') }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="isLoading">
          <TableCell colspan="6" class="h-24 text-center">
            <Loader2 class="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </TableCell>
        </TableRow>
        <TableRow v-else v-for="report in filteredReports" :key="report.id">
          <TableCell class="text-center">{{
            format(new Date(report.productionDate), 'dd/MM/yyyy')
          }}</TableCell>
          <TableCell class="text-center">{{ report.shift }}</TableCell>
          <TableCell class="text-center">{{ report.grade }}</TableCell>
          <TableCell class="text-center">{{ report.bookNo }}/{{ report.pageNo }}</TableCell>
          <TableCell class="text-center">
            <span
              :class="[
                'px-2 py-1 rounded-full text-xs font-medium',
                report.status === 'SUBMITTED'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700',
              ]"
            >
              {{ report.status }}
            </span>
          </TableCell>
          <TableCell class="text-right">
            <div class="flex justify-end gap-2">
              <Button variant="ghost" size="icon" @click="emit('edit', report)">
                <FileText v-if="report.status === 'SUBMITTED' || !canUpdate" class="h-4 w-4" />
                <Edit2 v-else class="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow v-if="!isLoading && filteredReports.length === 0">
          <TableCell colspan="6" class="h-24 text-center text-muted-foreground">
            {{ t('production.history.empty') }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
