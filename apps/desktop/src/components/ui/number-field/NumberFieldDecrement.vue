<script setup lang="ts">
import { cn } from '@/lib/utils';
import { Minus } from 'lucide-vue-next';
import { NumberFieldDecrement } from 'radix-vue';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <NumberFieldDecrement
    data-slot="decrement"
    :class="
      cn(
        'absolute left-0 top-1/2 -translate-y-1/2 p-3 disabled:cursor-not-allowed disabled:opacity-20 z-10',
        props.class
      )
    "
  >
    <slot>
      <Minus class="h-4 w-4" />
    </slot>
  </NumberFieldDecrement>
</template>
