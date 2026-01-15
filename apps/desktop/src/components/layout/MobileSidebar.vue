<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useSidebarMenu } from '@/composables/useSidebarMenu';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-vue-next';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { menuGroups } = useSidebarMenu();
const isOpen = ref(false);

// Close sidebar on route change
watch(
  () => route.path,
  () => {
    isOpen.value = false;
  }
);
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetTrigger as-child>
      <Button variant="ghost" size="icon" class="lg:hidden shrink-0">
        <Menu class="w-5 h-5" />
        <span class="sr-only">Toggle navigation menu</span>
      </Button>
    </SheetTrigger>
    <SheetContent side="left" class="w-64 p-0">
      <SheetHeader class="px-4 py-4 border-b">
        <SheetTitle class="text-left">Menu</SheetTitle>
      </SheetHeader>
      <nav class="flex-1 p-4 space-y-6 overflow-y-auto">
        <div v-for="(group, index) in menuGroups" :key="index">
          <h4
            class="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2"
          >
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
      <div class="p-4 border-t mt-auto">
        <p class="text-xs text-center text-muted-foreground">Version 0.0.1</p>
      </div>
    </SheetContent>
  </Sheet>
</template>
