<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMaintenance, type StorageLocation } from '@/composables/useMaintenance';
import { Plus, Search } from 'lucide-vue-next';
import { ref } from 'vue';
import { toast } from 'vue-sonner';
import LocationDataTable from './LocationDataTable.vue';

const searchQuery = ref('');
const isFormVisible = ref(false);

const { locations, addLocation, updateLocation, deleteLocation } = useMaintenance();

const form = ref({
  nameEN: '',
  nameTH: '',
  building: '',
  zone: '',
});

const editingId = ref<string | null>(null);

const resetForm = () => {
  form.value = {
    nameEN: '',
    nameTH: '',
    building: '',
    zone: '',
  };
  editingId.value = null;
  isFormVisible.value = false;
};

const handleAdd = async () => {
  if (!form.value.nameEN && !form.value.building) {
    toast.error('Name (EN) or Building is required');
    return;
  }

  const payload = {
    ...form.value,
    name: form.value.nameEN || form.value.building || 'Unnamed Location',
  };

  try {
    if (editingId.value) {
      // Update existing
      await updateLocation(editingId.value, payload);
      toast.success('Location updated successfully');
    } else {
      // Add new
      await addLocation(payload);
      toast.success('Location added successfully');
      isFormVisible.value = false;
    }
    resetForm();
  } catch (e) {
    toast.error('Failed to save location');
  }
};

const startEdit = (location: StorageLocation) => {
  form.value = {
    nameEN: location.nameEN || '',
    nameTH: location.nameTH || '',
    building: location.building || '',
    zone: location.zone || '',
  };
  editingId.value = location.id;
  isFormVisible.value = true;
};

const isDeleteDialogOpen = ref(false);
const itemToDelete = ref<string | null>(null);

const confirmDelete = (id: string) => {
  itemToDelete.value = id;
  isDeleteDialogOpen.value = true;
};

const executeDelete = async () => {
  if (itemToDelete.value) {
    try {
      await deleteLocation(itemToDelete.value);
      toast.success('Location deleted successfully');
    } catch (e) {
      toast.error('Failed to delete location');
    } finally {
      itemToDelete.value = null;
      isDeleteDialogOpen.value = false;
    }
  }
};
</script>

<template>
  <DialogContent class="max-w-5xl max-h-[90vh] flex flex-col p-0">
    <DialogHeader class="px-6 pt-6 pb-4 flex-shrink-0">
      <div class="flex items-center justify-between pr-8">
        <div class="space-y-0.5">
          <DialogTitle class="text-xl font-bold">Storage Locations</DialogTitle>
          <DialogDescription class="text-sm text-slate-500">
            Manage storage locations for stock items
          </DialogDescription>
        </div>
        <div class="flex items-center gap-3">
          <!-- Search -->
          <div class="relative w-48 lg:w-64">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              v-model="searchQuery"
              placeholder="Search locations..."
              class="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            />
          </div>
          <Button
            @click="isFormVisible = !isFormVisible"
            :variant="isFormVisible ? 'secondary' : 'default'"
            class="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-sm"
          >
            <Plus class="w-3.5 h-3.5 mr-1.5" />
            {{ editingId ? 'Editing' : 'Add' }}
          </Button>
        </div>
      </div>
    </DialogHeader>

    <div class="flex-1 overflow-y-auto px-6">
      <!-- Add/Edit Form -->
      <div v-if="isFormVisible || editingId" class="bg-slate-50 rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-sm text-slate-700">
            {{ editingId ? 'Edit Location' : 'Add New Location' }}
          </h3>
          <Button v-if="editingId" variant="ghost" size="sm" @click="resetForm" class="h-7 text-xs">
            Cancel Edit
          </Button>
        </div>
        <div class="grid grid-cols-4 gap-3">
          <div class="space-y-1.5">
            <Label class="text-xs font-medium">Name (EN)</Label>
            <Input v-model="form.nameEN" placeholder="e.g. Main Warehouse" class="h-9 text-sm" />
          </div>
          <div class="space-y-1.5">
            <Label class="text-xs font-medium">Name (TH)</Label>
            <Input v-model="form.nameTH" placeholder="e.g. คลังหลัก" class="h-9 text-sm" />
          </div>
          <div class="space-y-1.5">
            <Label class="text-xs font-medium">Building</Label>
            <Input v-model="form.building" placeholder="e.g. Building A" class="h-9 text-sm" />
          </div>
          <div class="space-y-1.5">
            <Label class="text-xs font-medium">Zone</Label>
            <Input v-model="form.zone" placeholder="e.g. Zone 1" class="h-9 text-sm" />
          </div>
        </div>
        <div class="flex justify-end items-center gap-2 mt-4">
          <Button variant="ghost" size="sm" @click="resetForm" class="h-8 text-xs text-slate-500">
            Cancel
          </Button>
          <Button
            @click="handleAdd"
            class="h-8 px-6 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold"
          >
            {{ editingId ? 'Update Location' : 'Save Location' }}
          </Button>
        </div>
      </div>

      <!-- Locations Table -->
      <LocationDataTable
        :data="locations"
        :search-query="searchQuery"
        @edit="startEdit"
        @delete="confirmDelete"
      />
    </div>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the storage location.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="executeDelete" class="bg-red-600 hover:bg-red-700">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </DialogContent>
</template>
