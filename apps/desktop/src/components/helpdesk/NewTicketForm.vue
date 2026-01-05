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
import { Paperclip, Send, Trash2 } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  onSuccess?: () => void;
  onCancel?: () => void;
}>();

const { t, tm, rt } = useI18n();
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
});

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
  loading.value = true;
  // Mock API call
  await new Promise((resolve) => setTimeout(resolve, 1500));
  loading.value = false;
  if (props.onSuccess) props.onSuccess();
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
          <SelectTrigger id="priority">
            <SelectValue :placeholder="t('services.itHelp.tickets.priority')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">{{ t('services.itHelp.tickets.priorities.low') }}</SelectItem>
            <SelectItem value="medium">{{
              t('services.itHelp.tickets.priorities.medium')
            }}</SelectItem>
            <SelectItem value="high">{{ t('services.itHelp.tickets.priorities.high') }}</SelectItem>
            <SelectItem value="critical">{{
              t('services.itHelp.tickets.priorities.critical')
            }}</SelectItem>
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
        <span v-if="loading">{{ t('services.itHelp.request.submitting') }}</span>
        <span v-else>{{ t('services.itHelp.tickets.submit') }}</span>
      </Button>
    </div>
  </form>
</template>
