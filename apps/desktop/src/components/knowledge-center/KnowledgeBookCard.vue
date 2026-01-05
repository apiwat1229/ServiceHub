<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { KnowledgeBook } from '@/services/knowledge-books';
import { Calendar, Download, Eye, FileText, Presentation, Trash2, User } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  book: KnowledgeBook;
  canDelete?: boolean;
}>();

const emit = defineEmits<{
  view: [];
  download: [];
  delete: [];
}>();

const fileIcon = computed(() => {
  return props.book.fileType === 'pdf' ? FileText : Presentation;
});

const fileIconColor = computed(() => {
  return props.book.fileType === 'pdf' ? 'text-red-500' : 'text-orange-500';
});

const formattedDate = computed(() => {
  return new Date(props.book.createdAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});

const formattedSize = computed(() => {
  const mb = props.book.fileSize / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
});

const uploaderName = computed(() => {
  const uploader = props.book.uploader;
  if (!uploader) return t('services.itHelp.kb.unknownUploader');
  return (
    uploader.displayName ||
    `${uploader.firstName || ''} ${uploader.lastName || ''}`.trim() ||
    t('services.itHelp.kb.unknownUploader')
  );
});
</script>

<template>
  <Card class="hover:shadow-lg transition-shadow cursor-pointer group" @click="emit('view')">
    <CardHeader class="pb-3">
      <div class="flex items-start gap-3">
        <div class="p-3 rounded-lg bg-muted">
          <component :is="fileIcon" :class="['w-8 h-8', fileIconColor]" />
        </div>
        <div class="flex-1 min-w-0">
          <CardTitle class="text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {{ book.title }}
          </CardTitle>
          <Badge variant="secondary" class="mt-2">
            {{ book.category }}
          </Badge>
        </div>
      </div>
    </CardHeader>

    <CardContent class="pb-3">
      <CardDescription v-if="book.description" class="line-clamp-2">
        {{ book.description }}
      </CardDescription>
      <CardDescription v-else class="italic">
        {{ t('services.itHelp.kb.noDescription') }}
      </CardDescription>

      <div v-if="book.tags.length > 0" class="flex flex-wrap gap-1 mt-3">
        <Badge v-for="tag in book.tags.slice(0, 3)" :key="tag" variant="outline" class="text-xs">
          {{ tag }}
        </Badge>
        <Badge v-if="book.tags.length > 3" variant="outline" class="text-xs">
          +{{ book.tags.length - 3 }}
        </Badge>
      </div>
    </CardContent>

    <CardFooter class="flex-col items-start gap-3 pt-3 border-t">
      <div class="flex items-center gap-4 text-xs text-muted-foreground w-full">
        <div class="flex items-center gap-1">
          <Eye class="w-3 h-3" />
          <span>{{ book.views }}</span>
        </div>
        <div class="flex items-center gap-1">
          <Download class="w-3 h-3" />
          <span>{{ book.downloads }}</span>
        </div>
        <div class="flex items-center gap-1 ml-auto">
          <span>{{ formattedSize }}</span>
        </div>
      </div>

      <div class="flex items-center justify-between w-full text-xs text-muted-foreground">
        <div class="flex items-center gap-1">
          <User class="w-3 h-3" />
          <span>{{ uploaderName }}</span>
        </div>
        <div class="flex items-center gap-1">
          <Calendar class="w-3 h-3" />
          <span>{{ formattedDate }}</span>
        </div>
      </div>

      <div class="flex gap-2 w-full" @click.stop>
        <Button variant="default" size="sm" class="flex-1" @click="emit('view')">
          <Eye class="w-3 h-3 mr-1" />
          {{ t('navbar.home') === 'Home' ? 'View' : 'ดู' }}
        </Button>
        <Button variant="outline" size="sm" class="flex-1" @click="emit('download')">
          <Download class="w-3 h-3 mr-1" />
          {{ t('navbar.home') === 'Home' ? 'Download' : 'ดาวน์โหลด' }}
        </Button>
        <Button
          v-if="canDelete"
          variant="destructive"
          size="sm"
          class="px-2"
          @click="emit('delete')"
        >
          <Trash2 class="w-3 h-3" />
        </Button>
      </div>
    </CardFooter>
  </Card>
</template>
