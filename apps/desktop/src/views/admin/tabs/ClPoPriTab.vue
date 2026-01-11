<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { Input } from '@/components/ui/input';
import { bookingsApi } from '@/services/bookings';
import type { ColumnDef } from '@tanstack/vue-table';
import { CalendarIcon, Edit, Search } from 'lucide-vue-next';
import { computed, h, onMounted, ref } from 'vue';

const bookings = ref<any[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const statusFilter = ref('ALL');

const fetchData = async () => {
  isLoading.value = true;
  try {
    const data = await bookingsApi.getAll();
    // Filter for Cuplump only - Update logic to strict Cuplump if needed, keeping permissive for now to ensure data shows
    bookings.value = data.filter(
      (b: any) =>
        b.rubberType === 'Coagulating Cup Lumps' ||
        b.rubberType.includes('Cup') ||
        b.rubberType.includes('CL')
    );
  } catch (error) {
    console.error('Failed to load bookings:', error);
  } finally {
    isLoading.value = false;
  }
};

// Computed Data for Stats
const filteredBookings = computed(() => {
  let result = bookings.value;

  if (statusFilter.value === 'COMPLETE') {
    // Logic for complete
  } else if (statusFilter.value === 'INCOMPLETE') {
    // Logic for incomplete
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (b) =>
        b.bookingCode?.toLowerCase().includes(query) ||
        b.supplierName?.toLowerCase().includes(query) ||
        b.truckRegister?.toLowerCase().includes(query)
    );
  }

  return result;
});

const totalGrossWeight = computed(() => {
  return filteredBookings.value.reduce((sum, b) => sum + (b.totalWeight || 0), 0);
});

const totalNetWeight = computed(() => {
  return 0; // Placeholder
});

// Column Definitions
const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'bookingCode',
    header: () => 'Lot Number',
    cell: ({ row }) => {
      const booking = row.original;
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-bold text-sm' }, booking.bookingCode),
        h(
          'span',
          { class: 'text-xs text-muted-foreground' },
          new Date(booking.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        ),
      ]);
    },
  },
  {
    accessorKey: 'supplierName',
    header: () => 'Supplier',
    cell: ({ row }) => {
      const booking = row.original;
      return h('div', { class: 'flex flex-col' }, [
        h(
          'span',
          { class: 'font-medium text-sm' },
          `${booking.supplierCode} : ${booking.supplierName}`
        ),
      ]);
    },
  },
  {
    accessorKey: 'truckRegister',
    header: () => 'Truck',
    cell: ({ row }) => {
      const booking = row.original;
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-bold text-sm' }, booking.truckRegister),
        h('span', { class: 'text-xs text-muted-foreground' }, booking.truckType || '-'),
      ]);
    },
  },
  {
    accessorKey: 'rubberType',
    header: () => 'Rubber Type',
    cell: ({ row }) => {
      const booking = row.original;
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium text-sm' }, booking.rubberType),
        h('span', { class: 'text-xs text-muted-foreground' }, booking.location || '-'),
      ]);
    },
  },
  {
    accessorKey: 'moisture',
    header: () =>
      h(
        'div',
        {
          class:
            'text-center bg-orange-50 text-orange-700 h-8 flex items-center justify-center rounded-sm mx-1 min-w-[80px] font-bold text-xs',
        },
        'MOISTURE'
      ),
    cell: ({ row }) => {
      const val = row.original.moisture;
      return h('div', { class: 'text-center' }, [
        val
          ? h('span', { class: 'text-orange-600 font-bold' }, val)
          : h('span', { class: 'text-muted-foreground/30' }, '-'),
      ]);
    },
  },
  {
    accessorKey: 'drcEst',
    header: () =>
      h(
        'div',
        {
          class:
            'text-center bg-blue-50 text-blue-700 h-8 flex items-center justify-center rounded-sm mx-1 min-w-[80px] font-bold text-xs',
        },
        'DRC EST.'
      ),
    cell: ({ row }) => {
      const val = row.original.drcEst;
      return h('div', { class: 'text-center' }, [
        val
          ? h('span', { class: 'text-blue-600 font-bold' }, val)
          : h('span', { class: 'text-muted-foreground/30' }, '-'),
      ]);
    },
  },
  {
    accessorKey: 'avgCp',
    header: () =>
      h(
        'div',
        {
          class:
            'text-center bg-green-50 text-green-700 h-8 flex items-center justify-center rounded-sm mx-1 min-w-[80px] font-bold text-xs',
        },
        'AVG %CP'
      ),
    cell: ({ row }) => {
      const val = row.original.avgCp;
      return h('div', { class: 'text-center' }, [
        val
          ? h('span', { class: 'text-green-600 font-bold' }, val)
          : h('span', { class: 'text-muted-foreground/30' }, '-'),
      ]);
    },
  },
  {
    accessorKey: 'totalWeight',
    header: () => h('div', { class: 'text-right' }, 'Gross Weight'),
    cell: ({ row }) => {
      const val = row.original.totalWeight;
      return h('div', { class: 'text-right' }, [
        h('span', { class: 'font-bold' }, val ? `${val.toLocaleString()} Kg.` : '-'),
      ]);
    },
  },
  {
    accessorKey: 'netWeight',
    header: () => h('div', { class: 'text-right' }, 'Net Weight'),
    cell: ({ row }) => {
      const val = row.original.netWeight;
      return h('div', { class: 'text-right' }, [
        val
          ? h('span', { class: 'font-bold text-green-600' }, `${val.toLocaleString()} Kg.`)
          : h('span', { class: 'text-green-600/30 font-bold' }, '-'),
      ]);
    },
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-center' }, 'Actions'),
    cell: () => {
      return h('div', { class: 'text-center' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-muted-foreground hover:text-primary',
          },
          () => h(Edit, { class: 'w-4 h-4' })
        ),
      ]);
    },
  },
];

const handleRowClick = (row: any) => {
  // Navigation logic here if needed
  console.log('Clicked row', row);
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="space-y-4">
    <!-- Filters and Summary -->
    <div
      class="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-lg border shadow-sm"
    >
      <div class="flex items-center gap-3 w-full md:w-auto">
        <div class="relative w-full md:w-64">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            type="search"
            placeholder="Search..."
            class="pl-9 bg-background"
          />
        </div>

        <Button
          variant="outline"
          class="w-[130px] justify-start text-left font-normal bg-background"
        >
          <CalendarIcon class="mr-2 h-4 w-4" />
          <span>Pick a date</span>
        </Button>

        <div class="flex items-center gap-2 bg-muted/50 p-1 rounded-md">
          <Button
            variant="ghost"
            size="sm"
            class="h-8 px-3 rounded-sm bg-background shadow-sm text-foreground"
            @click="statusFilter = 'ALL'"
          >
            All <Badge variant="secondary" class="ml-2 bg-slate-100 text-slate-700">3</Badge>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-8 px-3 rounded-sm text-muted-foreground hover:bg-background/50"
            @click="statusFilter = 'COMPLETE'"
          >
            Complete <Badge variant="secondary" class="ml-2 bg-green-100 text-green-700">6</Badge>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-8 px-3 rounded-sm text-muted-foreground hover:bg-background/50"
            @click="statusFilter = 'INCOMPLETE'"
          >
            Incomplete
            <Badge variant="secondary" class="ml-2 bg-orange-100 text-orange-700">3</Badge>
          </Button>
        </div>
      </div>

      <div class="flex items-center gap-8 px-4">
        <div class="text-right">
          <p class="text-xs text-muted-foreground font-medium">Gross Weight</p>
          <p class="text-xl font-bold font-mono">
            {{ totalGrossWeight.toLocaleString() }}
            <span class="text-sm font-normal text-muted-foreground">Kg.</span>
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs text-muted-foreground font-medium">Net Weight</p>
          <p class="text-xl font-bold font-mono text-green-600">
            {{ totalNetWeight.toLocaleString() }}
            <span class="text-sm font-normal text-muted-foreground">Kg.</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="rounded-md border bg-card">
      <DataTable
        :columns="columns"
        :data="filteredBookings"
        :loading="isLoading"
        @row-click="handleRowClick"
        :initial-page-size="5"
      />
    </div>
  </div>
</template>
