<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Contract } from '@/services/contracts';
import { AlertTriangle, CheckCircle2, DollarSign, FileText } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  contracts: Contract[];
}>();

const totalContracts = computed(() => props.contracts.length);

const activeContracts = computed(() => props.contracts.filter((c) => c.status === 'Active').length);

const expiringSoon = computed(() => props.contracts.filter((c) => c.status === 'Expiring').length);

const totalValue = computed(() =>
  props.contracts.reduce((sum, c) => sum + (c.status === 'Active' ? c.cost : 0), 0)
);

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(val);
};
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Total Contracts</CardTitle>
        <FileText class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ totalContracts }}</div>
        <p class="text-xs text-muted-foreground">Across all departments</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Active Value</CardTitle>
        <DollarSign class="h-4 w-4 text-emerald-600" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ formatCurrency(totalValue) }}</div>
        <p class="text-xs text-muted-foreground">Total active contract types</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Active Status</CardTitle>
        <CheckCircle2 class="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ activeContracts }}</div>
        <p class="text-xs text-muted-foreground">Currently valid contracts</p>
      </CardContent>
    </Card>

    <Card :class="expiringSoon > 0 ? 'border-amber-200 bg-amber-50/30' : ''">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Expiring Soon</CardTitle>
        <AlertTriangle
          class="h-4 w-4"
          :class="expiringSoon > 0 ? 'text-amber-600' : 'text-muted-foreground'"
        />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold" :class="expiringSoon > 0 ? 'text-amber-700' : ''">
          {{ expiringSoon }}
        </div>
        <p class="text-xs text-muted-foreground">Require attention within 60 days</p>
      </CardContent>
    </Card>
  </div>
</template>
