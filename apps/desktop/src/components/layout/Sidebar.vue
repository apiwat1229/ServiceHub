<script setup lang="ts">
import { useSidebarMenu } from '@/composables/useSidebarMenu';
import { cn } from '@/lib/utils';
import { useRoute } from 'vue-router';

const route = useRoute();
const { menuGroups } = useSidebarMenu();
</script>

<template>
  <aside class="hidden lg:flex w-64 h-full flex-col border-r bg-background">
    <nav class="flex-1 p-4 space-y-6 overflow-y-auto">
      <div v-for="(group, index) in menuGroups" :key="index">
        <h4 class="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {{ group.title }}
        </h4>
        <div class="space-y-1">
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            :class="
              cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                route.path === item.path
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            "
          >
            <component :is="item.icon" class="w-4 h-4" />
            <span>{{ item.name }}</span>
          </router-link>
        </div>
      </div>
    </nav>

    <div class="p-4">
      <p class="text-xs text-center text-muted-foreground">Version 0.0.1</p>
    </div>
  </aside>
</template>
