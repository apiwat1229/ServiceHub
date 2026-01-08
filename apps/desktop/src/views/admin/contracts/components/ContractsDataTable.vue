<script setup lang="ts">
import Badge from '@/components/ui/badge/Badge.vue';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type Contract } from '@/services/contracts';
import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/vue-table';
import { Download, Edit, FileText, MoreHorizontal, Search, Trash2 } from 'lucide-vue-next';
import { computed, h, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  contracts: Contract[];
  loading?: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// Table State
const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const globalFilter = ref('');

// Helper Functions
const formatDate = (dateStr: string) => {
  return new Date(dateStr)
    .toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })
    .replace(/ /g, '-');
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(val);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
    case 'Expiring':
      return 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100';
    case 'Expired':
      return 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'Active':
      return t('services.contracts.status.active');
    case 'Expiring':
      return t('services.contracts.status.expiring');
    case 'Expired':
      return t('services.contracts.status.expired');
    default:
      return t('services.contracts.status.draft');
  }
};

const getTypeLabel = (type: string) => {
  return t(`services.contracts.types.${type.toLowerCase()}`);
};

// Get unique values for filters
const uniqueTypes = computed(() => {
  const types = new Set(props.contracts.map((c) => c.contractType));
  return Array.from(types);
});

const uniqueDepartments = computed(() => {
  const departments = new Set(props.contracts.map((c) => c.department));
  return Array.from(departments);
});

const uniqueStatuses = computed(() => {
  const statuses = new Set(props.contracts.map((c) => c.status));
  return Array.from(statuses);
});

const columns: ColumnDef<Contract>[] = [
  {
    accessorKey: 'title',
    header: () => t('services.contracts.dashboard.table.title'),
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h('div', { class: 'p-1.5 rounded bg-blue-50 text-blue-600' }, [
          h(FileText, { class: 'w-4 h-4' }),
        ]),
        h('span', { class: 'font-medium' }, row.getValue('title')),
      ]);
    },
  },
  {
    accessorKey: 'contractType',
    header: () => t('services.contracts.dashboard.table.type'),
    cell: ({ row }) =>
      h('span', { class: 'text-slate-600' }, getTypeLabel(row.getValue('contractType'))),
    filterFn: 'equals',
  },
  {
    accessorKey: 'department',
    header: () => t('services.contracts.dashboard.table.department'),
    cell: ({ row }) => h('span', { class: 'text-slate-600' }, row.getValue('department')),
    filterFn: 'equals',
  },
  {
    accessorKey: 'startDate',
    header: () => t('services.contracts.dashboard.table.duration'),
    cell: ({ row }) => {
      const startDate = formatDate(row.original.startDate);
      const endDate = formatDate(row.original.endDate);
      return h(
        'div',
        { class: 'text-xs text-slate-900 whitespace-nowrap' },
        `${startDate} → ${endDate}`
      );
    },
  },
  {
    accessorKey: 'cost',
    header: () => h('div', { class: 'text-right' }, t('services.contracts.dashboard.table.value')),
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-right font-medium text-slate-700' },
        formatCurrency(row.getValue('cost'))
      ),
  },
  {
    accessorKey: 'status',
    header: () =>
      h('div', { class: 'text-center' }, t('services.contracts.dashboard.table.status')),
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return h(
        'div',
        { class: 'flex justify-center' },
        h(Badge, { class: `border ${getStatusColor(status)}` }, () => getStatusLabel(status))
      );
    },
    filterFn: 'equals',
  },
  {
    id: 'actions',
    header: () =>
      h('div', { class: 'text-right' }, t('services.contracts.dashboard.table.actions')),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'flex justify-end' },
        h(
          DropdownMenu,
          {},
          {
            default: () => [
              h(
                DropdownMenuTrigger,
                { asChild: true },
                {
                  default: () =>
                    h(
                      Button,
                      { variant: 'ghost', class: 'h-8 w-8 p-0' },
                      {
                        default: () => [
                          h('span', { class: 'sr-only' }, 'Open menu'),
                          h(MoreHorizontal, { class: 'h-4 w-4' }),
                        ],
                      }
                    ),
                }
              ),
              h(
                DropdownMenuContent,
                { align: 'end' },
                {
                  default: () => [
                    h(DropdownMenuLabel, {}, () => t('services.contracts.dashboard.table.actions')),
                    h(
                      DropdownMenuItem,
                      { onClick: () => props.onEdit(row.original.id) },
                      {
                        default: () => [
                          h(Edit, { class: 'mr-2 h-4 w-4' }),
                          h('span', {}, t('services.contracts.actions.edit')),
                        ],
                      }
                    ),
                    h(DropdownMenuItem, {}, () => [
                      h(Download, { class: 'mr-2 h-4 w-4' }),
                      h('span', {}, t('services.contracts.actions.download')),
                    ]),
                    h(DropdownMenuSeparator),
                    h(
                      DropdownMenuItem,
                      {
                        onClick: () => props.onDelete(row.original.id),
                        class: 'text-red-600 focus:text-red-600',
                      },
                      {
                        default: () => [
                          h(Trash2, { class: 'mr-2 h-4 w-4' }),
                          h('span', {}, t('services.contracts.actions.delete')),
                        ],
                      }
                    ),
                  ],
                }
              ),
            ],
          }
        )
      );
    },
  },
];

// Table Instance
const table = useVueTable({
  get data() {
    return props.contracts;
  },
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onSortingChange: (updaterOrValue) => {
    sorting.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(sorting.value) : updaterOrValue;
  },
  onColumnFiltersChange: (updaterOrValue) => {
    columnFilters.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(columnFilters.value) : updaterOrValue;
  },
  onGlobalFilterChange: (updaterOrValue) => {
    globalFilter.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(globalFilter.value) : updaterOrValue;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get globalFilter() {
      return globalFilter.value;
    },
  },
  initialState: {
    pagination: {
      pageSize: 10,
    },
  },
});
</script>

<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="flex flex-col md:flex-row gap-4">
      <!-- Search -->
      <div class="relative flex-1">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          :model-value="globalFilter"
          @update:model-value="(value) => (globalFilter = value as string)"
          :placeholder="t('services.contracts.dashboard.filters.searchPlaceholder')"
          class="pl-8"
        />
      </div>

      <!-- Type Filter -->
      <Select
        :model-value="(table.getColumn('contractType')?.getFilterValue() as string) ?? 'all'"
        @update:model-value="
          (value) => table.getColumn('contractType')?.setFilterValue(value === 'all' ? '' : value)
        "
      >
        <SelectTrigger class="w-[180px]">
          <SelectValue :placeholder="t('services.contracts.dashboard.filters.type')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{
            t('services.contracts.dashboard.filters.allTypes')
          }}</SelectItem>
          <SelectItem v-for="type in uniqueTypes" :key="type" :value="type">
            {{ type }}
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Department Filter -->
      <Select
        :model-value="(table.getColumn('department')?.getFilterValue() as string) ?? 'all'"
        @update:model-value="
          (value) => table.getColumn('department')?.setFilterValue(value === 'all' ? '' : value)
        "
      >
        <SelectTrigger class="w-[200px]">
          <SelectValue :placeholder="t('services.contracts.dashboard.filters.department')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{
            t('services.contracts.dashboard.filters.allDepartments')
          }}</SelectItem>
          <SelectItem v-for="dept in uniqueDepartments" :key="dept" :value="dept">
            {{ dept }}
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Status Filter -->
      <Select
        :model-value="(table.getColumn('status')?.getFilterValue() as string) ?? 'all'"
        @update:model-value="
          (value) => table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
        "
      >
        <SelectTrigger class="w-[150px]">
          <SelectValue :placeholder="t('services.contracts.dashboard.filters.status')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{
            t('services.contracts.dashboard.filters.allStatus')
          }}</SelectItem>
          <SelectItem v-for="status in uniqueStatuses" :key="status" :value="status">
            {{ getStatusLabel(status) }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Table -->
    <div class="rounded-md border">
      <table class="w-full text-sm">
        <thead class="bg-slate-50">
          <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="px-4 py-3 text-left font-medium text-slate-500"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            class="hover:bg-slate-50/50 transition-colors"
          >
            <td v-for="cell in row.getVisibleCells()" :key="cell.id" class="px-4 py-3">
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between">
      <div class="text-sm text-muted-foreground">
        {{
          t('services.contracts.dashboard.filters.showing', {
            start: table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1,
            end: Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            ),
            total: table.getFilteredRowModel().rows.length,
          })
        }}
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          @click="table.previousPage()"
          :disabled="!table.getCanPreviousPage()"
        >
          {{ t('services.contracts.dashboard.filters.previous') }}
        </Button>
        <Button
          variant="outline"
          size="sm"
          @click="table.nextPage()"
          :disabled="!table.getCanNextPage()"
        >
          {{ t('services.contracts.dashboard.filters.next') }}
        </Button>
      </div>
    </div>
  </div>
</template>
