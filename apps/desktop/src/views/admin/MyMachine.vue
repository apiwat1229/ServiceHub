<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMyMachine } from '@/composables/useMyMachine';
import { ClipboardList, LayoutDashboard, Package, Settings } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';

import MachineDashboard from './components/mymachine/MachineDashboard.vue';
import MachineForm from './components/mymachine/MachineForm.vue';
import MachineList from './components/mymachine/MachineList.vue';
import RepairForm from './components/mymachine/RepairForm.vue';
import RepairList from './components/mymachine/RepairList.vue';
import StockForm from './components/mymachine/StockForm.vue';
import StockList from './components/mymachine/StockList.vue';

const { loadData, addMachine, updateMachine, addRepair, addStock } = useMyMachine();
const searchQuery = ref('');
const activeTab = ref('dashboard');

// Modal States
const isMachineDialogOpen = ref(false);
const editingMachine = ref<any>(null);
const isRepairDialogOpen = ref(false);
const isStockDialogOpen = ref(false);

const handleMachineSave = (data: any) => {
  if (editingMachine.value) {
    updateMachine(editingMachine.value.id, data);
  } else {
    addMachine(data);
    toast.success('Machine registered successfully');
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

const handleRepairSave = (data: any) => {
  addRepair(data);
  isRepairDialogOpen.value = false;
  toast.success('Maintenance log recorded');
};

const handleStockSave = (data: any) => {
  addStock(data);
  isStockDialogOpen.value = false;
  toast.success('Inventory updated');
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
    <!-- Modern Compact Header - Sticky -->
    <div
      class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border border-slate-200/50 flex-shrink-0 shadow-sm rounded-xl mx-6 mt-4 mb-0 overflow-hidden"
    >
      <div class="px-6 py-2.5 flex items-center justify-between gap-4">
        <!-- Left: Title -->
        <div class="flex-shrink-0">
          <h1 class="text-lg font-bold text-slate-900">Maintenance System</h1>
          <p class="text-[0.625rem] text-slate-500">
            Centralized management for machines, repairs, and spare parts
          </p>
        </div>

        <!-- Center: Navigation Tabs -->
        <nav class="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
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
            <span>Overview</span>
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
            <span>Machines</span>
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
            <span>Repairs</span>
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
            <span>Parts</span>
          </button>
        </nav>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 min-h-0 overflow-hidden">
      <!-- Tab Contents -->
      <div v-show="activeTab === 'dashboard'" class="h-full overflow-hidden">
        <MachineDashboard />
      </div>

      <div v-show="activeTab === 'machines'" class="h-full overflow-hidden">
        <MachineList
          :search-query="searchQuery"
          @add-machine="isMachineDialogOpen = true"
          @edit-machine="handleEditMachine"
        />
      </div>

      <div v-show="activeTab === 'repairs'" class="h-full overflow-hidden">
        <RepairList :search-query="searchQuery" @add-repair="isRepairDialogOpen = true" />
      </div>

      <div v-show="activeTab === 'stock'" class="h-full overflow-hidden">
        <StockList :search-query="searchQuery" @add-stock="isStockDialogOpen = true" />
      </div>
    </div>

    <!-- Dialogs -->
    <Dialog :open="isMachineDialogOpen" @update:open="(val) => !val && closeMachineDialog()">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto font-sans">
        <DialogHeader class="border-b pb-4 mb-2">
          <DialogTitle>{{ editingMachine ? 'Edit Machine Info' : 'Add New Machine' }}</DialogTitle>
          <DialogDescription>
            {{
              editingMachine
                ? 'Update machine details and operational status.'
                : 'Register a new machine to the system database.'
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
          <DialogTitle>New Maintenance Record</DialogTitle>
          <DialogDescription>Document technical issues and parts utilization.</DialogDescription>
        </DialogHeader>
        <RepairForm @save="handleRepairSave" @cancel="isRepairDialogOpen = false" />
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isStockDialogOpen">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader class="border-b pb-4 mb-2">
          <DialogTitle>Add Inventory Stock</DialogTitle>
          <DialogDescription>Update spare parts availability and pricing.</DialogDescription>
        </DialogHeader>
        <StockForm @save="handleStockSave" @cancel="isStockDialogOpen = false" />
      </DialogContent>
    </Dialog>
  </div>
</template>
