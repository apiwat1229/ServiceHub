<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useMyMachine } from '@/composables/useMyMachine';
import type { ColumnDef } from '@tanstack/vue-table';
import { Edit2, Monitor, QrCode, Search, Settings, Trash2 } from 'lucide-vue-next';
import { computed, h, ref } from 'vue';
import { useRouter } from 'vue-router';
import MachineQrModal from './MachineQrModal.vue';
import RepairDetailModal from './RepairDetailModal.vue';

const props = defineProps<{
  searchQuery?: string;
}>();

const router = useRouter();
const emit = defineEmits<{
  (e: 'add-machine'): void;
  (e: 'edit-machine', machine: any): void;
}>();

const { machines, deleteMachine, getMachineStats } = useMyMachine();

const localSearch = ref('');
const isQrModalOpen = ref(false);
const isRepairDetailOpen = ref(false);
const selectedMachine = ref<any>(null);
const selectedRepair = ref<any>(null);

const generateQr = (machine: any) => {
  selectedMachine.value = machine;
  isQrModalOpen.value = true;
};

const viewDetail = (machine: any) => {
  router.push(`/my-machine/${machine.id}`);
};

const viewRepairDetail = (repair: any) => {
  selectedRepair.value = repair;
  isRepairDetailOpen.value = true;
};

const filteredMachines = computed(() => {
  const q = (localSearch.value || props.searchQuery || '').toLowerCase();
  if (!q) return machines.value;
  return machines.value.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      (m.model && m.model.toLowerCase().includes(q)) ||
      (m.location && m.location.toLowerCase().includes(q))
  );
});

const handleDeleteMachine = (id: string) => {
  if (confirm('Are you sure you want to delete this machine? Repairs history will remain.')) {
    deleteMachine(id);
  }
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Maintenance':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'Inactive':
      return 'bg-slate-50 text-slate-700 border-slate-100';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

// Define Columns
const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'name',
    header: 'Machine & Model',
    cell: ({ row }) => {
      const machine = row.original;
      return h('div', { class: 'flex items-center gap-3 group/name' }, [
        h(
          'div',
          {
            class:
              'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border border-slate-200 bg-gradient-to-br from-white to-slate-50 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:from-blue-50 hover:to-blue-100 transition-all shadow-sm',
          },
          [h(Monitor, { class: 'w-5 h-5' })]
        ),
        h('div', { class: 'min-w-0 flex-1' }, [
          h('div', { class: 'flex items-center gap-2 mb-0.5' }, [
            h(
              'span',
              {
                class:
                  'font-bold text-slate-900 group-hover/name:text-blue-700 transition-colors truncate cursor-pointer',
                onClick: (e) => {
                  e.stopPropagation();
                  viewDetail(machine);
                },
              },
              machine.name
            ),
            h(
              'span',
              {
                class:
                  'text-[0.5625rem] font-bold text-slate-400 uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 flex-shrink-0',
              },
              machine.model || 'STD'
            ),
          ]),
          h('p', { class: 'text-xs text-slate-500 truncate' }, machine.location || 'Not assigned'),
        ]),
      ]);
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const stats = getMachineStats(row.original.id);
      return h('div', { class: 'flex flex-col gap-1' }, [
        h(
          Badge,
          {
            variant: 'outline',
            class: `text-[0.625rem] font-bold uppercase tracking-wide px-2 py-1 ${getStatusStyles(status)}`,
          },
          () => status
        ),
        h('span', { class: 'text-[0.625rem] text-slate-400' }, `${stats.count} repairs logged`),
      ]);
    },
  },
  {
    id: 'utilization',
    header: () => h('div', { class: 'text-right' }, 'Total Cost'),
    cell: ({ row }) => {
      const stats = getMachineStats(row.original.id);
      return h('div', { class: 'text-right' }, [
        h(
          'div',
          { class: 'text-base font-black text-slate-900 hover:text-blue-700 transition-colors' },
          `฿${stats.cost.toLocaleString()}`
        ),
      ]);
    },
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right pr-4 font-bold' }, 'Actions'),
    enableHiding: false,
    cell: ({ row }) => {
      const machine = row.original;

      return h('div', { class: 'flex items-center justify-end gap-1 pr-2' }, [
        // Action: Edit Asset
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors',
            title: 'Edit Machine',
            onClick: () => emit('edit-machine', machine),
          },
          () => h(Edit2, { class: 'h-3.5 w-3.5' })
        ),

        // Action: Generate QR
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors',
            title: 'Generate Asset QR',
            onClick: () => generateQr(machine),
          },
          () => h(QrCode, { class: 'h-4 w-4' })
        ),

        // Action: Remove Asset
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors',
            title: 'Remove Asset',
            onClick: () => handleDeleteMachine(machine.id),
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
          <h2 class="text-base font-bold text-slate-900">Registered Assets</h2>
          <p class="text-xs text-slate-500">Manage and monitor your industrial equipment</p>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative w-64 flex-shrink-0">
            <Search class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              v-model="localSearch"
              type="search"
              placeholder="Search assets..."
              class="pl-8 pr-2 h-9 text-xs bg-white border-slate-200 focus:bg-white transition-all shadow-sm"
            />
          </div>
          <Button
            class="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md h-9"
            @click="emit('add-machine')"
          >
            <Settings class="w-4 h-4" />
            Add Machine
          </Button>
        </div>
      </div>

      <!-- DataTable -->
      <div
        class="rounded-xl border border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden"
      >
        <DataTable :columns="columns" :data="filteredMachines" />
      </div>
    </div>

    <!-- Repair Detail Modal (Nested trigger) -->
    <Dialog v-model:open="isRepairDetailOpen">
      <RepairDetailModal
        v-if="selectedRepair"
        :repair="selectedRepair"
        @close="isRepairDetailOpen = false"
      />
    </Dialog>

    <!-- QR Modal -->
    <Dialog v-model:open="isQrModalOpen">
      <MachineQrModal
        v-if="selectedMachine"
        :machine="selectedMachine"
        @close="isQrModalOpen = false"
      />
    </Dialog>
  </div>
</template>
