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
import { useSidebarMenu } from '@/composables/useSidebarMenu';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { ChevronRight, LogOut, MoreVertical, Settings, User as UserIcon } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Global variable defined in vite.config.ts
const appVersion = __APP_VERSION__;
// ... existing code ...

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { menuGroups } = useSidebarMenu();

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

    <!-- Navigation Scroll Area -->
    <nav class="flex-1 px-3 py-2 space-y-6 overflow-y-auto scrollbar-hide">
      <div v-for="(group, index) in menuGroups" :key="index" class="space-y-1">
        <div class="px-3">
          <h4
            class="text-[0.625rem] font-bold text-muted-foreground uppercase tracking-widest py-2"
          >
            {{ group.title }}
          </h4>
        </div>

        <div class="space-y-0.5">
          <template v-for="item in group.items" :key="item.path">
            <!-- Parent Item -->
            <router-link
              :to="item.path"
              :class="
                cn(
                  'group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all',
                  route.path === item.path || (item.children && route.path.startsWith(item.path))
                    ? 'bg-primary/10 text-primary'
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
                      route.path === item.path ||
                        (item.children && route.path.startsWith(item.path))
                        ? 'text-primary'
                        : 'text-foreground/45 group-hover:text-primary'
                    )
                  "
                />
                <span class="tracking-tight">{{ item.name }}</span>
              </div>

              <ChevronRight
                v-if="item.children"
                :class="
                  cn(
                    'w-3.5 h-3.5 transition-transform duration-200',
                    route.path.startsWith(item.path) ? 'rotate-90' : 'opacity-40'
                  )
                "
              />
            </router-link>

            <!-- Sub Items -->
            <div
              v-if="item.children && route.path.startsWith(item.path)"
              class="mt-0.5 ml-4 pl-3 border-l border-border/60 space-y-0.5"
            >
              <router-link
                v-for="child in item.children"
                :key="child.path"
                :to="child.path"
                :class="
                  cn(
                    'group flex items-center gap-3 px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                    route.path === child.path || route.fullPath === child.path
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/60 hover:bg-accent/50 hover:text-foreground'
                  )
                "
              >
                <component
                  :is="child.icon"
                  :class="
                    cn(
                      'w-3.5 h-3.5',
                      route.path === child.path || route.fullPath === child.path
                        ? 'text-primary'
                        : 'text-foreground/40 group-hover:text-primary'
                    )
                  "
                />
                <span>{{ child.name }}</span>
              </router-link>
            </div>
          </template>
        </div>
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
        <span>v{{ appVersion }}</span>
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
