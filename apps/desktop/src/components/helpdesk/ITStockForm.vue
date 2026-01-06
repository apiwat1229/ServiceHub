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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { itAssetsApi } from '@/services/it-assets';
import { useAuthStore } from '@/stores/auth';
import { CalendarDate, getLocalTimeZone, type DateValue } from '@internationalized/date';
import { format } from 'date-fns';
import JsBarcode from 'jsbarcode';
import {
  Calendar as CalendarIcon,
  Check,
  Edit2,
  File as ImageIcon,
  Save,
  ScanBarcode,
  X,
} from 'lucide-vue-next';

import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const props = defineProps<{
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}>();

const { t } = useI18n();
const authStore = useAuthStore();
const loading = ref(false);
const isEditingBarcode = ref(false);
// Helper to transform relative path to full URL
const getImageUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:2530';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
const imagePreview = ref<string | null>(getImageUrl(props.initialData?.image || null));
const fileInput = ref<HTMLInputElement | null>(null);
const barcodeRef = ref<SVGSVGElement | null>(null);

const form = ref({
  name: props.initialData?.name || '',
  code: props.initialData?.code || '',
  isAutoCode: !props.initialData?.code, // Default to true if no code provided
  category: props.initialData?.category || '',
  count: props.initialData?.stock || 0,
  minStock: props.initialData?.minStock || 2,
  location: props.initialData?.location || '',
  description: props.initialData?.description || '',
  image: props.initialData?.image || null,
  price: props.initialData?.price || 0,
  receivedDate: props.initialData?.receivedDate
    ? new Date(props.initialData.receivedDate)
    : new Date(),
  receiver:
    props.initialData?.receiver || authStore.user?.username || authStore.user?.email || 'Unknown',
  serialNumber: props.initialData?.serialNumber || '',
  barcode: props.initialData?.barcode || '',
});

// Watch for initialData changes to update form and preview
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      imagePreview.value = getImageUrl(newData.image || null);
      form.value = {
        name: newData.name || '',
        code: newData.code || '',
        isAutoCode: !newData.code,
        category: newData.category || '',
        count: newData.stock || 0,
        minStock: newData.minStock || 2,
        location: newData.location || '',
        description: newData.description || '',
        image: newData.image || null,
        price: newData.price || 0,
        receivedDate: newData.receivedDate ? new Date(newData.receivedDate) : new Date(),
        receiver: newData.receiver || authStore.user?.username || 'Unknown',
        serialNumber: newData.serialNumber || '',
        barcode: newData.barcode || '',
      };
    }
  },
  { deep: true, immediate: true }
);

// Reactive Barcode Generation
const renderBarcode = async (value: string) => {
  if (!value) return;

  // Wait for DOM to be ready (especially important for v-show or modals)
  await nextTick();

  if (barcodeRef.value) {
    try {
      JsBarcode(barcodeRef.value, value, {
        format: 'CODE128',
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 14,
        background: 'transparent',
      });
    } catch (e) {
      console.error('Barcode generation failed:', e);
    }
  }
};

watch(
  () => form.value.barcode,
  (newBarcode) => {
    renderBarcode(newBarcode || '');
  },
  { flush: 'post', immediate: true }
);

// Also re-render if barcodeRef becomes available
watch(
  barcodeRef,
  (newRef) => {
    if (newRef && form.value.barcode) {
      renderBarcode(form.value.barcode);
    }
  },
  { flush: 'post' }
);

const receivedDateProxy = computed({
  get: () => {
    if (!form.value.receivedDate) return undefined;
    const d = form.value.receivedDate;
    // ensure d is a Date object
    const dateObj = d instanceof Date ? d : new Date(d);
    return new CalendarDate(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
  },
  set: (val: DateValue | undefined) => {
    if (val) {
      form.value.receivedDate = val.toDate(getLocalTimeZone());
    } else {
      // form.value.receivedDate = undefined;
    }
  },
});

// Mock Code Generation Logic
const generateCode = (category: string) => {
  if (!category) return '';
  const prefixMap: Record<string, string> = {
    laptop: 'IT-LPT',
    monitor: 'IT-MON',
    peripheral: 'IT-PER',
    network: 'IT-NET',
    mobile: 'IT-MOB',
    other: 'IT-OTH',
  };
  const prefix = prefixMap[category] || 'IT-DEV';
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digit random
  return `${prefix}-${randomNum}`;
};

watch(
  [() => form.value.isAutoCode, () => form.value.category],
  ([newAuto, newCat]) => {
    if (newAuto && newCat) {
      form.value.code = generateCode(newCat);
    }
  },
  { immediate: true }
);

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string;
      form.value.image = file;
    };
    reader.readAsDataURL(file);
  }
};

const handleRemoveImage = () => {
  form.value.image = null;
  imagePreview.value = null;
  if (fileInput.value) fileInput.value.value = '';
};

const shouldShowSerial = computed(() => {
  const serialCategories = [
    'laptop',
    'pc',
    'monitor',
    'printer',
    'network-device',
    'server',
    'ups-battery',
  ];
  return serialCategories.includes(form.value.category);
});

const handleSubmit = async () => {
  loading.value = true;
  try {
    // Explicitly construct payload to match CreateITAssetDto and avoid 400 violations
    // (backend forbids non-whitelisted fields like 'isAutoCode' and 'count')
    const payload = {
      name: form.value.name,
      code: form.value.code,
      category: form.value.category,
      stock: shouldShowSerial.value ? 1 : Number(form.value.count), // Default to 1 if serial tracked
      minStock: Number(form.value.minStock),
      location: form.value.location,
      description: form.value.description,
      price: Number(form.value.price),
      receivedDate:
        form.value.receivedDate instanceof Date
          ? form.value.receivedDate.toISOString()
          : form.value.receivedDate,
      receiver: form.value.receiver || undefined,
      serialNumber:
        shouldShowSerial.value && form.value.serialNumber ? form.value.serialNumber : undefined, // Send undefined if hidden or empty
      barcode: form.value.barcode || undefined,
    };

    // Ensure stock/minStock are Integers (Prisma Int)
    if (payload.stock) payload.stock = Math.round(Number(payload.stock));
    if (payload.minStock) payload.minStock = Math.round(Number(payload.minStock));

    let assetId = props.initialData?.id;
    if (assetId) {
      // If image was removed explicitly
      if (form.value.image === null) {
        (payload as any).image = null;
      }
      await itAssetsApi.update(assetId, payload as any);
    } else {
      const res = await itAssetsApi.create(payload as any);
      assetId = res.id;
    }

    // Now handle image upload if it's a File
    if (form.value.image instanceof File && assetId) {
      await itAssetsApi.uploadImage(assetId, form.value.image);
    }

    toast.success(t('services.itHelp.stock.saveSuccess'));
    if (props.onSuccess) props.onSuccess();
  } catch (error: any) {
    console.error('Failed to save stock item:', error);
    const msg = error.response?.data?.message || error.message || 'Unknown error';
    toast.error(`${t('common.errorSaving')}: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6 pt-2">
    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Left Column: Image Upload -->
      <div class="w-full lg:w-1/3 space-y-2">
        <Label>{{ t('services.itHelp.stock.deviceImage') }}</Label>
        <div
          class="border-2 border-dashed rounded-lg p-4 transition-colors hover:bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer relative h-[300px]"
          @click="!imagePreview && fileInput?.click()"
        >
          <input
            type="file"
            ref="fileInput"
            class="hidden"
            accept="image/*"
            @change="handleImageUpload"
          />

          <div
            v-if="imagePreview"
            class="relative ring-2 ring-primary/10 rounded-lg overflow-hidden"
          >
            <img :src="imagePreview" class="w-full h-full object-contain rounded-md" />
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  class="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg bg-red-400/80 hover:bg-red-500 transition-all border-2 border-white"
                >
                  <X class="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{{ t('common.confirmDelete') }}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {{ t('services.itHelp.stock.confirmDeleteImage') }}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
                  <AlertDialogAction @click="handleRemoveImage" class="bg-red-500 hover:bg-red-600">
                    {{ t('common.confirm') }}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <template v-else>
            <div class="p-3 rounded-full bg-primary/10 text-primary">
              <ImageIcon class="w-8 h-8" />
            </div>
            <p class="text-sm font-medium text-muted-foreground">
              {{ t('admin.users.uploadImage') }}
            </p>
            <p class="text-xs text-muted-foreground">{{ t('admin.users.maxFileSize') }}</p>
          </template>
        </div>

        <div class="space-y-2 mt-4">
          <div class="flex items-center justify-between">
            <Label for="stock-barcode"
              >{{ t('services.itHelp.stock.barcode') }}
              <span class="text-[10px] text-muted-foreground"
                >({{ t('common.optional') }})</span
              ></Label
            >
            <Button
              v-if="form.barcode && !isEditingBarcode"
              type="button"
              variant="ghost"
              size="sm"
              class="h-7 px-2 text-xs gap-1"
              @click="isEditingBarcode = true"
            >
              <Edit2 class="h-3 w-3" />
              {{ t('common.edit') }}
            </Button>
          </div>

          <div v-if="!form.barcode || isEditingBarcode" class="relative flex gap-2">
            <div class="relative flex-1">
              <ScanBarcode class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="stock-barcode"
                v-model="form.barcode"
                :placeholder="t('services.itHelp.stock.placeholder.barcode')"
                class="pl-9"
              />
            </div>
            <Button
              v-if="isEditingBarcode"
              type="button"
              variant="outline"
              size="icon"
              @click="isEditingBarcode = false"
              class="h-10 w-10 shrink-0"
            >
              <Check class="h-4 w-4 text-green-600" />
            </Button>
          </div>
          <div
            v-else
            class="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-dashed"
          >
            <ScanBarcode class="h-4 w-4 text-muted-foreground" />
            <span class="font-mono text-sm tracking-wider">{{ form.barcode }}</span>
          </div>
        </div>

        <!-- Barcode Preview Area -->
        <div
          v-show="form.barcode"
          class="mt-4 p-4 border rounded-lg bg-white flex justify-center h-[120px] items-center overflow-hidden"
        >
          <svg ref="barcodeRef"></svg>
        </div>
      </div>

      <!-- Right Column: Form Fields -->
      <div class="flex-1 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <div class="flex items-center h-6">
              <Label for="stock-name">{{ t('services.itHelp.stock.deviceName') }}</Label>
            </div>
            <Input
              id="stock-name"
              v-model="form.name"
              :placeholder="t('services.itHelp.stock.placeholder.name')"
              required
            />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between h-6">
              <Label for="stock-code">{{ t('services.itHelp.stock.deviceCode') }}</Label>
              <div class="flex items-center gap-2">
                <Checkbox id="auto-code" v-model:checked="form.isAutoCode" />
                <Label for="auto-code" class="text-xs font-normal cursor-pointer leading-none">
                  {{ t('services.itHelp.stock.autoGenerate') }}
                </Label>
              </div>
            </div>
            <Input
              id="stock-code"
              v-model="form.code"
              :placeholder="t('services.itHelp.stock.placeholder.code')"
              :disabled="form.isAutoCode"
              required
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="stock-category">{{ t('services.itHelp.stock.category') }}</Label>
            <Select v-model="form.category" required>
              <SelectTrigger id="stock-category">
                <SelectValue :placeholder="t('services.itHelp.stock.placeholder.category')" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>IT Device</SelectLabel>
                  <SelectItem value="mouse">Mouse</SelectItem>
                  <SelectItem value="keyboard">Keyboard</SelectItem>
                  <SelectItem value="ink">Spare Ink</SelectItem>
                  <SelectItem value="laptop">Laptop / PC</SelectItem>
                  <SelectItem value="printer">Printer</SelectItem>
                  <SelectItem value="network">Network Device</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Other</SelectLabel>
                  <SelectItem value="accessory">Accessory</SelectItem>
                  <SelectItem value="consumable">Consumable</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="stock-location">{{ t('services.itHelp.stock.location') }}</Label>
            <Input
              id="stock-location"
              v-model="form.location"
              :placeholder="t('services.itHelp.stock.placeholder.location')"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Conditional Logic: Show Serial Number for high-value assets, Count for consumables -->
          <div v-if="shouldShowSerial" class="space-y-2">
            <Label for="stock-serial">{{ t('services.itHelp.stock.serialNumber') }}</Label>
            <Input
              id="stock-serial"
              v-model="form.serialNumber"
              :placeholder="t('services.itHelp.stock.placeholder.serialNumber')"
            />
          </div>
          <div v-else class="space-y-2">
            <Label for="stock-count">{{ t('services.itHelp.stock.count') }}</Label>
            <Input id="stock-count" v-model="form.count" type="number" min="0" required />
          </div>

          <div class="space-y-2">
            <Label for="stock-min">{{ t('services.itHelp.stock.minStock') }}</Label>
            <Input id="stock-min" v-model="form.minStock" type="number" min="0" required />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="stock-price">{{ t('services.itHelp.stock.price') }}</Label>
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center justify-center h-full pt-1"
                >฿</span
              >
              <Input
                id="stock-price"
                v-model="form.price"
                type="number"
                min="0"
                step="0.01"
                class="pl-7"
                required
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label>{{ t('services.itHelp.stock.receivedDate') }}</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  :class="
                    cn(
                      'w-full justify-start text-left font-normal h-10',
                      !form.receivedDate && 'text-muted-foreground'
                    )
                  "
                >
                  <CalendarIcon class="mr-2 h-4 w-4" />
                  {{
                    form.receivedDate
                      ? format(form.receivedDate, 'dd-MMM-yyyy')
                      : t('services.itHelp.stock.selectDate')
                  }}
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0">
                <Calendar v-model="receivedDateProxy" mode="single" initial-focus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="stock-receiver">{{ t('services.itHelp.stock.receiver') }}</Label>
          <Input id="stock-receiver" v-model="form.receiver" disabled class="bg-muted" />
        </div>

        <div class="space-y-2">
          <Label for="stock-description">{{ t('services.itHelp.stock.description') }}</Label>
          <Textarea id="stock-description" v-model="form.description" class="min-h-[80px]" />
        </div>
      </div>
    </div>

    <div class="flex gap-3 pt-2 justify-end border-t mt-4">
      <Button type="button" variant="outline" class="w-32" @click="onCancel">
        {{ t('common.cancel') }}
      </Button>
      <Button type="submit" class="w-32 gap-2" :disabled="loading">
        <Save v-if="!loading" class="w-4 h-4" />
        <span v-if="loading">{{ t('services.itHelp.request.submitting') }}</span>
        <span v-else>{{ t('common.save') }}</span>
      </Button>
    </div>
  </form>
</template>
