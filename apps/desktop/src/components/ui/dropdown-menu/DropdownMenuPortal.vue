<script setup lang="ts">
import { DropdownMenuPortal, type DropdownMenuPortalProps } from 'reka-ui';

const props = defineProps<DropdownMenuPortalProps>();
</script>

<template>
  <DropdownMenuPortal v-bind="props">
    <slot />
  </DropdownMenuPortal>
</template>
