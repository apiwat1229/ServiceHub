<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card';
import DateRangePicker from '@/components/ui/date-range-picker.vue';
import { type Pool } from '@/services/pools';
import { getLocalTimeZone, today } from '@internationalized/date';
import { type DateRange } from 'reka-ui';
import { computed, ref } from 'vue';
import VueApexCharts from 'vue3-apexcharts';

const props = defineProps<{
  pools: Pool[];
}>();

const dateRange = ref<DateRange>({
  start: today(getLocalTimeZone()).subtract({ days: 15 }),
  end: today(getLocalTimeZone()),
} as any);

const distributionFromIntake = computed(() => {
  const grades = ['AA', 'A', 'B', 'C'];
  const colors = ['#10b981', '#0ea5e9', '#6366f1', '#f59e0b'];
  const series = intakeChartData.value.series.map((s) => s.data.reduce((a, b) => a + b, 0));
  const total = series.reduce((a, b) => a + b, 0);
  return { categories: grades, series, total, colors };
});

const intakeChartData = computed(() => {
  const start = dateRange.value.start;
  const end = dateRange.value.end;

  let days: string[] = [];
  if (start && end) {
    const diff = (end as any).compare(start);
    days = Array.from({ length: diff + 1 }, (_, i) => {
      const d = (start as any).add({ days: i });
      return `${d.day} ${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(d.year, d.month - 1, d.day))}`;
    });
  } else {
    days = Array.from({ length: 15 }, (_, i) => `${i + 1} Oct`);
  }

  const grades = ['AA', 'A', 'B', 'C'];
  const series = grades.map((grade) => ({
    name: `Grade ${grade}`,
    data: days.map(() => Math.floor(Math.random() * 20) + 5),
  }));

  const colors = ['#10b981', '#0ea5e9', '#6366f1', '#f59e0b'];

  return { categories: days, series, colors };
});

const intakeChartOptions = computed(() => ({
  chart: {
    type: 'bar' as const,
    stacked: true,
    toolbar: { show: false },
    fontFamily: 'inherit',
  },
  colors: intakeChartData.value.colors,
  plotOptions: {
    bar: {
      columnWidth: '40%',
      borderRadius: 2,
    },
  },
  dataLabels: {
    enabled: true,
    style: {
      fontSize: '8px',
      fontWeight: 900,
    },
    formatter: (val: number) => (val > 5 ? val.toFixed(0) : ''),
  },
  xaxis: {
    categories: intakeChartData.value.categories,
    labels: {
      style: { fontSize: '10px', fontWeight: 700, colors: '#94a3b8' },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      style: { fontSize: '10px', fontWeight: 700, colors: '#94a3b8' },
    },
  },
  legend: {
    position: 'top' as const,
    horizontalAlign: 'right' as const,
    fontSize: '10px',
    fontWeight: 700,
    offsetY: -10,
  },
  grid: {
    borderColor: '#f1f5f9',
    strokeDashArray: 4,
  },
}));

const getChartOptions = (labels: string[], colors: string[], total: number) => ({
  chart: {
    type: 'donut' as const,
    fontFamily: 'inherit',
  },
  colors,
  labels,
  dataLabels: { enabled: false },
  legend: { show: false },
  stroke: { width: 0 },
  plotOptions: {
    pie: {
      donut: {
        size: '80%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'TOTAL',
            formatter: () => `${total.toFixed(1)}`,
            fontSize: '10px',
            fontWeight: 900,
            color: '#64748b',
          },
          value: {
            show: true,
            fontSize: '18px',
            fontWeight: 900,
            offsetY: 2,
            formatter: (val: string) => `${parseFloat(val).toFixed(1)} T`,
          },
        },
      },
    },
  },
  tooltip: { enabled: true },
});
</script>

<template>
  <Card class="bg-white border-slate-200/60 shadow-sm overflow-hidden col-span-1 lg:col-span-2">
    <CardContent class="p-0">
      <div class="grid grid-cols-1 lg:grid-cols-12 divide-x divide-slate-50 h-[360px]">
        <div class="lg:col-span-3 p-6 flex flex-col bg-slate-50/20">
          <div class="flex items-center h-8 mb-6">
            <div class="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              Weight Distribution
            </div>
          </div>
          <div class="w-full h-48 flex items-center justify-center flex-1">
            <VueApexCharts
              type="donut"
              height="100%"
              :options="
                getChartOptions(
                  distributionFromIntake.categories,
                  distributionFromIntake.colors,
                  distributionFromIntake.total
                )
              "
              :series="distributionFromIntake.series"
            />
          </div>
        </div>

        <!-- Intake Column (Significant portion) -->
        <div class="lg:col-span-9 p-6 flex flex-col">
          <div class="flex items-center justify-between mb-6">
            <div class="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              Daily Intake - Quantity (Ton)
            </div>
            <DateRangePicker v-model="dateRange" class="h-8 w-[240px]" />
          </div>
          <div class="flex-1 min-h-0">
            <VueApexCharts
              type="bar"
              height="100%"
              :options="intakeChartOptions"
              :series="intakeChartData.series"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
