<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useMyMachine } from '@/composables/useMyMachine';
import type { ColumnDef } from '@tanstack/vue-table';
import {
  ArrowUpDown,
  Calendar,
  FileText,
  Package,
  Plus,
  QrCode,
  Search,
  Trash2,
  User,
  Wrench,
} from 'lucide-vue-next';
import { computed, h, ref } from 'vue';
import RepairDetailModal from './RepairDetailModal.vue';
import RepairQrModal from './RepairQrModal.vue';

const props = defineProps<{
  searchQuery?: string;
}>();

const emit = defineEmits<{
  (e: 'add-repair'): void;
}>();

const { repairs, deleteRepair } = useMyMachine();

const isDetailModalOpen = ref(false);
const selectedRepair = ref<any>(null);

const isQrModalOpen = ref(false);
const selectedRepairForQr = ref<any>(null);

const viewDetails = (repair: any) => {
  selectedRepair.value = repair;
  isDetailModalOpen.value = true;
};

const generateQr = (repair: any) => {
  selectedRepairForQr.value = repair;
  isQrModalOpen.value = true;
};

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

const handleDeleteRepair = (id: string) => {
  if (confirm('Are you sure you want to delete this record?')) {
    deleteRepair(id);
  }
};

const getStatusStyles = (cost: number) => {
  // Mocking status based on cost or other logic if status field doesn't exist in data
  // In a real app, 'status' would be part of the record.
  // For UI demonstration, we'll assume they are all "Completed" if they have cost > 0
  if (cost > 10000) return 'bg-blue-50 text-blue-700 border-blue-100'; // Major Repair
  return 'bg-emerald-50 text-emerald-700 border-emerald-100'; // Standard Service
};

// DataTable Columns
const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          class: 'p-0 font-bold',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Log Date', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
      );
    },
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2 text-slate-600' }, [
        h(Calendar, { class: 'w-3.5 h-3.5' }),
        String(row.getValue('date')),
      ]),
  },
  {
    accessorKey: 'machineName',
    header: 'Target Asset',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h('div', { class: 'p-1.5 bg-blue-50 text-blue-600 rounded-md' }, [
          h(Wrench, { class: 'w-3.5 h-3.5' }),
        ]),
        h('span', { class: 'font-bold text-slate-900' }, row.getValue('machineName')),
      ]),
  },
  {
    accessorKey: 'issue',
    header: 'Maintenance Details',
    cell: ({ row }) => {
      const issue = row.original.issue;
      const technician = row.original.technician;
      const content = [h('p', { class: 'text-sm text-slate-700 line-clamp-1' }, issue)];

      if (technician) {
        content.push(
          h('div', { class: 'flex items-center gap-1.5 mt-1 text-xs text-muted-foreground' }, [
            h(User, { class: 'w-3 h-3' }),
            `Tech: ${technician}`,
          ])
        );
      }

      return h('div', { class: 'max-w-[300px]' }, content);
    },
  },
  {
    id: 'parts',
    header: 'Resources',
    cell: ({ row }) => {
      const parts = row.original.parts;
      if (!parts || parts.length === 0)
        return h(
          'span',
          { class: 'text-slate-400 text-[0.625rem] italic font-medium uppercase tracking-tight' },
          'No resources used'
        );
      return h('div', { class: 'flex items-center gap-1.5' }, [
        h(Package, { class: 'w-3.5 h-3.5 text-slate-400' }),
        h(
          'span',
          { class: 'text-xs text-slate-600 font-medium' },
          `${parts.length} replacement parts`
        ),
      ]);
    },
  },
  {
    accessorKey: 'totalCost',
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          class: 'justify-end w-full p-0 font-bold',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Excl. Tax (THB)', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('totalCost'));
      return h('div', { class: 'text-right flex items-center justify-end gap-2' }, [
        h('span', { class: 'font-bold text-slate-900' }, `฿${amount.toLocaleString()}`),
        h(
          Badge,
          {
            variant: 'outline',
            class: `px-1.5 py-0 text-[0.5625rem] uppercase font-black ${getStatusStyles(amount)}`,
          },
          () => (amount > 10000 ? 'Major' : 'Service')
        ),
      ]);
    },
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right pr-4 font-bold' }, 'Actions'),
    enableHiding: false,
    cell: ({ row }) => {
      const repair = row.original;
      return h('div', { class: 'flex items-center justify-end gap-1 pr-2' }, [
        // Action: View Details (Paper Icon)
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors',
            title: 'View Full Details',
            onClick: () => viewDetails(repair),
          },
          () => h(FileText, { class: 'h-4 w-4' })
        ),

        // Action: QR Code
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class:
              'h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors',
            title: 'Generate Log QR',
            onClick: () => generateQr(repair),
          },
          () => h(QrCode, { class: 'h-4 w-4' })
        ),

        // Action: Delete
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors',
            title: 'Delete Record',
            onClick: () => handleDeleteRepair(repair.id),
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
    <div class="flex-1 overflow-y-auto px-6 pb-6 pt-4">
      <!-- Header Section -->
      <div class="flex flex-shrink-0 items-center justify-between mb-4">
        <div>
          <h2 class="text-base font-bold text-slate-900">Maintenance History</h2>
          <p class="text-xs text-slate-500">Technical history and resource utilization records</p>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative w-64 flex-shrink-0">
            <Search class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              v-model="localSearch"
              type="search"
              placeholder="Search logs..."
              class="pl-8 pr-2 h-9 text-xs bg-white border-slate-200 focus:bg-white transition-all shadow-sm"
            />
          </div>
          <Button
            class="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md h-9"
            @click="emit('add-repair')"
          >
            <Plus class="w-4 h-4" />
            New Repair Log
          </Button>
        </div>
      </div>

      <!-- DataTable -->
      <div
        class="rounded-xl border border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden"
      >
        <DataTable :columns="columns" :data="filteredRepairs" />
      </div>
    </div>

    <!-- Detail Modal -->
    <Dialog v-model:open="isDetailModalOpen">
      <RepairDetailModal
        v-if="selectedRepair"
        :repair="selectedRepair"
        @close="isDetailModalOpen = false"
      />
    </Dialog>

    <!-- QR Modal -->
    <Dialog v-model:open="isQrModalOpen">
      <RepairQrModal
        v-if="selectedRepairForQr"
        :repair="selectedRepairForQr"
        @close="isQrModalOpen = false"
      />
    </Dialog>
  </div>
</template>
