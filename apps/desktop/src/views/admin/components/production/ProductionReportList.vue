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
import { productionReportsApi, type ProductionReport } from '@/services/productionReports';
import { format } from 'date-fns';
import { Edit2, Loader2, Trash2 } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();
const reports = ref<ProductionReport[]>([]);
const isLoading = ref(false);

const emit = defineEmits(['edit']);

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

const handleDelete = async (id: string) => {
  if (!confirm(t('common.areYouSure'))) return;
  try {
    await productionReportsApi.delete(id);
    toast.success(t('common.deleteSuccess'));
    fetchReports();
  } catch (error) {
    console.error('Failed to delete report:', error);
    toast.error(t('common.errorDelete'));
  }
};

onMounted(fetchReports);
</script>

<template>
  <div class="rounded-xl border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{{ t('production.productionDate') }}</TableHead>
          <TableHead>{{ t('production.shift') }}</TableHead>
          <TableHead>{{ t('production.grade') }}</TableHead>
          <TableHead>{{ t('production.bookNo') }}/{{ t('production.pageNo') }}</TableHead>
          <TableHead>{{ t('common.status') }}</TableHead>
          <TableHead class="text-right">{{ t('common.actions') }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="isLoading">
          <TableCell colspan="6" class="h-24 text-center">
            <Loader2 class="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </TableCell>
        </TableRow>
        <TableRow v-else v-for="report in reports" :key="report.id">
          <TableCell>{{ format(new Date(report.productionDate), 'dd/MM/yyyy') }}</TableCell>
          <TableCell>{{ report.shift }}</TableCell>
          <TableCell>{{ report.grade }}</TableCell>
          <TableCell>{{ report.bookNo }}/{{ report.pageNo }}</TableCell>
          <TableCell>
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
                <Edit2 class="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="text-destructive"
                @click="handleDelete(report.id!)"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow v-if="!isLoading && reports.length === 0">
          <TableCell colspan="6" class="h-24 text-center text-muted-foreground">
            {{ t('production.history.empty') }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
