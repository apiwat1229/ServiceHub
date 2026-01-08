<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import Spinner from '@/components/ui/spinner/Spinner.vue';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { itAssetsApi, type ITAsset } from '@/services/it-assets';
import { itTicketsApi } from '@/services/it-tickets';
import { usersApi, type User } from '@/services/users';
import { getLocalTimeZone, type DateValue } from '@internationalized/date';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Send } from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import BarcodePreview from './BarcodePreview.vue';

const props = defineProps<{
  onSuccess?: () => void;
  onCancel?: () => void;
}>();

const { t } = useI18n();
const loading = ref(false);
const assets = ref<ITAsset[]>([]);
const users = ref<User[]>([]);
const loadingAssets = ref(false);

const form = ref({
  category: '',
  assetId: '',
  quantity: '1',
  urgency: 'medium',
  reason: '',
  expectedDate: '',
  approverId: '',
});

const selectedDate = ref<DateValue>();

onMounted(() => {
  fetchData();
});

const fetchData = async () => {
  loadingAssets.value = true;
  try {
    const [assetsData, usersData] = await Promise.all([itAssetsApi.getAll(), usersApi.getAll()]);
    assets.value = assetsData;
    users.value = usersData;
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    loadingAssets.value = false;
  }
};

const approvers = computed(() => {
  const approverRoles = [
    'admin',
    'administrator',
    'md',
    'gm',
    'manager',
    'asst_mgr',
    'asst_manager',
  ];
  const approverPositions = [
    'manager',
    'assistant manager',
    'ass. manager',
    'asst. manager',
    'gm',
    'md',
  ];

  return users.value.filter((u) => {
    const role = u.role?.toLowerCase() || '';
    const position = u.position?.toLowerCase() || '';

    return approverRoles.includes(role) || approverPositions.some((p) => position.includes(p));
  });
});

const selectedApproverLabel = computed(() => {
  if (!form.value.approverId) return null;
  const user = approvers.value.find((u) => u.id === form.value.approverId);
  if (!user) return null;
  const name =
    user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
  const pos = user.position || user.role;
  return `${name} - ${pos}`;
});

const categories = computed(() => {
  const cats = assets.value.map((a) => a.category);
  return [...new Set(cats)].sort();
});

const filteredAssets = computed(() => {
  if (!form.value.category) return [];
  return assets.value.filter((a) => a.category === form.value.category && a.stock > 0);
});
const selectedAsset = computed(() => {
  return assets.value.find((a) => a.id === form.value.assetId);
});

// Reset assetId when category changes
watch(
  () => form.value.category,
  () => {
    form.value.assetId = '';
  }
);

watch(selectedDate, (val) => {
  if (val) {
    const date = val.toDate(getLocalTimeZone());
    form.value.expectedDate = format(date, 'yyyy-MM-dd');
  } else {
    form.value.expectedDate = '';
  }
});

const dateLabel = computed(() => {
  if (selectedDate.value) {
    return format(selectedDate.value.toDate(getLocalTimeZone()), 'dd-MMM-yyyy');
  }
  return t('services.itHelp.request.expectedDate');
});

const handleSubmit = async () => {
  if (!form.value.expectedDate) {
    toast.error('Please select an expected date');
    return;
  }
  if (!form.value.assetId) {
    toast.error('Please select a device model');
    return;
  }

  loading.value = true;
  try {
    const selectedAsset = assets.value.find((a) => a.id === form.value.assetId);

    await itTicketsApi.create({
      title: `Equipment Request: ${selectedAsset?.name || 'Device'}`,
      description: form.value.reason,
      category: 'Hardware',
      priority:
        form.value.urgency === 'high' ? 'High' : form.value.urgency === 'medium' ? 'Medium' : 'Low',
      isAssetRequest: true,
      assetId: form.value.assetId,
      quantity: Number(form.value.quantity),
      expectedDate: new Date(form.value.expectedDate).toISOString(),
      approverId: form.value.approverId,
    });

    toast.success('Equipment request submitted successfully');
    if (props.onSuccess) props.onSuccess();
  } catch (error: any) {
    console.error('Failed to submit request:', error);
    toast.error('Failed to submit request', {
      description: error.response?.data?.message || 'Unknown error occurred',
    });
  } finally {
    loading.value = false;
  }
};

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return undefined;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:2530';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="pt-2">
    <div v-if="loadingAssets" class="flex justify-center py-12">
      <Spinner class="h-8 w-8 text-primary" />
    </div>
    <div
      v-else
      :class="
        cn(
          'transition-all duration-500',
          selectedAsset ? 'grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8' : 'space-y-6'
        )
      "
    >
      <!-- Left Column: Form Fields -->
      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="category">{{ t('services.itHelp.request.category') }}</Label>
            <Select v-model="form.category" required>
              <SelectTrigger id="category" class="capitalize">
                <SelectValue :placeholder="t('services.itHelp.request.category')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="cat in categories" :key="cat" :value="cat" class="capitalize">
                  {{ cat }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="urgency">{{ t('services.itHelp.request.urgency') }}</Label>
            <Select v-model="form.urgency">
              <SelectTrigger id="urgency">
                <SelectValue :placeholder="t('services.itHelp.request.urgency')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{{ t('services.itHelp.request.urgencyLevels.low') }}</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-amber-500" />
                    <span>{{ t('services.itHelp.request.urgencyLevels.medium') }}</span>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-destructive" />
                    <span>{{ t('services.itHelp.request.urgencyLevels.high') }}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="model">{{ t('services.itHelp.request.model') }}</Label>
          <Select v-model="form.assetId" required :disabled="!form.category">
            <SelectTrigger id="model">
              <SelectValue :placeholder="t('services.itHelp.request.model')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="asset in filteredAssets" :key="asset.id" :value="asset.id">
                {{ asset.name }} (Stock: {{ asset.stock }})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="quantity">{{ t('services.itHelp.request.quantity') }}</Label>
            <Input id="quantity" v-model="form.quantity" type="number" min="1" required />
          </div>

          <div class="space-y-2 flex flex-col">
            <Label for="expectedDate" class="mb-2">{{
              t('services.itHelp.request.expectedDate')
            }}</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  :class="
                    cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )
                  "
                >
                  <CalendarIcon class="mr-2 h-4 w-4" />
                  {{ dateLabel }}
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0">
                <Calendar v-model="selectedDate" initial-focus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="approver" class="text-sm font-semibold text-slate-700">
            Approver (Ass.Manager/Manager)
          </Label>
          <Select v-model="form.approverId" required>
            <SelectTrigger id="approver" class="h-11 border-slate-200">
              <SelectValue :placeholder="t('services.itHelp.request.placeholder.selectApprover')">
                {{ selectedApproverLabel }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="user in approvers" :key="user.id" :value="user.id">
                <div class="flex flex-col py-0.5">
                  <span class="font-semibold text-slate-800">
                    {{
                      user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    }}
                  </span>
                  <span class="text-[11px] text-slate-500 font-medium tracking-tight">
                    {{ user.position || user.role }}
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="reason">{{ t('services.itHelp.request.reason') }}</Label>
          <Textarea
            id="reason"
            v-model="form.reason"
            placeholder="..."
            class="min-h-[100px]"
            required
          />
        </div>
      </div>

      <!-- Right Column: Asset Preview Card -->
      <div v-if="selectedAsset" class="flex flex-col lg:pt-0">
        <div class="lg:sticky lg:top-0 space-y-4">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Device Preview
          </h4>
          <div
            class="w-full bg-white rounded-xl overflow-hidden border shadow-lg transition-all duration-300 hover:shadow-xl group mx-auto"
          >
            <!-- Image Area -->
            <div
              class="aspect-[4/3] bg-slate-50 flex items-center justify-center p-6 border-b relative overflow-hidden"
            >
              <img
                v-if="selectedAsset.image"
                :src="getImageUrl(selectedAsset.image)"
                :alt="selectedAsset.name"
                class="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110"
              />
              <div v-else class="text-slate-300 flex flex-col items-center gap-2">
                <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <span class="text-2xl font-bold opacity-20">IT</span>
                </div>
              </div>
              <div
                v-if="selectedAsset.stock <= 5"
                class="absolute top-2 right-2 bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-500/20"
              >
                Low Stock
              </div>
            </div>

            <!-- Info Area -->
            <div class="p-4 space-y-3">
              <div class="space-y-0.5">
                <h4
                  class="font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors text-sm sm:text-base"
                >
                  {{ selectedAsset.name }}
                </h4>
              </div>

              <div class="grid grid-cols-[80px,1fr] gap-y-1.5 text-[12px] sm:text-[13px]">
                <span class="text-slate-400 font-medium tracking-tight">Code:</span>
                <span class="text-slate-700 font-bold font-mono tracking-tight">{{
                  selectedAsset.code
                }}</span>

                <span class="text-slate-400 font-medium">Category:</span>
                <span class="text-slate-700 font-semibold capitalize">{{
                  selectedAsset.category
                }}</span>
              </div>

              <!-- Barcode Area -->
              <div class="pt-2">
                <BarcodePreview
                  v-if="selectedAsset.barcode"
                  :value="selectedAsset.barcode"
                  :height="40"
                  :font-size="10"
                  class="border-dashed border-slate-200"
                />
                <div
                  v-else
                  class="h-[60px] border border-dashed border-slate-200 rounded-lg flex items-center justify-center bg-slate-50/50"
                >
                  <span class="text-[10px] text-slate-400 font-medium italic"
                    >No Barcode Assigned</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex gap-3 pt-8 border-t mt-8">
      <Button type="button" variant="outline" class="flex-1" @click="onCancel">
        {{ t('common.cancel') }}
      </Button>
      <Button type="submit" class="flex-1 gap-2" :disabled="loading">
        <Send v-if="!loading" class="w-4 h-4" />
        <span v-if="loading" class="flex items-center gap-2">
          <Spinner class="h-4 w-4" />
          {{ t('services.itHelp.request.submitting') }}
        </span>
        <span v-else>{{ t('services.itHelp.request.submit') }}</span>
      </Button>
    </div>
  </form>
</template>
