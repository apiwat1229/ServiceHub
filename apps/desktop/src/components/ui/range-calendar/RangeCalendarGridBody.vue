<script lang="ts" setup>
import { cn } from '@/lib/utils';
import { RangeCalendarGridBody, type RangeCalendarGridBodyProps, useForwardProps } from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<RangeCalendarGridBodyProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <RangeCalendarGridBody :class="cn(props.class)" v-bind="forwardedProps">
    <slot />
  </RangeCalendarGridBody>
</template>
