<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDate, getLocalTimeZone } from '@internationalized/date';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, FileText, QrCode, X } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';
import { computed, ref, watch } from 'vue';
import { toast } from 'vue-sonner';

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
    ? {
        ...props.initialData,
        // Ensure legacy data maps correctly
        nameTH: props.initialData.nameTH || '',
        nameEN: props.initialData.nameEN || props.initialData.name,
        dateReceived: props.initialData.dateReceived
          ? new Date(props.initialData.dateReceived)
          : new Date(),
      }
    : {
        name: '',
        nameTH: '',
        nameEN: '',
        code: generateCode(''), // Default SP
        category: '',
        location: '',
        qty: 0,
        minQty: 5,
        price: 0,
        dateReceived: new Date(),
        receiver: '',
        description: '',
        autoGenerateCode: true,
      }
);

// Computed property to handle conversion between Date and CalendarDate
const calendarValue = computed({
  get: () => {
    if (!form.value.dateReceived) return undefined;
    const d = form.value.dateReceived;
    return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  },
  set: (v: CalendarDate | undefined) => {
    if (v) {
      form.value.dateReceived = v.toDate(getLocalTimeZone());
    }
  },
});

const fileInput = ref<HTMLInputElement | null>(null);

const handleFileClick = () => {
  fileInput.value?.click();
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    toast.error('File too large (max 2MB)');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    form.value.image = event.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const removeImage = (e: Event) => {
  e.stopPropagation();
  form.value.image = undefined;
  if (fileInput.value) fileInput.value.value = '';
};

// Watch for auto-gen toggle or category change
watch(
  [() => form.value.autoGenerateCode, () => form.value.category],
  ([autoGen, cat]) => {
    if (autoGen && !props.initialData?.code) {
      form.value.code = generateCode(cat);
    }
  },
  { immediate: true }
);

const handleSave = () => {
  if (!form.value.nameEN) {
    toast.error('Part Name (EN) is required');
    return;
  }

  const payload = {
    ...form.value,
    name: form.value.nameEN, // Primary display name
    dateReceived: format(form.value.dateReceived, 'yyyy-MM-dd'),
    unit: 'pcs',
  };
  emit('save', payload);
};
// Force HMR Update 2
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-12 gap-6 py-4">
    <!-- Left Column: Image & QR Code -->
    <div class="md:col-span-4 space-y-6">
      <div>
        <Label class="mb-2 block text-slate-700 font-semibold">Part / Asset Image</Label>
        <input
          type="file"
          ref="fileInput"
          class="hidden"
          accept="image/*"
          @change="handleFileChange"
        />
        <div
          @click="handleFileClick"
          class="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center h-[200px] bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden"
        >
          <template v-if="form.image">
            <img :src="form.image" class="w-full h-full object-cover" />
            <div
              class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
            >
              <Button
                variant="secondary"
                size="sm"
                class="h-8 text-xs font-bold"
                @click.stop="handleFileClick"
              >
                Change Photo
              </Button>
              <Button variant="destructive" size="icon" class="h-8 w-8" @click="removeImage">
                <X class="w-4 h-4" />
              </Button>
            </div>
          </template>
          <template v-else>
            <div
              class="bg-blue-50 text-blue-500 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform"
            >
              <FileText :size="24" />
            </div>
            <p class="font-bold text-sm text-slate-900 mb-1">Upload Photo</p>
            <p class="text-xs text-slate-500 text-center text-balance px-4">Max 2MB. JPG or PNG.</p>
          </template>
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
          <p class="text-[0.625rem] font-black uppercase tracking-widest text-slate-400 mb-1">
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
          <Label class="text-slate-700 font-semibold">Part Name (English)</Label>
          <Input
            v-model="form.nameEN"
            placeholder="e.g. Bearing 6002-ZZ"
            class="bg-white border-slate-200"
          />
        </div>
        <div class="space-y-2">
          <Label class="text-slate-700 font-semibold">Part Name (Thai)</Label>
          <Input
            v-model="form.nameTH"
            placeholder="e.g. ตลับลูกปืน 6002-ZZ"
            class="bg-white border-slate-200"
          />
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <Label class="text-slate-700 font-semibold">Stock Code</Label>
          <div class="flex items-center space-x-2">
            <Checkbox id="auto-gen-stock" v-model:checked="form.autoGenerateCode" />
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
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="w-full justify-start text-left font-normal bg-white border-slate-200"
                :class="!form.dateReceived && 'text-muted-foreground'"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{ form.dateReceived ? format(form.dateReceived, 'PPP') : 'Pick a date' }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0 border-none shadow-xl" align="start">
              <Calendar v-model="calendarValue" mode="single" initial-focus />
            </PopoverContent>
          </Popover>
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
