<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <div class="h-screen flex flex-col items-center justify-center p-4 text-center">
    <div class="mb-8 p-6 bg-red-100 rounded-full dark:bg-red-900/20">
      <FileQuestion class="w-16 h-16 text-red-600 dark:text-red-400" />
    </div>
    <h1 class="text-4xl font-bold mb-4 tracking-tight">Page Not Found</h1>
    <p class="text-lg text-muted-foreground mb-8 max-w-md">
      The page you are looking for does not exist or has been moved.
    </p>
    <div class="flex gap-4">
      <Button variant="outline" @click="router.back()"> Go Back </Button>
      <Button @click="router.push('/')"> Go Home </Button>
    </div>
  </div>
</template>
