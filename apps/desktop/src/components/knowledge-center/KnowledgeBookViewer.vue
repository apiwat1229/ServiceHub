<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import api from '@/services/api';
import { knowledgeBooksApi, type KnowledgeBook } from '@/services/knowledge-books';
import VueOfficePptx from '@vue-office/pptx';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Presentation,
} from 'lucide-vue-next';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VuePdfEmbed from 'vue-pdf-embed';

const { t } = useI18n();

const props = defineProps<{
  open: boolean;
  book: KnowledgeBook | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const isFullscreen = ref(false);
const fileBlobUrl = ref('');
const loading = ref(false);
const currentPage = ref(1);
const pageCount = ref(0);

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
      .catch((err) => console.error('Failed to track view', err));
  } catch (error) {
    console.error('Failed to load document:', error);
  } finally {
    loading.value = false;
  }
}

// Navigation Logic
function nextPage() {
  if (props.book?.fileType === 'pdf') {
    if (currentPage.value < pageCount.value) {
      currentPage.value++;
    }
  } else if (props.book?.fileType === 'pptx') {
    // PPTX Logic: Scroll container
    navigatePptx('next');
  }
}

function prevPage() {
  if (props.book?.fileType === 'pdf') {
    if (currentPage.value > 1) {
      currentPage.value--;
    }
  } else if (props.book?.fileType === 'pptx') {
    navigatePptx('prev');
  }
}

function navigatePptx(direction: 'next' | 'prev') {
  const wrapper = document.querySelector('.pptx-preview-wrapper');
  if (!wrapper) return;

  const slides = wrapper.children;
  if (slides.length === 0) return;

  // Set total pages if not set (rough estimate based on DOM, assuming loaded)
  if (pageCount.value === 0) pageCount.value = slides.length;

  if (direction === 'next' && currentPage.value < slides.length) {
    currentPage.value++;
  } else if (direction === 'prev' && currentPage.value > 1) {
    currentPage.value--;
  }

  // Scroll to slide
  const targetIndex = currentPage.value - 1;
  const targetSlide = slides[targetIndex] as HTMLElement;
  if (targetSlide) {
    targetSlide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }
}

// PDF specific handlers
function handlePdfLoaded(pdf: any) {
  // vue-pdf-embed 2.x passes the document proxy
  pageCount.value = pdf.numPages;
}

// Setup PPTX hacks after render
function onPptxRendered() {
  // Wait for DOM
  nextTick(() => {
    const wrapper = document.querySelector('.pptx-preview-wrapper');
    if (wrapper) {
      // Count slides
      pageCount.value = wrapper.children.length;
    }
  });
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
      :class="`p-0 gap-0 ${isFullscreen ? 'max-w-full h-screen' : 'max-w-5xl max-h-[90vh]'}`"
      hide-close
    >
      <DialogTitle class="sr-only">{{ book?.title }}</DialogTitle>
      <DialogDescription class="sr-only">Viewing eBook: {{ book?.title }}</DialogDescription>
      <div class="flex flex-col h-full">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 pr-12 border-b bg-background z-30">
          <div class="flex-1">
            <h3 class="font-semibold">{{ book?.title }}</h3>
            <p v-if="book?.author" class="text-sm text-muted-foreground">by {{ book.author }}</p>
          </div>

          <!-- Navigation Controls (Center) -->
          <div class="flex items-center gap-4 mr-4" v-if="pageCount > 0">
            <Button variant="outline" size="icon" @click="prevPage" :disabled="currentPage <= 1">
              <ChevronLeft class="w-4 h-4" />
            </Button>
            <span class="text-sm font-medium min-w-[3rem] text-center">
              {{ currentPage }} / {{ pageCount }}
            </span>
            <Button
              variant="outline"
              size="icon"
              @click="nextPage"
              :disabled="currentPage >= pageCount"
            >
              <ChevronRight class="w-4 h-4" />
            </Button>
          </div>

          <div class="flex items-center gap-2">
            <Button variant="ghost" size="icon" @click="handleDownload">
              <Download class="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" @click="toggleFullscreen">
              <Maximize2 v-if="!isFullscreen" class="w-4 h-4" />
              <Minimize2 v-else class="w-4 h-4" />
            </Button>
          </div>
        </div>

        <!-- Document Viewer -->
        <div
          class="flex-1 overflow-hidden bg-muted/10 relative h-full flex flex-col items-center justify-center"
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

          <div class="h-full w-full overflow-hidden relative">
            <!-- PDF Viewer -->
            <div
              v-if="book?.fileType === 'pdf' && fileUrl"
              class="h-full w-full overflow-auto flex justify-center p-4"
            >
              <VuePdfEmbed
                :source="fileUrl"
                :page="currentPage"
                class="shadow-lg max-h-full w-auto max-w-full object-contain"
                @loaded="handlePdfLoaded"
              />
            </div>

            <!-- PPTX Viewer -->
            <div
              v-else-if="book?.fileType === 'pptx' && fileUrl"
              class="h-full w-full pptx-slide-mode"
            >
              <VueOfficePptx :src="fileUrl" @rendered="onPptxRendered" class="w-full h-full" />
            </div>

            <!-- Fallback -->
            <div v-else-if="!loading" class="text-center py-20 px-4 w-full">
              <div class="max-w-md mx-auto space-y-4">
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
      </div>
    </DialogContent>
  </Dialog>
</template>

<style>
/* CSS Hacks for Slide Mode in PPTX */
.pptx-slide-mode .vue-office-pptx {
  height: 100% !important;
  width: 100% !important;
  overflow: hidden !important;
}

.pptx-slide-mode .vue-office-pptx-main {
  height: 100% !important;
  width: 100% !important;
  overflow: hidden !important;
}

.pptx-slide-mode .pptx-preview-wrapper {
  display: flex !important;
  flex-direction: row !important;
  overflow-x: hidden !important; /* Hide scrollbar, use buttons */
  overflow-y: hidden !important;
  height: 100% !important;
  width: 100% !important;
  scroll-behavior: smooth !important;
  align-items: center !important;
  background-color: #525659 !important; /* Dark background like PDF viewers */
}

/* Individual Slides */
.pptx-slide-mode .pptx-preview-wrapper > div {
  flex: 0 0 100% !important; /* Full width */
  height: 100% !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  margin: 0 !important;
  padding: 20px !important; /* Padding around slide */
  box-sizing: border-box !important;
}

/* Inner Slide Content Scale */
.pptx-slide-mode .pptx-preview-wrapper > div > div {
  max-width: 100% !important;
  max-height: 100% !important;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
}
</style>
