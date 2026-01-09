<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { FileText, QrCode } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';
import { ref, watch } from 'vue';

const props = defineProps<{
  initialData?: any;
}>();

const emit = defineEmits(['save', 'cancel']);

const CATEGORY_PREFIXES: Record<string, string> = {
  Mechanical: 'MECH',
  Electrical: 'ELEC',
  Electronic: 'ELN',
  Pneumatic: 'PNEU',
  Hydraulic: 'HYDR',
  Consumables: 'CONS',
  'Spare Parts': 'PART',
};

const generateCode = (category: string) => {
  const prefix = CATEGORY_PREFIXES[category] || 'SP';
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
};

const form = ref(
  props.initialData
    ? { ...props.initialData }
    : {
        name: '',
        code: generateCode(''), // Default SP
        category: '',
        location: '',
        qty: 0,
        minQty: 5,
        price: 0,
        dateReceived: new Date().toISOString().split('T')[0],
        receiver: '',
        description: '',
        autoGenerateCode: true,
      }
);

// Watch for auto-gen toggle or category change
watch([() => form.value.autoGenerateCode, () => form.value.category], ([autoGen, cat]) => {
  if (autoGen) {
    form.value.code = generateCode(cat);
  }
});

const handleSave = () => {
  if (!form.value.name) return;
  const payload = { ...form.value, unit: 'pcs' };
  emit('save', payload);
};
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-12 gap-6 py-4">
    <!-- Left Column: Image & QR Code -->
    <div class="md:col-span-4 space-y-6">
      <div>
        <Label class="mb-2 block text-slate-700 font-semibold">Part / Asset Image</Label>
        <div
          class="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 h-[200px] bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div
            class="bg-blue-50 text-blue-500 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform"
          >
            <FileText :size="24" />
          </div>
          <p class="font-bold text-sm text-slate-900 mb-1">Upload Photo</p>
          <p class="text-xs text-slate-500 text-center text-balance px-4">Max 2MB. JPG or PNG.</p>
        </div>
      </div>

      <div class="pt-4 border-t border-slate-100">
        <Label class="mb-3 text-slate-700 font-semibold flex items-center gap-2">
          <QrCode class="w-4 h-4 text-blue-600" />
          Asset QR Code
        </Label>
        <div
          class="bg-white border rounded-xl p-4 flex flex-col items-center justify-center shadow-sm border-slate-200"
        >
          <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
            <QrcodeVue
              :value="form.code || 'NO-CODE-ASSIGNED'"
              :size="120"
              level="H"
              render-as="svg"
              class="mx-auto"
            />
          </div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Encoded Data
          </p>
          <code
            class="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded truncate max-w-full"
          >
            {{ form.code || 'NULL' }}
          </code>
        </div>
      </div>
    </div>

    <!-- Right Column: Form Fields -->
    <div class="md:col-span-8 space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label class="text-slate-700 font-semibold">Part Name</Label>
          <Input
            v-model="form.name"
            placeholder="e.g. Bearing 6002-ZZ"
            class="bg-white border-slate-200"
          />
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label class="text-slate-700 font-semibold">Stock Code</Label>
            <div class="flex items-center space-x-2">
              <Checkbox id="auto-gen-stock" v-model="form.autoGenerateCode" />
              <label for="auto-gen-stock" class="text-xs font-medium text-slate-500 cursor-pointer">
                Auto-gen
              </label>
            </div>
          </div>
          <Input
            v-model="form.code"
            placeholder="e.g. SP-BRG-001"
            :disabled="form.autoGenerateCode"
            class="bg-white border-slate-200"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label class="text-slate-700 font-semibold">Category</Label>
          <Select v-model="form.category">
            <SelectTrigger class="bg-white border-slate-200">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mechanical">Mechanical</SelectItem>
              <SelectItem value="Electrical">Electrical</SelectItem>
              <SelectItem value="Electronic">Electronic</SelectItem>
              <SelectItem value="Pneumatic">Pneumatic</SelectItem>
              <SelectItem value="Hydraulic">Hydraulic</SelectItem>
              <SelectItem value="Consumables">Consumables</SelectItem>
              <SelectItem value="Spare Parts">General Spare Parts</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label class="text-slate-700 font-semibold">Storage Location</Label>
          <Input
            v-model="form.location"
            placeholder="e.g. Rack B, Section 4"
            class="bg-white border-slate-200"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label class="text-slate-700 font-semibold">Stock Balance</Label>
          <Input type="number" v-model="form.qty" min="0" class="bg-white border-slate-200" />
        </div>
        <div class="space-y-2">
          <Label class="text-slate-700 font-semibold">Safety Stock (Min)</Label>
          <Input type="number" v-model="form.minQty" min="0" class="bg-white border-slate-200" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label class="text-slate-700 font-semibold">Unit Price (THB)</Label>
          <div class="relative">
            <span class="absolute left-3 top-2.5 text-slate-400 text-sm">฿</span>
            <Input
              class="pl-7 bg-white border-slate-200"
              type="number"
              v-model="form.price"
              min="0"
            />
          </div>
        </div>
        <div class="space-y-2">
          <Label class="text-slate-700 font-semibold">Entry Date</Label>
          <Input type="date" v-model="form.dateReceived" class="bg-white border-slate-200" />
        </div>
      </div>

      <div class="space-y-2">
        <Label class="text-slate-700 font-semibold">Recorded By</Label>
        <Input
          v-model="form.receiver"
          placeholder="Staff identifier"
          class="bg-white border-slate-200"
        />
      </div>

      <div class="space-y-2">
        <Label class="text-slate-700 font-semibold">Item Description / Technical Specs</Label>
        <Textarea
          v-model="form.description"
          class="min-h-[80px] resize-none bg-white border-slate-200"
        />
      </div>
    </div>
  </div>

  <div class="flex justify-end gap-3 pt-6 border-t mt-4">
    <Button variant="outline" @click="emit('cancel')" class="border-slate-200">Cancel</Button>
    <Button @click="handleSave" class="bg-blue-600 hover:bg-blue-700 shadow-md"
      >Save Spare Part</Button
    >
  </div>
</template>
