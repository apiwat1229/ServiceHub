import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, File as ImageIcon, Save, X } from 'lucide-vue-next';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}>();

const { t } = useI18n();
const authStore = useAuthStore();
const loading = ref(false);
const imagePreview = ref<string | null>(props.initialData?.image || null);
const fileInput = ref<HTMLInputElement | null>(null);

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
  receivedDate: props.initialData?.receivedDate ? new Date(props.initialData.receivedDate) : new Date(),
  receiver: props.initialData?.receiver || authStore.user?.username || authStore.user?.email || 'Unknown',
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

const removeImage = () => {
  imagePreview.value = null;
  form.value.image = null;
  if (fileInput.value) fileInput.value.value = '';
};

const handleSubmit = async () => {
  loading.value = true;
  // Mock API call
  console.log('Submitting form:', form.value);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  loading.value = false;
  if (props.onSuccess) props.onSuccess();
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6 pt-2">
    <!-- Image Upload Section -->
    <div class="space-y-2">
      <Label>{{ t('services.itHelp.stock.deviceImage') }}</Label>
      <div
        class="border-2 border-dashed rounded-lg p-4 transition-colors hover:bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer relative min-h-[150px]"
        @click="!imagePreview && fileInput?.click()"
      >
        <input
          type="file"
          ref="fileInput"
          class="hidden"
          accept="image/*"
          @change="handleImageUpload"
        />

        <template v-if="imagePreview">
          <img :src="imagePreview" class="max-h-[200px] rounded-md object-contain" />
          <Button
            variant="destructive"
            size="icon"
            class="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
            @click.stop="removeImage"
          >
            <X class="w-4 h-4" />
          </Button>
        </template>

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
    </div>

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
            <SelectItem value="laptop">{{
              t('services.itHelp.stock.categories.laptop')
            }}</SelectItem>
            <SelectItem value="monitor">{{
              t('services.itHelp.stock.categories.monitor')
            }}</SelectItem>
            <SelectItem value="peripheral">{{
              t('services.itHelp.stock.categories.peripheral')
            }}</SelectItem>
            <SelectItem value="network">{{
              t('services.itHelp.stock.categories.network')
            }}</SelectItem>
            <SelectItem value="mobile">{{
              t('services.itHelp.stock.categories.mobile')
            }}</SelectItem>
            <SelectItem value="other">{{ t('services.itHelp.stock.categories.other') }}</SelectItem>
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
      <div class="space-y-2">
        <Label for="stock-count">{{ t('services.itHelp.stock.count') }}</Label>
        <Input id="stock-count" v-model="form.count" type="number" min="0" required />
      </div>

      <div class="space-y-2">
        <Label for="stock-min">{{ t('services.itHelp.stock.minStock') }}</Label>
        <Input id="stock-min" v-model="form.minStock" type="number" min="0" required />
      </div>
    </div>

    <!-- Price and Date Received -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label for="stock-price">{{ t('services.itHelp.stock.price') }}</Label>
        <div class="relative">
          <span class="absolute left-3 top-2.5 text-muted-foreground">฿</span>
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

      <div class="space-y-2 flex flex-col">
        <Label>{{ t('services.itHelp.stock.receivedDate') }}</Label>
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              :class="cn('w-full justify-start text-left font-normal', !form.receivedDate && 'text-muted-foreground')"
            >
              <CalendarIcon class="mr-2 h-4 w-4" />
              {{ form.receivedDate ? format(form.receivedDate, 'PPP') : t('services.itHelp.stock.selectDate') }}
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0">
            <Calendar v-model="form.receivedDate" mode="single" initial-focus />
          </PopoverContent>
        </Popover>
      </div>
    </div>

    <!-- Receiver -->
    <div class="space-y-2">
      <Label for="stock-receiver">{{ t('services.itHelp.stock.receiver') }}</Label>
      <Input id="stock-receiver" v-model="form.receiver" disabled class="bg-muted" />
    </div>

    <div class="space-y-2">
      <Label for="stock-description">{{ t('services.itHelp.stock.description') }}</Label>
      <Textarea id="stock-description" v-model="form.description" class="min-h-[100px]" />
    </div>

    <div class="flex gap-3 pt-2">
      <Button type="button" variant="outline" class="flex-1" @click="onCancel">
        {{ t('common.cancel') }}
      </Button>
      <Button type="submit" class="flex-1 gap-2" :disabled="loading">
        <Save v-if="!loading" class="w-4 h-4" />
        <span v-if="loading">{{ t('services.itHelp.request.submitting') }}</span>
        <span v-else>{{ t('common.save') }}</span>
      </Button>
    </div>
  </form>
</template>
