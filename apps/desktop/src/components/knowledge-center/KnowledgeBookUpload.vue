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
import { knowledgeBooksApi } from '@/services/knowledge-books';
import { type DateValue, getLocalTimeZone } from '@internationalized/date';
import { format } from 'date-fns';
import { enUS, th } from 'date-fns/locale';
import {
  AlertCircle as AlertCircleIcon,
  Calendar as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  FileText,
  Upload,
  X,
} from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  uploaded: [];
}>();

const fileInput = ref<HTMLInputElement>();
const file = ref<File | null>(null);
const title = ref('');
const description = ref('');
const category = ref('');
const author = ref('');
const tags = ref<string[]>([]);
const tagInput = ref('');
const uploading = ref(false);
const uploadProgress = ref(0);
const isDragging = ref(false);
const trainingDate = ref<DateValue>();
const attendees = ref<number | ''>('');
const uploadStatus = ref<'idle' | 'success' | 'error'>('idle');
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

const fileIcon = computed(() => {
  if (!file.value) return FileText;
  return FileText;
});

const fileSize = computed(() => {
  if (!file.value) return '';
  const mb = file.value.size / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
});

const isValid = computed(() => {
  return file.value && title.value && category.value;
});

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;

  const droppedFile = e.dataTransfer?.files[0];
  if (droppedFile) {
    validateAndSetFile(droppedFile);
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const selectedFile = target.files?.[0];
  if (selectedFile) {
    validateAndSetFile(selectedFile);
  }
}

function validateAndSetFile(selectedFile: File) {
  const allowedTypes = ['application/pdf'];

  if (!allowedTypes.includes(selectedFile.type)) {
    const msg =
      locale.value === 'th'
        ? 'รองรับเฉพาะไฟล์ PDF เท่านั้น'
        : 'Invalid file type: Only PDF files are allowed';
    console.error(msg);
    alert(msg);
    return;
  }

  if (selectedFile.size > 50 * 1024 * 1024) {
    const msg =
      locale.value === 'th'
        ? 'ไฟล์ใหญ่เกินไป: ขนาดสูงสุดคือ 50MB'
        : 'File too large: Maximum file size is 50MB';
    console.error(msg);
    alert(msg);
    return;
  }

  file.value = selectedFile;

  // Auto-fill title from filename if empty
  if (!title.value) {
    title.value = selectedFile.name.replace(/\.[^/.]+$/, '');
  }
}

function removeFile() {
  file.value = null;
}

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

async function handleUpload() {
  if (!isValid.value || !file.value) return;

  uploading.value = true;
  uploadStatus.value = 'idle'; // Reset status
  uploadProgress.value = 0;
  errorMessage.value = '';

  try {
    // Simulate progress for better UX (since axios interceptor might hide real progress or it's too fast)
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10;
      }
    }, 200);

    await knowledgeBooksApi.upload({
      file: file.value,
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

    clearInterval(progressInterval);
    uploadProgress.value = 100;
    uploadStatus.value = 'success';
    console.log('eBook uploaded successfully');
    emit('uploaded');
    // Don't close automatically so user sees success message
  } catch (error: any) {
    console.error('Upload failed:', error);
    uploadStatus.value = 'error';
    const defaultError =
      locale.value === 'th' ? 'อัปโหลด eBook ไม่สำเร็จ' : 'Failed to upload eBook';
    errorMessage.value = error.response?.data?.message || defaultError;
  } finally {
    uploading.value = false;
  }
}

function handleClose() {
  file.value = null;
  title.value = '';
  description.value = '';
  category.value = '';
  author.value = '';
  tags.value = [];
  tagInput.value = '';
  uploadProgress.value = 0;
  trainingDate.value = undefined;
  attendees.value = '';
  uploadStatus.value = 'idle';
  errorMessage.value = '';
  emit('update:open', false);
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ t('services.itHelp.kb.uploadModal.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('services.itHelp.kb.uploadModal.subtitle') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4" v-if="uploadStatus === 'idle' && !uploading">
        <!-- File Upload Zone -->
        <div
          v-if="!file"
          class="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer hover:bg-muted/50"
          :class="isDragging ? 'border-primary bg-primary/5' : 'border-border'"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
          @click="() => fileInput?.click()"
        >
          <Upload class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p class="text-sm font-medium mb-2">{{ t('services.itHelp.kb.uploadModal.dragDrop') }}</p>
          <p class="text-xs text-muted-foreground mb-4 font-normal">
            {{ t('services.itHelp.kb.uploadModal.orClick') }}
          </p>
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            accept=".pdf"
            @change="handleFileSelect"
          />
          <p class="text-xs text-muted-foreground mt-4 font-normal">
            {{ t('services.itHelp.kb.uploadModal.supported') }}
          </p>
        </div>

        <!-- Selected File -->
        <div v-else class="border rounded-lg p-4 flex items-center gap-3">
          <component :is="fileIcon" class="w-10 h-10 text-primary" />
          <div class="flex-1">
            <p class="font-medium">{{ file.name }}</p>
            <p class="text-sm text-muted-foreground">{{ fileSize }}</p>
          </div>
          <Button variant="ghost" size="icon" @click="removeFile">
            <X class="w-4 h-4" />
          </Button>
        </div>

        <!-- Title -->
        <div class="space-y-2">
          <Label for="title">{{ t('services.itHelp.kb.fields.title') }} *</Label>
          <Input
            id="title"
            v-model="title"
            :placeholder="t('services.itHelp.kb.placeholders.title')"
          />
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <Label for="description">{{ t('services.itHelp.kb.fields.description') }}</Label>
          <Textarea
            id="description"
            v-model="description"
            :placeholder="t('services.itHelp.kb.placeholders.description')"
            rows="3"
          />
        </div>

        <!-- Category & Author -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="category">{{ t('services.itHelp.kb.fields.category') }} *</Label>
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
            <Label for="author">{{ t('services.itHelp.kb.fields.author') }}</Label>
            <Input
              id="author"
              v-model="author"
              :placeholder="t('services.itHelp.kb.placeholders.author')"
            />
          </div>
        </div>

        <!-- Training Date -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="trainingDate">{{ t('services.itHelp.kb.fields.trainingDate') }}</Label>
            <div class="relative">
              <Popover>
                <PopoverTrigger as-child>
                  <Button
                    id="trainingDate"
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
            <Label for="attendees">{{ t('services.itHelp.kb.fields.attendees') }}</Label>
            <Input id="attendees" type="number" v-model="attendees" placeholder="0" min="0" />
          </div>
        </div>

        <!-- Tags -->
        <div class="space-y-2">
          <Label for="tags">{{ t('services.itHelp.kb.fields.tags') }}</Label>
          <div class="flex gap-2">
            <Input
              id="tags"
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

      <!-- Upload Progress / Status View -->
      <div v-else class="py-12 flex flex-col items-center justify-center space-y-6 text-center">
        <!-- Uploading -->
        <div v-if="uploading && uploadStatus === 'idle'" class="w-full max-w-xs space-y-4">
          <div class="relative w-16 h-16 mx-auto">
            <div class="absolute inset-0 rounded-full border-4 border-muted"></div>
            <div
              class="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
            ></div>
            <Upload class="absolute inset-0 w-8 h-8 m-auto text-primary animate-pulse" />
          </div>
          <div class="space-y-1">
            <h3 class="font-semibold text-lg">
              {{ locale === 'th' ? 'กำลังอัปโหลด...' : 'Uploading...' }}
            </h3>
            <p class="text-sm text-muted-foreground">
              {{
                locale === 'th'
                  ? 'กรุณารอสักครู่ในขณะที่เราประมวลผลไฟล์ของคุณ'
                  : 'Please wait while we process your file.'
              }}
            </p>
          </div>
          <Progress :model-value="uploadProgress" class="w-full h-2" />
          <p class="text-xs text-muted-foreground text-right font-normal">{{ uploadProgress }}%</p>
        </div>

        <!-- Success -->
        <div
          v-else-if="uploadStatus === 'success'"
          class="space-y-4 animate-in fade-in zoom-in duration-300"
        >
          <div
            class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto"
          >
            <CheckCircleIcon class="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div class="space-y-1">
            <h3 class="font-semibold text-lg">
              {{ locale === 'th' ? 'อัปโหลดเสร็จสิ้น!' : 'Upload Complete!' }}
            </h3>
            <p class="text-sm text-muted-foreground">
              {{
                locale === 'th'
                  ? 'eBook ของคุณถูกเพิ่มลงในคลังเรียบร้อยแล้ว'
                  : 'Your eBook has been successfully added to the library.'
              }}
            </p>
          </div>
        </div>

        <!-- Error -->
        <div
          v-else-if="uploadStatus === 'error'"
          class="space-y-4 animate-in fade-in zoom-in duration-300"
        >
          <div
            class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto"
          >
            <AlertCircleIcon class="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div class="space-y-1">
            <h3 class="font-semibold text-lg text-red-600">
              {{ locale === 'th' ? 'อัปโหลดล้มเหลว' : 'Upload Failed' }}
            </h3>
            <p class="text-sm text-muted-foreground font-normal">{{ errorMessage }}</p>
          </div>
          <Button variant="outline" @click="uploadStatus = 'idle'">{{
            locale === 'th' ? 'ลองอีกครั้ง' : 'Try Again'
          }}</Button>
        </div>
      </div>

      <DialogFooter v-if="uploadStatus === 'idle' && !uploading">
        <Button variant="outline" @click="handleClose"> {{ t('common.cancel') }} </Button>
        <Button @click="handleUpload" :disabled="!isValid">
          <Upload class="w-4 h-4 mr-2" />
          {{ t('services.itHelp.kb.uploadBtn') }}
        </Button>
      </DialogFooter>
      <DialogFooter v-else-if="uploadStatus === 'success'">
        <Button @click="handleClose" class="w-full sm:w-auto">{{ t('common.close') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
