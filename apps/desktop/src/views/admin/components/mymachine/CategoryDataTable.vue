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
import type { StockCategory } from '@/composables/useMyMachine';
import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
  type ColumnDef,
} from '@tanstack/vue-table';
import { Edit2, Trash2 } from 'lucide-vue-next';
import { computed, h } from 'vue';

const props = defineProps<{
  data: StockCategory[];
  searchQuery?: string;
}>();

const emit = defineEmits<{
  edit: [category: StockCategory];
  delete: [id: string];
}>();

const globalFilter = computed(() => props.searchQuery || '');

const columns = computed<ColumnDef<StockCategory>[]>(() => [
  {
    accessorKey: 'nameEN',
    header: 'Name (EN)',
    cell: ({ row }) =>
      h('span', { class: 'text-slate-600 font-medium' }, row.getValue('nameEN') || '-'),
  },
  {
    accessorKey: 'nameTH',
    header: 'Name (TH)',
    cell: ({ row }) => h('span', { class: 'text-slate-600' }, row.getValue('nameTH') || '-'),
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 80,
    cell: ({ row }) => {
      const category = row.original;
      return h('div', { class: 'flex items-center justify-end gap-1' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-7 w-7 text-slate-400 hover:text-blue-600',
            onClick: () => emit('edit', category),
          },
          () => h(Edit2, { class: 'w-3.5 h-3.5' })
        ),
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-7 w-7 text-slate-400 hover:text-red-600',
            onClick: () => emit('delete', category.id),
          },
          () => h(Trash2, { class: 'w-3.5 h-3.5' })
        ),
      ]);
    },
  },
]);

const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return columns.value;
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  state: {
    get globalFilter() {
      return globalFilter.value;
    },
  },
  onGlobalFilterChange: (_value) => {
    // Shared state from props
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
    <!-- Table -->
    <div class="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="bg-slate-50 font-semibold text-slate-700"
              :style="{ width: header.getSize() !== 150 ? `${header.getSize()}px` : 'auto' }"
            >
              <div
                :class="[
                  'flex items-center',
                  header.column.id === 'actions' ? 'justify-end' : 'justify-start',
                ]"
              >
                <FlexRender
                  v-if="!header.isPlaceholder"
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getPaginationRowModel().rows?.length">
            <TableRow
              v-for="row in table.getPaginationRowModel().rows"
              :key="row.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="py-2.5"
                :style="{
                  width: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : 'auto',
                }"
              >
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell :colspan="columns.length" class="h-24 text-center text-slate-500">
              No categories found.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between px-2 pt-2 pb-6">
      <div class="text-sm text-slate-600">
        Showing
        {{ table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 }}
        to
        {{
          Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )
        }}
        of {{ table.getFilteredRowModel().rows.length }} categories
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          Next
        </Button>
      </div>
    </div>
  </div>
</template>
