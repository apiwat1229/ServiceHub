<script setup lang="ts">
import { DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date';
import { computed } from 'vue';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-vue-next';

const props = defineProps<{
  modelValue?: string | null;
  class?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
}>();

const df = new DateFormatter('en-US', {
  dateStyle: 'medium',
});

const value = computed({
  get: () => (props.modelValue ? parseDate(props.modelValue) : null),
  set: (val) => emit('update:modelValue', val ? val.toString() : null),
});

const placeholder = computed(() => value.value || today(getLocalTimeZone()));
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="
          cn(
            'w-[140px] justify-start text-left font-normal h-10 px-3 border-slate-200 rounded-lg hover:bg-slate-50 transition-all no-drag',
            !value && 'text-muted-foreground',
            props.class
          )
        "
        style="-webkit-app-region: no-drag"
      >
        <CalendarIcon class="mr-2 h-4 w-4 text-blue-600" />
        <span class="text-[11px] font-black uppercase tracking-tight">
          {{ value ? df.format(value.toDate(getLocalTimeZone())) : 'Pick a date' }}
        </span>
      </Button>
    </PopoverTrigger>
    <PopoverContent
      class="w-auto p-0 border-slate-200 shadow-lg no-drag"
      style="-webkit-app-region: no-drag"
    >
      <Calendar v-model="value as any" initial-focus :placeholder="placeholder" />
    </PopoverContent>
  </Popover>
</template>
