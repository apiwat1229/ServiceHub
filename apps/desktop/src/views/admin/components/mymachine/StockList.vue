<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMyMachine } from '@/composables/useMyMachine';
import type { ColumnDef } from '@tanstack/vue-table';
import {
  AlertTriangle,
  ArrowUpDown,
  DollarSign,
  Edit2,
  Filter,
  MapPin,
  Package,
  Search,
  Tag,
  Trash2,
} from 'lucide-vue-next';
import { computed, h, ref } from 'vue';

const props = defineProps<{
  searchQuery?: string;
}>();

const emit = defineEmits<{
  (e: 'add-stock'): void;
  (e: 'edit-stock', item: any): void;
}>();

const { stocks, deleteStock } = useMyMachine();

// Filters
const localSearch = ref('');
const categoryFilter = ref('ALL');

// Computed Stats
const stockStats = computed(() => {
  const totalItems = stocks.value.length;
  const lowStockItems = stocks.value.filter((s) => s.qty <= s.minQty).length;
  const totalValue = stocks.value.reduce((sum, s) => sum + s.price * s.qty, 0);
  const totalCategories = new Set(stocks.value.map((s) => s.category)).size;

  return {
    totalItems,
    lowStockItems,
    totalValue,
    totalCategories,
  };
});

const filteredStocks = computed(() => {
  let result = stocks.value;

  if (categoryFilter.value !== 'ALL') {
    result = result.filter((s) => s.category === categoryFilter.value);
  }

  const q = (props.searchQuery || localSearch.value).toLowerCase();
  if (q) {
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q))
    );
  }

  return result;
});

const handleDelete = (id: string) => {
  if (confirm('Are you sure you want to delete this item?')) {
    deleteStock(id);
  }
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

// DataTable Columns
const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          class: 'p-0 font-bold',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Part Specification', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
      );
    },
    cell: ({ row }) => {
      const item = row.original;
      return h('div', { class: 'flex items-center gap-3' }, [
        h(
          'div',
          {
            class:
              'w-10 h-10 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0',
          },
          [
            item.image
              ? h('img', { src: item.image, class: 'w-full h-full object-cover' })
              : h(Package, { class: 'w-4 h-4' }),
          ]
        ),
        h('div', { class: 'flex flex-col' }, [
          h('span', { class: 'font-bold text-slate-900' }, item.name),
          h(
            'span',
            { class: 'text-[0.625rem] font-medium text-slate-400 uppercase tracking-tight' },
            item.code || 'NO-CODE'
          ),
        ]),
      ]);
    },
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-1.5' }, [
        h(Tag, { class: 'w-3 h-3 text-slate-400' }),
        h('span', { class: 'text-sm text-slate-600' }, row.getValue('category') || 'Uncategorized'),
      ]),
  },
  {
    accessorKey: 'location',
    header: 'Storage',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-1.5' }, [
        h(MapPin, { class: 'w-3 h-3 text-slate-400' }),
        h('span', { class: 'text-sm text-slate-600' }, row.getValue('location') || '-'),
      ]),
  },
  {
    accessorKey: 'qty',
    header: 'Inventory',
    cell: ({ row }) => {
      const qty = row.getValue('qty') as number;
      const minQty = row.original.minQty;
      const isLow = qty <= minQty;

      return h('div', { class: 'flex items-center gap-2' }, [
        h(
          'span',
          { class: `text-sm font-black ${isLow ? 'text-red-600' : 'text-slate-900'}` },
          `${qty} pcs`
        ),
        isLow
          ? h(
              Badge,
              {
                variant: 'outline',
                class:
                  'bg-red-50 text-red-700 border-red-100 text-[0.5625rem] font-bold px-1.5 py-0',
              },
              () => 'LOW STOCK'
            )
          : null,
      ]);
    },
  },
  {
    accessorKey: 'price',
    header: 'Valuation',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('price'));
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'text-sm font-bold text-slate-900' }, formatCurrency(amount)),
      ]);
    },
  },
  {
    id: 'actions',
    header: 'Action',
    enableHiding: false,
    cell: ({ row }) => {
      const item = row.original;
      return h('div', { class: 'flex items-center gap-2' }, [
        h(
          Button,
          {
            variant: 'outline',
            size: 'icon',
            class: 'h-8 w-8 text-blue-600 border-blue-100 hover:bg-blue-50 hover:text-blue-700',
            onClick: () => emit('edit-stock', item),
          },
          () => h(Edit2, { class: 'h-4 w-4' })
        ),
        h(
          Button,
          {
            variant: 'outline',
            size: 'icon',
            class: 'h-8 w-8 text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700',
            onClick: () => handleDelete(item.id),
          },
          () => h(Trash2, { class: 'h-4 w-4' })
        ),
      ]);
    },
  },
];
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden bg-slate-50">
    <!-- Scrollable Content Area -->
    <div class="flex-1 overflow-y-auto px-6 pb-6 pt-1">
      <!-- Statistics Cards (Modern Compact) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 flex-shrink-0 pb-4">
        <Card
          class="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm overflow-hidden group hover:shadow-md transition-all"
        >
          <CardContent class="p-3">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Inventory Value
                </p>
                <h3 class="text-2xl font-black text-slate-900">
                  {{ formatCurrency(stockStats.totalValue) }}
                </h3>
              </div>
              <div
                class="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"
              >
                <DollarSign class="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          class="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm overflow-hidden group hover:shadow-md transition-all"
        >
          <CardContent class="p-3">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Line Items
                </p>
                <h3 class="text-2xl font-black text-slate-900">{{ stockStats.totalItems }}</h3>
              </div>
              <div
                class="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform"
              >
                <Package class="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          class="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm overflow-hidden group hover:shadow-md transition-all"
          :class="stockStats.lowStockItems > 0 ? 'border-red-200/50 ring-1 ring-red-100/50' : ''"
        >
          <CardContent class="p-3">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Low Stock Alerts
                </p>
                <h3
                  class="text-2xl font-black"
                  :class="stockStats.lowStockItems > 0 ? 'text-red-600' : 'text-slate-900'"
                >
                  {{ stockStats.lowStockItems }}
                </h3>
              </div>
              <div
                class="p-3 rounded-xl group-hover:scale-110 transition-transform"
                :class="
                  stockStats.lowStockItems > 0
                    ? 'bg-red-50 text-red-600'
                    : 'bg-slate-50 text-slate-400'
                "
              >
                <AlertTriangle class="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          class="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm overflow-hidden group hover:shadow-md transition-all"
        >
          <CardContent class="p-3">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Categories</p>
                <h3 class="text-2xl font-black text-slate-900">{{ stockStats.totalCategories }}</h3>
              </div>
              <div
                class="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"
              >
                <Filter class="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Filter & Table -->
      <div class="flex flex-col space-y-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 flex-shrink-0">
          <div>
            <h2 class="text-base font-bold text-slate-900">Spare Parts Inventory</h2>
            <p class="text-xs text-slate-500">Inventory levels and spare parts availability</p>
          </div>

          <div class="flex items-center gap-2">
            <div class="relative w-full md:w-64">
              <Search class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                v-model="localSearch"
                placeholder="Filter by name or code..."
                class="pl-8 bg-white border-slate-200 focus:bg-white transition-colors h-9 text-sm"
              />
            </div>
            <Select v-model="categoryFilter">
              <SelectTrigger class="w-[160px] bg-white border-slate-200 h-9 text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="Mechanical">Mechanical</SelectItem>
                <SelectItem value="Electrical">Electrical</SelectItem>
                <SelectItem value="Electronic">Electronic</SelectItem>
                <SelectItem value="Consumables">Consumables</SelectItem>
                <SelectItem value="Spare Parts">Spare Parts</SelectItem>
              </SelectContent>
            </Select>
            <Button
              class="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md h-9"
              @click="emit('add-stock')"
            >
              <Package class="w-4 h-4" />
              Add Stock
            </Button>
          </div>
        </div>

        <!-- DataTable -->
        <div
          class="rounded-xl border border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden"
        >
          <DataTable :columns="columns" :data="filteredStocks" />
        </div>
      </div>
    </div>
  </div>
</template>
