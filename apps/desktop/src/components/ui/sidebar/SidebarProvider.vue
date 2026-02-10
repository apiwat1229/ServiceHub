<script setup lang="ts">
import { onMounted, onUnmounted, provide, ref } from 'vue';

const props = defineProps<{
  defaultOpen?: boolean;
}>();

const MOBILE_BREAKPOINT = 768;

const open = ref(props.defaultOpen ?? true);
const isMobile = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT;
  if (isMobile.value) {
    open.value = false;
  }
};

const toggleSidebar = () => {
  open.value = !open.value;
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

provide('sidebar', {
  open,
  isMobile,
  toggleSidebar,
});
</script>

<template>
  <div class="group/sidebar-wrapper flex h-full w-full has-[[data-variant=inset]]:bg-sidebar">
    <slot />
  </div>
</template>
