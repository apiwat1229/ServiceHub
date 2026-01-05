<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { knowledgeBooksApi } from '@/services/knowledge-books';
import { FileText, Presentation, Upload, X } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';

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

const categories = [
  'Getting Started',
  'Tutorials',
  'Troubleshooting',
  'System Guides',
  'Best Practices',
];

const fileIcon = computed(() => {
  if (!file.value) return FileText;
  return file.value.type.includes('pdf') ? FileText : Presentation;
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

function handleDragLeave() {
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
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];

  if (!allowedTypes.includes(selectedFile.type)) {
    console.error('Invalid file type: Only PDF and PowerPoint files are allowed');
    alert('Invalid file type: Only PDF and PowerPoint files are allowed');
    return;
  }

  if (selectedFile.size > 50 * 1024 * 1024) {
    console.error('File too large: Maximum file size is 50MB');
    alert('File too large: Maximum file size is 50MB');
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
  uploadProgress.value = 0;

  try {
    await knowledgeBooksApi.upload({
      file: file.value,
      title: title.value,
      description: description.value,
      category: category.value,
      author: author.value,
      tags: tags.value,
    });

    console.log('eBook uploaded successfully');
    toast.success('eBook uploaded successfully!');

    emit('uploaded');
    handleClose();
  } catch (error: any) {
    console.error('Upload failed:', error);
    toast.error(error.response?.data?.message || 'Failed to upload eBook');
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
  emit('update:open', false);
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Upload eBook</DialogTitle>
        <DialogDescription>
          Upload a PDF or PowerPoint file to the Knowledge Center
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- File Upload Zone -->
        <div
          v-if="!file"
          class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
          :class="isDragging ? 'border-primary bg-primary/5' : 'border-border'"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <Upload class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p class="text-sm font-medium mb-2">Drag and drop your file here</p>
          <p class="text-xs text-muted-foreground mb-4">or</p>
          <Button variant="outline" @click="() => fileInput?.click()">Browse Files</Button>
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            accept=".pdf,.ppt,.pptx"
            @change="handleFileSelect"
          />
          <p class="text-xs text-muted-foreground mt-4">Supported: PDF, PowerPoint (Max 50MB)</p>
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
          <Label for="title">Title *</Label>
          <Input id="title" v-model="title" placeholder="Enter eBook title" :disabled="uploading" />
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <Label for="description">Description</Label>
          <Textarea
            id="description"
            v-model="description"
            placeholder="Enter description (optional)"
            :disabled="uploading"
            rows="3"
          />
        </div>

        <!-- Category & Author -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="category">Category *</Label>
            <Select v-model="category" :disabled="uploading">
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="cat in categories" :key="cat" :value="cat">
                  {{ cat }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="author">Author</Label>
            <Input
              id="author"
              v-model="author"
              placeholder="Author name (optional)"
              :disabled="uploading"
            />
          </div>
        </div>

        <!-- Tags -->
        <div class="space-y-2">
          <Label for="tags">Tags</Label>
          <div class="flex gap-2">
            <Input
              id="tags"
              v-model="tagInput"
              placeholder="Add tags..."
              :disabled="uploading"
              @keydown.enter.prevent="addTag"
            />
            <Button variant="outline" @click="addTag" :disabled="uploading"> Add </Button>
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

      <DialogFooter>
        <Button variant="outline" @click="handleClose" :disabled="uploading"> Cancel </Button>
        <Button @click="handleUpload" :disabled="!isValid || uploading">
          <Upload class="w-4 h-4 mr-2" />
          {{ uploading ? 'Uploading...' : 'Upload' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
