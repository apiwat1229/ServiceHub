<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-vue-next';
import { computed, ref } from 'vue';

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const currentTime = computed(() => {
  return props.modelValue || '00:00';
});

const currentHour = computed(() => currentTime.value.split(':')[0] || '00');
const currentMinute = computed(() => currentTime.value.split(':')[1] || '00');

const selectHour = (h: string) => {
  emit('update:modelValue', `${h}:${currentMinute.value}`);
};

const selectMinute = (m: string) => {
  emit('update:modelValue', `${currentHour.value}:${m}`);
};
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="
          cn(
            'w-full justify-center text-center font-normal',
            !modelValue && 'text-muted-foreground'
          )
        "
      >
        <Clock class="mr-2 h-4 w-4 opacity-50" />
        {{ modelValue || '00:00' }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <div class="flex h-64">
        <div class="flex flex-col border-r">
          <div class="px-4 py-2 text-xs font-medium text-center border-b bg-muted/50">Hr</div>
          <div class="h-full w-16 overflow-y-auto">
            <div class="flex flex-col p-1">
              <Button
                v-for="h in hours"
                :key="h"
                variant="ghost"
                size="sm"
                :class="
                  cn(
                    'shrink-0',
                    currentHour === h &&
                      'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                  )
                "
                @click="selectHour(h)"
              >
                {{ h }}
              </Button>
            </div>
          </div>
        </div>
        <div class="flex flex-col">
          <div class="px-4 py-2 text-xs font-medium text-center border-b bg-muted/50">Min</div>
          <div class="h-full w-16 overflow-y-auto">
            <div class="flex flex-col p-1">
              <Button
                v-for="m in minutes"
                :key="m"
                variant="ghost"
                size="sm"
                :class="
                  cn(
                    'shrink-0',
                    currentMinute === m &&
                      'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                  )
                "
                @click="selectMinute(m)"
              >
                {{ m }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
