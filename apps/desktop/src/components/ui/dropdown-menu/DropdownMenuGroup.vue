<script setup lang="ts">
import { DropdownMenuGroup, type DropdownMenuGroupProps, useForwardProps } from 'radix-vue';

const props = defineProps<DropdownMenuGroupProps>();

const forwardedProps = useForwardProps(props);
</script>

<template>
  <DropdownMenuGroup v-bind="forwardedProps">
    <slot />
  </DropdownMenuGroup>
</template>
