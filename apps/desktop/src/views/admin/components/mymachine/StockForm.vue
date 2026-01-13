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
import { Barcode, Calendar as CalendarIcon, FileText, QrCode, Settings, X } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import VueBarcode from 'vue3-barcode';
import GLCodeSettingsModal from './GLCodeSettingsModal.vue';

const { t } = useI18n();
const tagMode = ref<'qr' | 'barcode'>('qr');
const showGLSettings = ref(false);

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
        glCode: '',
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
    <!-- Left Column: Image, QR & Barcode in a single card -->
    <div class="md:col-span-4">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-8">
        <!-- Machine Image -->
        <div>
          <Label class="mb-3 block text-slate-700 font-semibold text-sm">{{
            t('services.myMachine.forms.machine.image')
          }}</Label>
          <input
            type="file"
            ref="fileInput"
            class="hidden"
            accept="image/*"
            @change="handleFileChange"
          />
          <div
            @click="handleFileClick"
            class="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center h-[180px] bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden"
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
                  {{ t('services.myMachine.forms.stock.changePhoto') }}
                </Button>
                <Button variant="destructive" size="icon" class="h-8 w-8" @click="removeImage">
                  <X class="w-4 h-4" />
                </Button>
              </div>
            </template>
            <template v-else>
              <div
                class="bg-blue-50 text-blue-500 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform"
              >
                <FileText :size="20" />
              </div>
              <p class="font-bold text-xs text-slate-900 mb-1">
                {{ t('services.myMachine.forms.machine.upload') }}
              </p>
              <p class="text-[10px] text-slate-500 text-center text-balance px-4">
                {{ t('services.myMachine.forms.stock.uploadLimit') }}
              </p>
            </template>
          </div>
        </div>

        <!-- Asset Tag / Barcode Toggle Section -->
        <div class="space-y-4 pt-4 border-t border-slate-100">
          <div class="flex items-center justify-between">
            <Label class="text-slate-700 font-semibold text-sm flex items-center gap-2">
              <QrCode v-if="tagMode === 'qr'" class="w-4 h-4 text-blue-600" />
              <Barcode v-else class="w-4 h-4 text-green-600" />
              {{ tagMode === 'qr' ? t('services.myMachine.forms.machine.assetTag') : 'Barcode' }}
            </Label>
            <div class="flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                @click="tagMode = 'qr'"
                class="px-3 py-1 text-[10px] font-bold rounded-md transition-all"
                :class="
                  tagMode === 'qr'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                "
              >
                QR Code
              </button>
              <button
                type="button"
                @click="tagMode = 'barcode'"
                class="px-3 py-1 text-[10px] font-bold rounded-md transition-all"
                :class="
                  tagMode === 'barcode'
                    ? 'bg-white shadow-sm text-green-600'
                    : 'text-slate-500 hover:text-slate-700'
                "
              >
                Barcode
              </button>
            </div>
          </div>

          <div class="flex flex-col items-center justify-center min-h-[180px]">
            <template v-if="tagMode === 'qr'">
              <div
                class="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-3 w-full flex justify-center"
              >
                <QrcodeVue
                  :value="form.code || 'NO-CODE-ASSIGNED'"
                  :size="120"
                  level="H"
                  render-as="svg"
                />
              </div>
              <p class="text-[0.625rem] font-black uppercase tracking-widest text-slate-400 mb-1">
                {{ t('services.myMachine.forms.stock.encodedData') }}
              </p>
              <code
                class="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded truncate max-w-full"
              >
                {{ form.code || 'NULL' }}
              </code>
            </template>

            <template v-else>
              <div
                class="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-3 w-full flex items-center justify-center overflow-x-auto min-h-[152px]"
              >
                <div class="min-w-0">
                  <VueBarcode
                    :value="form.code || 'NO-CODE'"
                    format="CODE128"
                    :width="1.5"
                    :height="50"
                    :displayValue="false"
                  />
                </div>
              </div>
              <p class="text-[0.625rem] font-black uppercase tracking-widest text-slate-400 mb-1">
                BARCODE DATA
              </p>
              <code
                class="text-xs font-mono font-bold text-green-600 bg-green-50 px-2 py-1 rounded truncate max-w-full"
              >
                {{ form.code || 'NULL' }}
              </code>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Form Fields -->
    <div class="md:col-span-8 space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label class="text-slate-700 font-semibold">{{
            t('services.myMachine.forms.stock.nameEN')
          }}</Label>
          <Input
            v-model="form.nameEN"
            placeholder="e.g. Bearing 6002-ZZ"
            class="bg-white border-slate-200"
          />
        </div>
        <div class="space-y-2">
          <Label class="text-slate-700 font-semibold">{{
            t('services.myMachine.forms.stock.nameTH')
          }}</Label>
          <Input
            v-model="form.nameTH"
            placeholder="e.g. ตลับลูกปืน 6002-ZZ"
            class="bg-white border-slate-200"
          />
        </div>
      </div>

      <div class="space-y-2">
        <div class="grid grid-cols-2 gap-4">
          <div class="flex items-center justify-between">
            <Label class="text-slate-700 font-semibold">{{
              t('services.myMachine.forms.stock.code')
            }}</Label>
            <div class="flex items-center space-x-2">
              <Checkbox id="auto-gen-stock" v-model:checked="form.autoGenerateCode" />
              <label for="auto-gen-stock" class="text-xs font-medium text-slate-500 cursor-pointer">
                {{ t('services.myMachine.forms.stock.autoGen') }}
              </label>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <Label class="text-slate-700 font-semibold">GL-Code</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="h-5 w-5 text-slate-400 hover:text-blue-600 p-0"
              @click="showGLSettings = true"
            >
              <Settings class="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <Input
            v-model="form.code"
            :placeholder="t('services.myMachine.forms.machine.tagPlaceholder')"
            :disabled="form.autoGenerateCode"
            class="bg-white border-slate-200"
          />
          <Input
            v-model="form.glCode"
            placeholder="e.g. A-ASST, F-FUEL"
            class="bg-white border-slate-200"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label class="text-slate-700 font-semibold">{{
            t('services.myMachine.forms.stock.category')
          }}</Label>
          <Select v-model="form.category">
            <SelectTrigger class="bg-white border-slate-200">
              <SelectValue :placeholder="t('services.myMachine.filterPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mechanical">{{
                t('services.myMachine.categories.mechanical')
              }}</SelectItem>
              <SelectItem value="Electrical">{{
                t('services.myMachine.categories.electrical')
              }}</SelectItem>
              <SelectItem value="Electronic">{{
                t('services.myMachine.categories.electronic')
              }}</SelectItem>
              <SelectItem value="Pneumatic">{{
                t('services.myMachine.categories.pneumatic')
              }}</SelectItem>
              <SelectItem value="Hydraulic">{{
                t('services.myMachine.categories.hydraulic')
              }}</SelectItem>
              <SelectItem value="Bearings">{{
                t('services.myMachine.categories.bearings')
              }}</SelectItem>
              <SelectItem value="Fasteners">{{
                t('services.myMachine.categories.fasteners')
              }}</SelectItem>
              <SelectItem value="Belts">{{ t('services.myMachine.categories.belts') }}</SelectItem>
              <SelectItem value="Lubricants">{{
                t('services.myMachine.categories.lubricants')
              }}</SelectItem>
              <SelectItem value="Seals">{{ t('services.myMachine.categories.seals') }}</SelectItem>
              <SelectItem value="Piping">{{
                t('services.myMachine.categories.piping')
              }}</SelectItem>
              <SelectItem value="Valves">{{
                t('services.myMachine.categories.valves')
              }}</SelectItem>
              <SelectItem value="Consumables">{{
                t('services.myMachine.categories.consumables')
              }}</SelectItem>
              <SelectItem value="Spare Parts">{{
                t('services.myMachine.categories.spareparts')
              }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label class="text-slate-700 font-semibold">{{
            t('services.myMachine.forms.stock.location')
          }}</Label>
          <Input
            v-model="form.location"
            :placeholder="t('services.myMachine.forms.machine.locationPlaceholder')"
            class="bg-white border-slate-200"
          />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div class="space-y-2">
          <Label class="text-slate-700 font-semibold">{{
            t('services.myMachine.forms.stock.qty')
          }}</Label>
          <Input type="number" v-model="form.qty" min="0" class="bg-white border-slate-200" />
        </div>
        <div class="space-y-2">
          <Label class="text-slate-700 font-semibold">{{
            t('services.myMachine.forms.stock.minQty')
          }}</Label>
          <Input type="number" v-model="form.minQty" min="0" class="bg-white border-slate-200" />
        </div>
        <div class="space-y-2">
          <Label class="text-slate-700 font-semibold">{{
            t('services.myMachine.forms.stock.price')
          }}</Label>
          <div class="relative">
            <Input
              class="pl-7 bg-white border-slate-200"
              type="number"
              v-model="form.price"
              min="0"
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label class="text-slate-700 font-semibold">{{
            t('services.myMachine.forms.repair.date')
          }}</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="w-full justify-start text-left font-normal bg-white border-slate-200"
                :class="!form.dateReceived && 'text-muted-foreground'"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{
                  form.dateReceived
                    ? format(form.dateReceived, 'PPP')
                    : t('services.myMachine.forms.stock.pickDate')
                }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0 border-none shadow-xl" align="start">
              <Calendar v-model="calendarValue" mode="single" initial-focus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div class="space-y-2">
        <Label class="text-slate-700 font-semibold">{{
          t('services.myMachine.forms.stock.recordedBy')
        }}</Label>
        <Input
          v-model="form.receiver"
          :placeholder="t('services.myMachine.forms.stock.staffIdentifier')"
          class="bg-white border-slate-200"
        />
      </div>

      <div class="space-y-2">
        <Label class="text-slate-700 font-semibold">{{
          t('services.myMachine.forms.machine.notes')
        }}</Label>
        <Textarea
          v-model="form.description"
          :placeholder="t('services.myMachine.forms.stock.specsPlaceholder')"
          class="min-h-[120px] bg-white border-slate-200"
        />
      </div>

      <div class="flex justify-end gap-3 pt-6 mt-8">
        <Button
          type="button"
          variant="outline"
          @click="emit('cancel')"
          class="h-10 px-6 border-slate-200 text-slate-600 font-bold"
        >
          {{ t('services.myMachine.forms.common.cancel') }}
        </Button>
        <Button
          type="submit"
          @click="handleSave"
          class="h-10 px-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 text-white font-black uppercase tracking-widest text-[10px]"
        >
          {{ t('services.myMachine.forms.stock.submit') }}
        </Button>
      </div>
    </div>
  </div>

  <GLCodeSettingsModal v-model:open="showGLSettings" />
</template>
