<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMyMachine } from '@/composables/useMyMachine';
import { AlertCircle, CheckCircle2, Clock, DollarSign, Wrench } from 'lucide-vue-next';
import { computed } from 'vue';

const { machines, repairs } = useMyMachine();

const totalCost = computed(() =>
  repairs.value.reduce((acc, curr) => acc + (Number(curr.totalCost) || 0), 0)
);
const totalRepairs = computed(() => repairs.value.length);
const activeMachines = computed(() => machines.value.filter((m) => m.status === 'Active').length);

const mostRepaired = computed(() => {
  const machineRepairCounts: Record<string, number> = {};
  repairs.value.forEach((r) => {
    machineRepairCounts[r.machineName] = (machineRepairCounts[r.machineName] || 0) + 1;
  });
  const sorted = Object.entries(machineRepairCounts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0] : null;
});

const recentRepairs = computed(() => repairs.value.slice(0, 5));

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(val);
};
</script>

<template>
  <div class="h-full overflow-y-auto pr-2 pb-8 space-y-6">
    <!-- Statistics Section (Help Desk Style) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card class="border-border/50 shadow-sm">
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Total Maintenance Cost</p>
              <h3 class="text-3xl font-bold mt-2">{{ formatCurrency(totalCost) }}</h3>
              <p class="text-xs text-muted-foreground mt-1">Total investment in repairs</p>
            </div>
            <div class="p-3 bg-emerald-50 rounded-lg">
              <DollarSign class="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border/50 shadow-sm">
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Active Machines</p>
              <h3 class="text-3xl font-bold mt-2">{{ activeMachines }} / {{ machines.length }}</h3>
              <p class="text-xs text-muted-foreground mt-1">Operational equipment</p>
            </div>
            <div class="p-3 bg-blue-50 rounded-lg">
              <CheckCircle2 class="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border/50 shadow-sm">
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Total Repairs</p>
              <h3 class="text-3xl font-bold mt-2">{{ totalRepairs }}</h3>
              <p class="text-xs text-muted-foreground mt-1">Maintenance logs recorded</p>
            </div>
            <div class="p-3 bg-purple-50 rounded-lg">
              <Wrench class="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border/50 shadow-sm">
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Critical Asset</p>
              <h3 class="text-xl font-bold mt-2 truncate max-w-[140px]">
                {{ mostRepaired ? mostRepaired[0] : '-' }}
              </h3>
              <p class="text-xs text-orange-600 mt-1">
                {{ mostRepaired ? `${mostRepaired[1]} repairs recorded` : 'No repairs' }}
              </p>
            </div>
            <div class="p-3 bg-orange-50 rounded-lg">
              <AlertCircle class="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Recent Activity Section -->
    <Card class="border-border/50 shadow-sm overflow-hidden">
      <CardHeader class="pb-3 border-b flex flex-row items-center justify-between space-y-0">
        <div class="space-y-1">
          <CardTitle class="text-xl font-bold">Recent Maintenance Logs</CardTitle>
          <p class="text-sm text-muted-foreground">Latest 5 repairs performed on systems.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          class="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold gap-1 text-xs"
        >
          View All Logs
          <Clock class="w-3 h-3" />
        </Button>
      </CardHeader>
      <CardContent class="p-0">
        <div class="divide-y divide-border/50">
          <div
            v-for="repair in recentRepairs"
            :key="repair.id"
            class="p-4 hover:bg-slate-50/80 transition-colors group flex items-center gap-4"
          >
            <!-- Icon -->
            <div
              class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-400 group-hover:text-blue-600 group-hover:border-blue-100 group-hover:bg-blue-50 transition-colors shadow-sm"
            >
              <Wrench class="w-5 h-5" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {{ repair.machineName }}
                </span>
                <span
                  class="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200"
                >
                  {{ machines.find((m) => m.id === repair.machineId)?.model || 'Standard' }}
                </span>
              </div>
              <div class="flex items-center gap-3 text-xs text-slate-500">
                <span class="truncate max-w-md">{{ repair.issue }}</span>
                <span class="text-slate-300">&bull;</span>
                <span
                  class="flex items-center gap-1 font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/50"
                >
                  <Clock class="w-3 h-3" />
                  {{ repair.date }}
                </span>
                <span
                  v-if="repair.technician"
                  class="flex items-center gap-1 text-slate-400 italic"
                >
                  Tech: {{ repair.technician }}
                </span>
              </div>
            </div>

            <!-- Value / Status -->
            <div class="flex items-center gap-4 flex-shrink-0">
              <div class="flex flex-col items-end gap-1">
                <div class="text-sm font-black text-slate-900">
                  {{ formatCurrency(Number(repair.totalCost)) }}
                </div>
                <Badge
                  variant="outline"
                  class="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0"
                  :class="
                    repair.totalCost > 10000
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  "
                >
                  {{ repair.totalCost > 10000 ? 'Major Service' : 'Routine' }}
                </Badge>
              </div>
            </div>
          </div>

          <div v-if="recentRepairs.length === 0" class="p-12 text-center">
            <div
              class="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3"
            >
              <Clock class="w-6 h-6 text-slate-300" />
            </div>
            <p class="text-slate-500 font-medium">No maintenance records found.</p>
            <p class="text-xs text-slate-400 mt-1">Logs will appear here once repairs are added.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
