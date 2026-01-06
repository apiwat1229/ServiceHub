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
  const approverRoles: string[] = ['admin', 'md', 'gm', 'manager', 'asst_mgr'];
  return users.value.filter((u) => approverRoles.includes(u.role.toLowerCase()));
});

const categories = computed(() => {
  const cats = assets.value.map((a) => a.category);
  return [...new Set(cats)].sort();
});

const filteredAssets = computed(() => {
  if (!form.value.category) return [];
  return assets.value.filter((a) => a.category === form.value.category && a.stock > 0);
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
    return format(selectedDate.value.toDate(getLocalTimeZone()), 'PPP');
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
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6 pt-2">
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
      <Label for="approver">{{ t('services.itHelp.request.approver') }}</Label>
      <Select v-model="form.approverId" required>
        <SelectTrigger id="approver">
          <SelectValue :placeholder="t('services.itHelp.request.placeholder.selectApprover')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="user in approvers" :key="user.id" :value="user.id">
            {{ user.firstName }} {{ user.lastName }} ({{ user.position || user.role }})
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

    <div class="flex gap-3 pt-2">
      <Button type="button" variant="outline" class="flex-1" @click="onCancel">
        {{ t('common.cancel') }}
      </Button>
      <Button type="submit" class="flex-1 gap-2" :disabled="loading">
        <Send v-if="!loading" class="w-4 h-4" />
        <span v-if="loading">{{ t('services.itHelp.request.submitting') }}</span>
        <span v-else>{{ t('services.itHelp.request.submit') }}</span>
      </Button>
    </div>
  </form>
</template>
