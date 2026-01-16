<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNum } from '@/lib/utils';
import { poolsApi, type Pool } from '@/services/pools';
import { Database as DatabaseIcon, LayoutGrid, RefreshCw, TrendingUp } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';
import PoolCard from './components/PoolCard.vue';
import PoolDistributionCharts from './components/PoolDistributionCharts.vue';
import PoolManagementDialog from './components/PoolManagementDialog.vue';
import QaHeader from './components/QaHeader.vue';

const pools = ref<Pool[]>([]);
const isLoading = ref(false);
const isDialogOpen = ref(false);
const selectedPool = ref<Pool | null>(null);

const handlePoolClick = (pool: Pool) => {
  selectedPool.value = pool;
  isDialogOpen.value = true;
};

const fetchData = async () => {
  isLoading.value = true;
  try {
    const data = await poolsApi.getAll();
    if (data.length === 0) {
      // Auto seed if no pools
      await poolsApi.seed();
      pools.value = await poolsApi.getAll();
    } else {
      pools.value = data;
    }
  } catch (error) {
    console.error('Failed to fetch pools:', error);
    toast.error('Failed to load pool data');
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchData);

// Stats Calculations
const stats = computed(() => {
  const total = pools.value.length;
  const open = pools.value.filter(
    (p) => p.status === 'open' && (p._count?.items || 0) === 0
  ).length;
  const filling = pools.value.filter(
    (p) => p.status === 'open' && (p._count?.items || 0) > 0
  ).length;
  const closed = pools.value.filter((p) => p.status === 'closed').length;
  const empty = pools.value.filter((p) => p.status === 'empty').length;

  const netWeightTotal = pools.value.reduce((sum, p) => sum + (p.totalWeight || 0), 0);
  const totalCapacity = pools.value.length * 260000; // 260 Ton per pool

  const remaining = Math.max(0, totalCapacity - netWeightTotal);
  const utilization = totalCapacity > 0 ? (netWeightTotal / totalCapacity) * 100 : 0;

  // Grade breakdown
  const grades = ['AA', 'A', 'B', 'C', 'D'];
  const gradeBreakdown = grades.reduce(
    (acc, grade) => {
      acc[grade] =
        pools.value
          .filter((p) => p.grade === grade)
          .reduce((sum, p) => sum + (p.totalWeight || 0), 0) / 1000;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    total,
    open,
    filling,
    closed,
    empty,
    netWeight: netWeightTotal / 1000, // Ton
    capacity: totalCapacity / 1000, // Ton
    remaining: remaining / 1000, // Ton
    utilization,
    gradeBreakdown,
  };
});

const getGradeColor = (grade: string) => {
  switch (grade.toUpperCase()) {
    case 'AA':
      return 'text-emerald-500';
    case 'A':
      return 'text-sky-500';
    case 'B':
      return 'text-indigo-500';
    case 'C':
      return 'text-amber-500';
    default:
      return 'text-slate-400';
  }
};
</script>

<template>
  <div class="p-6 space-y-6 bg-slate-50/30 min-h-screen custom-scrollbar overflow-y-auto">
    <QaHeader active-tab="cuplump-pool" />
    <!-- Top Stats Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Pool Counts -->
      <Card class="bg-white border-slate-200/60 shadow-sm">
        <CardHeader class="p-4 pb-2 border-b border-slate-50 flex flex-row items-center gap-2">
          <div class="p-1.5 bg-emerald-50 rounded-lg">
            <LayoutGrid class="w-4 h-4 text-emerald-600" />
          </div>
          <CardTitle class="text-[10px] font-black uppercase tracking-widest text-slate-400"
            >Total Pools</CardTitle
          >
        </CardHeader>
        <CardContent class="p-4 py-3">
          <div class="grid grid-cols-4 gap-2">
            <div class="text-center">
              <div class="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-tighter">
                Open
              </div>
              <div class="text-lg font-black text-emerald-600 leading-none">{{ stats.open }}</div>
            </div>
            <div class="text-center">
              <div class="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-tighter">
                Filling
              </div>
              <div class="text-lg font-black text-blue-600 leading-none">{{ stats.filling }}</div>
            </div>
            <div class="text-center">
              <div class="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-tighter">
                Closed
              </div>
              <div class="text-lg font-black text-slate-900 leading-none">{{ stats.closed }}</div>
            </div>
            <div class="text-center">
              <div class="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-tighter">
                Empty
              </div>
              <div class="text-lg font-black text-slate-300 leading-none">{{ stats.empty }}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        class="bg-white border-slate-200/60 shadow-sm col-span-1 lg:col-span-2 p-5 py-6 overflow-hidden"
      >
        <div class="flex items-start h-full">
          <!-- Net Weight SECTION -->
          <div class="flex flex-col shrink-0 pr-8 lg:pr-12">
            <div class="flex items-center gap-2 mb-2 h-7">
              <div class="p-1 px-1.5 bg-blue-50 rounded-md">
                <TrendingUp class="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span
                class="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap"
                >Net Weight</span
              >
            </div>
            <div class="text-3xl font-black text-blue-600 tracking-tight leading-none">
              {{ formatNum(stats.netWeight) }}
            </div>
          </div>

          <!-- Vertical Divider -->
          <div class="w-px h-12 bg-slate-100 flex-shrink-0 mt-2"></div>

          <!-- Weight By Grade SECTION -->
          <div class="flex-1 flex flex-col items-end ml-8 lg:ml-12 min-w-0">
            <div class="flex items-center gap-2 mb-2 h-7">
              <div class="p-1 px-1.5 bg-emerald-50 rounded-md">
                <DatabaseIcon class="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                >Weight By Grade</span
              >
            </div>

            <div class="flex items-center gap-6 lg:gap-10 overflow-x-auto no-scrollbar">
              <div
                v-for="(weight, grade) in stats.gradeBreakdown"
                :key="grade"
                class="flex flex-col items-end shrink-0"
              >
                <span
                  :class="[
                    'text-[10px] font-black uppercase leading-none mb-1.5',
                    getGradeColor(grade as string),
                  ]"
                  >{{ grade }}</span
                >
                <div class="flex items-baseline gap-1">
                  <span
                    :class="['text-lg font-black tracking-tighter', getGradeColor(grade as string)]"
                    >{{ formatNum(weight, 1) }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Utilization -->
      <Card class="bg-white border-slate-200/60 shadow-sm flex flex-col">
        <div class="grid grid-cols-2 divide-x divide-slate-50 border-b border-slate-50">
          <div class="p-3 px-4 flex flex-col items-center text-center">
            <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Capacity
            </div>
            <div class="text-md font-black text-slate-900 leading-none">
              {{ formatNum(stats.capacity, 1) }}
            </div>
          </div>
          <div class="p-3 px-4 flex flex-col items-center text-center">
            <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Remaining
            </div>
            <div class="text-md font-black text-slate-900 leading-none">
              {{ formatNum(stats.remaining) }}
            </div>
          </div>
        </div>
        <div class="p-3 px-4 flex flex-col justify-center bg-slate-50/30">
          <div class="flex items-center justify-between mb-1.5">
            <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Utilization
            </div>
            <div class="text-[11px] font-black text-emerald-600">
              {{ formatNum(stats.utilization, 1) }}%
            </div>
          </div>
          <Progress
            :model-value="stats.utilization"
            class="h-1.5 bg-white border border-slate-100"
            indicator-class="bg-emerald-500"
          />
        </div>
      </Card>
    </div>

    <!-- Data Visualization Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PoolDistributionCharts :pools="pools" />
    </div>

    <!-- Pool Overview Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-black text-slate-900 tracking-tight">Pool Overview</h2>
          <div
            class="px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-bold text-emerald-600 uppercase tracking-wider"
          >
            {{ pools.filter((p) => p.status !== 'empty').length }} / {{ pools.length }} ACTIVE
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="fetchData"
            :disabled="isLoading"
            class="h-8 text-[10px] font-bold uppercase tracking-wider border-slate-200"
          >
            <RefreshCw class="w-3 h-3 mr-2" :class="isLoading && 'animate-spin'" />
            Refresh
          </Button>
        </div>
      </div>

      <div
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pb-8"
      >
        <PoolCard
          v-for="pool in pools"
          :key="pool.id"
          :pool="pool"
          @refresh="fetchData"
          @click="handlePoolClick"
        />
      </div>
    </div>

    <!-- Management Dialog -->
    <PoolManagementDialog v-model:open="isDialogOpen" :pool="selectedPool" @refresh="fetchData" />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.1);
}
</style>
