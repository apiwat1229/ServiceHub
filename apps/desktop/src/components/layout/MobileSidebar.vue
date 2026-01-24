<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar/index';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useSidebarMenu } from '@/composables/useSidebarMenu';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { ChevronRight, Menu, Search } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const authStore = useAuthStore();
const { menuGroups } = useSidebarMenu();
const isOpen = ref(false);

const searchQuery = ref('');

const filteredMenuGroups = computed(() => {
  if (!searchQuery.value) return menuGroups.value;

  const query = searchQuery.value.toLowerCase();
  return menuGroups.value
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) || group.title.toLowerCase().includes(query)
      ),
    }))
    .filter((group) => group.items.length > 0);
});

const userInitials = computed(() => {
  if (!authStore.user?.firstName) return 'U';
  return `${authStore.user.firstName.charAt(0)}${authStore.user.lastName ? authStore.user.lastName.charAt(0) : ''}`;
});

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
    <SheetContent side="left" class="w-72 p-0 flex flex-col h-full bg-card/95 backdrop-blur-xl">
      <SheetHeader class="px-6 py-6 border-b border-border/40">
        <SheetTitle class="text-left flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs"
          >
            YT
          </div>
          <span>YTRC CENTER</span>
        </SheetTitle>
      </SheetHeader>

      <!-- Search in Mobile -->
      <div class="px-4 py-4">
        <div class="relative">
          <Search
            class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          />
          <Input
            v-model="searchQuery"
            type="text"
            placeholder="Search menu..."
            class="pl-9 h-9 bg-background/50 border-border/40"
          />
        </div>
      </div>

      <nav class="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
        <div v-for="(group, index) in filteredMenuGroups" :key="index" class="space-y-1">
          <div class="px-3">
            <h4
              class="text-[0.625rem] font-bold text-muted-foreground uppercase tracking-widest py-2"
            >
              {{ group.title }}
            </h4>
          </div>

          <div class="space-y-0.5">
            <router-link
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              :class="
                cn(
                  'group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all',
                  route.path === item.path
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 bg-gradient-to-r from-primary to-primary/80'
                    : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                )
              "
            >
              <div class="flex items-center gap-3">
                <component
                  :is="item.icon"
                  :class="
                    cn('w-4 h-4', route.path === item.path ? 'text-white' : 'text-foreground/45')
                  "
                />
                <span class="tracking-tight">{{ item.name }}</span>
              </div>
              <ChevronRight v-if="route.path === item.path" class="w-3.5 h-3.5 opacity-50" />
            </router-link>
          </div>
        </div>
      </nav>

      <div class="mt-auto p-4 border-t border-border/40 bg-background/20">
        <div class="flex items-center gap-3 p-2 rounded-lg bg-accent/50 border border-border/40">
          <Avatar class="w-9 h-9 border border-border/40 shadow-sm">
            <AvatarImage :src="authStore.userAvatarUrl" />
            <AvatarFallback class="bg-primary/5 text-primary text-xs font-bold">{{
              userInitials
            }}</AvatarFallback>
          </Avatar>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate text-foreground">
              {{ authStore.user?.displayName || authStore.user?.username || 'User' }}
            </p>
            <p
              class="text-[0.625rem] text-muted-foreground truncate uppercase tracking-wider font-bold"
            >
              {{ authStore.user?.roleName || 'Administrator' }}
            </p>
          </div>
        </div>

        <div
          class="mt-4 flex items-center justify-between text-[0.5rem] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] px-1"
        >
          <span>Version 0.1.2</span>
          <span>© 2026</span>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
