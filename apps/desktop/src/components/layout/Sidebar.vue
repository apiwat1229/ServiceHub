<script setup lang="ts">
import { cn } from '@/lib/utils';
import {
  Activity,
  Bell,
  ClipboardCheck,
  Layers,
  LayoutDashboard,
  Shield,
  Truck,
  Users,
} from 'lucide-vue-next';
import { useRoute } from 'vue-router';

const route = useRoute();

const menuGroups = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'Roles & Permissions', path: '/admin/roles', icon: Shield },
      { name: 'Users Management', path: '/admin/users', icon: Users },
      { name: 'Suppliers', path: '/admin/suppliers', icon: Truck },
      { name: 'Rubber Types', path: '/admin/rubber-types', icon: Layers },
      { name: 'Notifications', path: '/admin/notifications', icon: Bell },
      { name: 'Approvals', path: '/admin/approvals', icon: ClipboardCheck },
    ],
  },
  {
    title: 'System',
    items: [{ name: 'Analytics', path: '/admin/analytics', icon: Activity }],
  },
];
</script>

<template>
  <aside class="w-64 h-full flex flex-col">
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
