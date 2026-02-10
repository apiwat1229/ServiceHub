<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMaintenance } from '@/composables/useMaintenance';
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { toast } from 'vue-sonner';

const { t } = useI18n();

import MachineDashboard from './components/maintenance/MachineDashboard.vue';
import MachineDetail from './components/maintenance/MachineDetail.vue';
import MachineForm from './components/maintenance/MachineForm.vue';
import MachineList from './components/maintenance/MachineList.vue';
import RepairForm from './components/maintenance/RepairForm.vue';
import RepairList from './components/maintenance/RepairList.vue';
import StockList from './components/maintenance/StockList.vue';

const { loadData, addMachine, updateMachine, addRepair, updateRepair } = useMaintenance();

const route = useRoute();
const searchQuery = ref('');
const activeTab = ref(
  route.query.tab?.toString() || localStorage.getItem('maintenance_active_tab') || 'dashboard'
);

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab) {
      activeTab.value = newTab.toString();
    }
  }
);

watch(activeTab, (newTab) => {
  localStorage.setItem('maintenance_active_tab', newTab);
});

// Modal States
const isMachineDialogOpen = ref(false);
const editingMachine = ref(null as any);
const isRepairDialogOpen = ref(false);
const editingRepair = ref(null as any);

// Detail Modal State
const isDetailDialogOpen = ref(false);
const detailMachineId = ref('');

const handleViewDetail = (id: string) => {
  detailMachineId.value = id;
  isDetailDialogOpen.value = true;
};

const handleMachineSave = (data: any) => {
  if (editingMachine.value) {
    updateMachine(editingMachine.value.id, data);
    toast.success(t('services.maintenance.messages.machineSuccess'));
  } else {
    addMachine(data);
    toast.success(t('services.maintenance.messages.machineSuccess'));
  }
  closeMachineDialog();
};

const handleEditMachine = (machine: any) => {
  editingMachine.value = machine;
  isMachineDialogOpen.value = true;
};

const closeMachineDialog = () => {
  isMachineDialogOpen.value = false;
  editingMachine.value = null;
};

const handleEditRepair = (repair: any) => {
  editingRepair.value = repair;
  isRepairDialogOpen.value = true;
};

const closeRepairDialog = () => {
  isRepairDialogOpen.value = false;
  editingRepair.value = null;
};

const handleRepairSave = async (data: any) => {
  try {
    if (editingRepair.value) {
      await updateRepair(editingRepair.value.id, data);
      toast.success(t('services.maintenance.messages.repairUpdated'));
    } else {
      await addRepair(data);
      toast.success(t('services.maintenance.messages.repairSuccess'));
    }
    closeRepairDialog();
  } catch (e) {
    toast.error('Failed to save repair record');
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="h-full w-full flex flex-col bg-slate-50 overflow-hidden">
    <main class="flex-1 overflow-hidden p-4 lg:p-6">
      <div class="h-full w-full max-w-[1920px] mx-auto">
        <div v-show="activeTab === 'dashboard'" class="h-full overflow-hidden">
          <MachineDashboard @view-detail="handleViewDetail" />
        </div>

        <div v-show="activeTab === 'machines'" class="h-full overflow-hidden">
          <MachineList
            :search-query="searchQuery"
            @add-machine="isMachineDialogOpen = true"
            @edit-machine="handleEditMachine"
            @view-detail="handleViewDetail"
          />
        </div>

        <div v-show="activeTab === 'repairs'" class="h-full overflow-hidden">
          <RepairList
            :search-query="searchQuery"
            @add-repair="isRepairDialogOpen = true"
            @edit-repair="handleEditRepair"
          />
        </div>

        <div v-show="activeTab === 'stock'" class="h-full overflow-hidden">
          <StockList :search-query="searchQuery" />
        </div>
      </div>
    </main>

    <!-- Dialogs -->
    <Dialog
      :open="isMachineDialogOpen"
      @update:open="(val: boolean) => !val && closeMachineDialog()"
    >
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto font-sans">
        <DialogHeader class="border-b pb-4 mb-2">
          <DialogTitle>{{
            editingMachine
              ? t('services.maintenance.forms.machine.editTitle')
              : t('services.maintenance.forms.machine.title')
          }}</DialogTitle>
          <DialogDescription>
            {{
              editingMachine
                ? t('services.maintenance.forms.machine.editDescription')
                : t('services.maintenance.forms.machine.description')
            }}
          </DialogDescription>
        </DialogHeader>
        <MachineForm
          :initial-data="editingMachine"
          @save="handleMachineSave"
          @cancel="closeMachineDialog"
        />
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isRepairDialogOpen">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader class="border-b pb-4 mb-2">
          <DialogTitle>{{ t('services.maintenance.forms.repair.title') }}</DialogTitle>
          <DialogDescription>{{
            t('services.maintenance.forms.repair.description')
          }}</DialogDescription>
        </DialogHeader>
        <RepairForm
          :initial-data="editingRepair"
          @save="handleRepairSave"
          @cancel="closeRepairDialog"
        />
      </DialogContent>
    </Dialog>

    <!-- Detail Modal -->
    <Dialog v-model:open="isDetailDialogOpen">
      <DialogContent
        class="max-w-screen-xl max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl rounded-sm"
      >
        <DialogHeader class="sr-only">
          <DialogTitle>{{ t('services.maintenance.assetSpecifications') }}</DialogTitle>
          <DialogDescription>{{ t('services.maintenance.qrDescription') }}</DialogDescription>
        </DialogHeader>
        <div class="bg-white px-12 py-6 relative">
          <MachineDetail v-if="detailMachineId" :machine-id="detailMachineId" />
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
