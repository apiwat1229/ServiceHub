<script setup lang="ts">
import { Button } from '@/components/ui/button';
import DatePicker from '@/components/ui/date-picker.vue';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner/Spinner.vue';
import { Textarea } from '@/components/ui/textarea';
import { itTicketsApi } from '@/services/it-tickets';
import { Clock, Paperclip, Send, Trash2 } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const props = defineProps<{
  onSuccess?: () => void;
  onCancel?: () => void;
}>();

const { t, tm, rt } = useI18n();
const emit = defineEmits(['success', 'cancel']);

const loading = ref(false);
const attachmentInput = ref<HTMLInputElement | null>(null);
const attachmentPreview = ref<string | null>(null);

const form = ref({
  subject: '',
  category: '',
  subcategory: '',
  issueType: '',
  priority: 'medium',
  location: '',
  description: '',
  attachment: null as File | null,
  createdAt: null as string | null, // Combined Date + Time
});

// Created Date/Time Local State
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');

const createdDate = ref<string | null>(`${year}-${month}-${day}`);
const createdTime = ref<string>(`${hours}:${minutes}`);

// Watchers to Combine Date + Time into form.createdAt
watch(
  [createdDate, createdTime],
  ([newDate, newTime]) => {
    if (!newDate) {
      form.value.createdAt = null;
      return;
    }
    // Combine date and time
    // newDate is YYYY-MM-DD from DatePicker
    // newTime is HH:MM from Input type="time"
    const combined = new Date(`${newDate}T${newTime || '00:00'}:00`);
    if (!isNaN(combined.getTime())) {
      form.value.createdAt = combined.toISOString();
    } else {
      form.value.createdAt = null;
    }
  },
  { immediate: true }
);

// Cascading Logic Helpers
const categories = computed(() => {
  const cats = tm('services.itHelp.tickets.categories') as Record<string, any>;
  return Object.keys(cats).map((key) => ({
    id: key,
    label: rt(cats[key].label),
  }));
});

const subcategories = computed(() => {
  if (!form.value.category) return [];
  const subs = tm(`services.itHelp.tickets.categories.${form.value.category}.subs`) as Record<
    string,
    any
  >;
  return Object.keys(subs).map((key) => {
    const sub = subs[key];
    return {
      id: key,
      label: typeof sub === 'string' ? rt(sub) : rt(sub.label),
      hasIssues: typeof sub !== 'string' && !!sub.issues,
    };
  });
});

const issueTypes = computed(() => {
  if (!form.value.category || !form.value.subcategory) return [];
  const sub = tm(
    `services.itHelp.tickets.categories.${form.value.category}.subs.${form.value.subcategory}`
  ) as any;
  if (!sub || typeof sub === 'string' || !sub.issues) return [];

  const issues = sub.issues as Record<string, any>;
  return Object.keys(issues).map((key) => ({
    id: key,
    label: rt(issues[key]),
  }));
});

// Watchers to reset dependable fields
watch(
  () => form.value.category,
  () => {
    form.value.subcategory = '';
    form.value.issueType = '';
  }
);

watch(
  () => form.value.subcategory,
  () => {
    form.value.issueType = '';
  }
);

const handleFileClick = () => {
  attachmentInput.value?.click();
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    form.value.attachment = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      attachmentPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const removeAttachment = () => {
  form.value.attachment = null;
  attachmentPreview.value = null;
  if (attachmentInput.value) attachmentInput.value.value = '';
};

const handleSubmit = async () => {
  if (!form.value.subject || !form.value.category) return;

  loading.value = true;
  try {
    // Map form fields to the backend ITTicket model
    const payload = {
      title: form.value.subject,
      category: `${form.value.category} > ${form.value.subcategory}${form.value.issueType ? ' > ' + form.value.issueType : ''}`,
      description: form.value.description,
      priority: form.value.priority.charAt(0).toUpperCase() + form.value.priority.slice(1), // capitalize
      ...(form.value.createdAt ? { createdAt: new Date(form.value.createdAt).toISOString() } : {}),
    };

    await itTicketsApi.create(payload);
    emit('success');
    if (props.onSuccess) props.onSuccess();
  } catch (error) {
    console.error('Failed to submit ticket:', error);
    toast.error('Failed to submit ticket');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6 pt-2">
    <!-- Subject -->
    <div class="space-y-2">
      <Label for="subject">{{ t('services.itHelp.tickets.subject') }}</Label>
      <Input
        id="subject"
        v-model="form.subject"
        :placeholder="t('services.itHelp.tickets.subjectPlaceholder')"
        required
      />
    </div>

    <!-- Cascading Dropdowns -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Main Category -->
      <div class="space-y-2">
        <Label for="category">{{ t('services.itHelp.tickets.category') }}</Label>
        <Select v-model="form.category" required>
          <SelectTrigger id="category">
            <SelectValue :placeholder="t('services.itHelp.tickets.category')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Sub-Category -->
      <div class="space-y-2">
        <Label for="subcategory">{{ t('services.itHelp.tickets.subcategory') }}</Label>
        <Select v-model="form.subcategory" :disabled="!form.category" required>
          <SelectTrigger id="subcategory">
            <SelectValue :placeholder="t('services.itHelp.tickets.subcategory')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="sub in subcategories" :key="sub.id" :value="sub.id">
              {{ sub.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Issue Type (Conditional) -->
    <div
      v-if="issueTypes.length > 0"
      class="space-y-2 animation-in fade-in slide-in-from-top-2 duration-300"
    >
      <Label for="issueType">{{ t('services.itHelp.tickets.issueType') }}</Label>
      <Select v-model="form.issueType" required>
        <SelectTrigger id="issueType">
          <SelectValue :placeholder="t('services.itHelp.tickets.issueType')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="issue in issueTypes" :key="issue.id" :value="issue.id">
            {{ issue.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Priority & Location -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label for="priority">{{ t('services.itHelp.tickets.priority') }}</Label>
        <Select v-model="form.priority">
          <SelectTrigger id="priority" class="h-10">
            <SelectValue :placeholder="t('services.itHelp.tickets.priority')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                <span class="text-emerald-700 font-medium">{{
                  t('services.itHelp.tickets.priorities.low')
                }}</span>
              </div>
            </SelectItem>
            <SelectItem value="medium">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-amber-500 shadow-sm" />
                <span class="text-amber-700 font-medium">{{
                  t('services.itHelp.tickets.priorities.medium')
                }}</span>
              </div>
            </SelectItem>
            <SelectItem value="high">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-orange-600 shadow-sm" />
                <span class="text-orange-700 font-medium">{{
                  t('services.itHelp.tickets.priorities.high')
                }}</span>
              </div>
            </SelectItem>
            <SelectItem value="critical">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-red-600 shadow-sm animate-pulse" />
                <span class="text-red-700 font-bold">
                  {{ t('services.itHelp.tickets.priorities.critical') }}
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="space-y-2">
        <Label for="location">{{ t('services.itHelp.tickets.location') }}</Label>
        <Input
          id="location"
          v-model="form.location"
          :placeholder="t('services.itHelp.tickets.locationPlaceholder')"
          required
        />
      </div>
    </div>

    <!-- Created Date & Time -->
    <div class="space-y-2">
      <Label>Created Date & Time</Label>
      <div class="flex items-center gap-2">
        <div class="flex-1">
          <DatePicker v-model="createdDate" class="w-full" />
        </div>
        <div class="w-[140px] relative">
          <Input type="time" v-model="createdTime" class="pl-9" :disabled="!createdDate" />
          <Clock class="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
        </div>
      </div>
      <p class="text-xs text-muted-foreground">Leave empty to use current date and time.</p>
    </div>

    <!-- Description -->
    <div class="space-y-2">
      <Label for="description">{{ t('services.itHelp.tickets.description') }}</Label>
      <Textarea
        id="description"
        v-model="form.description"
        :placeholder="t('services.itHelp.tickets.descriptionPlaceholder')"
        class="min-h-[100px]"
        required
      />
    </div>

    <!-- Attachment -->
    <div class="space-y-2">
      <Label>{{ t('services.itHelp.tickets.attachment') }}</Label>
      <div class="flex items-start gap-4">
        <Button
          type="button"
          variant="outline"
          class="w-full h-24 border-dashed flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
          @click="handleFileClick"
          v-if="!attachmentPreview"
        >
          <Paperclip class="w-6 h-6 text-muted-foreground" />
          <span class="text-xs text-muted-foreground">Click to upload image</span>
        </Button>

        <div v-else class="relative w-full h-32 rounded-lg border overflow-hidden group">
          <img :src="attachmentPreview" class="w-full h-full object-cover" />
          <div
            class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <Button type="button" variant="destructive" size="icon" @click="removeAttachment">
              <Trash2 class="w-4 h-4" />
            </Button>
          </div>
        </div>

        <input
          ref="attachmentInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileChange"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 pt-2">
      <Button type="button" variant="outline" class="flex-1" @click="onCancel">
        {{ t('common.cancel') }}
      </Button>
      <Button type="submit" class="flex-1 gap-2" :disabled="loading">
        <Send v-if="!loading" class="w-4 h-4" />
        <span v-if="loading" class="flex items-center gap-2">
          <Spinner class="h-4 w-4" />
          {{ t('services.itHelp.request.submitting') }}
        </span>
        <span v-else>{{ t('services.itHelp.tickets.submit') }}</span>
      </Button>
    </div>
  </form>
</template>
```
