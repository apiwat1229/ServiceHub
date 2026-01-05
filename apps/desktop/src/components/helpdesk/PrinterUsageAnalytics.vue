<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { printerService } from '@/services/printer';
import { PrinterDepartmentDto } from '@my-app/types';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileUp,
  Printer,
  RefreshCw,
  Search,
  Settings2,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-vue-next';
import Papa from 'papaparse';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import VueApexCharts from 'vue3-apexcharts';
import PrinterSettings from './PrinterSettings.vue';
const apexchart = VueApexCharts;

const { t, te, locale } = useI18n();

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

const stats = ref({
  totalUsers: 0,
  totalDepts: 0,
  grandTotal: 0,
  totalBW: 0,
  totalColor: 0,
  totalPrint: 0,
  totalCopy: 0,
});
const historyRecords = ref<any[]>([]);

const allImportedUsers = computed(() => {
  const users = new Set(historyRecords.value.map((r) => r.userName).filter(Boolean));
  return Array.from(users).sort();
});

const viewMode = ref<'single' | 'range'>('single');
const startPeriod = ref('');
const endPeriod = ref('');
const comparisonStats = ref({
  diff: 0,
  percent: 0,
  diffBW: 0,
  percentBW: 0,
  diffColor: 0,
  percentColor: 0,
  prevTotal: 0,
});

const availablePeriods = computed(() => {
  const periods = new Set(historyRecords.value.map((r) => r.period));
  // Sort Descending (Newest first)
  return Array.from(periods).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
});

// Helper: Format Date Label
const formatPeriodLabel = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const targetLocale = locale.value === 'th' ? 'th-TH' : 'en-US';
  return d.toLocaleDateString(targetLocale, { month: 'long', year: 'numeric' });
};

// Main Calculation Logic
const calculateUsage = (startIso: string, endIso: string) => {
  const sorted = availablePeriods.value.sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  ); // Ascending for index search
  const startIndex = sorted.indexOf(startIso);
  const endIndex = sorted.indexOf(endIso);

  if (startIndex === -1 || endIndex === -1) return;

  // 1. Identify Target and Baseline Records
  // Target = End Month Records
  const targetRecords = historyRecords.value.filter((r) => r.period === endIso);

  // Baseline = (Start - 1) Month Records
  // If Start is the very first recorded month, we treat Baseline as 0-meter or "Initial" state.
  // Ideally, if we have continuous data, find sorted[startIndex - 1]
  const baselineIso = startIndex > 0 ? sorted[startIndex - 1] : null;
  const baselineRecords = baselineIso
    ? historyRecords.value.filter((r) => r.period === baselineIso)
    : [];

  const baselineMap: Record<string, any> = {};
  baselineRecords.forEach((r) => (baselineMap[r.userName] = r));

  // 2. Mapping & Calculation
  let grandTotal = 0;
  let sumBW = 0,
    sumColor = 0,
    sumPrint = 0,
    sumCopy = 0;
  const userMap: Record<string, UserUsage> = {};

  // We iterate over Target Records (the "End" state)
  targetRecords.forEach((u) => {
    const prev = baselineMap[u.userName];

    // Usage = EndMeter - StartPrevMeter
    // Note: If no baseline (first month selected), usage is 0 to match chart delta logic
    const printBW = baselineIso ? Math.max(0, (u.printBW || 0) - (prev?.printBW || 0)) : 0;
    const printColor = baselineIso ? Math.max(0, (u.printColor || 0) - (prev?.printColor || 0)) : 0;
    const copyBW = baselineIso ? Math.max(0, (u.copyBW || 0) - (prev?.copyBW || 0)) : 0;
    const copyColor = baselineIso ? Math.max(0, (u.copyColor || 0) - (prev?.copyColor || 0)) : 0;
    const total = baselineIso ? Math.max(0, (u.total || 0) - (prev?.total || 0)) : 0;

    userMap[u.userName] = {
      user_name: u.userName,
      department: (() => {
        // Resolve department
        const mapping = userDepartmentMap.value[u.userName];
        return mapping || 'other';
      })(),
      printBW,
      printColor,
      copyBW,
      copyColor,
      total,
      // Keep raw meters for debug? Not needed for display
      meterBW: u.printBW,
      meterColor: u.printColor,
      meterPrint: u.printBW, // Using generic mapping from Schema
      meterCopy: u.copyBW,
      meterTotal: u.total,
    };

    grandTotal += total;
    sumBW += printBW + copyBW;
    sumColor += printColor + copyColor;
    sumPrint += printBW + printColor;
    sumCopy += copyBW + copyColor;
  });

  processedData.value = Object.values(userMap);
  const uniqueDepts = new Set(processedData.value.map((u) => u.department));

  stats.value = {
    totalUsers: processedData.value.length,
    totalDepts: uniqueDepts.size,
    grandTotal: grandTotal,
    totalBW: sumBW,
    totalColor: sumColor,
    totalPrint: sumPrint,
    totalCopy: sumCopy,
  };

  // 3. Comparison Stats (Only for Single View mainly, or Range vs Prev Range)
  // Logic: Compare "Calculated Usage" vs "Usage of Previous Cycle"
  // Previous Cycle:
  //   If Single 'Jan': Cycle = 'Jan'. Prev Cycle = 'Dec'.
  //   If Range 'Feb-Mar': Cycle = 'Feb-Mar'. Prev Cycle = 'Dec-Jan'? (2 months prior)

  // Implementation for "Difference":
  // We calculated 'grandTotal' for current selection.
  // We need 'grandTotal' for the previous Equivalent duration.

  // 3. Comparison Stats
  const duration = endIndex - startIndex + 1; // Number of months
  const prevIntervalEndIndex = startIndex - 1;
  const prevIntervalStartIndex = prevIntervalEndIndex - duration + 1;

  let prevTotalUsage = 0;
  let prevTotalBW = 0;
  let prevTotalColor = 0;

  if (prevIntervalStartIndex >= 0) {
    // Calculate Prev Cycle Usage
    const pEndIso = sorted[prevIntervalEndIndex];
    const pBaseIso = prevIntervalStartIndex > 0 ? sorted[prevIntervalStartIndex - 1] : null;

    const pEndRecs = historyRecords.value.filter((r) => r.period === pEndIso);
    const pBaseRecs = pBaseIso ? historyRecords.value.filter((r) => r.period === pBaseIso) : [];

    // Store full record for baseline
    const pBaseMap: Record<string, any> = {};
    pBaseRecs.forEach((r) => (pBaseMap[r.userName] = r));

    pEndRecs.forEach((u) => {
      const baseRec = pBaseMap[u.userName];

      const uTotal = u.total || 0;
      const uBW = u.printBW || 0;
      const uColor = u.printColor || 0;

      const bTotal = baseRec?.total || 0;
      const bBW = baseRec?.printBW || 0;
      const bColor = baseRec?.printColor || 0;

      prevTotalUsage += Math.max(0, uTotal - bTotal);
      prevTotalBW += Math.max(0, uBW - bBW);
      prevTotalColor += Math.max(0, uColor - bColor);
    });
  }

  const diff = grandTotal - prevTotalUsage;
  const pct = prevTotalUsage > 0 ? (diff / prevTotalUsage) * 100 : 0;

  const diffBW = sumBW - prevTotalBW;
  const pctBW = prevTotalBW > 0 ? (diffBW / prevTotalBW) * 100 : 0;

  const diffColor = sumColor - prevTotalColor;
  const pctColor = prevTotalColor > 0 ? (diffColor / prevTotalColor) * 100 : 0;

  comparisonStats.value = {
    diff,
    percent: parseFloat(pct.toFixed(1)),
    diffBW,
    percentBW: parseFloat(pctBW.toFixed(1)),
    diffColor,
    percentColor: parseFloat(pctColor.toFixed(1)),
    prevTotal: prevTotalUsage,
  };

  hasData.value = true;
  currentPage.value = 1;
  nextTick(() => {
    if (typeof renderCharts === 'function') {
      renderCharts();
    }
  });
};

// Triggered when filters change
const refreshDashboard = () => {
  if (viewMode.value === 'single') {
    if (!selectedPeriod.value) return;
    calculateUsage(selectedPeriod.value, selectedPeriod.value);
  } else {
    // Range Mode
    if (!startPeriod.value || !endPeriod.value) return;
    // Auto-swap if start > end
    if (new Date(startPeriod.value) > new Date(endPeriod.value)) {
      const temp = startPeriod.value;
      startPeriod.value = endPeriod.value;
      endPeriod.value = temp;
    }
    calculateUsage(startPeriod.value, endPeriod.value);
  }
};

const loadLatestFromHistory = () => {
  if (availablePeriods.value.length === 0) return;
  // Default to Latest Single
  viewMode.value = 'single';
  selectedPeriod.value = availablePeriods.value[0];
  startPeriod.value = availablePeriods.value[availablePeriods.value.length - 1];
  endPeriod.value = availablePeriods.value[0];
  refreshDashboard();
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

// --- APEXCHARTS CONFIGURATIONS ---

const typeChartConfig = computed<Record<string, { label: string; color: string }>>(() => ({
  printBW: {
    label: t('services.itHelp.printer.charts.labels.printBW'),
    color: 'hsl(var(--chart-1))',
  },
  printColor: {
    label: t('services.itHelp.printer.charts.labels.printColor'),
    color: 'hsl(var(--chart-2))',
  },
  copyBW: {
    label: t('services.itHelp.printer.charts.labels.copyBW'),
    color: 'hsl(var(--chart-3))',
  },
  copyColor: {
    label: t('services.itHelp.printer.charts.labels.copyColor'),
    color: 'hsl(var(--chart-4))',
  },
}));

const typeChartData = computed(() => [
  { type: 'printBW', value: processedData.value.reduce((acc, curr) => acc + curr.printBW, 0) },
  {
    type: 'printColor',
    value: processedData.value.reduce((acc, curr) => acc + curr.printColor, 0),
  },
  { type: 'copyBW', value: processedData.value.reduce((acc, curr) => acc + curr.copyBW, 0) },
  {
    type: 'copyColor',
    value: processedData.value.reduce((acc, curr) => acc + curr.copyColor, 0),
  },
]);

const deptChartData = computed(() => {
  const deptDataMap: Record<string, number> = {};
  processedData.value.forEach((u) => {
    // Look up department name from dbDepartments if available
    const deptInfo = dbDepartments.value.find((d) => d.id === u.department);
    const resolvedName = deptInfo ? deptInfo.name : u.department;

    const key = `services.itHelp.printer.departments.${resolvedName}`;
    const deptLabel = te(key) ? t(key) : resolvedName;
    deptDataMap[deptLabel] = (deptDataMap[deptLabel] || 0) + u.total;
  });

  return Object.keys(deptDataMap)
    .sort((a, b) => deptDataMap[b] - deptDataMap[a])
    .map((label) => ({
      dept: label,
      usage: deptDataMap[label],
    }));
});

const deptChartConfig = computed<Record<string, { label: string; color: string }>>(() => {
  const config: Record<string, { label: string; color: string }> = {};
  deptChartData.value.forEach((d, i) => {
    config[d.dept] = { label: d.dept, color: `hsl(var(--chart-${(i % 5) + 1}))` };
  });
  return config;
});

const userChartData = computed(() => {
  return [...processedData.value]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((u) => ({
      name: u.user_name,
      usage: u.total,
    }));
});

const userChartConfig = computed<Record<string, { label: string; color: string }>>(() => {
  const config: Record<string, { label: string; color: string }> = {};
  userChartData.value.forEach((u, i) => {
    config[u.name] = { label: u.name, color: `hsl(var(--chart-${(i % 5) + 1}))` };
  });
  return config;
});

const baseChartOptions = {
  chart: {
    toolbar: { show: false },
    fontFamily: 'inherit',
  },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 2, colors: ['transparent'] },
  legend: { show: false },
};

// 1. Usage Type Donut
const typeChartOptions = computed(() => ({
  ...baseChartOptions,
  labels: typeChartData.value.map((d) => typeChartConfig.value[d.type].label),
  colors: typeChartData.value.map((d) => typeChartConfig.value[d.type].color),
  legend: {
    show: true,
    position: 'bottom' as const,
    horizontalAlign: 'center' as const,
    fontSize: '12px',
    markers: {
      size: 6,
    },
  },
  dataLabels: {
    enabled: true,
    formatter: (_: number, { seriesIndex, w }: any) => {
      return formatNumber(w.config.series[seriesIndex]);
    },
    dropShadow: { enabled: false },
  },
  plotOptions: {
    pie: {
      expandOnClick: true,
      donut: {
        size: '65%',
        labels: {
          show: true,
          value: {
            formatter: (val: string) => {
              const num = parseFloat(val);
              return isNaN(num) ? val : num.toLocaleString();
            },
          },
          total: {
            show: true,
            label: 'Grand Total',
            formatter: () => stats.value.grandTotal.toLocaleString(),
          },
        },
      },
    },
  },
  tooltip: {
    y: {
      formatter: (val: number) => formatNumber(val),
    },
  },
}));

const typeChartSeries = computed(() => typeChartData.value.map((d) => d.value));

// 2. Top Users Bar
const userChartOptions = computed(() => ({
  ...baseChartOptions,
  xaxis: {
    categories: userChartData.value.map((u) => u.name),
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  colors: userChartData.value.map((u) => userChartConfig.value[u.name]?.color || '#3b82f6'),
  dataLabels: {
    enabled: true,
    formatter: (val: number) => formatNumber(val),
    offsetY: -20,
    style: {
      fontSize: '11px',
      colors: ['#64748b'],
    },
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '60%',
      distributed: true,
      dataLabels: {
        position: 'top',
      },
    },
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${formatNumber(val)}`,
    },
  },
}));

const userChartSeries = computed(() => [
  {
    name: 'Usage',
    data: userChartData.value.map((u) => u.usage),
  },
]);

// 3. Usage by Dept Bar
const deptChartOptions = computed(() => ({
  ...baseChartOptions,
  xaxis: {
    categories: deptChartData.value.map((d) => d.dept),
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  colors: deptChartData.value.map((d) => deptChartConfig.value[d.dept]?.color || '#3b82f6'),
  dataLabels: {
    enabled: true,
    formatter: (val: number) => formatNumber(val),
    offsetY: -20,
    style: {
      fontSize: '11px',
      colors: ['#64748b'],
    },
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '60%',
      distributed: true,
      dataLabels: {
        position: 'top',
      },
    },
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${formatNumber(val)}`,
    },
  },
}));

const deptChartSeries = computed(() => [
  {
    name: 'Usage',
    data: deptChartData.value.map((d) => d.usage),
  },
]);

// 4. Monthly Usage History Area
const historyTrendData = computed(() => {
  if (historyRecords.value.length === 0) return [];

  // Group by period
  const periods = [...availablePeriods.value].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  if (periods.length < 2) return [];

  const results: any[] = [];

  // Add first period as baseline (0 usage)
  results.push({
    date: periods[0],
    total: 0,
    bw: 0,
    color: 0,
  });

  // For each period (starting from index 1 to calculate delta)
  for (let i = 1; i < periods.length; i++) {
    const currentIso = periods[i];
    const prevIso = periods[i - 1];

    const currentRecs = historyRecords.value.filter((r) => r.period === currentIso);
    const prevRecs = historyRecords.value.filter((r) => r.period === prevIso);

    const prevMap: Record<string, any> = {};
    prevRecs.forEach((r) => (prevMap[r.userName] = r));

    let sumTotal = 0;
    let sumBW = 0;
    let sumColor = 0;

    currentRecs.forEach((curr) => {
      const prev = prevMap[curr.userName];
      if (prev) {
        sumTotal += Math.max(0, curr.total - prev.total);
        sumBW += Math.max(0, curr.printBW - prev.printBW);
        sumColor += Math.max(0, curr.printColor - prev.printColor);
      }
    });

    results.push({
      date: currentIso,
      total: sumTotal,
      bw: sumBW,
      color: sumColor,
    });
  }

  return results;
});

const historyChartOptions = computed(() => ({
  ...baseChartOptions,
  chart: {
    ...baseChartOptions.chart,
    type: 'line' as const,
    stacked: false,
    zoom: { enabled: false },
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => formatNumber(val),
    style: {
      fontSize: '10px',
      colors: ['hsl(var(--primary))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))'],
    },
    background: {
      enabled: true,
      foreColor: '#fff',
      padding: 4,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: '#fff',
      opacity: 0.9,
    },
    offsetY: -10,
  },
  colors: ['hsl(var(--primary))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))'],
  stroke: {
    curve: 'smooth' as const,
    width: 3,
  },
  xaxis: {
    type: 'category' as const,
    categories: historyTrendData.value.map((d) => formatPeriodLabel(d.date)),
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      formatter: (val: number) => formatNumber(val),
    },
  },
  markers: {
    size: 4,
    strokeWidth: 2,
    hover: { size: 6 },
  },
  tooltip: {
    shared: true,
    intersect: false,
    y: {
      formatter: (val: number) => formatNumber(val),
    },
  },
  legend: {
    show: true,
    position: 'top' as const,
    horizontalAlign: 'right' as const,
  },
}));

const historyChartSeries = computed(() => [
  {
    name: 'Total Usage',
    data: historyTrendData.value.map((d) => d.total),
  },
  {
    name: 'B&W',
    data: historyTrendData.value.map((d) => d.bw),
  },
  {
    name: 'Color',
    data: historyTrendData.value.map((d) => d.color),
  },
]);

const renderCharts = () => {
  return;
};

const isProcessing = ref(false);
const uploadProgress = ref(0);
const processingStatus = ref('');

const parseFilePromise = (file: File): Promise<{ file: File; data: any[]; period: string }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        // Peek date
        let rawDateStr = '';
        for (const row of data) {
          if (row.tran_date) {
            rawDateStr = row.tran_date;
            break;
          }
        }
        if (!rawDateStr) {
          reject(new Error(`File ${file.name}: Could not detect date.`));
          return;
        }
        // Format: DD/MM/YYYY
        const parts = rawDateStr.split('/');
        if (parts.length !== 3) {
          reject(new Error(`File ${file.name}: Invalid date format.`));
          return;
        }
        const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, 1);
        resolve({ file, data, period: d.toISOString() });
      },
      error: (err) => reject(err),
    });
  });
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files ? Array.from(target.files) : [];
  if (files.length === 0) return;

  isProcessing.value = true;
  uploadProgress.value = 0;
  hasData.value = false;
  let successCount = 0;
  let skippedCount = 0;
  let totalRecordsCount = 0;

  try {
    // 1. Parse All Files
    processingStatus.value = `Parsing ${files.length} file(s)...`;
    const parsedFiles = [];

    for (const file of files) {
      try {
        const res = await parseFilePromise(file);
        parsedFiles.push(res);
        totalRecordsCount += res.data.length;
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || 'Parse error');
      }
    }

    if (parsedFiles.length === 0) {
      isProcessing.value = false;
      target.value = '';
      return;
    }

    // Show total records found
    toast.info(`Found ${totalRecordsCount} records in ${parsedFiles.length} file(s)`);

    // 2. Sort by Date (Ascending)
    parsedFiles.sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());

    // 3. Process Sequentially
    const total = parsedFiles.length;
    // We maintain a temporary list of "known" periods in this session to catch duplicates within the batch
    const tempKnownPeriods = new Set(historyRecords.value.map((r) => new Date(r.period).getTime()));

    for (let i = 0; i < total; i++) {
      const { file, data, period } = parsedFiles[i];
      const periodTime = new Date(period).getTime();
      const progressPercent = Math.round(((i + 1) / total) * 100);

      processingStatus.value = `Processing ${i + 1}/${total}: ${file.name} (${data.length} records)`;
      uploadProgress.value = progressPercent;

      if (tempKnownPeriods.has(periodTime)) {
        skippedCount++;
        toast.warning(`Skipped: ${file.name} - Period already exists (${data.length} records)`);
        continue;
      }

      // Map Data
      const payload = processRawDataToPayload2(data, period);

      // Save to DB
      await printerService.saveUsageRecords(payload);

      // Add to temp set so we don't re-upload if duplicate in same batch
      tempKnownPeriods.add(periodTime);
      successCount++;
    }

    // 4. Finish
    processingStatus.value = 'Finalizing...';
    await loadHistory(); // Reload from BE

    // Explicitly sort and select the LATEST period to show
    if (historyRecords.value.length > 0) {
      const periods = [...new Set(historyRecords.value.map((r) => r.period))].sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      );
      selectedPeriod.value = periods[0];
      loadLatestFromHistory(); // Render the view
    }

    // Comprehensive summary
    const savedRecords = parsedFiles
      .filter((_, idx) => idx < successCount)
      .reduce((sum, pf) => sum + pf.data.length, 0);
    const skippedRecords = parsedFiles
      .filter((_, idx) => idx >= successCount)
      .reduce((sum, pf) => sum + pf.data.length, 0);

    toast.success(
      `Upload Complete!\n✓ Saved: ${successCount} file(s) (${savedRecords} records)\n⊘ Skipped: ${skippedCount} file(s) (${skippedRecords} records)\n📊 Total: ${totalRecordsCount} records`
    );
  } catch (err) {
    console.error('Batch Upload Error:', err);
    toast.error('Batch Upload Failed');
  } finally {
    isProcessing.value = false;
    target.value = ''; // Reset input
  }
};

// Refined Payload Processor with preserved logic
const processRawDataToPayload2 = (data: any[], periodIso: string) => {
  const userMap: Record<
    string,
    {
      meterPrint: number;
      meterColor: number;
      meterCopy: number;
      meterTotal: number;
    }
  > = {};
  data.forEach((row) => {
    if (!row.user_name) return;
    const userName = row.user_name.trim();

    // Replicating EXACT logic from previous `processData` loop (first pass)
    // mColor = TotalColor or (P_Col + C_Col)
    const mColor =
      parseInt(row.TotalColor) || parseInt(row.PrintColor) + parseInt(row.CopyColor) || 0;

    // mPrint = P_BW + P_Col
    const mPrint = (parseInt(row.PrintBW) || 0) + (parseInt(row.PrintColor) || 0);

    // mCopy = C_BW + C_Col
    const mCopy = (parseInt(row.CopyBW) || 0) + (parseInt(row.CopyColor) || 0);

    // mTotal = TotalMeter or (TotalBW + TotalColor)
    const mTotal = parseInt(row.TotalMeter) || (parseInt(row.TotalBW) || 0) + mColor || 0;

    if (!userMap[userName]) {
      userMap[userName] = {
        meterPrint: 0,
        meterColor: 0,
        meterCopy: 0,
        meterTotal: 0,
      };
    }
    const u = userMap[userName];
    u.meterPrint = Math.max(u.meterPrint, mPrint);
    u.meterColor = Math.max(u.meterColor, mColor);
    u.meterCopy = Math.max(u.meterCopy, mCopy);
    u.meterTotal = Math.max(u.meterTotal, mTotal);
  });

  // Map to DB payload format, replicating `saveToDb` logic
  return Object.keys(userMap).map((userName) => {
    const u = userMap[userName];
    return {
      period: new Date(periodIso),
      userName,
      printBW: u.meterPrint, // DB field `printBW` gets aggregated `meterPrint`
      printColor: u.meterColor, // DB field `printColor` gets aggregated `meterColor`
      copyBW: u.meterCopy, // DB field `copyBW` gets aggregated `meterCopy`
      copyColor: u.meterCopy, // DB field `copyColor` also gets aggregated `meterCopy` (as per original `saveToDb` placeholder)
      total: u.meterTotal, // DB field `total` gets aggregated `meterTotal`
    };
  });
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

const renderTrendChart = () => {
  // Logic to be migrated to Unovis if needed, or removed
  return;
};

watch(historyRecords, () => {
  nextTick(() => renderTrendChart());
});

onUnmounted(() => {
  // Unovis handles its own cleanup through Vue lifecycle
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
          <!-- Date Controls -->
          <div class="flex items-center gap-2 mr-2">
            <!-- View Toggle -->
            <div class="flex bg-muted rounded-lg p-1">
              <button
                @click="
                  viewMode = 'single';
                  refreshDashboard();
                "
                :class="
                  cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-all',
                    viewMode == 'single'
                      ? 'bg-background shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  )
                "
              >
                Monthly
              </button>
              <button
                @click="
                  viewMode = 'range';
                  refreshDashboard();
                "
                :class="
                  cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-all',
                    viewMode == 'range'
                      ? 'bg-background shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  )
                "
              >
                Range
              </button>
            </div>

            <!-- Period Selectors -->
            <template v-if="viewMode === 'single'">
              <Select v-model="selectedPeriod" @update:model-value="refreshDashboard">
                <SelectTrigger class="w-[180px] h-9">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="p in availablePeriods" :key="p" :value="p">
                    {{ formatPeriodLabel(p) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </template>

            <template v-else>
              <div class="flex items-center gap-2">
                <Select v-model="startPeriod" @update:model-value="refreshDashboard">
                  <SelectTrigger class="w-[140px] h-9">
                    <SelectValue placeholder="From" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="p in availablePeriods" :key="p" :value="p">
                      {{ formatPeriodLabel(p) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <span class="text-xs text-muted-foreground">-</span>
                <Select v-model="endPeriod" @update:model-value="refreshDashboard">
                  <SelectTrigger class="w-[140px] h-9">
                    <SelectValue placeholder="To" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="p in availablePeriods" :key="p" :value="p">
                      {{ formatPeriodLabel(p) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </template>

            <Button variant="outline" size="icon" class="h-9 w-9" @click="loadHistory">
              <RefreshCw class="w-4 h-4" />
            </Button>
          </div>
          <div
            v-if="uploadedFile"
            class="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border text-right"
          >
            <div class="font-medium text-foreground max-w-[200px] truncate">
              {{ uploadedFile.name }}
            </div>
            <div>{{ (uploadedFile.size / 1024).toFixed(2) }} KB</div>
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
        </div>
      </CardHeader>
    </Card>

    <div v-if="showSettings" class="animate-in fade-in slide-in-from-top-4 duration-300">
      <PrinterSettings
        :imported-users="allImportedUsers"
        :history-records="historyRecords"
        @data-changed="loadHistory"
      >
        <template #upload-button>
          <Label for="csv-upload" class="cursor-pointer m-0">
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
            multiple
            class="hidden"
            @change="handleFileUpload"
          />
        </template>
      </PrinterSettings>
    </div>

    <div
      v-else-if="isProcessing"
      class="py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/20 animate-pulse"
    >
      <div class="w-full max-w-md space-y-4 text-center">
        <h3 class="text-xl font-semibold">
          {{ processingStatus || t('services.itHelp.printer.processing') }}
        </h3>
        <p class="text-sm text-muted-foreground">{{ uploadProgress }}%</p>
        <div class="h-2 w-full bg-secondary overflow-hidden rounded-full">
          <div
            class="h-full bg-primary transition-all duration-300 ease-out"
            :style="{ width: `${uploadProgress}%` }"
          ></div>
        </div>
      </div>
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
      <!-- Unified Dashboard Stats Bar -->
      <Card class="shadow-sm border-slate-200 overflow-hidden">
        <div class="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x bg-white">
          <!-- 1. Usage Trend (Span 3) -->
          <div class="lg:col-span-3 p-4 flex flex-col justify-center">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-muted-foreground">Usage Trend</span>
              <span
                class="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border/50"
              >
                Previous {{ viewMode === 'range' ? 'Range' : 'Month' }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-4 divide-x">
              <!-- B&W Trend -->
              <div class="flex flex-col gap-0.5">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold text-slate-600">B&W</span>
                  <span
                    :class="
                      cn(
                        'text-[10px] px-1.5 py-0.5 rounded-sm font-bold flex items-center gap-1',
                        comparisonStats.diffBW > 0
                          ? 'bg-red-50 text-red-600'
                          : 'bg-green-50 text-green-600'
                      )
                    "
                  >
                    <TrendingUp v-if="comparisonStats.diffBW > 0" class="h-3 w-3" />
                    <TrendingDown v-else class="h-3 w-3" />
                    {{ formatNumber(Math.abs(comparisonStats.diffBW)) }}
                  </span>
                </div>
                <div
                  :class="
                    cn(
                      'text-xl font-bold tracking-tight flex items-center gap-1.5',
                      comparisonStats.diffBW > 0 ? 'text-red-600' : 'text-green-600'
                    )
                  "
                >
                  <TrendingUp v-if="comparisonStats.diffBW > 0" class="h-4 w-4" />
                  <TrendingDown v-else class="h-4 w-4" />
                  {{ Math.abs(comparisonStats.percentBW).toFixed(1) }}%
                </div>
              </div>
              <!-- Color Trend -->
              <div class="flex flex-col gap-0.5 pl-4">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold text-pink-600">Color</span>
                  <span
                    :class="
                      cn(
                        'text-[10px] px-1.5 py-0.5 rounded-sm font-bold flex items-center gap-1',
                        comparisonStats.diffColor > 0
                          ? 'bg-red-50 text-red-600'
                          : 'bg-green-50 text-green-600'
                      )
                    "
                  >
                    <TrendingUp v-if="comparisonStats.diffColor > 0" class="h-3 w-3" />
                    <TrendingDown v-else class="h-3 w-3" />
                    {{ formatNumber(Math.abs(comparisonStats.diffColor)) }}
                  </span>
                </div>
                <div
                  :class="
                    cn(
                      'text-xl font-bold tracking-tight flex items-center gap-1.5',
                      comparisonStats.diffColor > 0 ? 'text-red-600' : 'text-green-600'
                    )
                  "
                >
                  <TrendingUp v-if="comparisonStats.diffColor > 0" class="h-4 w-4" />
                  <TrendingDown v-else class="h-4 w-4" />
                  {{ Math.abs(comparisonStats.percentColor).toFixed(1) }}%
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Users & Depts (Span 2) -->
          <div class="lg:col-span-2 p-4 flex flex-col justify-center bg-slate-50/30">
            <div class="grid grid-cols-2 gap-4 divide-x h-full items-center">
              <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-medium text-muted-foreground">Total Users</span>
                  <Users class="h-3.5 w-3.5 text-muted-foreground/70" />
                </div>
                <div class="text-2xl font-bold text-slate-700">
                  {{ formatNumber(stats.totalUsers) }}
                </div>
              </div>
              <div class="flex flex-col gap-1 pl-4">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-medium text-muted-foreground">Total Depts</span>
                  <BarChart3 class="h-3.5 w-3.5 text-muted-foreground/70" />
                </div>
                <div class="text-2xl font-bold text-slate-700">
                  {{ formatNumber(stats.totalDepts) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Usage Breakdown (Span 7) -->
          <div
            class="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x"
          >
            <!-- Grand Total -->
            <div class="p-4 flex flex-col justify-center bg-blue-50/40">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-semibold text-blue-600">Grand Total Usage</span>
                <Printer class="h-4 w-4 text-blue-600" />
              </div>
              <div class="text-3xl font-bold text-blue-700">
                {{ formatNumber(stats.grandTotal) }}
              </div>
            </div>
            <!-- B&W -->
            <div class="p-4 flex flex-col justify-center">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-semibold text-slate-600">Total Print B&W</span>
                <div class="h-2.5 w-2.5 rounded-full bg-blue-500" />
              </div>
              <div class="text-3xl font-bold text-slate-800">{{ formatNumber(stats.totalBW) }}</div>
            </div>
            <!-- Color -->
            <div class="p-4 flex flex-col justify-center">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-semibold text-slate-600">Total Print Color</span>
                <div class="h-2.5 w-2.5 rounded-full bg-pink-500" />
              </div>
              <div class="text-3xl font-bold text-slate-800">
                {{ formatNumber(stats.totalColor) }}
              </div>
            </div>
          </div>
        </div>
      </Card>

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
              <apexchart
                type="bar"
                height="320"
                :options="userChartOptions"
                :series="userChartSeries"
              />
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
              <apexchart
                :key="locale"
                type="bar"
                height="320"
                :options="deptChartOptions"
                :series="deptChartSeries"
              />
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
              <apexchart
                :key="locale"
                type="donut"
                height="320"
                class="w-full"
                :options="typeChartOptions"
                :series="typeChartSeries"
              />
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
            <apexchart
              :key="locale"
              type="line"
              height="320"
              :options="historyChartOptions"
              :series="historyChartSeries"
            />
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
