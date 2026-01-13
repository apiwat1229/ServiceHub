<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { Input } from '@/components/ui/input';
import { SelectContent, SelectItem } from '@/components/ui/select';
import { useMyMachine } from '@/composables/useMyMachine';
import type { ColumnDef } from '@tanstack/vue-table';
import { Edit2, Package, Plus, Search, Trash2 } from 'lucide-vue-next';
import { computed, h, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t, locale } = useI18n();

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

const handleDeleteStock = (id: string) => {
  if (confirm(t('services.myMachine.messages.confirmDeletePart'))) {
    deleteStock(id);
    toast.success(t('services.myMachine.messages.stockRemoved'));
  }
};

// Define Stock Columns
const columns = computed<ColumnDef<any>[]>(() => [
  {
    accessorKey: 'name',
    header: t('services.myMachine.stock.columns.partCategory'),
    cell: ({ row }) => {
      const part = row.original;
      const displayName =
        locale.value === 'th' ? part.nameTH || part.name : part.nameEN || part.name;
      return h('div', { class: 'flex items-center gap-3' }, [
        h(
          'div',
          {
            class:
              'w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400',
          },
          [h(Package, { class: 'w-5 h-5' })]
        ),
        h('div', { class: 'flex flex-col' }, [
          h('span', { class: 'text-sm font-bold text-slate-900 leading-tight' }, displayName),
          h('div', { class: 'flex items-center gap-2 mt-0.5' }, [
            h(
              'span',
              { class: 'text-[10px] text-slate-400 font-medium' },
              part.category
                ? t(`services.myMachine.categories.${part.category.toLowerCase().replace(' ', '')}`)
                : t('services.myMachine.categories.spareParts')
            ),
            h('span', { class: 'text-[10px] text-slate-300' }, '•'),
            h(
              'span',
              { class: 'text-[10px] text-slate-400' },
              part.code || t('services.myMachine.noCode')
            ),
          ]),
        ]),
      ]);
    },
  },
  {
    accessorKey: 'qty',
    header: t('services.myMachine.machines.columns.status'),
    cell: ({ row }) => {
      const qty = row.getValue('qty') as number;
      const minQty = row.original.minQty;
      let status = t('services.myMachine.stock.status.inStock');
      let style = 'bg-emerald-50 text-emerald-700 border-emerald-100';

      if (qty === 0) {
        status = t('services.myMachine.stock.status.outOfStock');
        style = 'bg-red-50 text-red-700 border-red-100';
      } else if (qty <= minQty) {
        status = t('services.myMachine.stock.status.lowStock');
        style = 'bg-amber-50 text-amber-700 border-amber-100';
      }

      return h(
        Badge,
        {
          variant: 'outline',
          class: `w-fit text-[10px] h-4 px-1.5 uppercase font-bold ${style}`,
        },
        () => status
      );
    },
  },
  {
    id: 'quantity',
    header: t('services.myMachine.stock.columns.quantity'),
    cell: ({ row }) => {
      const qty = row.original.qty;
      const unit = row.original.unit || t('services.myMachine.units');
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-mono font-bold text-slate-900 text-sm' }, qty.toString()),
        h('span', { class: 'text-[9px] text-slate-400 uppercase tracking-tighter' }, unit),
      ]);
    },
  },
  {
    accessorKey: 'price',
    header: t('services.myMachine.stock.columns.unitPrice'),
    cell: ({ row }) => {
      const price = Number(row.getValue('price'));
      return h(
        'span',
        { class: 'font-mono font-bold text-slate-900 text-xs' },
        formatCurrency(price)
      );
    },
  },
  {
    id: 'value',
    header: t('services.myMachine.stock.columns.value'),
    cell: ({ row }) => {
      const value = Number(row.original.qty) * Number(row.original.price);
      return h(
        'span',
        { class: 'font-mono font-bold text-blue-600 text-sm' },
        formatCurrency(value)
      );
    },
  },
  {
    id: 'actions',
    header: t('services.myMachine.stock.columns.actions'),
    cell: ({ row }) => {
      const part = row.original;
      return h('div', { class: 'flex items-center justify-center gap-1' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50',
            onClick: () => emit('edit-stock', part),
          },
          () => h(Edit2, { class: 'w-4 h-4' })
        ),
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50/50',
            onClick: () => handleDeleteStock(part.id),
          },
          () => h(Trash2, { class: 'w-4 h-4' })
        ),
      ]);
    },
  },
]);
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden bg-slate-50">
    <!-- Scrollable Content Area -->
    <div class="flex-1 overflow-y-auto px-6 pb-6 pt-1">
      <!-- Filter & Table -->
      <div class="flex flex-col space-y-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 flex-shrink-0">
          <div class="space-y-1">
            <h2
              class="text-xl font-bold tracking-tight text-slate-900 group flex items-center gap-2"
            >
              <Package class="w-5 h-5 text-blue-600" />
              {{ t('services.myMachine.stock.title') }}
            </h2>
            <p class="text-sm text-slate-500 font-medium">
              {{ t('services.myMachine.stock.subtitle') }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div class="relative w-64">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                v-model="localSearch"
                :placeholder="t('services.myMachine.stock.search')"
                class="pl-9 bg-white/50 border-slate-200/50 h-9 text-sm rounded-lg focus:ring-blue-500/20"
              />
            </div>
            <Select v-model="categoryFilter">
              <SelectTrigger
                class="w-[160px] bg-white border-slate-200 h-9 text-sm rounded-lg shadow-sm"
              >
                <SelectValue :placeholder="t('services.myMachine.allCategories')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{{ t('services.myMachine.allCategories') }}</SelectItem>
                <SelectItem value="Mechanical">{{
                  t('services.myMachine.categories.mechanical')
                }}</SelectItem>
                <SelectItem value="Electrical">{{
                  t('services.myMachine.categories.electrical')
                }}</SelectItem>
                <SelectItem value="Electronic">{{
                  t('services.myMachine.categories.electronic')
                }}</SelectItem>
                <SelectItem value="Pneumatic">{{
                  t('services.myMachine.categories.pneumatic')
                }}</SelectItem>
                <SelectItem value="Hydraulic">{{
                  t('services.myMachine.categories.hydraulic')
                }}</SelectItem>
                <SelectItem value="Bearings">{{
                  t('services.myMachine.categories.bearings')
                }}</SelectItem>
                <SelectItem value="Fasteners">{{
                  t('services.myMachine.categories.fasteners')
                }}</SelectItem>
                <SelectItem value="Belts">{{
                  t('services.myMachine.categories.belts')
                }}</SelectItem>
                <SelectItem value="Lubricants">{{
                  t('services.myMachine.categories.lubricants')
                }}</SelectItem>
                <SelectItem value="Seals">{{
                  t('services.myMachine.categories.seals')
                }}</SelectItem>
                <SelectItem value="Piping">{{
                  t('services.myMachine.categories.piping')
                }}</SelectItem>
                <SelectItem value="Valves">{{
                  t('services.myMachine.categories.valves')
                }}</SelectItem>
                <SelectItem value="Consumables">{{
                  t('services.myMachine.categories.consumables')
                }}</SelectItem>
                <SelectItem value="Spare Parts">{{
                  t('services.myMachine.categories.spareparts')
                }}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              @click="emit('add-stock')"
              class="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-lg shadow-sm shadow-blue-200 flex items-center gap-2"
            >
              <Plus class="w-4 h-4" />
              {{ t('services.myMachine.stock.add') }}
            </Button>
          </div>
        </div>

        <!-- DataTable -->
        <div
          class="mt-6 rounded-xl border border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden"
        >
          <DataTable :columns="columns" :data="filteredStocks" />
        </div>
      </div>
    </div>
  </div>
</template>
