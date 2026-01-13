<script lang="ts" setup>
import { reactiveOmit } from '@vueuse/core';
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-vue-next';
import type { ToasterProps } from 'vue-sonner';
import { Toaster as Sonner } from 'vue-sonner';

const props = defineProps<ToasterProps>();
const delegatedProps = reactiveOmit(props, 'toastOptions', 'position');
</script>

<template>
  <Sonner
    v-bind="delegatedProps"
    class="toaster group"
    :toast-options="{
      classes: {
        toast:
          'group toast group-[.toaster]:shadow-2xl border-0 !p-4 !rounded-xl !flex !items-center !justify-center',
        success: '!bg-green-600 !text-white !border-green-700',
        error: '!bg-red-600 !text-white !border-red-700',
        warning: '!bg-yellow-500 !text-white !border-yellow-600',
        info: '!bg-blue-600 !text-white !border-blue-700',
        description: '!text-white/90 font-medium',
        title: '!font-bold !text-white',
        actionButton: '!bg-white !text-black hover:!bg-white/90 font-bold',
        cancelButton: '!bg-white/20 !text-white hover:!bg-white/30',
        closeButton:
          '!bg-white !text-slate-900 !border-none !outline-none !ring-0 !opacity-100 !shadow-lg',
      },
    }"
  >
    <template #success-icon>
      <CircleCheckIcon class="size-5 text-white" />
    </template>
    <template #info-icon>
      <InfoIcon class="size-5 text-white" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="size-5 text-white" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="size-5 text-white" />
    </template>
    <template #loading-icon>
      <Loader2Icon class="size-5 text-white animate-spin" />
    </template>
    <template #close-icon>
      <XIcon class="size-3 text-slate-900" />
    </template>
  </Sonner>
</template>
