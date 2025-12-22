<script setup lang="ts">
import AppearanceSettings from '@/components/settings/AppearanceSettings.vue';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar/index';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Home,
  LayoutDashboard,
  LogOut,
  RotateCw,
  Settings,
  User,
} from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const showThemeSettings = ref(false);

const props = defineProps<{
  showBrand?: boolean;
}>();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const userInitials = () => {
  if (!authStore.user?.firstName) return 'U';
  return `${authStore.user.firstName.charAt(0)}${authStore.user.lastName ? authStore.user.lastName.charAt(0) : ''}`;
};

const pageTitle = computed(() => {
  const name = route.name?.toString() || '';
  if (name === 'Home') return 'Dashboard';
  if (name === 'AdminDashboard') return 'Admin Panel';
  return name;
});
</script>

<template>
  <header
    class="h-12 border-b border-border bg-card/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-10"
  >
    <div class="flex items-center gap-4">
      <!-- Navigation Controls -->
      <div class="flex items-center gap-1 border-r border-border pr-4 mr-2">
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="router.back()" title="Back">
          <ArrowLeft class="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          @click="router.forward()"
          title="Forward"
        >
          <ArrowRight class="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="router.go(0)" title="Refresh">
          <RotateCw class="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="router.push('/')" title="Home">
          <Home class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Centered Title -->
    <div
      class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
    >
      <span class="text-lg text-foreground font-semibold">
        {{ pageTitle }}
      </span>
    </div>

    <div class="flex items-center gap-4">
      <!-- Bell Notification -->
      <Button variant="ghost" size="icon" class="h-8 w-8">
        <Bell class="w-5 h-5 text-muted-foreground" />
      </Button>

      <!-- User Profile -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" class="relative h-8 w-8">
            <Avatar class="h-8 w-8 rounded-md">
              <AvatarImage
                :src="authStore.user?.avatar || ''"
                :alt="authStore.user?.username || ''"
              />
              <AvatarFallback class="rounded-md">{{ userInitials() }}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56" align="end">
          <DropdownMenuLabel class="font-normal">
            <div class="flex flex-col space-y-1">
              <p class="text-sm font-medium leading-none">
                {{ authStore.user?.displayName || authStore.user?.username }}
              </p>
              <p class="text-xs leading-none text-muted-foreground">
                {{ authStore.user?.email }}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem v-if="authStore.user?.role === 'admin'" @click="router.push('/admin')">
            <LayoutDashboard class="mr-2 h-4 w-4" />
            <span>Admin Panel</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <User class="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem @click="showThemeSettings = true">
            <Settings class="mr-2 h-4 w-4" />
            <span>Theme Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleLogout" class="text-red-600 focus:text-red-600">
            <LogOut class="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- Window Controls -->
      <div class="flex items-center gap-1 border-l pl-2 ml-2">
        <Button variant="ghost" size="icon" class="h-8 w-8" title="Minimize">
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4"
          >
            <path
              d="M2.25 7.5H12.75"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </Button>
        <Button variant="ghost" size="icon" class="h-8 w-8" title="Maximize">
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="w-3.5 h-3.5"
          >
            <path
              d="M2.5 2.5H12.5V12.5H2.5V2.5Z"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 hover:bg-red-500 hover:text-white"
          title="Close"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4"
          >
            <path
              d="M3.75 3.75L11.25 11.25"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M11.25 3.75L3.75 11.25"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </Button>
      </div>
    </div>
    <!-- Theme Settings Dialog -->
    <Dialog v-model:open="showThemeSettings">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Theme Settings</DialogTitle>
          <DialogDescription>Customize the appearance of the application.</DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <AppearanceSettings />
        </div>
      </DialogContent>
    </Dialog>
  </header>
</template>
