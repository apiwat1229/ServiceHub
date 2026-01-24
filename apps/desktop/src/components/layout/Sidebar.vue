<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar/index';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useSidebarMenu } from '@/composables/useSidebarMenu';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import {
  ChevronRight,
  LogOut,
  MoreVertical,
  Search,
  Settings,
  User as UserIcon,
} from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { menuGroups } = useSidebarMenu();

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

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const userInitials = computed(() => {
  if (!authStore.user?.firstName) return 'U';
  return `${authStore.user.firstName.charAt(0)}${authStore.user.lastName ? authStore.user.lastName.charAt(0) : ''}`;
});
</script>

<template>
  <aside
    class="hidden lg:flex w-64 h-full flex-col border-r bg-card/40 backdrop-blur-xl transition-all duration-300"
  >
    <!-- Header/Logo Area (Optional, currently Navbar handles brand) -->

    <!-- Search Bar -->
    <div class="px-4 py-4 pt-6">
      <div class="relative group">
        <Search
          class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors"
        />
        <Input
          v-model="searchQuery"
          type="text"
          placeholder="Search menu..."
          class="pl-9 h-9 bg-background/50 border-border/40 focus:bg-background transition-all"
        />
      </div>
    </div>

    <!-- Navigation Scroll Area -->
    <nav class="flex-1 px-3 py-2 space-y-6 overflow-y-auto scrollbar-hide">
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
                  cn(
                    'w-4 h-4',
                    route.path === item.path
                      ? 'text-white'
                      : 'text-foreground/45 group-hover:text-primary'
                  )
                "
              />
              <span class="tracking-tight">{{ item.name }}</span>
            </div>

            <ChevronRight v-if="route.path === item.path" class="w-3.5 h-3.5 opacity-50" />
          </router-link>
        </div>
      </div>

      <!-- Empty State for Search -->
      <div
        v-if="filteredMenuGroups.length === 0"
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <Search class="w-8 h-8 text-muted-foreground/20 mb-3" />
        <p class="text-xs text-muted-foreground">No matches found</p>
      </div>
    </nav>

    <!-- Footer / User Profile Area -->
    <div class="mt-auto p-4 border-t border-border/40 bg-background/20">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            class="flex flex-row items-center w-full gap-3 p-2 rounded-lg hover:bg-accent/80 transition-all text-left group"
          >
            <Avatar
              class="shrink-0 w-9 h-9 border border-border/40 shadow-sm transition-transform group-hover:scale-105"
            >
              <AvatarImage :src="authStore.userAvatarUrl" />
              <AvatarFallback class="bg-primary/5 text-primary text-xs font-bold">
                {{ userInitials }}
              </AvatarFallback>
            </Avatar>

            <div class="flex flex-col flex-1 min-w-0">
              <span
                class="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors leading-tight"
              >
                {{ authStore.user?.displayName || authStore.user?.username || 'User' }}
              </span>
              <span
                class="text-[0.625rem] text-muted-foreground truncate uppercase tracking-wider font-bold leading-tight"
              >
                {{ authStore.user?.roleName || 'Administrator' }}
              </span>
            </div>

            <MoreVertical
              class="shrink-0 w-4 h-4 text-muted-foreground/50 group-hover:text-foreground"
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" class="w-56 mb-2">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="router.push('/profile')">
            <UserIcon class="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="router.push('/settings')">
            <Settings class="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleLogout" class="text-red-600 focus:text-red-600">
            <LogOut class="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div
        class="mt-4 pt-2 flex items-center justify-between text-[0.625rem] text-muted-foreground/50 font-bold uppercase tracking-widest px-2"
      >
        <span>YTRC CENTER</span>
        <span>v0.1.2</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
