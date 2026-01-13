<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useMyMachine } from '@/composables/useMyMachine';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/vue-table';
import { Edit2, Monitor, QrCode, Search, Settings, Trash2 } from 'lucide-vue-next';
import { computed, h, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import MachineQrModal from './MachineQrModal.vue';

const { t } = useI18n();

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
  (e: 'add-machine'): void;
  (e: 'edit-machine', machine: any): void;
  (e: 'view-detail', id: string): void;
}>();

const { machines, deleteMachine, getMachineStats } = useMyMachine();

const localSearch = ref('');
const isQrModalOpen = ref(false);
const selectedMachine = ref<any>(null);

const generateQr = (machine: any) => {
  selectedMachine.value = machine;
  isQrModalOpen.value = true;
};

const viewDetail = (machine: any) => {
  emit('view-detail', machine.id);
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
  if (confirm(t('services.myMachine.messages.confirmDeleteMachine'))) {
    deleteMachine(id);
    toast.success(t('services.myMachine.messages.machineRemoved'));
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

// Define Machines Columns
const columns = computed<ColumnDef<any>[]>(() => [
  {
    accessorKey: 'name',
    header: t('services.myMachine.machines.columns.machineModel'),
    cell: ({ row }) => {
      const machine = row.original;
      return h('div', { class: 'flex items-center gap-3 group/name' }, [
        h(
          'div',
          {
            class:
              'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border border-slate-200 bg-gradient-to-br from-white to-slate-50 text-slate-400 group-hover/name:text-blue-600 group-hover/name:border-blue-200 transition-all shadow-sm',
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
              },
              machine.name
            ),
          ]),
          h(
            'p',
            { class: 'text-xs text-slate-500 truncate' },
            machine.location || t('services.myMachine.notAssigned')
          ),
        ]),
      ]);
    },
  },
  {
    accessorKey: 'status',
    header: t('services.myMachine.machines.columns.status'),
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const stats = getMachineStats(row.original.id);
      return h('div', { class: 'flex flex-col gap-1' }, [
        h(
          Badge,
          {
            variant: 'outline',
            class: cn('w-fit text-[10px] h-4 px-1.5 uppercase font-bold', getStatusStyles(status)),
          },
          () => t(`services.myMachine.forms.machine.status${status}`)
        ),
        h(
          'span',
          { class: 'text-[9px] text-slate-400 font-medium' },
          `${stats.count} ${t('services.myMachine.entriesRecorded')}`
        ),
      ]);
    },
  },
  {
    accessorKey: 'totalCost',
    header: t('services.myMachine.machines.columns.cost'),
    cell: ({ row }) => {
      const stats = getMachineStats(row.original.id);
      const cost = stats.cost;
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-mono font-bold text-slate-900' }, formatCurrency(cost)),
        h('span', { class: 'text-[10px] text-slate-400' }, t('services.myMachine.stats.totalCost')),
      ]);
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const machine = row.original;
      return h('div', { class: 'flex items-center justify-end gap-1.5' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50',
            onClick: (e: Event) => {
              e.stopPropagation();
              emit('edit-machine', machine);
            },
          },
          () => h(Edit2, { class: 'w-4 h-4' })
        ),
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50',
            onClick: (e: Event) => {
              e.stopPropagation();
              generateQr(machine);
            },
          },
          () => h(QrCode, { class: 'w-4 h-4' })
        ),
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50',
            onClick: (e: Event) => {
              e.stopPropagation();
              handleDeleteMachine(machine.id);
            },
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
    <div class="flex-1 overflow-y-auto px-6 pb-6 pt-1">
      <!-- Header Section -->
      <div class="flex items-center justify-between gap-4">
        <div class="space-y-1">
          <h2 class="text-xl font-bold tracking-tight text-slate-900 group flex items-center gap-2">
            <Monitor class="w-5 h-5 text-blue-600" />
            {{ t('services.myMachine.machines.title') }}
          </h2>
          <p class="text-sm text-slate-500 font-medium">
            {{ t('services.myMachine.machines.subtitle') }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative w-64">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              v-model="localSearch"
              :placeholder="t('services.myMachine.machines.search')"
              class="pl-9 bg-white/50 border-slate-200/50 h-9 text-sm rounded-lg focus:ring-blue-500/20"
            />
          </div>
          <Button
            @click="emit('add-machine')"
            class="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-lg shadow-sm shadow-blue-200 flex items-center gap-2"
          >
            <Settings class="w-4 h-4" />
            {{ t('services.myMachine.machines.add') }}
          </Button>
        </div>
      </div>

      <!-- Assets Table -->
      <div
        class="mt-6 rounded-xl border border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden"
      >
        <DataTable :columns="columns" :data="filteredMachines" @rowClick="viewDetail" />
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
