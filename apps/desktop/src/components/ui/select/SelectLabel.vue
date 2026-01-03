<script setup lang="ts">
import { cn } from '@/lib/utils';
import { SelectLabel, type SelectLabelProps } from 'radix-vue';

const props = defineProps<SelectLabelProps & { class?: string }>();
</script>

<template>
  <SelectLabel :class="cn('py-1.5 pl-8 pr-2 text-sm font-semibold', props.class)" v-bind="props">
    <slot />
  </SelectLabel>
</template>
