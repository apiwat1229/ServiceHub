<script setup lang="ts">
import { cn } from '@/lib/utils';
import { AvatarImage, type AvatarImageProps } from 'reka-ui';

const props = defineProps<AvatarImageProps & { class?: string }>();
</script>

<template>
  <AvatarImage v-bind="props" :class="cn('aspect-square h-full w-full', props.class)" />
</template>
