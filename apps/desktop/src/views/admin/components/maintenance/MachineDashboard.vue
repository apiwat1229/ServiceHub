<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMaintenance } from '@/composables/useMaintenance';
import { cn } from '@/lib/utils';
import type { ApexOptions } from 'apexcharts';
import { Check, ChevronsUpDown } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import VueApexCharts from 'vue3-apexcharts';

import { useThemeStore } from '@/stores/theme'; // Import theme store

const themeStore = useThemeStore(); // Initialize store
const { t, locale } = useI18n();

const emit = defineEmits<{
  (e: 'view-detail', id: string): void;
}>();

const { machines, repairs } = useMaintenance();

const viewMachineDetail = (id: string) => {
  emit('view-detail', id);
};

// --- Data Aggregation for Charts ---

const selectedMachineIds = ref<string[]>(['all']);
const open = ref(false);
const topCount = ref('10');

// Map global theme names to Hex palettes for ApexCharts
const themePalettes: Record<string, string[]> = {
  zinc: ['#18181b', '#27272a', '#3f3f46', '#52525b', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7'],
  teal: ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1', '#e0f2f1', '#f0fdfa'],
  blue: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#f8fafc'], // Primary Blue
  green: ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7', '#f0fdf4', '#f7fee7'],
  orange: ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#fff7ed', '#fffaf0'],
  rose: ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6', '#fff1f2', '#fffceb'],
  violet: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff', '#faf5ff'],
  pink: ['#db2777', '#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3', '#fdf2f8', '#fff1f2'],
  // Fallbacks
  indigo: ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#eef2ff', '#faf5ff'],
  emerald: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5', '#f0fdf4'],
  amber: ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7', '#fffbeb', '#fffdf0'],
  slate: ['#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9', '#f8fafc', '#f8fafc'],
};

// Helper to get current palette
const currentPalette = computed(() => {
  const color = themeStore.themeColor || 'blue';
  return themePalettes[color] || themePalettes.blue;
});

// Helper to get primary color hex (approximate for single line)
const primaryHex = computed(() => currentPalette.value[0]);

// 1. Cost Trend (Monthly)
const costTrendChart = computed(() => {
  const months = [
    t('services.maintenance.dashboard.months.jan'),
    t('services.maintenance.dashboard.months.feb'),
    t('services.maintenance.dashboard.months.mar'),
    t('services.maintenance.dashboard.months.apr'),
    t('services.maintenance.dashboard.months.may'),
    t('services.maintenance.dashboard.months.jun'),
    t('services.maintenance.dashboard.months.jul'),
    t('services.maintenance.dashboard.months.aug'),
    t('services.maintenance.dashboard.months.sep'),
    t('services.maintenance.dashboard.months.oct'),
    t('services.maintenance.dashboard.months.nov'),
    t('services.maintenance.dashboard.months.dec'),
  ];
  const isAll = selectedMachineIds.value.includes('all') || selectedMachineIds.value.length === 0;

  const series = [];

  if (isAll) {
    const data = new Array(12).fill(0);
    repairs.value.forEach((r) => {
      const date = new Date(r.date);
      if (!isNaN(date.getTime())) {
        data[date.getMonth()] += Number(r.totalCost) || 0;
      }
    });
    series.push({ name: t('services.maintenance.dashboard.totalMaintenanceCost'), data });
  } else {
    selectedMachineIds.value.forEach((id) => {
      const machine = machines.value.find((m) => m.id === id);
      const machineName = machine
        ? machine.name
        : t('services.maintenance.dashboard.unknownMachine');
      const data = new Array(12).fill(0);

      const machineRepairs = repairs.value.filter((r) => r.machineId === id);
      machineRepairs.forEach((r) => {
        const date = new Date(r.date);
        if (!isNaN(date.getTime())) {
          data[date.getMonth()] += Number(r.totalCost) || 0;
        }
      });
      series.push({ name: machineName, data });
    });
  }

  return {
    series,
    options: {
      chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false } },
      colors: [primaryHex.value], // Use primary theme color
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [0, 100],
        },
      },
      dataLabels: {
        enabled: true,
        offsetY: -6,
        style: {
          fontSize: '10px',
          colors: ['#64748b'],
        },
        background: { enabled: false },
        formatter: (val: number) =>
          val > 0
            ? val.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
            : '',
      },
      markers: { size: 4, hover: { size: 6 } },
      xaxis: { categories: months, labels: { style: { colors: '#94a3b8', fontSize: '10px' } } },
      yaxis: {
        labels: {
          style: { colors: '#94a3b8', fontSize: '10px' },
          formatter: (v: number) =>
            v.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
        },
      },
      legend: { show: true, position: 'top', horizontalAlign: 'right' },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
      tooltip: { theme: 'light' },
    } as ApexOptions,
  };
});

// 2. Cost Trend (Monthly) - logic continues...

// 3. Top 5 Costly Machines
const topCostlyChart = computed(() => {
  const machineCosts: { [key: string]: number } = {};
  repairs.value.forEach((r) => {
    machineCosts[r.machineName] = (machineCosts[r.machineName] || 0) + (Number(r.totalCost) || 0);
  });

  const sorted = Object.entries(machineCosts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, Number(topCount.value));

  // Generate colors from selected theme palette
  const baseColors = currentPalette.value;

  // Map colors cyclically via modulo operator
  const chartColors = sorted
    .map((_, i) => baseColors[i % baseColors.length])
    .slice(0, Number(topCount.value));

  return {
    series: [
      { name: t('services.maintenance.dashboard.totalSumLabel'), data: sorted.map((s) => s[1]) },
    ],
    options: {
      chart: { type: 'bar', toolbar: { show: false } },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: true,
          distributed: true, // Enable individual colors
          dataLabels: { position: 'center' },
        },
      },
      colors: chartColors,
      dataLabels: {
        enabled: true,
        textAnchor: 'middle',
        style: {
          colors: sorted.map((s) => (s[1] < 300 ? '#1e293b' : '#fff')), // Dark text for light bars (< 300), white for others
          fontSize: '10px',
          fontWeight: 'bold',
        },
        formatter: (val: number) =>
          val.toLocaleString('th-TH', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }),
        dropShadow: { enabled: false }, // Remove shadow for cleaner look
      },
      xaxis: { categories: sorted.map((s) => s[0]), labels: { style: { fontSize: '10px' } } },
      yaxis: { labels: { style: { fontSize: '10px' } } },
      legend: { show: false }, // Hide legend as colors are just for visual effect
      grid: { borderColor: '#f1f5f9' },
      tooltip: {
        y: {
          formatter: (val: number) =>
            val.toLocaleString('th-TH', {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }),
        },
      },
    } as ApexOptions,
  };
});

const machineCostDetails = computed(() => {
  const details: {
    [key: string]: { total: number; count: number; name: string; machineId: string };
  } = {};

  repairs.value.forEach((r) => {
    if (!details[r.machineId]) {
      details[r.machineId] = { total: 0, count: 0, name: r.machineName, machineId: r.machineId };
    }
    details[r.machineId].total += Number(r.totalCost) || 0;
    details[r.machineId].count += 1;
  });

  return Object.values(details).sort((a, b) => b.total - a.total);
});

const isTotalMode = computed(
  () => selectedMachineIds.value.includes('all') || selectedMachineIds.value.length === 0
);

const repairDetailsList = computed(() => {
  if (isTotalMode.value) return [];
  // Filter repairs by selected machines
  return repairs.value
    .filter((r) => selectedMachineIds.value.includes(r.machineId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

const displayedTotalCost = computed(() => {
  const list = isTotalMode.value ? repairs.value : repairDetailsList.value;
  return list.reduce((acc, curr) => acc + (Number(curr.totalCost) || 0), 0);
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden bg-slate-50 pt-1">
    <!-- Charts Section -->
    <div class="flex-1 overflow-y-auto px-6 pb-6 pt-2">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-6 h-full min-h-[700px]">
        <!-- Left Column: Charts -->
        <div class="lg:col-span-2 flex flex-col gap-4 h-full">
          <!-- Area Chart: Cost Trend -->
          <Card class="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <div class="space-y-1">
                <CardTitle class="text-sm font-bold tracking-tight text-slate-900">
                  {{ t('services.maintenance.dashboard.costTrend') }}
                </CardTitle>
                <p class="text-[0.625rem] text-slate-500">
                  {{ t('services.maintenance.dashboard.costTrendSub') }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{{
                  t('services.maintenance.dashboard.filterAsset')
                }}</span>
                <Popover v-model:open="open">
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      role="combobox"
                      :aria-expanded="open"
                      class="h-8 w-[200px] justify-between text-xs font-normal border-slate-200"
                    >
                      <span class="truncate">
                        {{
                          selectedMachineIds.includes('all') || selectedMachineIds.length === 0
                            ? t('services.maintenance.dashboard.allMachines')
                            : selectedMachineIds.length === 1
                              ? machines.find((m) => m.id === selectedMachineIds[0])?.name
                              : `${selectedMachineIds.length} ${t('services.maintenance.dashboard.assetsSelected')}`
                        }}
                      </span>
                      <ChevronsUpDown class="ml-2 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-[200px] p-0">
                    <Command>
                      <CommandInput
                        class="h-8 text-xs"
                        :placeholder="t('services.maintenance.dashboard.searchMachine')"
                      />
                      <CommandEmpty>{{
                        t('services.maintenance.dashboard.noMachineFound')
                      }}</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            @select="
                              () => {
                                selectedMachineIds = ['all'];
                                open = false;
                              }
                            "
                            class="text-xs"
                          >
                            <Check
                              :class="
                                cn(
                                  'mr-2 h-3 w-3',
                                  selectedMachineIds.includes('all') ? 'opacity-100' : 'opacity-0'
                                )
                              "
                            />
                            {{ t('services.maintenance.dashboard.allMachines') }}
                          </CommandItem>
                          <CommandItem
                            v-for="machine in machines"
                            :key="machine.id"
                            :value="machine.name"
                            @select="
                              () => {
                                if (selectedMachineIds.includes('all')) {
                                  selectedMachineIds = [machine.id];
                                } else {
                                  if (selectedMachineIds.includes(machine.id)) {
                                    selectedMachineIds = selectedMachineIds.filter(
                                      (id) => id !== machine.id
                                    );
                                    if (selectedMachineIds.length === 0) {
                                      selectedMachineIds = ['all'];
                                    }
                                  } else {
                                    selectedMachineIds.push(machine.id);
                                  }
                                }
                                // Keep open for multi-select
                              }
                            "
                            class="text-xs"
                          >
                            <Check
                              :class="
                                cn(
                                  'mr-2 h-3 w-3',
                                  selectedMachineIds.includes(machine.id)
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )
                              "
                            />
                            {{ machine.name }}
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent class="p-0">
              <div class="h-[250px] w-full px-2">
                <VueApexCharts
                  height="100%"
                  width="100%"
                  :options="costTrendChart.options"
                  :series="costTrendChart.series"
                />
              </div>
            </CardContent>
          </Card>

          <!-- Bar Chart: Top Costly Assets -->
          <Card
            class="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm overflow-hidden flex flex-col flex-1 min-h-0"
          >
            <CardHeader class="pb-1 flex flex-row items-center justify-between flex-shrink-0">
              <div>
                <CardTitle class="text-sm font-bold text-slate-800">{{
                  t('services.maintenance.dashboard.topExpenses', { count: topCount })
                }}</CardTitle>
                <p class="text-[0.625rem] text-slate-400 uppercase tracking-widest">
                  {{ t('services.maintenance.dashboard.assetsHighestBudget') }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Select v-model="topCount">
                  <SelectTrigger
                    class="h-6 w-[70px] text-[10px] font-bold border-slate-200 focus:ring-primary/20"
                  >
                    <SelectValue placeholder="5" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5" class="text-xs">{{
                      t('services.maintenance.dashboard.topCount', { count: 5 })
                    }}</SelectItem>
                    <SelectItem value="10" class="text-xs">{{
                      t('services.maintenance.dashboard.topCount', { count: 10 })
                    }}</SelectItem>
                    <SelectItem value="15" class="text-xs">{{
                      t('services.maintenance.dashboard.topCount', { count: 15 })
                    }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent class="p-0 flex-1 min-h-0 overflow-y-auto">
              <div class="w-full h-full px-4 pb-2">
                <VueApexCharts
                  height="100%"
                  width="100%"
                  :options="topCostlyChart.options"
                  :series="topCostlyChart.series"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Right Column: Machine Cost Breakdown -->
        <Card
          class="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm overflow-hidden flex flex-col h-full"
        >
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="text-sm font-bold text-slate-800">
                  {{
                    isTotalMode
                      ? t('services.maintenance.dashboard.costBreakdown')
                      : t('services.maintenance.dashboard.repairDetails')
                  }}
                </CardTitle>
                <p class="text-[0.625rem] text-slate-400 uppercase tracking-widest">
                  {{
                    isTotalMode
                      ? t('services.maintenance.dashboard.perMachineInv')
                      : t('services.maintenance.dashboard.indivRepair')
                  }}
                </p>
              </div>
              <div class="text-right flex flex-col items-end">
                <span
                  class="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/10 shadow-sm"
                >
                  {{ formatCurrency(displayedTotalCost) }}
                </span>
                <span
                  class="text-[0.5rem] text-slate-400 font-bold mt-1 uppercase tracking-tighter"
                >
                  {{ t('services.maintenance.dashboard.totalSum') }}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent class="flex-1 overflow-y-auto px-4 pb-4">
            <!-- Mode 1: Aggregate List -->
            <div v-if="isTotalMode" class="space-y-3">
              <div
                v-for="item in machineCostDetails"
                :key="item.machineId"
                @click="viewMachineDetail(item.machineId)"
                class="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 hover:shadow-sm cursor-pointer transition-all group"
              >
                <div class="flex-1 min-w-0 mr-2">
                  <p class="text-xs font-bold text-slate-700 truncate capitalize">
                    {{ item.name }}
                  </p>
                  <p class="text-[0.625rem] text-slate-400">
                    {{ item.count }} {{ t('services.maintenance.dashboard.incidents') }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-xs font-black text-slate-900">{{ formatCurrency(item.total) }}</p>
                </div>
              </div>
            </div>

            <!-- Mode 2: Detailed Repair List -->
            <div v-else class="space-y-3">
              <div
                v-for="(repair, index) in repairDetailsList"
                :key="index"
                class="flex flex-col p-3 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div class="flex justify-between items-start mb-1">
                  <p class="text-xs font-bold text-slate-800 line-clamp-2">
                    {{ repair.issue || t('services.maintenance.dashboard.maintenanceTask') }}
                  </p>
                  <span class="text-xs font-black text-slate-900 whitespace-nowrap ml-2">
                    {{ formatCurrency(Number(repair.totalCost)) }}
                  </span>
                </div>

                <!-- Parts List -->
                <div
                  v-if="repair.parts && repair.parts.length > 0"
                  class="mt-2 pt-2 border-t border-slate-100/60"
                >
                  <div
                    v-for="part in repair.parts"
                    :key="part.id"
                    class="flex justify-between items-center text-[10px] text-slate-500 mb-0.5"
                  >
                    <div class="flex items-center gap-1.5 overflow-hidden">
                      <span class="w-1 h-1 rounded-full bg-slate-300 shrink-0"></span>
                      <span class="truncate">{{ part.name }}</span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="text-xs bg-slate-100 px-1 rounded text-slate-600"
                        >x{{ part.qty }}</span
                      >
                      <!-- <span class="font-medium w-[50px] text-right">{{ formatCurrency(part.price * part.qty) }}</span> -->
                    </div>
                  </div>
                </div>

                <div
                  class="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100"
                >
                  <span
                    class="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 font-medium"
                  >
                    {{ repair.machineName }}
                  </span>
                  <span class="text-[10px] text-slate-400">
                    {{
                      new Date(repair.date).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')
                    }}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
