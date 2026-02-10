<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { Input } from '@/components/ui/input';
import { SelectContent, SelectItem } from '@/components/ui/select';
import { useMaintenance } from '@/composables/useMaintenance';
import type { ColumnDef } from '@tanstack/vue-table';
import { Package, Plus, Search } from 'lucide-vue-next';
import { computed, h, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t, locale } = useI18n();
const router = useRouter();

const formatCurrency = (val: number) => {
  return val.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const props = defineProps<{
  searchQuery?: string;
}>();

const { stocks } = useMaintenance();

// Filters
const localSearch = ref('');
const categoryFilter = ref('ALL');

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

// Define Stock Columns
const columns = computed<ColumnDef<any>[]>(() => [
  {
    accessorKey: 'name',
    header: t('services.maintenance.stock.columns.partCategory'),
    cell: ({ row }) => {
      const part = row.original;
      // Better fallback: use locale-specific name if available, otherwise use default name
      let displayName = part.name;
      if (locale.value === 'th' && part.nameTH) {
        displayName = part.nameTH;
      } else if (locale.value === 'en' && part.nameEN) {
        displayName = part.nameEN;
      }

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
                ? t(
                    `services.maintenance.categories.${part.category.toLowerCase().replace(' ', '')}`
                  )
                : t('services.maintenance.categories.spareParts')
            ),
            h('span', { class: 'text-[10px] text-slate-300' }, '•'),
            h(
              'span',
              { class: 'text-[10px] text-slate-400' },
              part.code || t('services.maintenance.noCode')
            ),
          ]),
        ]),
      ]);
    },
  },
  {
    accessorKey: 'glCode',
    header: t('services.maintenance.stock.columns.glCode'),
    cell: ({ row }) =>
      h(
        'code',
        {
          class: 'px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-bold',
        },
        row.getValue('glCode') || '-'
      ),
  },
  {
    accessorKey: 'qty',
    header: t('services.maintenance.machines.columns.status'),
    cell: ({ row }) => {
      const qty = row.getValue('qty') as number;
      const minQty = row.original.minQty;
      let status = t('services.maintenance.stock.status.inStock');
      let style = 'bg-emerald-50 text-emerald-700 border-emerald-100';

      if (qty === 0) {
        status = t('services.maintenance.stock.status.outOfStock');
        style = 'bg-red-50 text-red-700 border-red-100';
      } else if (qty <= minQty) {
        status = t('services.maintenance.stock.status.lowStock');
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
    header: t('services.maintenance.stock.columns.quantity'),
    cell: ({ row }) => {
      const qty = row.original.qty;
      const unit = row.original.unit || t('services.maintenance.units');
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-mono font-bold text-slate-900 text-sm' }, qty.toString()),
        h('span', { class: 'text-[9px] text-slate-400 uppercase tracking-tighter' }, unit),
      ]);
    },
  },
  {
    accessorKey: 'price',
    header: t('services.maintenance.stock.columns.unitPrice'),
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
    header: t('services.maintenance.stock.columns.value'),
    cell: ({ row }) => {
      const value = Number(row.original.qty) * Number(row.original.price);
      return h(
        'span',
        { class: 'font-mono font-bold text-primary text-sm' },
        formatCurrency(value)
      );
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
              <Package class="w-5 h-5 text-primary" />
              {{ t('services.maintenance.stock.title') }}
            </h2>
            <p class="text-sm text-slate-500 font-medium">
              {{ t('services.maintenance.stock.subtitle') }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div class="relative w-64">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                v-model="localSearch"
                :placeholder="t('services.maintenance.stock.search')"
                class="pl-9 bg-white/50 border-slate-200/50 h-9 text-sm rounded-lg focus:ring-primary/20"
              />
            </div>
            <Select v-model="categoryFilter">
              <SelectTrigger
                class="w-[160px] bg-white border-slate-200 h-9 text-sm rounded-lg shadow-sm"
              >
                <SelectValue :placeholder="t('services.maintenance.allCategories')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{{ t('services.maintenance.allCategories') }}</SelectItem>
                <SelectItem value="Mechanical">{{
                  t('services.maintenance.categories.mechanical')
                }}</SelectItem>
                <SelectItem value="Electrical">{{
                  t('services.maintenance.categories.electrical')
                }}</SelectItem>
                <SelectItem value="Electronic">{{
                  t('services.maintenance.categories.electronic')
                }}</SelectItem>
                <SelectItem value="Pneumatic">{{
                  t('services.maintenance.categories.pneumatic')
                }}</SelectItem>
                <SelectItem value="Hydraulic">{{
                  t('services.maintenance.categories.hydraulic')
                }}</SelectItem>
                <SelectItem value="Bearings">{{
                  t('services.maintenance.categories.bearings')
                }}</SelectItem>
                <SelectItem value="Fasteners">{{
                  t('services.maintenance.categories.fasteners')
                }}</SelectItem>
                <SelectItem value="Belts">{{
                  t('services.maintenance.categories.belts')
                }}</SelectItem>
                <SelectItem value="Lubricants">{{
                  t('services.maintenance.categories.lubricants')
                }}</SelectItem>
                <SelectItem value="Seals">{{
                  t('services.maintenance.categories.seals')
                }}</SelectItem>
                <SelectItem value="Piping">{{
                  t('services.maintenance.categories.piping')
                }}</SelectItem>
                <SelectItem value="Valves">{{
                  t('services.maintenance.categories.valves')
                }}</SelectItem>
                <SelectItem value="Consumables">{{
                  t('services.maintenance.categories.consumables')
                }}</SelectItem>
                <SelectItem value="Spare Parts">{{
                  t('services.maintenance.categories.spareparts')
                }}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              @click="router.push('/my-machine/stock/add')"
              class="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4 rounded-lg shadow-sm shadow-primary/20 flex items-center gap-2"
            >
              <Plus class="w-4 h-4" />
              {{ t('services.maintenance.stock.add') }}
            </Button>
          </div>
        </div>

        <!-- DataTable -->
        <div
          class="mt-6 rounded-xl border border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm overflow-x-auto"
        >
          <DataTable :columns="columns" :data="filteredStocks" />
        </div>
      </div>
    </div>
  </div>
</template>
