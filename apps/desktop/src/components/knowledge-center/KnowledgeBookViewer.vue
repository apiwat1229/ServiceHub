<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import api from '@/services/api';
import { knowledgeBooksApi, type KnowledgeBook } from '@/services/knowledge-books';
import { useElementSize } from '@vueuse/core';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Presentation,
  X,
} from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VuePdfEmbed from 'vue-pdf-embed';
import 'vue-pdf-embed/dist/styles/annotationLayer.css';
import 'vue-pdf-embed/dist/styles/textLayer.css';

const { t } = useI18n();

const props = defineProps<{
  open: boolean;
  book: KnowledgeBook | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  viewTracked: [bookId: string];
}>();

const isFullscreen = ref(false);
const fileBlobUrl = ref('');
const loading = ref(false);
const currentPage = ref(1);
const pageCount = ref(0);

const viewerContainer = ref<HTMLElement | null>(null);
const { width: containerWidth } = useElementSize(viewerContainer);

const fileUrl = computed(() => {
  return fileBlobUrl.value;
});

const downloadUrl = computed(() => {
  if (!props.book) return '';
  return knowledgeBooksApi.getDownloadUrl(props.book.id);
});

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

async function handleDownload() {
  if (!props.book) return;

  try {
    const response = await api.get(downloadUrl.value, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', props.book.fileName || 'download.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
  }
}

function handleClose() {
  isFullscreen.value = false;
  if (fileBlobUrl.value) {
    window.URL.revokeObjectURL(fileBlobUrl.value);
    fileBlobUrl.value = '';
  }
  emit('update:open', false);
}

// Load content with auth
async function loadContent() {
  if (!props.open || !props.book) return;
  if (props.book.fileType !== 'pdf' && props.book.fileType !== 'pptx') return;

  loading.value = true;
  currentPage.value = 1;
  pageCount.value = 0;

  try {
    const response = await api.get(knowledgeBooksApi.getFileUrl(props.book.id), {
      responseType: 'blob',
    });

    // Revoke old URL if it exists
    if (fileBlobUrl.value) {
      window.URL.revokeObjectURL(fileBlobUrl.value);
    }

    fileBlobUrl.value = window.URL.createObjectURL(new Blob([response.data]));

    // Track view
    knowledgeBooksApi
      .trackView(props.book.id)
      .then(() => {
        emit('viewTracked', props.book!.id);
      })
      .catch((err) => console.error('Failed to track view', err));
  } catch (error) {
    console.error('Failed to load document:', error);
  } finally {
    loading.value = false;
  }
}

// Navigation Logic
function nextPage() {
  if (currentPage.value < pageCount.value) {
    currentPage.value++;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

// PDF specific handlers
function handlePdfLoaded(pdf: any) {
  // vue-pdf-embed 2.x passes the document proxy
  pageCount.value = pdf.numPages;
}

// Watch both open and book to fix re-open bug
watch(
  [() => props.open, () => props.book],
  ([newOpen, newBook]) => {
    if (newOpen && newBook) {
      loadContent();
    }
  },
  { immediate: true }
);
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent
      :class="`p-0 gap-0 overflow-hidden ${isFullscreen ? 'max-w-full h-screen border-none' : 'max-w-5xl h-fit max-h-[90vh] shadow-2xl rounded-xl'}`"
      hide-close
    >
      <DialogTitle class="sr-only">{{ book?.title }}</DialogTitle>
      <DialogDescription class="sr-only">Viewing eBook: {{ book?.title }}</DialogDescription>
      <div
        class="flex flex-col overflow-hidden bg-background"
        :style="!isFullscreen ? 'height: min(85vh, fit-content)' : 'height: 100vh'"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between p-3 px-4 pr-12 border-b bg-background z-30 shadow-sm shrink-0"
        >
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold truncate text-sm sm:text-base">{{ book?.title }}</h3>
            <p v-if="book?.author" class="text-xs text-muted-foreground truncate">
              by {{ book.author }}
            </p>
          </div>

          <!-- Navigation Controls (Center) -->
          <div class="flex items-center gap-2 mr-4" v-if="pageCount > 0">
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              @click="prevPage"
              :disabled="currentPage <= 1"
            >
              <ChevronLeft class="w-4 h-4" />
            </Button>
            <div
              class="flex items-center bg-muted/50 px-3 py-1 rounded text-xs font-medium min-w-[3.5rem] justify-center"
            >
              {{ currentPage }} / {{ pageCount }}
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              @click="nextPage"
              :disabled="currentPage >= pageCount"
            >
              <ChevronRight class="w-4 h-4" />
            </Button>
          </div>

          <div class="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" class="h-8 w-8" @click="handleDownload">
              <Download class="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" class="h-8 w-8" @click="toggleFullscreen">
              <Maximize2 v-if="!isFullscreen" class="w-4 h-4" />
              <Minimize2 v-else class="w-4 h-4" />
            </Button>
            <div class="w-px h-4 bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              @click="handleClose"
            >
              <X class="w-4 h-4" />
            </Button>
          </div>
        </div>

        <!-- Document Viewer -->
        <div
          ref="viewerContainer"
          class="flex-1 overflow-auto bg-muted/20 relative w-full flex flex-col items-center justify-center"
        >
          <div
            v-if="loading"
            class="absolute inset-0 flex items-center justify-center bg-background/50 z-20"
          >
            <div class="flex flex-col items-center gap-2">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p class="text-sm text-muted-foreground font-medium">{{ t('common.loading') }}</p>
            </div>
          </div>

          <!-- PDF Viewer Wrapper -->
          <div
            v-if="(book?.fileType === 'pdf' || book?.fileType === 'pptx') && fileUrl"
            class="w-full flex items-center justify-center p-2 sm:p-4"
          >
            <div class="max-w-full bg-white shadow-xl ring-1 ring-black/5">
              <VuePdfEmbed
                :source="fileUrl"
                :page="currentPage"
                :text-layer="true"
                :annotation-layer="true"
                :width="containerWidth > 48 ? containerWidth - 48 : undefined"
                class="max-w-full"
                @loaded="handlePdfLoaded"
              />
            </div>
          </div>

          <!-- Fallback -->
          <div v-else-if="!loading" class="flex-1 flex items-center justify-center p-8 text-center">
            <div class="max-w-md space-y-4">
              <div
                class="p-4 rounded-full bg-orange-100 w-16 h-16 flex items-center justify-center mx-auto mb-6"
              >
                <Presentation class="w-8 h-8 text-orange-600" />
              </div>
              <h4 class="text-xl font-semibold">
                {{ t('services.itHelp.kb.pptxNotSupported') }}
              </h4>
              <p class="text-muted-foreground">
                {{ t('services.itHelp.kb.pptxNotSupportedDesc') }}
              </p>
              <div class="pt-4">
                <Button size="lg" @click="handleDownload" class="gap-2">
                  <Download class="w-5 h-5" />
                  {{ t('navbar.home') === 'Home' ? 'Download eBook' : 'ดาวน์โหลด eBook' }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
