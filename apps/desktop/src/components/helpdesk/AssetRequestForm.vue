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
import { getLocalTimeZone, type DateValue } from '@internationalized/date';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Send } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  onSuccess?: () => void;
  onCancel?: () => void;
}>();

const { t } = useI18n();
const loading = ref(false);

const form = ref({
  category: '',
  model: '',
  quantity: '1',
  urgency: 'medium',
  reason: '',
  expectedDate: '',
});

const selectedDate = ref<DateValue>();

// Initialize with today if needed, or keep empty
// For this form, maybe empty is better to force user to pick

watch(selectedDate, (val) => {
  if (val) {
    // Convert DateValue to JS Date then to string YYYY-MM-DD for consistency
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
    // Show error or just don't submit
    return;
  }
  loading.value = true;
  // Mock API call
  await new Promise((resolve) => setTimeout(resolve, 1500));
  loading.value = false;
  if (props.onSuccess) props.onSuccess();
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6 pt-2">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label for="category">{{ t('services.itHelp.request.category') }}</Label>
        <Select v-model="form.category" required>
          <SelectTrigger id="category">
            <SelectValue :placeholder="t('services.itHelp.request.category')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="laptop">Laptop / PC</SelectItem>
            <SelectItem value="monitor">Monitor</SelectItem>
            <SelectItem value="keyboard">Keyboard / Mouse</SelectItem>
            <SelectItem value="network">Network (Adapter, Cable)</SelectItem>
            <SelectItem value="other">Other</SelectItem>
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
            <SelectItem value="low"
              >{{ t('auth.passwordStrength.weak') }} - Routine Request</SelectItem
            >
            <SelectItem value="medium"
              >{{ t('auth.passwordStrength.medium') }} - Required for Work</SelectItem
            >
            <SelectItem value="high"
              >{{ t('auth.passwordStrength.strong') }} - Critical / Blocker</SelectItem
            >
          </SelectContent>
        </Select>
      </div>
    </div>

    <div class="space-y-2">
      <Label for="model">{{ t('services.itHelp.request.model') }}</Label>
      <Input id="model" v-model="form.model" placeholder="e.g. Dell Latitude, Logitech MX Master" />
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
