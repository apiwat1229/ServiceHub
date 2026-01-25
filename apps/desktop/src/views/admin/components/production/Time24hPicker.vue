<script setup lang="ts">
import { Input } from '@/components/ui/input';

const props = defineProps<{
  modelValue?: string;
  disabled?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="relative w-full">
    <Input
      type="time"
      :value="modelValue"
      @input="handleInput"
      :disabled="disabled"
      class="h-8 py-0 px-2 text-center font-mono text-sm appearance-none bg-white border-muted focus-visible:ring-1"
    />
  </div>
</template>

<style scoped>
/* Optional: remove the clock icon if it interferes with centering, 
   but usually it's helpful for UX. Keeping it for now. */
input[type='time']::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
}
input[type='time']::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}
</style>
