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
import { FileText, ScanBarcode, X } from 'lucide-vue-next';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import ImageCropperModal from './ImageCropperModal.vue';

const { t } = useI18n();

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
        serialNumber: '',
        installDate: '',
        assetTag: '',
        notes: '',
        image: undefined,
      }
);

const fileInput = ref<HTMLInputElement | null>(null);
const showCropper = ref(false);
const sourceImage = ref('');

const handleFileClick = () => {
  fileInput.value?.click();
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    toast.error('File too large (max 5MB)');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    sourceImage.value = event.target?.result as string;
    showCropper.value = true;
  };
  reader.readAsDataURL(file);
};

const handleCrop = (croppedImage: string) => {
  machine.value.image = croppedImage;
  showCropper.value = false;
};

const removeImage = (e: Event) => {
  e.stopPropagation();
  machine.value.image = undefined;
  if (fileInput.value) fileInput.value.value = '';
};

const handleSave = () => {
  if (!machine.value.name) return;
  emit('save', machine.value);
};
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-12 gap-6 py-4">
    <!-- Left Column: Image Upload -->
    <div class="md:col-span-4">
      <Label class="mb-2 block text-slate-700 font-semibold">{{
        t('services.maintenance.forms.machine.image')
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
        class="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center h-[250px] bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden"
      >
        <template v-if="machine.image">
          <img :src="machine.image" class="w-full h-full object-cover" />
          <div
            class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
          >
            <Button
              variant="secondary"
              size="sm"
              class="h-8 text-xs font-bold"
              @click.stop="handleFileClick"
            >
              {{ t('services.maintenance.forms.stock.changePhoto') }}
            </Button>
            <Button variant="destructive" size="icon" class="h-8 w-8" @click="removeImage">
              <X class="w-4 h-4" />
            </Button>
          </div>
        </template>
        <template v-else>
          <div
            class="bg-primary/10 text-primary p-4 rounded-full mb-3 group-hover:scale-110 transition-transform"
          >
            <FileText :size="28" />
          </div>
          <p class="font-bold text-sm text-slate-900 mb-1">
            {{ t('services.maintenance.forms.machine.upload') }}
          </p>
          <p class="text-xs text-slate-500 text-center">Max 5MB. JPG or PNG.</p>
        </template>
      </div>

      <div class="mt-4">
        <Label class="mb-2 block text-slate-700 font-semibold"
          >{{ t('services.maintenance.forms.machine.assetTag') }}
          <span class="text-xs font-normal text-slate-500"
            >({{ t('services.maintenance.forms.common.optional') }})</span
          ></Label
        >
        <div class="relative">
          <ScanBarcode class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            v-model="machine.assetTag"
            :placeholder="t('services.maintenance.forms.machine.tagPlaceholder')"
            class="pl-9 bg-white border-slate-200 focus:bg-white transition-colors"
          />
        </div>
      </div>
    </div>

    <!-- Right Column: Form Fields -->
    <div class="md:col-span-8 space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="name" class="text-slate-700">{{
            t('services.maintenance.forms.machine.name')
          }}</Label>
          <Input
            id="name"
            v-model="machine.name"
            :placeholder="t('services.maintenance.forms.machine.namePlaceholder')"
            class="bg-white border-slate-200"
            required
          />
        </div>
        <div class="space-y-2">
          <Label for="model" class="text-slate-700">{{
            t('services.maintenance.forms.machine.model')
          }}</Label>
          <Input
            id="model"
            v-model="machine.model"
            :placeholder="t('services.maintenance.forms.machine.modelPlaceholder')"
            class="bg-white border-slate-200"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="location" class="text-slate-700">{{
            t('services.maintenance.forms.machine.location')
          }}</Label>
          <Input
            id="location"
            v-model="machine.location"
            :placeholder="t('services.maintenance.forms.machine.locationPlaceholder')"
            class="bg-white border-slate-200"
          />
        </div>
        <div class="space-y-2">
          <Label for="status" class="text-slate-700">{{
            t('services.maintenance.forms.machine.status')
          }}</Label>
          <Select v-model="machine.status">
            <SelectTrigger class="bg-white border-slate-200">
              <SelectValue :placeholder="t('services.maintenance.filterPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">{{
                t('services.maintenance.forms.machine.statusActive')
              }}</SelectItem>
              <SelectItem value="Inactive">{{
                t('services.maintenance.forms.machine.statusInactive')
              }}</SelectItem>
              <SelectItem value="Maintenance">{{
                t('services.maintenance.forms.machine.statusMaintenance')
              }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label class="text-slate-700">{{ t('services.maintenance.forms.machine.serial') }}</Label>
          <Input
            v-model="machine.serialNumber"
            placeholder="SN-998877"
            class="bg-white border-slate-200"
          />
        </div>
        <div class="space-y-2">
          <Label class="text-slate-700">{{
            t('services.maintenance.forms.machine.installDate')
          }}</Label>
          <Input v-model="machine.installDate" type="date" class="bg-white border-slate-200" />
        </div>
      </div>

      <div class="space-y-2">
        <Label class="text-slate-700">{{ t('services.maintenance.forms.machine.notes') }}</Label>
        <Textarea
          v-model="machine.notes"
          class="min-h-[100px] resize-none bg-white border-slate-200"
          :placeholder="t('services.maintenance.forms.machine.modelPlaceholder')"
        />
      </div>
    </div>
  </div>

  <div class="flex justify-end gap-3 pt-4 border-t mt-6">
    <Button variant="outline" @click="emit('cancel')" class="border-slate-200">{{
      t('services.maintenance.forms.common.cancel')
    }}</Button>
    <Button @click="handleSave" class="bg-primary hover:bg-primary/90 shadow-md">{{
      t('services.maintenance.forms.machine.submit')
    }}</Button>
  </div>

  <ImageCropperModal v-model:open="showCropper" :image="sourceImage" @crop="handleCrop" />
</template>
