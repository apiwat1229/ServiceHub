<script setup lang="ts">
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';
import AppearanceSettings from '@/components/settings/AppearanceSettings.vue';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { usePermissions } from '@/composables/usePermissions';
import approvalsApi from '@/services/approvals';
import { bookingsApi } from '@/services/bookings';
import { notificationsApi } from '@/services/notifications';
import { socketService } from '@/services/socket';
import { useAuthStore } from '@/stores/auth';
import type { NotificationDto } from '@my-app/types';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  Home,
  LayoutDashboard,
  LogOut,
  RotateCw,
  Settings,
  User,
} from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const showThemeSettings = ref(false);
const isTicketPreviewOpen = ref(false);
const previewTicket = ref<any>(null);
const isErrorDialogOpen = ref(false);
const errorDialogMessage = ref('');
const isCloseConfirmOpen = ref(false);

const { isAdmin, hasPermission } = usePermissions();

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
  if (name === 'ProjectTimeline') return t('services.projectTimeline.name');
  return name;
});

const { t } = useI18n();

// --- Notifications Logic ---
const unreadNotifications = ref<NotificationDto[]>([]);
const unreadCount = computed(() => unreadNotifications.value.length);

const pendingApprovalCount = ref(0);
// let pollingInterval: NodeJS.Timeout;

const fetchPendingApprovals = async () => {
  if (!authStore.isAuthenticated) return;
  try {
    // Check if user has permission first to avoid unnecessary calls
    if (isAdmin.value || hasPermission('approvals:approve')) {
      const res = await approvalsApi.getAll({ status: 'PENDING' });
      // Assuming res.data is the array
      pendingApprovalCount.value = res.data?.length || 0;
    }
  } catch (error) {
    console.error('Failed to fetch pending approvals', error);
  }
};

const fetchUnreadNotifications = async () => {
  if (!authStore.isAuthenticated) return;
  try {
    const res = await notificationsApi.getUnread();
    unreadNotifications.value = res.data || [];
  } catch (error) {
    console.error('Failed to fetch unread notifications', error);
  }
};

const handleMarkAsRead = async (id: string) => {
  try {
    await notificationsApi.markAsRead(id);
    unreadNotifications.value = unreadNotifications.value.filter((n) => n.id !== id);
  } catch (error) {
    console.error('Failed to mark as read', error);
  }
};

const handleViewAll = () => {
  router.push('/my-notifications');
};

// Window Controls
const handleMinimize = () => {
  (window as any).ipcRenderer?.window?.minimize();
};

const handleMaximize = () => {
  (window as any).ipcRenderer?.window?.maximize();
};

const handleClose = () => {
  isCloseConfirmOpen.value = true;
};

const confirmClose = () => {
  (window as any).ipcRenderer?.window?.close();
  isCloseConfirmOpen.value = false;
};

const handleNotificationClick = async (notification: NotificationDto) => {
  await handleMarkAsRead(notification.id);

  if (notification.actionUrl && notification.actionUrl.startsWith('/bookings')) {
    let bookingId = '';
    if (notification.actionUrl.includes('?code=')) {
      bookingId = notification.actionUrl.split('?code=')[1];
    } else {
      const parts = notification.actionUrl.split('/');
      bookingId = parts[parts.length - 1];
    }

    if (bookingId) {
      let booking;
      try {
        const isUuid = bookingId.length > 30;
        if (isUuid) {
          booking = await bookingsApi.getById(bookingId);
        } else {
          const bookings = await bookingsApi.getAll({ code: bookingId });
          if (bookings && bookings.length > 0) {
            booking = bookings[0];
          }
        }
      } catch (error) {
        console.warn('Failed to fetch booking preview:', error);
      }

      if (booking) {
        setTimeout(() => {
          previewTicket.value = {
            date: booking.date || booking.bookingDate,
            startTime: booking.startTime || booking.slot || booking.timeSlot,
            truckType: booking.truckType,
            truckRegister: booking.truckRegister || booking.truckLicensePlate,
            rubberType: booking.rubberType,
            supplierCode: booking.supplierCode || booking.supplier?.code,
            supplierName: booking.supplierName || booking.supplier?.name,
            bookingCode: booking.bookingCode,
            queueNo: booking.queueNo || booking.queueNumber,
            recorder:
              booking.recorder ||
              booking.createdBy?.displayName ||
              booking.createdBy?.username ||
              'System',
            status: booking.status,
            deletedAt: booking.deletedAt,
          };
          isTicketPreviewOpen.value = true;
        }, 100);
        return;
      } else {
        if (
          notification.title.toLowerCase().includes('cancel') ||
          notification.message.toLowerCase().includes('cancel')
        ) {
          setTimeout(() => {
            errorDialogMessage.value = 'Booking was cancelled and data is no longer available.';
            isErrorDialogOpen.value = true;
          }, 100);
          return;
        }
      }
    }
  }

  if (notification.actionUrl && !notification.actionUrl.startsWith('/bookings')) {
    router.push(notification.actionUrl);
  } else if (!notification.actionUrl) {
    router.push('/my-notifications');
  }
};

// Moved accessors to setup scope, init in onMounted below

// Ensure we join the room if user data loads late
// Logic moved to SocketService.connect() 'connect' listener to avoid race conditions
/* if (authStore.user?.id) {
    socketService.joinRoom(authStore.user.id);
  } */

const lastNotification = ref<{ title: string; message: string; time: number } | null>(null);
const instanceId = Math.random().toString(36).substring(7);

console.log(`[Navbar] Mounted instance: ${instanceId}`);

const handleNotificationSocket = (newNotification: any) => {
  console.log(`[Navbar ${instanceId}] Received socket notification:`, newNotification);

  // Frontend Deduplication Safeguard
  // Prevent duplicate notifications (same title/message) within 2 seconds, even if IDs differ
  const now = Date.now();
  if (lastNotification.value) {
    const isSameContent =
      lastNotification.value.title === newNotification.title &&
      lastNotification.value.message === newNotification.message;
    const isRecent = now - lastNotification.value.time < 2000; // 2000ms window

    if (isSameContent && isRecent) {
      console.warn('[Navbar] Duplicate notification suppressed:', newNotification.title);
      return;
    }
  }

  // Update last notification tracker
  lastNotification.value = {
    title: newNotification.title,
    message: newNotification.message,
    time: now,
  };

  // Add new notification to list
  if (!unreadNotifications.value.some((n) => n.id === newNotification.id)) {
    unreadNotifications.value.unshift(newNotification);

    // Show Toast with type-based styling
    const getToastStyles = (type: string) => {
      const styles = {
        SUCCESS: {
          textColor: 'text-green-600',
          iconColor: '!text-green-600',
          buttonBg: 'bg-green-600',
          buttonHover: 'hover:bg-green-700',
        },
        APPROVE: {
          textColor: 'text-teal-600',
          iconColor: '!text-teal-600',
          buttonBg: 'bg-teal-600',
          buttonHover: 'hover:bg-teal-700',
        },
        ERROR: {
          textColor: 'text-red-600',
          iconColor: '!text-red-600',
          buttonBg: 'bg-red-600',
          buttonHover: 'hover:bg-red-700',
        },
        WARNING: {
          textColor: 'text-yellow-600',
          iconColor: '!text-yellow-600',
          buttonBg: 'bg-yellow-600',
          buttonHover: 'hover:bg-yellow-700',
        },
        INFO: {
          textColor: 'text-blue-600',
          iconColor: '!text-blue-600',
          buttonBg: 'bg-blue-600',
          buttonHover: 'hover:bg-blue-700',
        },
        REQUEST: {
          textColor: 'text-purple-600',
          iconColor: '!text-purple-600',
          buttonBg: 'bg-purple-600',
          buttonHover: 'hover:bg-purple-700',
        },
      };
      return styles[type as keyof typeof styles] || styles.INFO;
    };

    const style = getToastStyles(newNotification.type);

    const toastOptions = {
      description: newNotification.message,
      duration: 5000, // 5 seconds
      unstyled: false, // Keep Sonner's base styling
      action: {
        label: 'View',
        onClick: () => handleNotificationClick(newNotification),
      },
      classNames: {
        toast: 'bg-white border-2 shadow-lg',
        title: `font-semibold ${style.textColor}`,
        description: 'text-gray-600',
        actionButton: `${style.buttonBg} ${style.buttonHover} text-white border-0 font-medium !important`,
        icon: `w-6 h-6 ${style.iconColor}`,
      },
    };

    switch (newNotification.type) {
      case 'SUCCESS':
      case 'APPROVE':
        toast.success(newNotification.title, toastOptions);
        break;
      case 'ERROR':
        toast.error(newNotification.title, toastOptions);
        break;
      case 'WARNING':
        toast.warning(newNotification.title, toastOptions);
        break;
      case 'INFO':
      case 'REQUEST':
      default:
        toast.info(newNotification.title, toastOptions);
        break;
    }
  }

  // Refresh pending approvals if notification relates to approvals
  if (
    newNotification.sourceApp === 'APPROVALS' ||
    newNotification.type === 'REQUEST' ||
    newNotification.type === 'APPROVE' ||
    newNotification.title.toLowerCase().includes('approval')
  ) {
    fetchPendingApprovals();
  }
};

onMounted(() => {
  fetchUnreadNotifications();
  fetchPendingApprovals();
  socketService.connect();
  socketService.on('notification', handleNotificationSocket);
  window.addEventListener('refresh-approvals-count', fetchPendingApprovals);
});

watch(
  () => authStore.user,
  (newUser: any) => {
    if (newUser?.id) {
      socketService.joinRoom(newUser.id);
    }
  }
);

onUnmounted(() => {
  // if (pollingInterval) clearInterval(pollingInterval);
  socketService.off('notification', handleNotificationSocket);
  window.removeEventListener('refresh-approvals-count', fetchPendingApprovals);
});
</script>

<template>
  <header
    class="h-12 border-b border-border bg-card/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50 draggable-region"
  >
    <div class="flex items-center gap-4 no-drag">
      <MobileSidebar />
      <!-- Navigation Controls -->
      <div class="flex items-center gap-1">
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

    <div class="flex items-center gap-4 no-drag">
      <!-- Notifications -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="relative group">
            <Bell
              class="w-5 h-5 transition-transform duration-500 ease-in-out"
              :class="{ 'animate-bell-ring text-primary': unreadCount > 0 }"
            />
            <span
              v-if="unreadCount > 0"
              class="absolute top-1 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[0.625rem] font-bold text-destructive-foreground animate-in zoom-in duration-300"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-80 p-0" align="end" side="bottom" :side-offset="8">
          <div class="flex items-center justify-between p-4 border-b">
            <h4 class="font-semibold leading-none">Notifications</h4>
            <span class="text-xs text-muted-foreground" v-if="unreadCount > 0">
              {{ unreadCount }} unread
            </span>
          </div>

          <div class="max-h-[300px] overflow-y-auto">
            <div v-if="unreadCount === 0" class="p-8 text-center text-muted-foreground">
              <Bell class="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p class="text-sm">No new notifications</p>
            </div>

            <template v-else>
              <DropdownMenuItem
                v-for="notification in unreadNotifications.slice(0, 5)"
                :key="notification.id"
                class="flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-muted/50 border-b last:border-0"
                @click="handleNotificationClick(notification)"
              >
                <div class="flex items-start justify-between w-full gap-2">
                  <div class="flex items-center gap-2 flex-1 overflow-hidden">
                    <div class="h-2 w-2 min-w-[8px] rounded-full bg-primary"></div>
                    <span class="font-semibold text-sm line-clamp-1 break-all">{{
                      notification.title
                    }}</span>
                  </div>
                  <span
                    class="text-[0.625rem] text-muted-foreground whitespace-nowrap flex-shrink-0"
                  >
                    {{ formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) }}
                  </span>
                </div>
                <p class="text-xs text-muted-foreground line-clamp-2 pl-4">
                  {{ notification.message }}
                </p>
              </DropdownMenuItem>
            </template>
          </div>

          <div class="p-2 border-t bg-muted/20">
            <Button variant="ghost" size="sm" class="w-full text-xs" @click="handleViewAll">
              View all notifications
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- User Profile -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" class="relative h-8 w-8 rounded-full">
            <Avatar class="h-8 w-8 rounded-full">
              <AvatarImage :src="authStore.userAvatarUrl" :alt="authStore.user?.username || ''" />
              <AvatarFallback class="rounded-full">{{ userInitials() }}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56" align="end" side="bottom" :side-offset="8">
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

          <DropdownMenuItem
            v-if="isAdmin || hasPermission('approvals:approve')"
            @click="router.push('/approvals')"
            class="justify-between"
          >
            <div class="flex items-center">
              <CheckCircle2 class="mr-2 h-4 w-4" />
              <span>{{ t('navbar.approvals') }}</span>
            </div>
            <span
              v-if="pendingApprovalCount > 0"
              class="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-100 px-1 text-xs font-bold text-red-600"
            >
              {{ pendingApprovalCount > 99 ? '99+' : pendingApprovalCount }}
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem v-if="isAdmin" @click="router.push('/admin')">
            <LayoutDashboard class="mr-2 h-4 w-4" />
            <span>{{ t('navbar.adminPanel') }}</span>
          </DropdownMenuItem>

          <DropdownMenuItem @click="router.push('/profile')">
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
        <LanguageSwitcher />
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          title="Minimize"
          @click="handleMinimize"
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
              d="M2.25 7.5H12.75"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          title="Maximize"
          @click="handleMaximize"
        >
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
          @click="handleClose"
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

    <!-- Ticket Preview Dialog -->
    <TicketDialog v-model:open="isTicketPreviewOpen" :ticket="previewTicket" />

    <!-- Error/Info Dialog (For Missing Data) -->
    <AlertDialog v-model:open="isErrorDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Data Unavailable</AlertDialogTitle>
          <AlertDialogDescription>
            {{ errorDialogMessage }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction @click="isErrorDialogOpen = false">OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Close Confirmation Dialog -->
    <AlertDialog v-model:open="isCloseConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Close Application?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to close the application? Any unsaved changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="confirmClose">Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </header>
</template>

<style scoped>
/* Draggable window region */
.draggable-region {
  -webkit-app-region: drag;
  app-region: drag;
}

/* Make interactive elements clickable */
.no-drag,
.no-drag * {
  -webkit-app-region: no-drag;
  app-region: no-drag;
}

@keyframes bell-ring {
  0%,
  100% {
    transform: rotate(0);
  }
  15% {
    transform: rotate(15deg);
  }
  30% {
    transform: rotate(-15deg);
  }
  45% {
    transform: rotate(10deg);
  }
  60% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(5deg);
  }
  85% {
    transform: rotate(-5deg);
  }
}

.animate-bell-ring {
  animation: bell-ring 2s cubic-bezier(0.19, 1, 0.22, 1) infinite;
  transform-origin: top center;
}
</style>
