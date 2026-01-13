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
import { useMyMachine } from '@/composables/useMyMachine';
import { cn } from '@/lib/utils';
import type { ApexOptions } from 'apexcharts';
import { Check, ChevronsUpDown } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import VueApexCharts from 'vue3-apexcharts';

const { t, locale } = useI18n();

const emit = defineEmits<{
  (e: 'view-detail', id: string): void;
}>();

const { machines, repairs } = useMyMachine();

const viewMachineDetail = (id: string) => {
  emit('view-detail', id);
};

// --- Data Aggregation for Charts ---

const selectedMachineIds = ref<string[]>(['all']);
const open = ref(false);
const topCount = ref('10');
type Theme = 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';
const selectedTheme = ref<Theme>('indigo');

const colorThemes: Record<Theme, string[]> = {
  indigo: ['#312e81', '#3730a3', '#4338ca', '#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'],
  emerald: ['#064e3b', '#065f46', '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
  rose: ['#881337', '#9f1239', '#be123c', '#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3'],
  amber: ['#78350f', '#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'],
  slate: ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'],
};

// 1. Cost Trend (Monthly)
const costTrendChart = computed(() => {
  const months = [
    t('services.myMachine.dashboard.months.jan'),
    t('services.myMachine.dashboard.months.feb'),
    t('services.myMachine.dashboard.months.mar'),
    t('services.myMachine.dashboard.months.apr'),
    t('services.myMachine.dashboard.months.may'),
    t('services.myMachine.dashboard.months.jun'),
    t('services.myMachine.dashboard.months.jul'),
    t('services.myMachine.dashboard.months.aug'),
    t('services.myMachine.dashboard.months.sep'),
    t('services.myMachine.dashboard.months.oct'),
    t('services.myMachine.dashboard.months.nov'),
    t('services.myMachine.dashboard.months.dec'),
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
    series.push({ name: t('services.myMachine.dashboard.totalMaintenanceCost'), data });
  } else {
    selectedMachineIds.value.forEach((id) => {
      const machine = machines.value.find((m) => m.id === id);
      const machineName = machine ? machine.name : t('services.myMachine.dashboard.unknownMachine');
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
      chart: { type: 'line', toolbar: { show: false }, zoom: { enabled: false } },
      // Remove hardcoded colors to allow auto-palette for multiple lines
      // colors: ['#10b981'],
      dataLabels: {
        enabled: true,
        offsetY: -6, // Move label up
        style: {
          fontSize: '10px',
          colors: ['#475569'], // slate-600
        },
        background: {
          enabled: false, // Remove background box
        },
        formatter: (val: number) =>
          val > 0
            ? val.toLocaleString('th-TH', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })
            : '',
      },
      markers: {
        size: 4,
        hover: { size: 6 },
      },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: { categories: months, labels: { style: { colors: '#64748b', fontSize: '10px' } } },
      yaxis: {
        labels: {
          style: { colors: '#64748b', fontSize: '10px' },
          formatter: (v: number) =>
            v.toLocaleString('th-TH', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }),
        },
      },
      legend: { show: true, position: 'top', horizontalAlign: 'right' },
      grid: { borderColor: '#f1f5f9' },
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

  // Generate colors from dark (indigo-900) to light (indigo-300)
  // Get base colors from selected theme
  const baseColors = colorThemes[selectedTheme.value];

  // Interpolate or map colors to match topCount
  const chartColors = sorted
    .map((_, i) => {
      const index = Math.floor((i / sorted.length) * baseColors.length);
      return baseColors[Math.min(index, baseColors.length - 1)];
    })
    .slice(0, Number(topCount.value));

  return {
    series: [
      { name: t('services.myMachine.dashboard.totalSumLabel'), data: sorted.map((s) => s[1]) },
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
          <Card class="border-slate-200/50 shadow-sm bg-white overflow-hidden">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <div class="space-y-1">
                <CardTitle class="text-sm font-bold tracking-tight text-slate-900">
                  {{ t('services.myMachine.dashboard.costTrend') }}
                </CardTitle>
                <p class="text-[0.625rem] text-slate-500">
                  {{ t('services.myMachine.dashboard.costTrendSub') }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{{
                  t('services.myMachine.dashboard.filterAsset')
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
                            ? t('services.myMachine.dashboard.allMachines')
                            : selectedMachineIds.length === 1
                              ? machines.find((m) => m.id === selectedMachineIds[0])?.name
                              : `${selectedMachineIds.length} ${t('services.myMachine.dashboard.assetsSelected')}`
                        }}
                      </span>
                      <ChevronsUpDown class="ml-2 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-[200px] p-0">
                    <Command>
                      <CommandInput
                        class="h-8 text-xs"
                        :placeholder="t('services.myMachine.dashboard.searchMachine')"
                      />
                      <CommandEmpty>{{
                        t('services.myMachine.dashboard.noMachineFound')
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
                            {{ t('services.myMachine.dashboard.allMachines') }}
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
            class="border-slate-200/50 shadow-sm bg-white overflow-hidden flex flex-col flex-1 min-h-0"
          >
            <CardHeader class="pb-1 flex flex-row items-center justify-between flex-shrink-0">
              <div>
                <CardTitle class="text-sm font-bold text-slate-800">{{
                  t('services.myMachine.dashboard.topExpenses', { count: topCount })
                }}</CardTitle>
                <p class="text-[0.625rem] text-slate-400 uppercase tracking-widest">
                  {{ t('services.myMachine.dashboard.assetsHighestBudget') }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Select v-model="selectedTheme">
                  <SelectTrigger
                    class="h-6 w-[80px] text-[10px] font-bold border-slate-200 capitalize"
                  >
                    <SelectValue :placeholder="t('services.myMachine.dashboard.theme')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indigo" class="text-xs">{{
                      t('services.myMachine.dashboard.themes.indigo')
                    }}</SelectItem>
                    <SelectItem value="emerald" class="text-xs">{{
                      t('services.myMachine.dashboard.themes.emerald')
                    }}</SelectItem>
                    <SelectItem value="rose" class="text-xs">{{
                      t('services.myMachine.dashboard.themes.rose')
                    }}</SelectItem>
                    <SelectItem value="amber" class="text-xs">{{
                      t('services.myMachine.dashboard.themes.amber')
                    }}</SelectItem>
                    <SelectItem value="slate" class="text-xs">{{
                      t('services.myMachine.dashboard.themes.slate')
                    }}</SelectItem>
                  </SelectContent>
                </Select>
                <Select v-model="topCount">
                  <SelectTrigger class="h-6 w-[70px] text-[10px] font-bold border-slate-200">
                    <SelectValue placeholder="5" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5" class="text-xs">{{
                      t('services.myMachine.dashboard.topCount', { count: 5 })
                    }}</SelectItem>
                    <SelectItem value="10" class="text-xs">{{
                      t('services.myMachine.dashboard.topCount', { count: 10 })
                    }}</SelectItem>
                    <SelectItem value="15" class="text-xs">{{
                      t('services.myMachine.dashboard.topCount', { count: 15 })
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
        <Card class="border-slate-200/50 shadow-sm bg-white overflow-hidden flex flex-col h-full">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="text-sm font-bold text-slate-800">
                  {{
                    isTotalMode
                      ? t('services.myMachine.dashboard.costBreakdown')
                      : t('services.myMachine.dashboard.repairDetails')
                  }}
                </CardTitle>
                <p class="text-[0.625rem] text-slate-400 uppercase tracking-widest">
                  {{
                    isTotalMode
                      ? t('services.myMachine.dashboard.perMachineInv')
                      : t('services.myMachine.dashboard.indivRepair')
                  }}
                </p>
              </div>
              <div class="text-right flex flex-col items-end">
                <span
                  class="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shadow-sm"
                >
                  {{ formatCurrency(displayedTotalCost) }}
                </span>
                <span
                  class="text-[0.5rem] text-slate-400 font-bold mt-1 uppercase tracking-tighter"
                >
                  {{ t('services.myMachine.dashboard.totalSum') }}
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
                    {{ item.count }} {{ t('services.myMachine.dashboard.incidents') }}
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
                    {{ repair.issue || t('services.myMachine.dashboard.maintenanceTask') }}
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
