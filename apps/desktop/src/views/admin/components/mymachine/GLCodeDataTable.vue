<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { GLCode } from '@/composables/useMyMachine';
import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/vue-table';
import { Edit2, Search, Trash2 } from 'lucide-vue-next';
import { ref } from 'vue';

interface Props {
  data: GLCode[];
}

const props = defineProps<Props>();
const emit = defineEmits(['edit', 'delete']);

const sorting = ref<SortingState>([]);
const globalFilter = ref('');

const columns: ColumnDef<GLCode>[] = [
  {
    accessorKey: 'transactionId',
    header: 'Transaction-ID',
    cell: ({ row }) => {
      return h(
        'span',
        { class: 'font-bold text-xs text-slate-700' },
        row.getValue('transactionId')
      );
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      return h('span', { class: 'text-xs text-slate-600' }, row.getValue('description'));
    },
  },
  {
    accessorKey: 'code',
    header: () => h('div', { class: 'text-center' }, 'GL-Code'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'flex justify-center' },
        h(
          'span',
          {
            class:
              'font-mono text-xs text-blue-600 font-bold bg-blue-50/50 rounded px-2 py-0.5 min-w-[80px] text-center',
          },
          row.getValue('code')
        )
      );
    },
  },
  {
    accessorKey: 'purpose',
    header: 'วัตถุประสงค์การซ่อมแซม',
    cell: ({ row }) => {
      return h('span', { class: 'text-xs text-slate-600' }, row.getValue('purpose') || '-');
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return h('div', { class: 'flex justify-end gap-1' }, [
        h(
          Button,
          {
            size: 'icon',
            variant: 'ghost',
            class: 'h-8 w-8 text-slate-400 hover:text-blue-600',
            onClick: (e: Event) => {
              e.stopPropagation();
              emit('edit', row.original);
            },
          },
          () => h(Edit2, { class: 'w-3.5 h-3.5' })
        ),
        h(
          Button,
          {
            size: 'icon',
            variant: 'ghost',
            class: 'h-8 w-8 text-slate-400 hover:text-red-600',
            onClick: (e: Event) => {
              e.stopPropagation();
              emit('delete', row.original.id);
            },
          },
          () => h(Trash2, { class: 'w-3.5 h-3.5' })
        ),
      ]);
    },
  },
];

import { h } from 'vue';

const table = useVueTable({
  get data() {
    return props.data;
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
  onGlobalFilterChange: (updaterOrValue) => {
    globalFilter.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(globalFilter.value) : updaterOrValue;
  },
  state: {
    get sorting() {
      return sorting.value;
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
    <!-- Search Bar -->
    <div class="relative max-w-sm">
      <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
      <Input
        v-model="globalFilter"
        placeholder="Search GL-Codes..."
        class="pl-9 h-9 text-xs bg-white border-slate-200"
      />
    </div>

    <!-- Table Containment -->
    <div class="border rounded-lg overflow-hidden border-slate-200 bg-white">
      <Table>
        <TableHeader class="bg-slate-50">
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="text-[10px] font-black uppercase text-slate-600 px-4 py-3"
              :style="{
                width:
                  header.id === 'transactionId'
                    ? '130px'
                    : header.id === 'actions'
                      ? '100px'
                      : header.id === 'code'
                        ? '120px'
                        : 'auto',
              }"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="px-4 py-2.5">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell colspan="5" class="h-32 text-center text-slate-400 text-xs italic">
              No results found.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between px-2">
      <div class="text-[11px] text-slate-500 font-medium">
        Showing
        {{ table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 }}
        to
        {{
          Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )
        }}
        of {{ table.getFilteredRowModel().rows.length }} entries
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-8 text-xs px-3"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-8 text-xs px-3"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          Next
        </Button>
      </div>
    </div>
  </div>
</template>
