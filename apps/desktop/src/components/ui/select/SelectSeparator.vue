<script setup lang="ts">
import { cn } from '@/lib/utils';
import { SelectSeparator, type SelectSeparatorProps } from 'radix-vue';

const props = defineProps<SelectSeparatorProps & { class?: string }>();
</script>

<template>
  <SelectSeparator :class="cn('-mx-1 my-1 h-px bg-muted', props.class)" v-bind="props">
    <slot />
  </SelectSeparator>
</template>
