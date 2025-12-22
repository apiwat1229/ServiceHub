<script setup lang="ts">
import { DropdownMenuGroup, type DropdownMenuGroupProps, useForwardProps } from 'reka-ui';

const props = defineProps<DropdownMenuGroupProps>();

const forwardedProps = useForwardProps(props);
</script>

<template>
  <DropdownMenuGroup v-bind="forwardedProps">
    <slot />
  </DropdownMenuGroup>
</template>
