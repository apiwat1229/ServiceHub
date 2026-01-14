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
import { useMyMachine, type StockCategory } from '@/composables/useMyMachine';
import { Plus } from 'lucide-vue-next';
import { ref } from 'vue';
import { toast } from 'vue-sonner';
import CategoryDataTable from './CategoryDataTable.vue';

const { categories, addCategory, updateCategory, deleteCategory } = useMyMachine();

const form = ref({
  nameEN: '',
  nameTH: '',
  prefix: '',
});

const editingId = ref<string | null>(null);

const resetForm = () => {
  form.value = {
    nameEN: '',
    nameTH: '',
    prefix: '',
  };
  editingId.value = null;
};

const handleAdd = async () => {
  if (!form.value.nameEN && !form.value.prefix) {
    toast.error('Name (EN) or Prefix is required');
    return;
  }

  const payload = {
    ...form.value,
    name: form.value.nameEN || form.value.prefix || 'Unnamed Category',
  };

  try {
    if (editingId.value) {
      // Update existing
      await updateCategory(editingId.value, payload);
      toast.success('Category updated successfully');
    } else {
      // Add new
      await addCategory(payload);
      toast.success('Category added successfully');
    }
    resetForm();
  } catch (e) {
    toast.error('Failed to save category');
  }
};

const startEdit = (category: StockCategory) => {
  form.value = {
    nameEN: category.nameEN || '',
    nameTH: category.nameTH || '',
    prefix: category.prefix || '',
  };
  editingId.value = category.id;
};

const handleDelete = async (id: string) => {
  if (confirm('Are you sure you want to delete this category?')) {
    try {
      await deleteCategory(id);
      toast.success('Category deleted successfully');
    } catch (e) {
      toast.error('Failed to delete category');
    }
  }
};
</script>

<template>
  <DialogContent class="max-w-5xl max-h-[90vh] flex flex-col p-0">
    <DialogHeader class="px-6 pt-6 pb-4 flex-shrink-0">
      <div class="flex items-center justify-between pr-8">
        <div class="space-y-0.5">
          <DialogTitle class="text-xl font-bold">Stock Categories</DialogTitle>
          <DialogDescription class="text-sm text-slate-500">
            Manage categories for stock items and auto-code generation
          </DialogDescription>
        </div>
        <Button
          @click="handleAdd"
          class="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
        >
          <Plus class="w-3.5 h-3.5 mr-1.5" />
          {{ editingId ? 'Update Category' : 'Add Category' }}
        </Button>
      </div>
    </DialogHeader>

    <div class="flex-1 overflow-y-auto px-6">
      <!-- Add/Edit Form -->
      <div class="bg-slate-50 rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-sm text-slate-700">
            {{ editingId ? 'Edit Category' : 'Add New Category' }}
          </h3>
          <Button v-if="editingId" variant="ghost" size="sm" @click="resetForm" class="h-7 text-xs">
            Cancel Edit
          </Button>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div class="space-y-1.5">
            <Label class="text-xs font-medium">Code Prefix</Label>
            <Input
              v-model="form.prefix"
              placeholder="e.g. MECH"
              class="h-9 text-sm uppercase"
              maxlength="4"
            />
          </div>
          <div class="space-y-1.5">
            <Label class="text-xs font-medium">Name (EN)</Label>
            <Input v-model="form.nameEN" placeholder="e.g. Mechanical" class="h-9 text-sm" />
          </div>
          <div class="space-y-1.5">
            <Label class="text-xs font-medium">Name (TH)</Label>
            <Input v-model="form.nameTH" placeholder="e.g. เครื่องกล" class="h-9 text-sm" />
          </div>
        </div>
      </div>

      <!-- Categories Table -->
      <CategoryDataTable :data="categories" @edit="startEdit" @delete="handleDelete" />
    </div>
  </DialogContent>
</template>
