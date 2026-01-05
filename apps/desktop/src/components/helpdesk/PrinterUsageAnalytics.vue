<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { printerService } from '@/services/printer';
import { PrinterDepartmentDto } from '@my-app/types';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileUp,
  Printer,
  Save,
  Search,
  Settings2,
  Trash2,
  Users,
} from 'lucide-vue-next';
import Papa from 'papaparse';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import PrinterSettings from './PrinterSettings.vue';

Chart.register(...registerables, ChartDataLabels);

const { t, tm, rt } = useI18n();

interface UserUsage {
  user_name: string;
  department: string;
  printBW: number; // Actual usage (delta)
  printColor: number; // Actual usage (delta)
  copyBW: number; // Actual usage (delta)
  copyColor: number; // Actual usage (delta)
  total: number; // Actual usage (delta)
  meterBW?: number; // Raw meter reading
  meterColor?: number; // Raw meter reading
  meterPrint?: number; // Raw meter reading
  meterCopy?: number; // Raw meter reading
  meterTotal?: number; // Raw meter reading
}

const processedData = ref<UserUsage[]>([]);
const hasData = ref(false);
const uploadedFile = ref<{ name: string; size: number } | null>(null);
const searchQuery = ref('');
const selectedDeptFilter = ref('all');
const sortKey = ref<keyof UserUsage>('total');
const sortOrder = ref<'asc' | 'desc'>('desc');
const selectedPeriod = ref<string>('');

// Department Mapping
const userDepartmentMap = ref<Record<string, string>>({});
const dbDepartments = ref<PrinterDepartmentDto[]>([]);
const showSettings = ref(false);

// Load data from DB
const loadDbData = async () => {
  try {
    const [deptsRes, mappingsRes] = await Promise.all([
      printerService.getDepartments(),
      printerService.getMappings(),
    ]);
    if (deptsRes.success) dbDepartments.value = deptsRes.data || [];
    if (mappingsRes.success) {
      const map: Record<string, string> = {};
      mappingsRes.data?.forEach((m) => {
        map[m.userName] = m.departmentId;
      });
      userDepartmentMap.value = map;
    }
  } catch (error) {
    console.error('Failed to load printer DB data:', error);
  }
};

onMounted(loadDbData);

const departments = computed(() => {
  return dbDepartments.value.map((d) => ({
    id: d.id,
    label: d.name,
  }));
});

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);

// Chart Instances
let userChartInstance: Chart | null = null;
let typeChartInstance: Chart | null = null;
let deptChartInstance: Chart | null = null;
let trendChartInstance: Chart | null = null;

const stats = ref({
  totalUsers: 0,
  totalDepts: 0,
  grandTotal: 0,
  totalBW: 0,
  totalColor: 0,
  totalPrint: 0,
  totalCopy: 0,
});

const isSaving = ref(false);
const historyRecords = ref<any[]>([]);

const saveToDb = async () => {
  if (processedData.value.length === 0 || !selectedPeriod.value) return;

  const period = new Date(selectedPeriod.value).toISOString();

  isSaving.value = true;
  try {
    const records = processedData.value.map((u) => ({
      period: new Date(period),
      userName: u.user_name,
      printBW: u.meterPrint || 0, // Save raw Reading to DB
      printColor: u.meterColor || 0,
      copyBW: u.meterCopy || 0,
      copyColor: u.meterCopy || 0, // Placeholder, usually logs combine print/copy in meter
      total: u.meterTotal || 0,
    }));

    await printerService.saveUsageRecords(records);
    await loadHistory(); // Reload history to update UI
    toast.success(t('services.itHelp.printer.history.saveSuccess'));
  } catch (err) {
    toast.error(t('services.itHelp.printer.history.saveError'));
  } finally {
    isSaving.value = false;
  }
};

const loadLatestFromHistory = () => {
  if (historyRecords.value.length === 0) return;

  // Group by period
  const groups: Record<string, any[]> = {};
  historyRecords.value.forEach((r) => {
    const p = new Date(r.period).toISOString();
    if (!groups[p]) groups[p] = [];
    groups[p].push(r);
  });

  const periods = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const currentPeriod = periods[0];
  const prevPeriod = periods[1];

  selectedPeriod.value = currentPeriod;
  const currentRecords = groups[currentPeriod];
  const prevRecords = prevPeriod ? groups[prevPeriod] : [];
  const prevMap = new Map(prevRecords.map((r) => [r.userName, r]));

  processedData.value = currentRecords.map((r) => {
    const prev = prevMap.get(r.userName);
    // DB stores METER readings
    const meterPrint = r.printBW;
    const meterColor = r.printColor;
    const meterCopy = r.copyBW; // stored as same value in saveToDb
    const meterTotal = r.total;

    let printBW = meterPrint;
    let printColor = meterColor;
    let copyBW = 0;
    let copyColor = 0;
    let total = meterTotal;

    if (prev) {
      printBW = Math.max(0, meterPrint - prev.printBW);
      printColor = Math.max(0, meterColor - prev.printColor);
      total = Math.max(0, meterTotal - prev.total);
    }

    return {
      user_name: r.userName,
      department: r.departmentId || 'other',
      printBW,
      printColor,
      copyBW,
      copyColor,
      total,
      meterBW: 0,
      meterColor: 0,
      meterPrint,
      meterCopy,
      meterTotal,
    } as UserUsage;
  });

  // Re-calculate stats
  const uniqueDepts = new Set(processedData.value.map((u) => u.department));
  stats.value = {
    totalUsers: processedData.value.length,
    totalDepts: uniqueDepts.size,
    grandTotal: processedData.value.reduce((acc, curr) => acc + curr.total, 0),
    totalBW: processedData.value.reduce((acc, curr) => acc + curr.printBW, 0),
    totalColor: processedData.value.reduce((acc, curr) => acc + curr.printColor, 0),
    totalPrint: processedData.value.reduce((acc, curr) => acc + curr.printBW, 0), // Approx
    totalCopy: 0,
  };

  hasData.value = true;
  nextTick(() => {
    renderCharts();
  });
};

const loadHistory = async () => {
  try {
    const res = await printerService.getHistory();
    if (res.success) {
      historyRecords.value = res.data || [];
      // If we don't have current data (e.g. on reload), try to load from history
      if (!hasData.value && historyRecords.value.length > 0) {
        loadLatestFromHistory();
      }
    }
  } catch (err) {
    console.error('Failed to load history:', err);
  }
};

onMounted(() => {
  loadDbData();
  loadHistory();
});

const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num);
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  uploadedFile.value = { name: file.name, size: file.size };

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      processData(results.data as any[]);
    },
    error: (err: any) => {
      console.error('CSV Parse Error:', err);
    },
  });
};

const processData = (data: any[]) => {
  const userMap: Record<string, UserUsage> = {};
  let rawDateStr = '';

  // 1. First Pass: Aggregate raw meter readings and find tran_date
  data.forEach((row) => {
    if (!row.user_name) return;
    if (!rawDateStr && row.tran_date) rawDateStr = row.tran_date;

    const userName = row.user_name.trim();
    const mBW = parseInt(row.TotalBW) || parseInt(row.PrintBW) + parseInt(row.CopyBW) || 0;
    const mColor =
      parseInt(row.TotalColor) || parseInt(row.PrintColor) + parseInt(row.CopyColor) || 0;
    const mPrint = parseInt(row.PrintBW) + parseInt(row.PrintColor) || 0;
    const mCopy = parseInt(row.CopyBW) + parseInt(row.CopyColor) || 0;
    const mTotal = parseInt(row.TotalMeter) || mBW + mColor;

    if (!userMap[userName]) {
      userMap[userName] = {
        user_name: userName,
        department: userDepartmentMap.value[userName] || 'other',
        printBW: 0,
        printColor: 0,
        copyBW: 0,
        copyColor: 0,
        total: 0,
        meterBW: 0,
        meterColor: 0,
        meterPrint: 0,
        meterCopy: 0,
        meterTotal: 0,
      };
    }

    // Since these are counters, we take the max value if multiple rows per user (though usually 1 row per user in logs)
    userMap[userName].meterBW = Math.max(userMap[userName].meterBW || 0, mBW);
    userMap[userName].meterColor = Math.max(userMap[userName].meterColor || 0, mColor);
    userMap[userName].meterPrint = Math.max(userMap[userName].meterPrint || 0, mPrint);
    userMap[userName].meterCopy = Math.max(userMap[userName].meterCopy || 0, mCopy);
    userMap[userName].meterTotal = Math.max(userMap[userName].meterTotal || 0, mTotal);
  });

  // 2. Parse Period from tran_date (format might be DD/MM/YYYY based on screenshot)
  if (rawDateStr) {
    const parts = rawDateStr.split('/');
    if (parts.length === 3) {
      // Create first day of month Date
      const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, 1);
      selectedPeriod.value = d.toISOString();
    }
  }

  // 3. Find Previous Month Records from history
  const currentMonthDate = new Date(selectedPeriod.value);
  const prevMonthDate = new Date(
    currentMonthDate.getFullYear(),
    currentMonthDate.getMonth() - 1,
    1
  );
  const prevMonthISO = prevMonthDate.toISOString();

  const prevPeriodRecords = historyRecords.value.filter((r) => {
    const d = new Date(r.period);
    return d.toISOString() === prevMonthISO;
  });

  const prevMonthMap: Record<string, any> = {};
  prevPeriodRecords.forEach((r) => {
    prevMonthMap[r.userName] = r;
  });

  // 4. Second Pass: Calculate Deltas
  let grandTotalUsage = 0;
  let sumBW = 0;
  let sumColor = 0;
  let sumPrint = 0;
  let sumCopy = 0;

  Object.values(userMap).forEach((u) => {
    const prev = prevMonthMap[u.user_name];
    if (prev) {
      // Usage = Current Meter - Previous Meter
      u.printBW = Math.max(0, (u.meterPrint || 0) - (prev.printBW || 0)); // Note: backend stores meters in BW/Color cols
      u.printColor = Math.max(0, (u.meterColor || 0) - (prev.printColor || 0));
      u.copyBW = 0; // If logs don't separate print/copy deltas well, we aggregate
      u.copyColor = 0;
      u.total = Math.max(0, (u.meterTotal || 0) - (prev.total || 0));
    } else {
      // If no previous data (First month of using the system)
      // We show the raw values from the file so the user can see initial data
      u.printBW = u.meterPrint || 0;
      u.printColor = u.meterColor || 0;
      u.total = u.meterTotal || 0;
    }

    grandTotalUsage += u.total;
    sumBW += u.printBW; // Simple mapping for now
    sumColor += u.printColor;
    sumPrint += u.printBW;
    sumCopy += 0;
  });

  processedData.value = Object.values(userMap);

  const uniqueDepts = new Set(processedData.value.map((u) => u.department));

  stats.value = {
    totalUsers: processedData.value.length,
    totalDepts: uniqueDepts.size,
    grandTotal: grandTotalUsage,
    totalBW: sumBW,
    totalColor: sumColor,
    totalPrint: sumPrint,
    totalCopy: sumCopy,
  };

  hasData.value = true;
  currentPage.value = 1;
  nextTick(() => {
    renderCharts();
  });
};

const renderCharts = () => {
  if (!hasData.value) return;

  const sortedUsers = [...processedData.value].sort((a, b) => b.total - a.total).slice(0, 10);
  const labels = sortedUsers.map((u) => u.user_name);
  const dataTotal = sortedUsers.map((u) => u.total);

  // Top Users Chart
  const canvasUser = document.getElementById('userChart') as HTMLCanvasElement;
  if (canvasUser) {
    if (userChartInstance) userChartInstance.destroy();
    userChartInstance = new Chart(canvasUser, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: t('services.itHelp.printer.charts.labels.totalUsage'),
            data: dataTotal,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          datalabels: {
            anchor: 'end',
            align: 'top',
            offset: 4,
            color: 'rgb(59, 130, 246)',
            font: {
              weight: 'bold',
            },
            formatter: (value) => {
              return formatNumber(value);
            },
            display: (context) => {
              return (context.dataset.data[context.dataIndex] as number) > 0;
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grace: '10%', // Add some space at the top for labels
          },
        },
      },
    });
  }

  // Type Breakdown Chart
  const canvasType = document.getElementById('typeChart') as HTMLCanvasElement;
  if (canvasType) {
    if (typeChartInstance) typeChartInstance.destroy();
    typeChartInstance = new Chart(canvasType, {
      type: 'doughnut',
      data: {
        labels: [
          t('services.itHelp.printer.charts.labels.printBW'),
          t('services.itHelp.printer.charts.labels.printColor'),
          t('services.itHelp.printer.charts.labels.copyBW'),
          t('services.itHelp.printer.charts.labels.copyColor'),
        ],
        datasets: [
          {
            data: [
              processedData.value.reduce((acc, curr) => acc + curr.printBW, 0),
              processedData.value.reduce((acc, curr) => acc + curr.printColor, 0),
              processedData.value.reduce((acc, curr) => acc + curr.copyBW, 0),
              processedData.value.reduce((acc, curr) => acc + curr.copyColor, 0),
            ],
            backgroundColor: [
              '#3b82f6', // Blue
              '#ec4899', // Pink
              '#9ca3af', // Gray
              '#f97316', // Orange
            ],
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          datalabels: {
            color: '#fff',
            font: {
              weight: 'bold',
              size: 14,
            },
            formatter: (value) => {
              return formatNumber(value);
            },
            display: (context) => {
              const value = context.dataset.data[context.dataIndex] as number;
              return value > 0; // Only show if value > 0
            },
          },
        },
      },
    });
  }

  // Department Usage Chart
  const canvasDept = document.getElementById('deptChart') as HTMLCanvasElement;
  if (canvasDept) {
    const deptDataMap: Record<string, number> = {};
    processedData.value.forEach((u) => {
      const deptLabel = rt(tm(`services.itHelp.printer.departments.${u.department}`));
      deptDataMap[deptLabel] = (deptDataMap[deptLabel] || 0) + u.total;
    });

    const deptLabels = Object.keys(deptDataMap).sort((a, b) => deptDataMap[b] - deptDataMap[a]);
    const deptValues = deptLabels.map((l) => deptDataMap[l]);

    if (deptChartInstance) deptChartInstance.destroy();
    deptChartInstance = new Chart(canvasDept, {
      type: 'bar',
      data: {
        labels: deptLabels,
        datasets: [
          {
            label: t('services.itHelp.printer.charts.labels.totalUsage'),
            data: deptValues,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          datalabels: {
            anchor: 'end',
            align: 'right',
            offset: 4,
            color: 'rgb(16, 185, 129)',
            font: { weight: 'bold' },
            formatter: (value) => formatNumber(value),
            display: (context) => (context.dataset.data[context.dataIndex] as number) > 0,
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grace: '10%',
          },
        },
      },
    });
  }
};

const sortBy = (key: keyof UserUsage) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'desc';
  }
};

const filteredUsers = computed(() => {
  let temp = [...processedData.value];

  // Search filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    temp = temp.filter((u) => u.user_name.toLowerCase().includes(q));
  }

  // Department filter
  if (selectedDeptFilter.value !== 'all') {
    temp = temp.filter((u) => u.department === selectedDeptFilter.value);
  }

  temp.sort((a, b) => {
    let valA = a[sortKey.value];
    let valB = b[sortKey.value];

    if (valA === undefined) return 1;
    if (valB === undefined) return -1;

    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = (valB as string).toLowerCase();
    }
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });
  return temp;
});

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / pageSize.value));

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredUsers.value.slice(start, start + pageSize.value);
});

watch([searchQuery, pageSize, selectedDeptFilter], () => {
  currentPage.value = 1;
});

const resetData = () => {
  processedData.value = [];
  hasData.value = false;
  uploadedFile.value = null;
  currentPage.value = 1;
  if (userChartInstance) userChartInstance.destroy();
  if (typeChartInstance) typeChartInstance.destroy();
  if (deptChartInstance) deptChartInstance.destroy();
};

const renderTrendChart = () => {
  if (historyRecords.value.length === 0) return;

  const canvasTrend = document.getElementById('trendChart') as HTMLCanvasElement;
  if (!canvasTrend) return;

  // Group history by period
  const periodMap: Record<string, number> = {};
  historyRecords.value.forEach((r) => {
    const d = new Date(r.period);
    const label = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    periodMap[label] = (periodMap[label] || 0) + r.total;
  });

  const labels = Object.keys(periodMap).sort();
  const values = labels.map((l) => periodMap[l]);

  if (trendChartInstance) trendChartInstance.destroy();
  trendChartInstance = new Chart(canvasTrend, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t('services.itHelp.printer.history.title'),
          data: values,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'top',
          offset: 4,
          color: 'rgb(59, 130, 246)',
          font: { weight: 'bold' },
          formatter: (value) => formatNumber(value),
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grace: '15%',
        },
      },
    },
  });
};

watch(historyRecords, () => {
  nextTick(() => renderTrendChart());
});

onUnmounted(() => {
  if (userChartInstance) userChartInstance.destroy();
  if (typeChartInstance) typeChartInstance.destroy();
  if (deptChartInstance) deptChartInstance.destroy();
  if (trendChartInstance) trendChartInstance.destroy();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header/Upload -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-7">
        <div class="space-y-1">
          <CardTitle>{{ t('services.itHelp.printer.title') }}</CardTitle>
          <CardDescription>{{ t('services.itHelp.printer.subtitle') }}</CardDescription>
        </div>
        <div class="flex items-center gap-4">
          <div
            v-if="uploadedFile"
            class="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border text-right"
          >
            <div class="font-medium text-foreground max-w-[200px] truncate">
              {{ uploadedFile.name }}
            </div>
            <div>{{ (uploadedFile.size / 1024).toFixed(2) }} KB</div>
          </div>
          <div v-if="hasData" class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              class="gap-2"
              @click="saveToDb"
              :disabled="isSaving"
            >
              <Save class="w-4 h-4" /> {{ t('services.itHelp.printer.history.saveBtn') }}
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="gap-2 text-destructive hover:text-destructive"
              @click="resetData"
            >
              <Trash2 class="w-4 h-4" /> {{ t('common.clearAll') }}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            class="gap-2 underline decoration-primary/30 hover:decoration-primary"
            @click="showSettings = !showSettings"
          >
            <Settings2 v-if="!showSettings" class="w-4 h-4" />
            <BarChart3 v-else class="w-4 h-4" />
            {{ showSettings ? t('services.itHelp.tabs.printer') : t('admin.settings') }}
          </Button>

          <div v-if="!showSettings" class="flex items-center gap-2">
            <Label for="csv-upload" class="cursor-pointer">
              <div
                class="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                <FileUp class="w-4 h-4" /> {{ t('services.itHelp.printer.uploadTitle') }}
              </div>
            </Label>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              class="hidden"
              @change="handleFileUpload"
            />
          </div>
        </div>
      </CardHeader>
    </Card>

    <div v-if="showSettings" class="animate-in fade-in slide-in-from-top-4 duration-300">
      <PrinterSettings @data-changed="loadDbData" />
    </div>

    <template v-else-if="!hasData">
      <!-- Empty State -->
      <div
        class="py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/20"
      >
        <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Printer class="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 class="text-xl font-semibold mb-2">{{ t('services.itHelp.printer.emptyState') }}</h3>
        <p class="text-sm text-muted-foreground">
          {{ t('services.itHelp.printer.emptyStateDesc') }}
        </p>
      </div>
    </template>

    <template v-else>
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">{{
              t('services.itHelp.printer.stats.totalUsers')
            }}</CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatNumber(stats.totalUsers) }}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">{{
              t('services.itHelp.printer.stats.totalDepts')
            }}</CardTitle>
            <BarChart3 class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatNumber(stats.totalDepts) }}</div>
          </CardContent>
        </Card>
        <Card class="bg-primary/5 border-primary/20">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium text-primary">{{
              t('services.itHelp.printer.stats.grandTotal')
            }}</CardTitle>
            <Printer class="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-primary">{{ formatNumber(stats.grandTotal) }}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">{{
              t('services.itHelp.printer.stats.printBW')
            }}</CardTitle>
            <div class="h-4 w-4 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatNumber(stats.totalBW) }}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">{{
              t('services.itHelp.printer.stats.printColor')
            }}</CardTitle>
            <div class="h-4 w-4 rounded-full bg-pink-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatNumber(stats.totalColor) }}</div>
          </CardContent>
        </Card>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card class="lg:col-span-1">
          <CardHeader>
            <CardTitle class="text-base">{{
              t('services.itHelp.printer.charts.topUsers')
            }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="h-80 w-full">
              <canvas id="userChart"></canvas>
            </div>
          </CardContent>
        </Card>
        <Card class="lg:col-span-1">
          <CardHeader>
            <CardTitle class="text-base">{{
              t('services.itHelp.printer.charts.usageByDept')
            }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="h-80 w-full">
              <canvas id="deptChart"></canvas>
            </div>
          </CardContent>
        </Card>
        <Card class="lg:col-span-1">
          <CardHeader>
            <CardTitle class="text-base">{{
              t('services.itHelp.printer.charts.usageType')
            }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="h-80 w-full flex justify-center">
              <canvas id="typeChart"></canvas>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Historical Trends -->
      <Card v-if="historyRecords.length > 0">
        <CardHeader>
          <CardTitle class="text-base">{{ t('services.itHelp.printer.history.title') }}</CardTitle>
          <CardDescription>{{ t('services.itHelp.printer.history.comparison') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="h-80 w-full">
            <canvas id="trendChart"></canvas>
          </div>
        </CardContent>
      </Card>

      <!-- Detail Table -->
      <Card>
        <CardHeader>
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle class="text-lg">{{ t('services.itHelp.printer.table.title') }}</CardTitle>
            <div class="flex items-center gap-2">
              <Select v-model="selectedDeptFilter">
                <SelectTrigger class="w-[180px]">
                  <SelectValue :placeholder="t('services.itHelp.printer.table.filterDept')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{{
                    t('services.itHelp.printer.table.allDepts')
                  }}</SelectItem>
                  <SelectItem v-for="dept in departments" :key="dept.id" :value="dept.id">
                    {{ dept.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <div class="relative w-full md:w-64">
                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  v-model="searchQuery"
                  :placeholder="t('services.itHelp.printer.table.search')"
                  class="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="rounded-md border overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-muted/50 border-b">
                <tr>
                  <th
                    class="p-3 text-left font-medium cursor-pointer hover:text-primary transition-colors"
                    @click="sortBy('user_name')"
                  >
                    {{ t('services.itHelp.printer.table.userName') }}
                    <span v-if="sortKey === 'user_name'">{{
                      sortOrder === 'asc' ? '↑' : '↓'
                    }}</span>
                  </th>
                  <th class="p-3 text-left font-medium">
                    {{ t('services.itHelp.printer.table.department') }}
                  </th>
                  <th
                    class="p-3 text-right font-medium cursor-pointer hover:text-primary transition-colors"
                    @click="sortBy('total')"
                  >
                    {{ t('services.itHelp.printer.table.total') }}
                    <span v-if="sortKey === 'total'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
                  </th>
                  <th class="p-3 text-right font-medium text-blue-600">
                    {{ t('services.itHelp.printer.charts.labels.printBW') }}
                  </th>
                  <th class="p-3 text-right font-medium text-pink-600">
                    {{ t('services.itHelp.printer.charts.labels.printColor') }}
                  </th>
                  <th class="p-3 text-right font-medium text-slate-500">
                    {{ t('services.itHelp.printer.charts.labels.copyBW') }}
                  </th>
                  <th class="p-3 text-right font-medium text-orange-600">
                    {{ t('services.itHelp.printer.charts.labels.copyColor') }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr
                  v-for="user in paginatedUsers"
                  :key="user.user_name"
                  class="hover:bg-muted/50 transition-colors"
                >
                  <td class="p-3 font-medium">{{ user.user_name }}</td>
                  <td class="p-3">
                    <span class="text-sm text-foreground">
                      {{
                        departments.find((d) => d.id === user.department)?.label || user.department
                      }}
                    </span>
                  </td>
                  <td class="p-3 text-right">
                    <div class="flex flex-col items-end">
                      <Badge variant="secondary" class="font-bold">{{
                        formatNumber(user.total)
                      }}</Badge>
                      <span v-if="user.meterTotal" class="text-[10px] text-muted-foreground mt-1">
                        Rd: {{ formatNumber(user.meterTotal) }}
                      </span>
                    </div>
                  </td>
                  <td class="p-3 text-right text-muted-foreground whitespace-nowrap">
                    <div class="flex flex-col items-end">
                      <span class="text-foreground">{{ formatNumber(user.printBW) }}</span>
                      <span v-if="user.meterPrint" class="text-[10px]"
                        >Rd: {{ formatNumber(user.meterPrint) }}</span
                      >
                    </div>
                  </td>
                  <td class="p-3 text-right text-muted-foreground whitespace-nowrap">
                    <div class="flex flex-col items-end">
                      <span class="text-foreground">{{ formatNumber(user.printColor) }}</span>
                      <span v-if="user.meterColor" class="text-[10px]"
                        >Rd: {{ formatNumber(user.meterColor) }}</span
                      >
                    </div>
                  </td>
                  <td class="p-3 text-right text-muted-foreground">
                    {{ formatNumber(user.copyBW) }}
                  </td>
                  <td class="p-3 text-right text-muted-foreground">
                    {{ formatNumber(user.copyColor) }}
                  </td>
                </tr>
                <tr v-if="paginatedUsers.length === 0">
                  <td colspan="7" class="p-8 text-center text-muted-foreground">
                    {{ t('services.itHelp.printer.table.noData') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Controls -->
          <div class="flex items-center justify-between px-2 py-4">
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium">
                  {{ t('services.itHelp.printer.table.rowsPerPage') }}
                </p>
                <Select
                  :model-value="pageSize.toString()"
                  @update:model-value="(v) => (pageSize = parseInt(v))"
                >
                  <SelectTrigger class="h-8 w-[70px]">
                    <SelectValue :placeholder="pageSize.toString()" />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectItem
                      v-for="size in [10, 20, 30, 40, 50]"
                      :key="size"
                      :value="size.toString()"
                    >
                      {{ size }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex w-[100px] items-center justify-center text-sm font-medium">
                {{ t('services.itHelp.printer.table.page') }} {{ currentPage }} of {{ totalPages }}
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <Button
                variant="outline"
                class="hidden h-8 w-8 p-0 lg:flex"
                :disabled="currentPage === 1"
                @click="currentPage = 1"
              >
                <span class="sr-only">Go to first page</span>
                <ChevronsLeft class="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                class="h-8 w-8 p-0"
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                <span class="sr-only">Go to previous page</span>
                <ChevronLeft class="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                class="h-8 w-8 p-0"
                :disabled="currentPage === totalPages"
                @click="currentPage++"
              >
                <span class="sr-only">Go to next page</span>
                <ChevronRight class="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                class="hidden h-8 w-8 p-0 lg:flex"
                :disabled="currentPage === totalPages"
                @click="currentPage = totalPages"
              >
                <span class="sr-only">Go to last page</span>
                <ChevronsRight class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
