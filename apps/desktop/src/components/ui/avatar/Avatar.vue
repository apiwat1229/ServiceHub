<script setup lang="ts">
import { cn } from '@/lib/utils';
import { AvatarRoot, type AvatarRootProps, useForwardProps } from 'reka-ui';

const props = defineProps<AvatarRootProps & { class?: string }>();

const forwarded = useForwardProps(props);
</script>

<template>
  <AvatarRoot
    v-bind="forwarded"
    :class="cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', props.class)"
  >
    <slot />
  </AvatarRoot>
</template>
