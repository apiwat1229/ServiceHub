<script setup lang="ts">
import { Tabs, TabsContent } from '@/components/ui/tabs';
import RawMaterialPlanForm from './RawMaterialPlanForm.vue';
import RawMaterialPlanList from './RawMaterialPlanList.vue';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <div class="space-y-4">
    <Tabs
      :model-value="modelValue"
      @update:model-value="emit('update:modelValue', $event)"
      class="w-full"
    >
      <TabsContent value="list" class="mt-0 outline-none">
        <RawMaterialPlanList @create="emit('update:modelValue', 'create')" />
      </TabsContent>

      <TabsContent value="create" class="mt-0 outline-none">
        <RawMaterialPlanForm />
      </TabsContent>
    </Tabs>
  </div>
</template>

<style scoped>
/* Optional: Hide the default tabs highlight if custom styling is preferred */
</style>
