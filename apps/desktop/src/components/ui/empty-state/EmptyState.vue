<script setup lang="ts">
import { Button } from '@/components/ui/button';

interface Props {
  icon?: any;
  title: string;
  description?: string;
  actionLabel?: string;
  action?: () => void;
}

defineProps<Props>();
</script>

<template>
  <div class="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
    <div v-if="icon" class="mb-4 p-4 bg-muted/50 rounded-full">
      <component :is="icon" class="w-12 h-12 text-muted-foreground" />
    </div>
    <h3 class="text-xl font-semibold mb-2">{{ title }}</h3>
    <p v-if="description" class="text-muted-foreground max-w-sm mb-6">
      {{ description }}
    </p>
    <Button v-if="actionLabel && action" @click="action">
      {{ actionLabel }}
    </Button>
  </div>
</template>
