<script lang="ts" setup>
import { cn } from '@/lib/utils';
import { RangeCalendarHeading, type RangeCalendarHeadingProps, useForwardProps } from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<RangeCalendarHeadingProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <RangeCalendarHeading :class="cn('text-sm font-medium', props.class)" v-bind="forwardedProps">
    <slot />
  </RangeCalendarHeading>
</template>
