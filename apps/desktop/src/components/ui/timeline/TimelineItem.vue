<script setup lang="ts">
import { cn } from '@/lib/utils';

interface Props {
  dotColor?: string;
  dotClass?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  dotColor: 'bg-blue-500',
  dotClass: '',
  class: '',
});
</script>

<template>
  <div
    :class="
      cn(
        'relative flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500',
        props.class
      )
    "
  >
    <!-- Dot -->
    <div
      :class="
        cn(
          'absolute -left-[26px] w-6 h-6 rounded-full ring-4 ring-background flex items-center justify-center text-white transition-all hover:scale-125 hover:ring-2',
          dotColor,
          dotClass
        )
      "
    >
      <slot name="dot" />
    </div>

    <!-- Content -->
    <div class="flex-1">
      <slot />
    </div>
  </div>
</template>
