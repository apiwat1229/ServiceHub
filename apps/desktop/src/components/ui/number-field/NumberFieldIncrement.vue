<script setup lang="ts">
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-vue-next';
import { NumberFieldIncrement } from 'radix-vue';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <NumberFieldIncrement
    data-slot="increment"
    :class="
      cn(
        'absolute right-0 top-1/2 -translate-y-1/2 p-3 disabled:cursor-not-allowed disabled:opacity-20 z-10',
        props.class
      )
    "
  >
    <slot>
      <Plus class="h-4 w-4" />
    </slot>
  </NumberFieldIncrement>
</template>
