<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { Input } from '@/components/ui/input';
import { useMyMachine } from '@/composables/useMyMachine';
import type { ColumnDef } from '@tanstack/vue-table';
import { AlertCircle, CheckCircle2, Clock, DollarSign, Search, Wrench } from 'lucide-vue-next';
import { computed, h, ref } from 'vue';

const { machines, repairs } = useMyMachine();
const searchQuery = ref('');

const filteredRepairs = computed(() => {
  if (!searchQuery.value) return repairs.value;
  const q = searchQuery.value.toLowerCase();
  return repairs.value.filter(
    (r) =>
      r.machineName.toLowerCase().includes(q) ||
      (r.issue && r.issue.toLowerCase().includes(q)) ||
      (r.technician && r.technician.toLowerCase().includes(q))
  );
});

const totalCost = computed(() =>
  repairs.value.reduce((acc, curr) => acc + (Number(curr.totalCost) || 0), 0)
);
const totalRepairs = computed(() => repairs.value.length);
const activeMachines = computed(() => machines.value.filter((m) => m.status === 'Active').length);

const mostRepaired = computed(() => {
  const machineRepairCounts: Record<string, number> = {};
  repairs.value.forEach((r) => {
    machineRepairCounts[r.machineName] = (machineRepairCounts[r.machineName] || 0) + 1;
  });
  const sorted = Object.entries(machineRepairCounts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0] : null;
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(val);
};

// Define DataTable Columns
const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'machineName',
    header: 'Machine & Issue',
    cell: ({ row }) => {
      const repair = row.original;
      return h('div', { class: 'flex items-center gap-3' }, [
        h(
          'div',
          {
            class:
              'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border border-slate-200 bg-gradient-to-br from-white to-slate-50 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:from-blue-50 hover:to-blue-100 transition-all shadow-sm',
          },
          [h(Wrench, { class: 'w-5 h-5' })]
        ),
        h('div', { class: 'min-w-0 flex-1' }, [
          h('div', { class: 'flex items-center gap-2 mb-0.5' }, [
            h(
              'span',
              { class: 'font-bold text-slate-900 hover:text-blue-700 transition-colors truncate' },
              repair.machineName
            ),
            h(
              'span',
              {
                class:
                  'text-[0.5625rem] font-bold text-slate-400 uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 flex-shrink-0',
              },
              machines.value.find((m) => m.id === repair.machineId)?.model || 'STD'
            ),
          ]),
          h('p', { class: 'text-xs text-slate-500 truncate' }, repair.issue),
        ]),
      ]);
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-1.5 text-xs text-slate-600 font-medium' }, [
        h(Clock, { class: 'w-3.5 h-3.5 text-slate-400' }),
        String(row.getValue('date')),
      ]),
  },
  {
    accessorKey: 'technician',
    header: 'Technician',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-sm font-medium text-slate-700' },
        row.getValue('technician') || 'N/A'
      ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const cost = Number(row.original.totalCost);
      return h(
        Badge,
        {
          variant: 'outline',
          class: `text-[0.625rem] font-bold uppercase tracking-wide px-2 py-1 ${
            cost > 10000
              ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200'
              : 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200'
          }`,
        },
        () => (cost > 10000 ? 'Major Service' : 'Routine')
      );
    },
  },
  {
    accessorKey: 'totalCost',
    header: () => h('div', { class: 'text-right' }, 'Cost'),
    cell: ({ row }) => {
      const amount = Number(row.getValue('totalCost'));
      return h('div', { class: 'text-right' }, [
        h(
          'div',
          { class: 'text-base font-black text-slate-900 hover:text-blue-700 transition-colors' },
          formatCurrency(amount)
        ),
      ]);
    },
  },
];
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden bg-slate-50 pt-4">
    <!-- Statistics Section (Modern Compact) -->
    <div class="px-6 py-2 flex-shrink-0">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <Card
          class="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md hover:bg-white/90 transition-all"
        >
          <CardContent class="p-3">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-[0.625rem] font-semibold text-slate-500 uppercase tracking-wide">
                  Total Cost
                </p>
                <h3 class="text-xl font-bold mt-0.5 text-slate-900">
                  {{ formatCurrency(totalCost) }}
                </h3>
                <p class="text-[0.5625rem] text-slate-400 mt-0.5">Investment in repairs</p>
              </div>
              <div class="p-1.5 bg-emerald-50 rounded-md">
                <DollarSign class="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          class="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md hover:bg-white/90 transition-all"
        >
          <CardContent class="p-3">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-[0.625rem] font-semibold text-slate-500 uppercase tracking-wide">
                  Active
                </p>
                <h3 class="text-xl font-bold mt-0.5 text-slate-900">
                  {{ activeMachines }} / {{ machines.length }}
                </h3>
                <p class="text-[0.5625rem] text-slate-400 mt-0.5">Operational equipment</p>
              </div>
              <div class="p-1.5 bg-blue-50 rounded-md">
                <CheckCircle2 class="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          class="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md hover:bg-white/90 transition-all"
        >
          <CardContent class="p-3">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-[0.625rem] font-semibold text-slate-500 uppercase tracking-wide">
                  Repairs
                </p>
                <h3 class="text-xl font-bold mt-0.5 text-slate-900">{{ totalRepairs }}</h3>
                <p class="text-[0.5625rem] text-slate-400 mt-0.5">Maintenance logs</p>
              </div>
              <div class="p-1.5 bg-purple-50 rounded-md">
                <Wrench class="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          class="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md hover:bg-white/90 transition-all"
        >
          <CardContent class="p-3">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-[0.625rem] font-semibold text-slate-500 uppercase tracking-wide">
                  Critical
                </p>
                <h3 class="text-base font-bold mt-0.5 text-slate-900 truncate max-w-[110px]">
                  {{ mostRepaired ? mostRepaired[0] : '-' }}
                </h3>
                <p class="text-[0.5625rem] text-orange-600 mt-0.5">
                  {{ mostRepaired ? `${mostRepaired[1]} repairs` : 'No repairs' }}
                </p>
              </div>
              <div class="p-1.5 bg-orange-50 rounded-md">
                <AlertCircle class="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Scrollable Content Area -->
    <div class="flex-1 overflow-y-auto px-6 pb-6 pt-3">
      <!-- Table Header -->
      <div class="flex items-center justify-between mb-3">
        <div>
          <h2 class="text-base font-bold text-slate-900">Recent Maintenance Logs</h2>
          <p class="text-xs text-slate-500">Latest repairs performed on systems</p>
        </div>
        <div class="relative w-64 flex-shrink-0">
          <Search class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            v-model="searchQuery"
            type="search"
            placeholder="Search logs..."
            class="pl-8 pr-2 h-9 text-xs bg-white border-slate-200 focus:bg-white transition-all shadow-sm"
          />
        </div>
      </div>

      <!-- DataTable -->
      <div
        class="rounded-xl border border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden"
      >
        <DataTable :columns="columns" :data="filteredRepairs" />
      </div>
    </div>
  </div>
</template>
