<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { Input } from '@/components/ui/input';
import { useMaintenance } from '@/composables/useMaintenance';
import type { ColumnDef } from '@tanstack/vue-table';
import { format } from 'date-fns';
import { Calendar, ClipboardList, Plus, Search, User, Wrench } from 'lucide-vue-next';
import { computed, h, ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const formatCurrency = (val: number) => {
  return val.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const props = defineProps<{
  searchQuery?: string;
}>();

const emit = defineEmits<{
  (e: 'add-repair'): void;
}>();

const { repairs } = useMaintenance();

const localSearch = ref('');

const filteredRepairs = computed(() => {
  const q = (localSearch.value || props.searchQuery || '').toLowerCase();
  if (!q) return repairs.value;
  return repairs.value.filter(
    (r) =>
      r.machineName.toLowerCase().includes(q) ||
      r.issue.toLowerCase().includes(q) ||
      (r.technician && r.technician.toLowerCase().includes(q))
  );
});

// Define Repairs Columns
const columns = computed<ColumnDef<any>[]>(() => [
  {
    accessorKey: 'date',
    header: t('services.maintenance.repairs.columns.date'),
    cell: ({ row }) => {
      const val = row.getValue('date');
      const date = val ? format(new Date(val as string), 'dd-MMM-yyyy , HH:mm') : '-';
      return h('div', { class: 'flex items-center gap-2.5 py-1' }, [
        h(
          'div',
          {
            class:
              'w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400',
          },
          [h(Calendar, { class: 'w-4 h-4' })]
        ),
        h('span', { class: 'text-xs font-bold text-slate-700' }, date),
      ]);
    },
  },
  {
    accessorKey: 'machineName',
    header: t('services.maintenance.repairs.columns.machine'),
    cell: ({ row }) => {
      return h('div', { class: 'flex flex-col' }, [
        h(
          'span',
          { class: 'text-xs font-bold text-slate-900 leading-none' },
          row.getValue('machineName')
        ),
        h('span', { class: 'text-[10px] text-slate-400 mt-1' }, t('services.maintenance.assetUnit')),
      ]);
    },
  },
  {
    accessorKey: 'issue',
    header: t('services.maintenance.repairs.columns.issue'),
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(Wrench, { class: 'w-3.5 h-3.5 text-blue-500' }),
        h(
          'span',
          { class: 'text-xs text-slate-600 font-medium line-clamp-1' },
          row.getValue('issue')
        ),
      ]);
    },
  },
  {
    accessorKey: 'technician',
    header: t('services.maintenance.repairs.columns.technician'),
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(User, { class: 'w-3.5 h-3.5 text-slate-400' }),
        h('span', { class: 'text-xs text-slate-600' }, row.getValue('technician')),
      ]);
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = (row.getValue('status') as string) || 'COMPLETED';
      const colorClass =
        status === 'OPEN'
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
          : status === 'IN_PROGRESS'
            ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
            : status === 'WAITING_PARTS'
              ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100';

      return h(Badge, { class: `border-none ${colorClass}` }, () => status.replace('_', ' '));
    },
  },
  {
    accessorKey: 'totalCost',
    header: t('services.maintenance.repairs.columns.cost'),
    cell: ({ row }) => {
      const cost = Number(row.getValue('totalCost'));
      return h(
        'div',
        { class: 'text-xs font-black text-slate-900 font-mono' },
        formatCurrency(cost)
      );
    },
  },
]);
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden bg-slate-50">
    <!-- Scrollable Content Area -->
    <div class="flex-1 overflow-y-auto px-6 pb-6 pt-1">
      <!-- Header Section -->
      <div class="flex items-center justify-between gap-4">
        <div class="space-y-1">
          <h2 class="text-xl font-bold tracking-tight text-slate-900 group flex items-center gap-2">
            <ClipboardList class="w-5 h-5 text-blue-600" />
            {{ t('services.maintenance.repairs.title') }}
          </h2>
          <p class="text-sm text-slate-500 font-medium">
            {{ t('services.maintenance.repairs.subtitle') }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative w-64">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              v-model="localSearch"
              :placeholder="t('services.maintenance.repairs.search')"
              class="pl-9 bg-white/50 border-slate-200/50 h-9 text-sm rounded-lg focus:ring-blue-500/20"
            />
          </div>
          <Button
            @click="emit('add-repair')"
            class="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-lg shadow-sm shadow-blue-200 flex items-center gap-2"
          >
            <Plus class="w-4 h-4" />
            {{ t('services.maintenance.repairs.add') }}
          </Button>
        </div>
      </div>

      <!-- DataTable -->
      <div
        class="mt-6 rounded-xl border border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden"
      >
        <DataTable :columns="columns" :data="filteredRepairs" />
      </div>
    </div>
  </div>
</template>
