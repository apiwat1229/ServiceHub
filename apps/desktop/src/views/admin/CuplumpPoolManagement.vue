<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import PlcControlPanel from './components/PlcControlPanel.vue';

const { t } = useI18n();
</script>

<template>
  <div class="p-6 h-full flex flex-col w-full overflow-hidden">
    <!-- Content Area -->
    <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <PlcControlPanel />
    </div>
  </div>
</template>
