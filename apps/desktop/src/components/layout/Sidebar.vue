<script setup lang="ts">
import { cn } from '@/lib/utils';
import { Home, Package, Settings, Truck, Users } from 'lucide-vue-next';
import { useRoute } from 'vue-router';

const route = useRoute();

const menuItems = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Queue & Booking', path: '/queue', icon: Truck },
  { name: 'Suppliers', path: '/suppliers', icon: Package },
  { name: 'Users', path: '/users', icon: Users },
  { name: 'Settings', path: '/settings', icon: Settings },
];
</script>

<template>
  <aside class="w-64 bg-card border-r border-border min-h-screen flex flex-col">
    <div class="h-12 px-6 border-b border-border flex items-center justify-center">
      <!-- Logo Placeholder -->
      <h1
        class="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
      >
        Admin Panel
      </h1>
    </div>

    <nav class="flex-1 p-4 space-y-1">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        :class="
          cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200',
            route.path === item.path && 'bg-primary/10 text-primary font-medium shadow-sm'
          )
        "
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span>{{ item.name }}</span>
      </router-link>
    </nav>

    <div class="p-4 border-t border-border">
      <p class="text-xs text-center text-muted-foreground">Version 0.0.1</p>
    </div>
  </aside>
</template>
