<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { Dialog } from '@/components/ui/dialog'; // Restored
import { useMyMachine } from '@/composables/useMyMachine';
import type { ColumnDef } from '@tanstack/vue-table';
import { ArrowUpDown, Copy, Monitor, QrCode, Trash2 } from 'lucide-vue-next'; // Added Copy
import { computed, h, ref } from 'vue';
import { toast } from 'vue-sonner'; // Added toast
import MachineQrModal from './MachineQrModal.vue';

const props = defineProps<{
  searchQuery?: string;
}>();

const { machines, deleteMachine, getMachineStats } = useMyMachine();

const isQrModalOpen = ref(false);
const selectedMachine = ref<any>(null);

const generateQr = (machine: any) => {
  selectedMachine.value = machine;
  isQrModalOpen.value = true;
};

const filteredMachines = computed(() => {
  if (!props.searchQuery) return machines.value;
  const q = props.searchQuery.toLowerCase();
  return machines.value.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.model.toLowerCase().includes(q) ||
      m.location.toLowerCase().includes(q)
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
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          class: 'hover:bg-transparent p-0 font-bold',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Machine Information', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
      );
    },
    cell: ({ row }) => {
      const machine = row.original;
      return h('div', { class: 'flex items-center gap-3' }, [
        h(
          'div',
          {
            class:
              'w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200',
          },
          [h(Monitor, { class: 'w-5 h-5' })]
        ),
        h('div', { class: 'flex flex-col' }, [
          h('span', { class: 'font-bold text-slate-900' }, machine.name),
          h(
            'span',
            { class: 'text-xs text-muted-foreground' },
            machine.model || 'No model specified'
          ),
        ]),
      ]);
    },
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) =>
      h('div', { class: 'text-sm text-slate-600' }, row.getValue('location') || 'Not assigned'),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return h(
        Badge,
        {
          variant: 'outline',
          class: `px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyles(status)}`,
        },
        () => status
      );
    },
  },
  {
    id: 'utilization',
    header: 'Log Activity',
    cell: ({ row }) => {
      const stats = getMachineStats(row.original.id);
      return h('div', { class: 'flex flex-col gap-0.5 text-xs' }, [
        h('span', { class: 'text-slate-700 font-medium' }, `${stats.count} Repairs`),
        h('span', { class: 'text-slate-400' }, `Total: ฿${stats.cost.toLocaleString()}`),
      ]);
    },
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right pr-4 font-bold' }, 'Actions'),
    enableHiding: false,
    cell: ({ row }) => {
      const machine = row.original;
      const copyId = () => {
        navigator.clipboard.writeText(machine.id);
        toast.success('Asset ID copied to clipboard');
      };

      return h('div', { class: 'flex items-center justify-end gap-1 prop-2' }, [
        // Action: Copy ID
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class:
              'h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors',
            title: 'Copy Asset ID',
            onClick: copyId,
          },
          () => h(Copy, { class: 'h-3.5 w-3.5' })
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
  <div class="h-full flex flex-col space-y-4 overflow-hidden">
    <div class="flex-shrink-0 flex items-center justify-between">
      <h2 class="text-lg font-semibold tracking-tight text-slate-900 px-1">Registered Assets</h2>
    </div>
    <div class="flex-1 min-h-0 flex flex-col">
      <div
        class="flex-1 min-h-0 rounded-xl border bg-white shadow-sm overflow-hidden border-slate-200 flex flex-col"
      >
        <DataTable :columns="columns" :data="filteredMachines" class="flex-1" />
      </div>
    </div>

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
