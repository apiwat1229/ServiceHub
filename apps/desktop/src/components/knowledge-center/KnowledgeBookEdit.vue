<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { knowledgeBooksApi, type KnowledgeBook } from '@/services/knowledge-books';
import { CalendarDate, getLocalTimeZone } from '@internationalized/date';
import { format } from 'date-fns';
import { enUS, th } from 'date-fns/locale';
import {
  AlertCircle as AlertCircleIcon,
  Calendar as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Save,
  X,
} from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  open: boolean;
  book: KnowledgeBook | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  updated: [];
}>();

const title = ref('');
const description = ref('');
const category = ref('');
const author = ref('');
const tags = ref<string[]>([]);
const tagInput = ref('');
const trainingDate = ref<any>();
const attendees = ref<number | ''>('');
const saving = ref(false);
const saveStatus = ref<'idle' | 'success' | 'error'>('idle');
const errorMessage = ref('');

const { t, locale } = useI18n();

const dateLocale = computed(() => {
  return locale.value === 'th' ? th : enUS;
});

const categories = [
  'Getting Started',
  'Tutorials',
  'Troubleshooting',
  'System Guides',
  'Best Practices',
];

const isValid = computed(() => {
  return title.value && category.value;
});

watch(
  () => props.book,
  (newBook) => {
    if (newBook) {
      title.value = newBook.title;
      description.value = newBook.description || '';
      category.value = newBook.category;
      author.value = newBook.author || '';
      tags.value = [...newBook.tags];
      attendees.value = newBook.attendees || '';

      if (newBook.trainingDate) {
        const d = new Date(newBook.trainingDate);
        trainingDate.value = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
      } else {
        trainingDate.value = undefined;
      }
    }
  },
  { immediate: true }
);

function addTag() {
  const tag = tagInput.value.trim();
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag);
    tagInput.value = '';
  }
}

function removeTag(tag: string) {
  tags.value = tags.value.filter((t) => t !== tag);
}

async function handleSave() {
  if (!isValid.value || !props.book) return;

  saving.value = true;
  saveStatus.value = 'idle';
  errorMessage.value = '';

  try {
    await knowledgeBooksApi.update(props.book.id, {
      title: title.value,
      description: description.value,
      category: category.value,
      author: author.value,
      tags: tags.value,
      trainingDate: trainingDate.value
        ? trainingDate.value.toDate(getLocalTimeZone()).toISOString()
        : undefined,
      attendees: attendees.value === '' ? undefined : Number(attendees.value),
    });

    saveStatus.value = 'success';
    emit('updated');
    setTimeout(() => {
      handleClose();
    }, 1500);
  } catch (error: any) {
    console.error('Update failed:', error);
    saveStatus.value = 'error';
    const defaultError =
      locale.value === 'th' ? 'อัปเดต eBook ไม่สำเร็จ' : 'Failed to update eBook';
    errorMessage.value = error.response?.data?.message || defaultError;
  } finally {
    saving.value = false;
  }
}

function handleClose() {
  saveStatus.value = 'idle';
  errorMessage.value = '';
  emit('update:open', false);
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ t('services.itHelp.kb.editModal.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('services.itHelp.kb.editModal.subtitle', { title: book?.title }) }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4" v-if="saveStatus !== 'error'">
        <!-- Title -->
        <div class="space-y-2">
          <Label for="edit-title">{{ t('services.itHelp.kb.fields.title') }} *</Label>
          <Input
            id="edit-title"
            v-model="title"
            :placeholder="t('services.itHelp.kb.placeholders.title')"
          />
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <Label for="edit-description">{{ t('services.itHelp.kb.fields.description') }}</Label>
          <Textarea
            id="edit-description"
            v-model="description"
            :placeholder="t('services.itHelp.kb.placeholders.description')"
            rows="3"
          />
        </div>

        <!-- Category & Author -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="edit-category">{{ t('services.itHelp.kb.fields.category') }} *</Label>
            <Select v-model="category">
              <SelectTrigger>
                <SelectValue :placeholder="t('services.itHelp.kb.placeholders.category')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="cat in categories" :key="cat" :value="cat">
                  {{ cat }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="edit-author">{{ t('services.itHelp.kb.fields.author') }}</Label>
            <Input
              id="edit-author"
              v-model="author"
              :placeholder="t('services.itHelp.kb.placeholders.author')"
            />
          </div>
        </div>

        <!-- Training Date -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="edit-trainingDate">{{ t('services.itHelp.kb.fields.trainingDate') }}</Label>
            <div class="relative">
              <Popover>
                <PopoverTrigger as-child>
                  <Button
                    id="edit-trainingDate"
                    variant="outline"
                    :class="
                      cn(
                        'w-full justify-start text-left font-normal',
                        !trainingDate && 'text-muted-foreground'
                      )
                    "
                  >
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    {{
                      trainingDate
                        ? format(trainingDate.toDate(getLocalTimeZone()), 'dd MMM yyyy', {
                            locale: dateLocale,
                          })
                        : t('services.itHelp.kb.placeholders.pickDate')
                    }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0">
                  <Calendar v-model="trainingDate" mode="single" initial-focus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="edit-attendees">{{ t('services.itHelp.kb.fields.attendees') }}</Label>
            <Input id="edit-attendees" type="number" v-model="attendees" placeholder="0" min="0" />
          </div>
        </div>

        <!-- Tags -->
        <div class="space-y-2">
          <Label for="edit-tags">{{ t('services.itHelp.kb.fields.tags') }}</Label>
          <div class="flex gap-2">
            <Input
              id="edit-tags"
              v-model="tagInput"
              :placeholder="t('services.itHelp.kb.placeholders.tags')"
              @keydown.enter.prevent="addTag"
            />
            <Button variant="outline" @click="addTag">
              {{ t('services.itHelp.kb.placeholders.add') }}
            </Button>
          </div>
          <div v-if="tags.length > 0" class="flex flex-wrap gap-2 mt-2">
            <Badge
              v-for="tag in tags"
              :key="tag"
              variant="secondary"
              class="cursor-pointer"
              @click="removeTag(tag)"
            >
              {{ tag }}
              <X class="w-3 h-3 ml-1" />
            </Badge>
          </div>
        </div>
      </div>

      <!-- Success / Error Status View -->
      <div
        v-if="saveStatus === 'success'"
        class="py-6 flex flex-col items-center justify-center space-y-4 text-center"
      >
        <div
          class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
        >
          <CheckCircleIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <h3 class="font-semibold text-lg">
          {{ locale === 'th' ? 'บันทึกการเปลี่ยนแปลงแล้ว' : 'Changes Saved' }}
        </h3>
      </div>

      <div
        v-else-if="saveStatus === 'error'"
        class="py-6 flex flex-col items-center justify-center space-y-4 text-center"
      >
        <div
          class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center"
        >
          <AlertCircleIcon class="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <h3 class="font-semibold text-lg text-red-600">
          {{ locale === 'th' ? 'อัปเดตล้มเหลว' : 'Update Failed' }}
        </h3>
        <p class="text-sm text-muted-foreground">{{ errorMessage }}</p>
        <Button variant="outline" @click="saveStatus = 'idle'">{{
          locale === 'th' ? 'ลองอีกครั้ง' : 'Try Again'
        }}</Button>
      </div>

      <DialogFooter v-if="saveStatus === 'idle'">
        <Button variant="outline" @click="handleClose" :disabled="saving">
          {{ t('common.cancel') }}
        </Button>
        <Button @click="handleSave" :disabled="!isValid || saving">
          <Save v-if="!saving" class="w-4 h-4 mr-2" />
          <div
            v-else
            class="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {{
            saving
              ? locale === 'th'
                ? 'กำลังบันทึก...'
                : 'Saving...'
              : locale === 'th'
                ? 'บันทึกการเปลี่ยนแปลง'
                : 'Save Changes'
          }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
