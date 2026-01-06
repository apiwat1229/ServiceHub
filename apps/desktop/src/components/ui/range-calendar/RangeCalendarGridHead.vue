<script lang="ts" setup>
import { cn } from '@/lib/utils';
import { RangeCalendarGridHead, type RangeCalendarGridHeadProps, useForwardProps } from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<RangeCalendarGridHeadProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <RangeCalendarGridHead :class="cn(props.class)" v-bind="forwardedProps">
    <slot />
  </RangeCalendarGridHead>
</template>
