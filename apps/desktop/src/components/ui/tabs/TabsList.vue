<script setup lang="ts">
import { cn } from '@/lib/utils';
import { TabsList, type TabsListProps } from 'radix-vue';
import { type HTMLAttributes, computed } from 'vue';

const props = defineProps<TabsListProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <TabsList
    v-bind="delegatedProps"
    :class="
      cn(
        'inline-flex h-auto items-center justify-center rounded-xl bg-muted/40 p-1.5 text-muted-foreground border border-border/50 shadow-inner gap-1',
        props.class
      )
    "
  >
    <slot />
  </TabsList>
</template>
