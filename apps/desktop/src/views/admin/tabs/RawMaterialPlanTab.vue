<script setup lang="ts">
import RawMaterialPlanForm from './RawMaterialPlanForm.vue';
import RawMaterialPlanList from './RawMaterialPlanList.vue';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <div class="space-y-4">
    <!-- View: Plan List -->
    <div v-if="modelValue === 'list'">
      <RawMaterialPlanList @create="emit('update:modelValue', 'create')" />
    </div>

    <!-- View: Create/Edit Plan -->
    <div v-else-if="modelValue === 'create'">
      <RawMaterialPlanForm />
    </div>
  </div>
</template>

<style scoped>
/* Optional: Hide the default tabs highlight if custom styling is preferred */
</style>
