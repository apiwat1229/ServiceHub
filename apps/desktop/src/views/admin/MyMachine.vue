<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMyMachine } from '@/composables/useMyMachine';
import { ClipboardList, LayoutDashboard, Package, Plus, Search, Settings } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';

import MachineDashboard from './components/mymachine/MachineDashboard.vue';
import MachineForm from './components/mymachine/MachineForm.vue';
import MachineList from './components/mymachine/MachineList.vue';
import RepairForm from './components/mymachine/RepairForm.vue';
import RepairList from './components/mymachine/RepairList.vue';
import StockForm from './components/mymachine/StockForm.vue';
import StockList from './components/mymachine/StockList.vue';

const { loadData, addMachine, addRepair, addStock } = useMyMachine();
const searchQuery = ref('');
const activeTab = ref('dashboard');

// Modal States
const isMachineDialogOpen = ref(false);
const isRepairDialogOpen = ref(false);
const isStockDialogOpen = ref(false);

const handleMachineSave = (data: any) => {
  addMachine(data);
  isMachineDialogOpen.value = false;
  toast.success('Machine registered successfully');
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
  <div class="h-screen flex flex-col p-6 pb-2 bg-slate-50 font-sans overflow-hidden">
    <!-- Professional Header (Help Desk Style) -->
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 mb-6"
    >
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">Maintenance System</h1>
        <p class="text-muted-foreground mt-1 text-sm">
          Centralized management for machines, repairs, and spare parts inventory.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button
          variant="outline"
          class="gap-2 border-slate-200 bg-white"
          @click="isMachineDialogOpen = true"
        >
          <Settings class="w-4 h-4" />
          Add Machine
        </Button>
        <Button
          variant="outline"
          class="gap-2 border-slate-200 bg-white"
          @click="isStockDialogOpen = true"
        >
          <Package class="w-4 h-4" />
          Add Stock
        </Button>
        <Button
          class="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md"
          @click="isRepairDialogOpen = true"
        >
          <Plus class="w-4 h-4" />
          New Repair Log
        </Button>
      </div>
    </div>

    <!-- Main Content Tabs (Help Desk Style) -->
    <Tabs v-model="activeTab" class="w-full flex-1 flex flex-col min-h-0">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 flex-shrink-0">
        <TabsList class="bg-muted p-1 rounded-lg">
          <TabsTrigger
            value="dashboard"
            class="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-sm font-medium"
          >
            <LayoutDashboard class="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger
            value="machines"
            class="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-sm font-medium"
          >
            <Settings class="w-4 h-4" /> Machine Registry
          </TabsTrigger>
          <TabsTrigger
            value="repairs"
            class="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-sm font-medium"
          >
            <ClipboardList class="w-4 h-4" /> Repair Logs
          </TabsTrigger>
          <TabsTrigger
            value="stock"
            class="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-sm font-medium"
          >
            <Package class="w-4 h-4" /> Spare Parts
          </TabsTrigger>
        </TabsList>

        <!-- Search Bar in Tabs Row -->
        <div class="relative w-full sm:w-64">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search registry..."
            class="pl-9 bg-white border-slate-200 focus:bg-white transition-colors h-9 text-sm"
            v-model="searchQuery"
          />
        </div>
      </div>

      <!-- Tab Contents -->
      <TabsContent value="dashboard" class="mt-0 outline-none flex-1 overflow-hidden">
        <MachineDashboard />
      </TabsContent>

      <TabsContent value="machines" class="mt-0 outline-none flex-1 overflow-hidden">
        <MachineList :search-query="searchQuery" />
      </TabsContent>

      <TabsContent value="repairs" class="mt-0 outline-none flex-1 overflow-hidden">
        <RepairList :search-query="searchQuery" />
      </TabsContent>

      <TabsContent value="stock" class="mt-0 outline-none flex-1 overflow-hidden">
        <StockList :search-query="searchQuery" />
      </TabsContent>
    </Tabs>

    <!-- Dialogs -->
    <Dialog v-model:open="isMachineDialogOpen">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader class="border-b pb-4 mb-2">
          <DialogTitle>Add New Machine</DialogTitle>
          <DialogDescription>Register a new machine to the system database.</DialogDescription>
        </DialogHeader>
        <MachineForm @save="handleMachineSave" @cancel="isMachineDialogOpen = false" />
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
