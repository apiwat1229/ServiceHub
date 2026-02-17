<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { approvalsApi } from '@/services/approvals';
import { notificationsApi } from '@/services/notifications';
import { useAuthStore } from '@/stores/auth';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Bell, CheckCircle, ChevronRight, LayoutGrid, User } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

interface ServiceModule {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  gradient: string;
  shadow: string;
  route: string;
  permission?: string;
}

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const modules = computed<ServiceModule[]>(() => [
  // Services moved to sidebar
]);

const recentActivities = ref<any[]>([]);
const isLoadingActivities = ref(false);

const fetchRecentActivities = async () => {
  isLoadingActivities.value = true;
  try {
    const [approvalsRes, notificationsRes] = await Promise.all([
      approvalsApi.getAll({ status: 'PENDING' }),
      notificationsApi.getUnread(),
    ]);

    const activities: any[] = [];

    // Add Approvals
    if (Array.isArray(approvalsRes.data)) {
      approvalsRes.data.slice(0, 3).forEach((item: any) => {
        activities.push({
          id: `approval-${item.id}`,
          type: 'APPROVAL',
          title: item.requestType,
          description: `Requested by ${item.requester?.displayName || 'Unknown'}`,
          time: item.submittedAt,
          icon: CheckCircle,
          color: 'text-orange-500',
          route: `/approvals/${item.id}`,
        });
      });
    }

    // Add Notifications
    if (Array.isArray(notificationsRes.data)) {
      notificationsRes.data.slice(0, 3).forEach((item: any) => {
        activities.push({
          id: `notif-${item.id}`,
          type: 'NOTIFICATION',
          title: item.title,
          description: item.message,
          time: item.createdAt,
          icon: Bell,
          color: 'text-blue-500',
          route: item.actionUrl || '/my-notifications',
        });
      });
    }

    recentActivities.value = activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  } catch (error) {
    console.error('Failed to fetch recent activities:', error);
  } finally {
    isLoadingActivities.value = false;
  }
};

onMounted(() => {
  fetchRecentActivities();
});

const userInitials = () => {
  if (!authStore.user?.firstName) return 'U';
  return `${authStore.user.firstName.charAt(0)}${authStore.user.lastName ? authStore.user.lastName.charAt(0) : ''}`;
};

const visibleModules = computed(() => {
  return authStore.user
    ? modules.value.filter((m) => !m.permission || authStore.hasPermission(m.permission))
    : modules.value;
});
</script>

<template>
  <div class="min-h-full flex flex-col pt-4">
    <!-- Main Content Area -->
    <main class="flex-1 w-full px-6 md:px-8 pb-12">
      <!-- Welcome Header -->
      <div class="mb-10 flex items-end justify-between">
        <div>
          <h2 class="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            {{ t('admin.dashboard.title') || 'Dashboard' }}
          </h2>
          <p class="text-sm text-muted-foreground font-medium mt-1">
            {{ t('admin.dashboard.subtitle') || 'Manage and monitor your services in one place.' }}
          </p>
        </div>
      </div>

      <!-- User & Activity Summary -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <!-- User Profile Card -->
        <Card
          class="lg:col-span-1 overflow-hidden group border-border/40 shadow-sm transition-all hover:shadow-md"
        >
          <CardHeader class="pb-2">
            <CardTitle
              class="text-sm font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2"
            >
              <User class="w-4 h-4 text-primary" />
              {{ t('navbar.profile') }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-2">
            <div class="flex items-center gap-4">
              <Avatar
                class="h-16 w-16 rounded-2xl border-2 border-primary/10 transition-transform group-hover:scale-105 duration-500"
              >
                <AvatarImage :src="authStore.userAvatarUrl" :alt="authStore.user?.username || ''" />
                <AvatarFallback class="rounded-2xl bg-primary/5 text-primary text-xl font-bold">
                  {{ userInitials() }}
                </AvatarFallback>
              </Avatar>
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-bold text-foreground truncate">
                  {{ authStore.user?.displayName || authStore.user?.username }}
                </h3>
                <p class="text-sm text-muted-foreground font-medium truncate">
                  {{ authStore.user?.position || authStore.user?.role || 'User' }}
                </p>
                <div class="mt-2 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    class="text-[10px] h-5 px-2 bg-primary/5 text-primary border-primary/10"
                  >
                    {{ authStore.user?.department || 'General' }}
                  </Badge>
                </div>
              </div>
            </div>
            <div
              class="mt-6 pt-6 border-t border-border/40 flex items-center justify-between text-xs font-medium"
            >
              <div class="flex flex-col gap-1">
                <span class="text-muted-foreground">Session ID</span>
                <span class="text-foreground tracking-tight"
                  >{{ authStore.token?.substring(0, 12) }}...</span
                >
              </div>
              <Button
                variant="ghost"
                size="sm"
                class="h-8 text-primary hover:bg-primary/5"
                @click="router.push('/profile')"
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- Activities Card -->
        <Card class="lg:col-span-2 border-border/40 shadow-sm transition-all hover:shadow-md">
          <CardHeader class="pb-2 flex flex-row items-center justify-between">
            <CardTitle
              class="text-sm font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2"
            >
              <Activity class="w-4 h-4 text-primary" />
              {{ t('admin.dashboard.recentActivity') }}
            </CardTitle>
            <Badge
              v-if="recentActivities.length > 0"
              variant="secondary"
              class="text-[10px] h-5 px-2 font-bold animate-pulse"
            >
              LIVE
            </Badge>
          </CardHeader>
          <CardContent>
            <div v-if="isLoadingActivities" class="space-y-4 py-2">
              <div v-for="i in 3" :key="i" class="flex items-center gap-3 animate-pulse">
                <div class="w-10 h-10 rounded-xl bg-muted/50"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3 bg-muted/50 rounded w-1/4"></div>
                  <div class="h-3 bg-muted/50 rounded w-3/4"></div>
                </div>
              </div>
            </div>

            <div v-else-if="recentActivities.length > 0" class="divide-y divide-border/40">
              <div
                v-for="activity in recentActivities"
                :key="activity.id"
                class="group flex items-center gap-4 py-3 cursor-pointer first:pt-0 last:pb-0"
                @click="router.push(activity.route)"
              >
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:bg-primary/5 border border-transparent group-hover:border-primary/20"
                  :class="activity.color.replace('text-', 'bg-').replace('500', '50/10')"
                >
                  <component :is="activity.icon" class="w-5 h-5" :class="activity.color" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-0.5">
                    <h4
                      class="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate"
                    >
                      {{ activity.title }}
                    </h4>
                    <span
                      class="text-[10px] font-medium text-muted-foreground shrink-0 uppercase tracking-tighter ml-2"
                    >
                      {{ formatDistanceToNow(new Date(activity.time), { addSuffix: true }) }}
                    </span>
                  </div>
                  <p class="text-xs text-muted-foreground truncate">
                    {{ activity.description }}
                  </p>
                </div>
                <ChevronRight
                  class="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
                />
              </div>
            </div>

            <div
              v-else
              class="flex flex-col items-center justify-center py-8 text-center bg-muted/5 rounded-2xl border border-dashed border-border/40"
            >
              <Activity class="w-8 h-8 text-muted-foreground/20 mb-2" />
              <p class="text-xs font-medium text-muted-foreground">No recent activity recorded.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Services Section -->
      <div class="space-y-6">
        <div class="flex items-center gap-2">
          <LayoutGrid class="w-4 h-4 text-primary" />
          <h3 class="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
            Available Services
          </h3>
        </div>

        <!-- App Grid -->
        <div
          v-if="visibleModules.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <router-link
            v-for="module in visibleModules"
            :key="module.id"
            :to="module.route"
            class="group relative flex items-start p-5 rounded-3xl bg-card border border-border/50 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
          >
            <!-- Module Icon -->
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center mr-4 shrink-0 transition-transform duration-500 group-hover:scale-110 relative overflow-hidden"
              :class="module.color"
            >
              <div
                class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"
              ></div>
              <component :is="module.icon" class="w-7 h-7 text-white relative z-10" />
            </div>

            <!-- Module Info -->
            <div class="flex-1 min-w-0">
              <h4
                class="text-base font-bold text-foreground group-hover:text-primary transition-colors"
              >
                {{ module.title }}
              </h4>
              <p
                class="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium"
              >
                {{ module.description }}
              </p>
            </div>

            <!-- Action Arrow -->
            <div
              class="self-center ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
            >
              <ChevronRight class="w-5 h-5 text-primary" />
            </div>
          </router-link>
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-3xl border border-dashed border-border"
        >
          <div class="bg-card p-6 rounded-full mb-4 shadow-sm">
            <LayoutGrid class="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 class="text-lg font-bold text-foreground">No services found</h3>
          <p class="text-muted-foreground max-w-xs mx-auto text-sm font-medium">
            You don't have access to any modules yet or they are still being configured.
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
