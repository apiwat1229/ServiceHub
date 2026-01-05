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
import { Send } from 'lucide-vue-next';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  onSuccess?: () => void;
  onCancel?: () => void;
}>();

const { t } = useI18n();
const loading = ref(false);

const form = ref({
  subject: '',
  category: '',
  priority: 'medium',
  description: '',
});

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
    <div class="space-y-2">
      <Label for="subject">{{ t('services.itHelp.tickets.subject') }}</Label>
      <Input
        id="subject"
        v-model="form.subject"
        :placeholder="t('services.itHelp.tickets.subjectPlaceholder')"
        required
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label for="category">{{ t('services.itHelp.tickets.category') }}</Label>
        <Select v-model="form.category" required>
          <SelectTrigger id="category">
            <SelectValue :placeholder="t('services.itHelp.tickets.category')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="software">{{ t('services.itHelp.tickets.software') }}</SelectItem>
            <SelectItem value="hardware">{{ t('services.itHelp.tickets.hardware') }}</SelectItem>
            <SelectItem value="network">{{ t('services.itHelp.tickets.network') }}</SelectItem>
            <SelectItem value="account">{{ t('services.itHelp.tickets.account') }}</SelectItem>
            <SelectItem value="other">{{ t('services.itHelp.tickets.other') }}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="space-y-2">
        <Label for="priority">{{ t('services.itHelp.tickets.priority') }}</Label>
        <Select v-model="form.priority">
          <SelectTrigger id="priority">
            <SelectValue :placeholder="t('services.itHelp.tickets.priority')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">{{ t('services.itHelp.tickets.low') }}</SelectItem>
            <SelectItem value="medium">{{ t('services.itHelp.tickets.medium') }}</SelectItem>
            <SelectItem value="high">{{ t('services.itHelp.tickets.high') }}</SelectItem>
            <SelectItem value="urgent">{{ t('services.itHelp.tickets.urgent') }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div class="space-y-2">
      <Label for="description">{{ t('services.itHelp.tickets.description') }}</Label>
      <Textarea
        id="description"
        v-model="form.description"
        :placeholder="t('services.itHelp.tickets.descriptionPlaceholder')"
        class="min-h-[120px]"
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
        <span v-else>{{ t('services.itHelp.tickets.submit') }}</span>
      </Button>
    </div>
  </form>
</template>
