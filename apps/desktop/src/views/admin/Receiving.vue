<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Cuplump from './Cuplump.vue';
import Uss from './Uss.vue';

const { t } = useI18n();
const activeTab = ref(localStorage.getItem('receiving-active-tab') || 'cuplump');

watch(activeTab, (newVal: string) => {
  localStorage.setItem('receiving-active-tab', newVal);
});
</script>

<template>
  <div class="h-full flex flex-col p-6 space-y-6 max-w-[1600px] mx-auto">
    <Tabs v-model="activeTab" class="w-full">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-foreground">
            {{ t('services.receiving.name') }}
          </h1>
        </div>

        <TabsList class="w-full md:w-auto">
          <TabsTrigger value="cuplump">
            {{ t('services.cuplump.name') }}
          </TabsTrigger>

          <TabsTrigger value="uss">
            {{ t('services.uss.name') || 'USS' }}
          </TabsTrigger>
        </TabsList>
      </div>

      <div class="mt-6">
        <TabsContent value="cuplump" class="m-0 border-none p-0 shadow-none">
          <Cuplump :embedded="true" />
        </TabsContent>
        <TabsContent value="uss" class="m-0 border-none p-0 shadow-none">
          <Uss :embedded="true" />
        </TabsContent>
      </div>
    </Tabs>
  </div>
</template>
