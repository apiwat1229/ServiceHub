<template>
  <div class="p-6 max-w-7xl mx-auto space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">
          {{ t('admin.systemStatus.title') }}
        </h1>
        <p class="text-slate-500 mt-1 text-lg">
          {{ t('admin.systemStatus.subtitle') }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="fetchStatus" :disabled="loading" class="h-10 px-4">
          <RefreshCw :class="['w-4 h-4 mr-2', loading && 'animate-spin']" />
          {{ t('admin.systemStatus.refresh') }}
        </Button>
      </div>
    </div>

    <!-- Overall Status Banner -->
    <div
      class="rounded-xl border bg-white p-6 shadow-sm flex items-center gap-5 transition-all duration-300"
      :class="status === 'ok' ? 'border-emerald-100' : 'border-rose-100'"
    >
      <div
        class="flex h-16 w-16 items-center justify-center rounded-full shadow-sm"
        :class="status === 'ok' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
      >
        <CheckCircle2 v-if="status === 'ok'" class="h-8 w-8" />
        <AlertTriangle v-else class="h-8 w-8" />
      </div>
      <div class="space-y-1">
        <h2 class="text-2xl font-semibold tracking-tight text-slate-900">
          {{
            status === 'ok'
              ? t('admin.systemStatus.allSystemsOperational')
              : t('admin.systemStatus.systemIssues')
          }}
        </h2>
        <p class="text-slate-500">
          {{
            status === 'ok'
              ? 'All services are functioning normally.'
              : 'Some systems are experiencing performance degradation.'
          }}
        </p>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid gap-6 md:grid-cols-3">
      <!-- Uptime -->
      <Card class="bg-white shadow-sm border-slate-200">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-slate-500">
            {{ t('admin.systemStatus.uptime') }}
          </CardTitle>
          <Timer class="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-slate-900">
            {{ uptime ? formatUptimeShort(uptime) : '-' }}
          </div>
          <p class="text-xs text-emerald-600 mt-1 font-medium">Updated just now</p>
        </CardContent>
      </Card>

      <!-- Response Time -->
      <Card class="bg-white shadow-sm border-slate-200">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-slate-500">
            {{ t('admin.systemStatus.responseTime') }}
          </CardTitle>
          <Zap class="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-slate-900">
            {{ responseTime ? responseTime.toFixed(0) : '-' }}
            <span class="text-sm font-normal text-slate-400">ms</span>
          </div>
          <p :class="['text-xs mt-1 font-medium', getLatencyColor(responseTime)]">
            {{ getLatencyStatus(responseTime) }}
          </p>
        </CardContent>
      </Card>

      <!-- Last Checked -->
      <Card class="bg-white shadow-sm border-slate-200">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-slate-500">
            {{ t('admin.systemStatus.lastChecked') }}
          </CardTitle>
          <Clock class="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-slate-900">
            {{ lastChecked ? formatTimeRaw(lastChecked) : '-' }}
          </div>
          <p class="text-xs text-slate-500 mt-1">Next check in {{ pollInterval / 1000 }}s</p>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <!-- System Services -->
      <Card class="bg-white shadow-sm border-slate-200 col-span-1">
        <CardHeader>
          <CardTitle class="text-lg font-semibold flex items-center gap-2">
            <Server class="w-5 h-5 text-slate-400" />
            {{ t('admin.systemStatus.systemServices') }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <!-- API Server -->
            <div class="flex items-center justify-between p-4 rounded-lg border bg-slate-50/50">
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-2.5 h-2.5 rounded-full',
                    status === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500',
                  ]"
                ></div>
                <div class="font-medium text-slate-700">API Gateway</div>
              </div>
              <div class="flex items-center gap-4">
                <span
                  class="text-sm font-medium"
                  :class="status === 'ok' ? 'text-emerald-600' : 'text-rose-600'"
                >
                  {{ status === 'ok' ? 'Operational' : 'Issues' }}
                </span>
              </div>
            </div>

            <!-- Inferred Database -->
            <div class="flex items-center justify-between p-4 rounded-lg border bg-slate-50/50">
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-2.5 h-2.5 rounded-full',
                    status === 'ok' ? 'bg-emerald-500' : 'bg-rose-500',
                  ]"
                ></div>
                <div class="font-medium text-slate-700">Database Connection</div>
              </div>
              <div class="flex items-center gap-4">
                <span
                  class="text-sm font-medium"
                  :class="status === 'ok' ? 'text-emerald-600' : 'text-rose-600'"
                >
                  {{ status === 'ok' ? 'Operational' : 'Degraded' }}
                </span>
              </div>
            </div>

            <!-- External Services -->
            <div class="flex items-center justify-between p-4 rounded-lg border bg-slate-50/50">
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-2.5 h-2.5 rounded-full',
                    status === 'ok' ? 'bg-emerald-500' : 'bg-rose-500',
                  ]"
                ></div>
                <div class="font-medium text-slate-700">Redis Cache</div>
              </div>
              <div class="flex items-center gap-4">
                <span
                  class="text-sm font-medium"
                  :class="status === 'ok' ? 'text-emerald-600' : 'text-rose-600'"
                >
                  {{ status === 'ok' ? 'Operational' : 'Degraded' }}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Recent Checks -->
      <Card class="bg-white shadow-sm border-slate-200 col-span-1">
        <CardHeader>
          <CardTitle class="text-lg font-semibold flex items-center gap-2">
            <History class="w-5 h-5 text-slate-400" />
            {{ t('admin.systemStatus.recentChecks') }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="rounded-md border overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 text-slate-500">
                <tr class="border-b">
                  <th class="h-10 px-4 text-left font-medium">
                    {{ t('admin.systemStatus.status') }}
                  </th>
                  <th class="h-10 px-4 text-left font-medium">Time</th>
                  <th class="h-10 px-4 text-right font-medium">
                    {{ t('admin.systemStatus.latency') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(check, i) in history"
                  :key="i"
                  class="border-b last:border-0 hover:bg-slate-50/50"
                >
                  <td class="p-4">
                    <div class="flex items-center gap-2">
                      <CheckCircle2 v-if="check.status === 'ok'" class="w-4 h-4 text-emerald-500" />
                      <AlertTriangle v-else class="w-4 h-4 text-rose-500" />
                      <span
                        class="font-medium"
                        :class="check.status === 'ok' ? 'text-emerald-700' : 'text-rose-700'"
                      >
                        {{ check.status === 'ok' ? 'OK' : 'Error' }}
                      </span>
                    </div>
                  </td>
                  <td class="p-4 text-slate-600">
                    {{ formatTimeRaw(check.timestamp) }}
                  </td>
                  <td class="p-4 text-right font-mono text-slate-600">
                    {{ check.latency.toFixed(0) }} ms
                  </td>
                </tr>
                <tr v-if="history.length === 0">
                  <td colspan="3" class="p-8 text-center text-muted-foreground">
                    No data available yet
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  RefreshCw,
  Server,
  Timer,
  Zap,
} from 'lucide-vue-next';
import { onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: Date;
  latency: number;
}

const status = ref<'ok' | 'error' | null>(null);
const uptime = ref<number | null>(null);
const lastChecked = ref<Date | null>(null);
const responseTime = ref<number | null>(null);
const loading = ref(false);
const history = ref<HealthCheck[]>([]);

const pollInterval = 10000;
let timer: ReturnType<typeof setInterval> | null = null;

const fetchStatus = async () => {
  loading.value = true;
  const start = performance.now();
  let currentStatus: 'ok' | 'error' = 'error';

  try {
    const res = await fetch('https://app.ytrc.co.th/api/health');
    const end = performance.now();
    const duration = end - start;
    responseTime.value = duration;

    if (res.ok) {
      const data = await res.json();
      currentStatus = data.status === 'ok' ? 'ok' : 'error';
      uptime.value = data.uptime;
      lastChecked.value = new Date();
    }
  } catch (error) {
    console.error('Failed to fetch status:', error);
  } finally {
    status.value = currentStatus;
    if (responseTime.value !== null) {
      addToHistory(currentStatus, new Date(), responseTime.value);
    }
    loading.value = false;
  }
};

const addToHistory = (status: 'ok' | 'error', timestamp: Date, latency: number) => {
  history.value.unshift({ status, timestamp, latency });
  if (history.value.length > 5) history.value.pop();
};

const formatUptimeShort = (seconds: number) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);

  return parts.join(' ');
};

const formatTimeRaw = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const getLatencyColor = (ms: number | null) => {
  if (!ms) return 'text-slate-500';
  if (ms < 200) return 'text-emerald-600';
  if (ms < 500) return 'text-amber-600';
  return 'text-rose-600';
};

const getLatencyStatus = (ms: number | null) => {
  if (!ms) return 'Unknown';
  if (ms < 200) return 'Excellent';
  if (ms < 500) return 'Good';
  return 'Slow';
};

onMounted(() => {
  fetchStatus();
  timer = setInterval(fetchStatus, pollInterval);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
