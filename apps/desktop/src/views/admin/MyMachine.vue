<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMyMachine } from '@/composables/useMyMachine';
import {
  CheckCircle2,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  Package,
  Settings,
  Wrench,
} from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { toast } from 'vue-sonner';

import MachineDashboard from './components/mymachine/MachineDashboard.vue';
import MachineDetail from './components/mymachine/MachineDetail.vue';
import MachineForm from './components/mymachine/MachineForm.vue';
import MachineList from './components/mymachine/MachineList.vue';
import RepairForm from './components/mymachine/RepairForm.vue';
import RepairList from './components/mymachine/RepairList.vue';
import StockForm from './components/mymachine/StockForm.vue';
import StockList from './components/mymachine/StockList.vue';

const { machines, repairs, loadData, addMachine, updateMachine, addRepair, addStock, updateStock } =
  useMyMachine();

const totalCost = computed(() =>
  repairs.value.reduce((acc, curr) => acc + (Number(curr.totalCost) || 0), 0)
);
const totalRepairs = computed(() => repairs.value.length);
const activeMachines = computed(() => machines.value.filter((m) => m.status === 'Active').length);

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

const searchQuery = ref('');
const activeTab = ref(localStorage.getItem('mymachine_active_tab') || 'dashboard');

watch(activeTab, (newTab) => {
  localStorage.setItem('mymachine_active_tab', newTab);
});

// Modal States
const isMachineDialogOpen = ref(false);
const editingMachine = ref<any>(null);
const isRepairDialogOpen = ref(false);

// Detail Modal State
const isDetailDialogOpen = ref(false);
const detailMachineId = ref('');

const handleViewDetail = (id: string) => {
  detailMachineId.value = id;
  isDetailDialogOpen.value = true;
};

// Stock Modal State
const isStockDialogOpen = ref(false);
const editingStock = ref<any>(null); // State for editing stock

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

const handleEditStock = (item: any) => {
  editingStock.value = item;
  isStockDialogOpen.value = true;
};

const handleStockSave = (data: any) => {
  if (editingStock.value) {
    updateStock(editingStock.value.id, data);
    toast.success('Inventory updated');
  } else {
    addStock(data);
    // Toast already in addStock
  }
  closeStockDialog();
};

const closeStockDialog = () => {
  isStockDialogOpen.value = false;
  editingStock.value = null;
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
    <!-- Modern Compact Header - Sticky -->
    <div
      class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border border-slate-200/50 flex-shrink-0 shadow-sm rounded-xl mx-6 mt-0 mb-0 overflow-hidden"
    >
      <div class="relative px-6 py-1.5 flex items-center justify-between gap-4">
        <!-- Left: Title -->
        <div>
          <h1 class="text-lg font-bold text-slate-900 leading-tight">My Machine</h1>
          <p class="text-[0.625rem] text-slate-500">Centralized management for machines</p>
        </div>

        <!-- Center: Global Stats Group -->
        <div
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center gap-6"
        >
          <!-- Stat: Total Cost -->
          <div class="flex items-center gap-2.5 group">
            <div
              class="p-1.5 bg-emerald-50 rounded-lg border border-emerald-100/50 group-hover:bg-emerald-100 transition-colors"
            >
              <DollarSign class="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div class="flex flex-col">
              <span class="text-[0.5rem] font-black text-slate-400 uppercase tracking-tighter"
                >Total Cost</span
              >
              <span class="text-[0.8rem] font-black text-slate-900 leading-none mt-0.5">
                {{ formatCurrency(totalCost) }}
              </span>
            </div>
          </div>

          <!-- Stat: Operational -->
          <div class="flex items-center gap-2.5 group">
            <div
              class="p-1.5 bg-blue-50 rounded-lg border border-blue-100/50 group-hover:bg-blue-100 transition-colors"
            >
              <CheckCircle2 class="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div class="flex flex-col">
              <span class="text-[0.5rem] font-black text-slate-400 uppercase tracking-tighter"
                >Operational</span
              >
              <span class="text-[0.8rem] font-black text-slate-900 leading-none mt-0.5">
                {{ activeMachines }} / {{ machines.length }}
              </span>
            </div>
          </div>

          <!-- Stat: Total Repairs -->
          <div class="flex items-center gap-2.5 group">
            <div
              class="p-1.5 bg-purple-50 rounded-lg border border-purple-100/50 group-hover:bg-purple-100 transition-colors"
            >
              <Wrench class="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div class="flex flex-col">
              <span class="text-[0.5rem] font-black text-slate-400 uppercase tracking-tighter"
                >Total Repairs</span
              >
              <span class="text-[0.8rem] font-black text-slate-900 leading-none mt-0.5">
                {{ totalRepairs }}
              </span>
            </div>
          </div>
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
        <RepairList :search-query="searchQuery" @add-repair="isRepairDialogOpen = true" />
      </div>

      <div v-show="activeTab === 'stock'" class="h-full overflow-hidden">
        <StockList
          :search-query="searchQuery"
          @add-stock="isStockDialogOpen = true"
          @edit-stock="handleEditStock"
        />
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

    <Dialog :open="isStockDialogOpen" @update:open="(val) => !val && closeStockDialog()">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader class="border-b pb-4 mb-2">
          <DialogTitle>{{
            editingStock ? 'Edit Inventory Stock' : 'Add Inventory Stock'
          }}</DialogTitle>
          <DialogDescription>Update spare parts availability and pricing.</DialogDescription>
        </DialogHeader>
        <StockForm
          :initial-data="editingStock"
          @save="handleStockSave"
          @cancel="closeStockDialog"
        />
      </DialogContent>
    </Dialog>

    <!-- Detail Modal -->
    <Dialog v-model:open="isDetailDialogOpen">
      <DialogContent
        class="max-w-screen-xl max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl rounded-sm"
      >
        <DialogHeader class="sr-only">
          <DialogTitle>Machine Specifications</DialogTitle>
          <DialogDescription>Full technical details and maintenance history.</DialogDescription>
        </DialogHeader>
        <div class="bg-white px-12 py-6 relative">
          <MachineDetail v-if="detailMachineId" :machine-id="detailMachineId" />
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
