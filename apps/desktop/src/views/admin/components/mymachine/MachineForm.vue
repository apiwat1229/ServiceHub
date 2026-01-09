<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, ScanBarcode } from 'lucide-vue-next';
import { ref } from 'vue';

const props = defineProps<{
  initialData?: any;
}>();

const emit = defineEmits(['save', 'cancel']);

const machine = ref(
  props.initialData
    ? { ...props.initialData }
    : {
        name: '',
        model: '',
        location: '',
        status: 'Active',
      }
);

const handleSave = () => {
  if (!machine.value.name) return;
  emit('save', machine.value);
};
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-12 gap-6 py-4">
    <!-- Left Column: Image Upload -->
    <div class="md:col-span-4">
      <Label class="mb-2 block text-slate-700 font-semibold">Machine Image</Label>
      <div
        class="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 h-[250px] bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group"
      >
        <div
          class="bg-blue-50 text-blue-500 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform"
        >
          <FileText :size="28" />
        </div>
        <p class="font-bold text-sm text-slate-900 mb-1">Upload Photo</p>
        <p class="text-xs text-slate-500 text-center">Max 5MB. JPG or PNG.</p>
      </div>

      <div class="mt-4">
        <Label class="mb-2 block text-slate-700 font-semibold"
          >Asset Tag <span class="text-xs font-normal text-slate-500">(Optional)</span></Label
        >
        <div class="relative">
          <ScanBarcode class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Scan or enter tag"
            class="pl-9 bg-white border-slate-200 focus:bg-white transition-colors"
          />
        </div>
      </div>
    </div>

    <!-- Right Column: Form Fields -->
    <div class="md:col-span-8 space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="name" class="text-slate-700">Machine Name / Code</Label>
          <Input
            id="name"
            v-model="machine.name"
            placeholder="e.g. CNC Lathe 01"
            class="bg-white border-slate-200"
            required
          />
        </div>
        <div class="space-y-2">
          <Label for="model" class="text-slate-700">Model / Specification</Label>
          <Input
            id="model"
            v-model="machine.model"
            placeholder="e.g. X1000-Pro"
            class="bg-white border-slate-200"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="location" class="text-slate-700">Location / Floor</Label>
          <Input
            id="location"
            v-model="machine.location"
            placeholder="e.g. Zone A"
            class="bg-white border-slate-200"
          />
        </div>
        <div class="space-y-2">
          <Label for="status" class="text-slate-700">Current Status</Label>
          <Select v-model="machine.status">
            <SelectTrigger class="bg-white border-slate-200">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Operational (Active)</SelectItem>
              <SelectItem value="Inactive">Storage (Inactive)</SelectItem>
              <SelectItem value="Maintenance">Under Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label class="text-slate-700">Serial Number</Label>
          <Input placeholder="SN-998877" class="bg-white border-slate-200" />
        </div>
        <div class="space-y-2">
          <Label class="text-slate-700">Installation Date</Label>
          <Input type="date" class="bg-white border-slate-200" />
        </div>
      </div>

      <div class="space-y-2">
        <Label class="text-slate-700">Description / Technical Notes</Label>
        <Textarea
          class="min-h-[100px] resize-none bg-white border-slate-200"
          placeholder="Enter any additional details..."
        />
      </div>
    </div>
  </div>

  <div class="flex justify-end gap-3 pt-4 border-t mt-6">
    <Button variant="outline" @click="emit('cancel')" class="border-slate-200">Cancel</Button>
    <Button @click="handleSave" class="bg-blue-600 hover:bg-blue-700 shadow-md"
      >Complete Registration</Button
    >
  </div>
</template>
