<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMyMachine, type StorageLocation } from '@/composables/useMyMachine';
import { Plus } from 'lucide-vue-next';
import { ref } from 'vue';
import { toast } from 'vue-sonner';
import LocationDataTable from './LocationDataTable.vue';

const { locations, addLocation, updateLocation, deleteLocation } = useMyMachine();

const form = ref({
  name: '',
  nameEN: '',
  nameTH: '',
  building: '',
  zone: '',
});

const editingId = ref<string | null>(null);

const resetForm = () => {
  form.value = {
    name: '',
    nameEN: '',
    nameTH: '',
    building: '',
    zone: '',
  };
  editingId.value = null;
};

const handleAdd = async () => {
  if (!form.value.name) {
    toast.error('Location name is required');
    return;
  }

  try {
    if (editingId.value) {
      // Update existing
      await updateLocation(editingId.value, form.value);
      toast.success('Location updated successfully');
    } else {
      // Add new
      await addLocation(form.value);
      toast.success('Location added successfully');
    }
    resetForm();
  } catch (e) {
    toast.error('Failed to save location');
  }
};

const startEdit = (location: StorageLocation) => {
  form.value = {
    name: location.name,
    nameEN: location.nameEN || '',
    nameTH: location.nameTH || '',
    building: location.building || '',
    zone: location.zone || '',
  };
  editingId.value = location.id;
};

const handleDelete = async (id: string) => {
  if (confirm('Are you sure you want to delete this location?')) {
    try {
      await deleteLocation(id);
      toast.success('Location deleted successfully');
    } catch (e) {
      toast.error('Failed to delete location');
    }
  }
};
</script>

<template>
  <DialogContent class="max-w-5xl max-h-[90vh] flex flex-col p-0">
    <DialogHeader class="px-6 pt-6 pb-4 flex-shrink-0">
      <div class="flex items-start justify-between">
        <div class="space-y-1.5">
          <DialogTitle class="text-xl font-bold">Storage Locations</DialogTitle>
          <DialogDescription class="text-sm">
            Manage storage locations for stock items
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>

    <div class="flex-1 overflow-y-auto px-6">
      <!-- Add/Edit Form -->
      <div class="bg-slate-50 rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-sm text-slate-700">
            {{ editingId ? 'Edit Location' : 'Add New Location' }}
          </h3>
          <Button v-if="editingId" variant="ghost" size="sm" @click="resetForm" class="h-7 text-xs">
            Cancel Edit
          </Button>
        </div>
        <div class="grid grid-cols-5 gap-3">
          <div class="space-y-1.5">
            <Label class="text-xs font-medium">Name *</Label>
            <Input v-model="form.name" placeholder="e.g. Main Warehouse" class="h-9 text-sm" />
          </div>
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
        <Button
          @click="handleAdd"
          class="mt-3 h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs"
        >
          <Plus class="w-3.5 h-3.5 mr-1.5" />
          {{ editingId ? 'Update Location' : 'Add Location' }}
        </Button>
      </div>

      <!-- Locations Table -->
      <LocationDataTable :data="locations" @edit="startEdit" @delete="handleDelete" />
    </div>
  </DialogContent>
</template>
