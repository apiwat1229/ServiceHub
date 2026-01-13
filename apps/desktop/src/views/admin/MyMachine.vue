<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMyMachine } from '@/composables/useMyMachine';
import { useThemeStore } from '@/stores/theme';
import { ClipboardList, LayoutDashboard, Package, Settings } from 'lucide-vue-next';
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();
const themeStore = useThemeStore();

import MachineDashboard from './components/mymachine/MachineDashboard.vue';
import MachineDetail from './components/mymachine/MachineDetail.vue';
import MachineForm from './components/mymachine/MachineForm.vue';
import MachineList from './components/mymachine/MachineList.vue';
import RepairForm from './components/mymachine/RepairForm.vue';
import RepairList from './components/mymachine/RepairList.vue';
import StockList from './components/mymachine/StockList.vue';

const { machines, repairs, loadData, addMachine, updateMachine, addRepair, updateRepair } =
  useMyMachine();

const searchQuery = ref('');
const activeTab = ref(localStorage.getItem('mymachine_active_tab') || 'dashboard');

watch(activeTab, (newTab) => {
  localStorage.setItem('mymachine_active_tab', newTab);
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
    toast.success(t('services.myMachine.messages.machineSuccess'));
  } else {
    addMachine(data);
    toast.success(t('services.myMachine.messages.machineSuccess'));
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
      toast.success(t('services.myMachine.messages.repairUpdated'));
    } else {
      await addRepair(data);
      toast.success(t('services.myMachine.messages.repairSuccess'));
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
  <div
    class="h-full flex flex-col bg-slate-50 overflow-hidden transition-all duration-300"
    :style="{
      fontFamily: themeStore.fontFamilies[themeStore.fontFamily],
      fontSize: themeStore.fontSizes[themeStore.fontSize],
    }"
  >
    <!-- Modern Compact Header - Sticky -->
    <div
      class="sticky top-0 z-40 bg-white/80 backdrop-blur-md border border-slate-200/50 flex-shrink-0 shadow-sm rounded-xl mx-6 mt-0 mb-0 overflow-hidden"
    >
      <div class="px-6 py-2.5 flex flex-col lg:flex-row items-center justify-between gap-6">
        <!-- Left: Title Group -->
        <div class="flex items-center gap-6 min-w-0 w-full lg:w-auto">
          <div class="flex-shrink-0">
            <h1 class="text-lg font-bold text-slate-900 leading-tight">
              {{ t('services.myMachine.name') }}
            </h1>
            <p class="text-[0.625rem] text-slate-500">{{ t('services.myMachine.description') }}</p>
          </div>
        </div>

        <!-- Right: Navigation Tabs -->
        <nav class="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md flex-shrink-0">
          <button
            @click="activeTab = 'dashboard'"
            :class="[
              'px-3 py-1 rounded text-xs font-medium transition-all inline-flex items-center gap-1.5',
              activeTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            ]"
          >
            <LayoutDashboard class="w-3 h-3" />
            <span>{{ t('services.myMachine.tabs.overview') }}</span>
          </button>
          <button
            @click="activeTab = 'machines'"
            :class="[
              'px-3 py-1 rounded text-xs font-medium transition-all inline-flex items-center gap-1.5',
              activeTab === 'machines'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            ]"
          >
            <Settings class="w-3 h-3" />
            <span>{{ t('services.myMachine.tabs.machines') }}</span>
          </button>
          <button
            @click="activeTab = 'repairs'"
            :class="[
              'px-3 py-1 rounded text-xs font-medium transition-all inline-flex items-center gap-1.5',
              activeTab === 'repairs'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            ]"
          >
            <ClipboardList class="w-3 h-3" />
            <span>{{ t('services.myMachine.tabs.repairs') }}</span>
          </button>
          <button
            @click="activeTab = 'stock'"
            :class="[
              'px-3 py-1 rounded text-xs font-medium transition-all inline-flex items-center gap-1.5',
              activeTab === 'stock'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            ]"
          >
            <Package class="w-3 h-3" />
            <span>{{ t('services.myMachine.tabs.parts') }}</span>
          </button>
        </nav>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 min-h-0 overflow-hidden pt-4">
      <!-- Tab Contents -->
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

    <!-- Dialogs -->
    <Dialog
      :open="isMachineDialogOpen"
      @update:open="(val: boolean) => !val && closeMachineDialog()"
    >
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto font-sans">
        <DialogHeader class="border-b pb-4 mb-2">
          <DialogTitle>{{
            editingMachine
              ? t('services.myMachine.forms.machine.editTitle')
              : t('services.myMachine.forms.machine.title')
          }}</DialogTitle>
          <DialogDescription>
            {{
              editingMachine
                ? t('services.myMachine.forms.machine.editDescription')
                : t('services.myMachine.forms.machine.description')
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
          <DialogTitle>{{ t('services.myMachine.forms.repair.title') }}</DialogTitle>
          <DialogDescription>{{
            t('services.myMachine.forms.repair.description')
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
          <DialogTitle>{{ t('services.myMachine.assetSpecifications') }}</DialogTitle>
          <DialogDescription>{{ t('services.myMachine.qrDescription') }}</DialogDescription>
        </DialogHeader>
        <div class="bg-white px-12 py-6 relative">
          <MachineDetail v-if="detailMachineId" :machine-id="detailMachineId" />
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
