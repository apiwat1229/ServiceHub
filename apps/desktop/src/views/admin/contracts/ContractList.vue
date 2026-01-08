<script setup lang="ts">
import Badge from '@/components/ui/badge/Badge.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner/Spinner.vue';
import Tabs from '@/components/ui/tabs/Tabs.vue';
import TabsList from '@/components/ui/tabs/TabsList.vue';
import TabsTrigger from '@/components/ui/tabs/TabsTrigger.vue';
import { contractsService, type Contract } from '@/services/contracts';
import { differenceInDays } from 'date-fns';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  Edit,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import ContractsDataTable from './components/ContractsDataTable.vue';

const router = useRouter();
const { t } = useI18n();

// State
const contracts = ref<Contract[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const statusFilter = ref('ALL');
const selectedPeriod = ref<'1month' | '3months' | '6months'>('3months'); // Default to 3 months

// Load Data
const loadContracts = async () => {
  loading.value = true;
  try {
    contracts.value = await contractsService.getContracts();
  } catch (err) {
    console.error(err);
    toast.error('Failed to load contracts');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadContracts();
});

// Helper Functions
const getDaysRemaining = (endDate: string): number => {
  return differenceInDays(new Date(endDate), new Date());
};

const getUrgencyLevel = (days: number): 'critical' | 'warning' | 'normal' => {
  if (days < 0) return 'critical';
  if (days < 30) return 'critical';
  if (days < 90) return 'warning';
  return 'normal';
};

const getUrgencyColor = (days: number): string => {
  const level = getUrgencyLevel(days);
  switch (level) {
    case 'critical':
      return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100';
    case 'warning':
      return 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100';
    default:
      return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100';
  }
};

const getRowHighlight = (days: number): string => {
  const level = getUrgencyLevel(days);
  switch (level) {
    case 'critical':
      return 'bg-red-50/50 hover:bg-red-50';
    case 'warning':
      return 'bg-orange-50/30 hover:bg-orange-50/50';
    default:
      return 'hover:bg-slate-50/50';
  }
};

// Computed
const periodDays = computed(() => {
  switch (selectedPeriod.value) {
    case '1month':
      return 30;
    case '3months':
      return 90;
    case '6months':
      return 180;
    default:
      return 30;
  }
});

const expiringContracts = computed(() => {
  return contracts.value
    .filter((c) => {
      const days = getDaysRemaining(c.endDate);
      return days >= 0 && days <= periodDays.value && c.status !== 'Expired';
    })
    .sort((a, b) => getDaysRemaining(a.endDate) - getDaysRemaining(b.endDate))
    .slice(0, 10); // Top 10
});

const contractStats = computed(() => {
  const active = contracts.value.filter((c) => c.status === 'Active');
  const expiringValue = expiringContracts.value.reduce((sum, c) => sum + (c.cost || 0), 0);
  const expiring = expiringContracts.value.length;

  return {
    total: contracts.value.length,
    active: active.length,
    expiringValue,
    expiring,
  };
});

const filteredContracts = computed(() => {
  let result = expiringContracts.value;

  if (statusFilter.value !== 'ALL') {
    result = result.filter((c) => c.status === statusFilter.value);
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.responsiblePerson.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
    );
  }

  return result;
});

// Actions
const handleCreate = () => {
  router.push('/admin/contracts/create');
};

const handleEdit = (id: string) => {
  router.push(`/admin/contracts/${id}`);
};

const handleDelete = async (id: string) => {
  if (!confirm(t('services.contracts.actions.deleteConfirm'))) return;
  try {
    await contractsService.deleteContract(id);
    toast.success(t('services.contracts.contractDeleted'));
    await loadContracts();
  } catch (err) {
    toast.error(t('services.contracts.errorSaving'));
  }
};

// Formatting
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(val);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr)
    .toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })
    .replace(/ /g, '-');
};

const formatDaysRemaining = (days: number): string => {
  if (days < 0) return t('services.contracts.dashboard.table.expired');
  if (days === 0) return t('services.contracts.dashboard.table.today');
  if (days === 1) return `1 ${t('services.contracts.dashboard.table.day')}`;
  return `${days} ${t('services.contracts.dashboard.table.days')}`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
    case 'Expiring':
      return 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100';
    case 'Expired':
      return 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100';
  }
};
</script>

<template>
  <div class="p-6 space-y-6 bg-slate-50/50 min-h-screen">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">
          {{ t('services.contracts.dashboard.title') }}
        </h1>
        <p class="text-muted-foreground mt-1">
          {{ t('services.contracts.dashboard.subtitle') }}
        </p>
      </div>
      <Button @click="handleCreate" class="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md">
        <Plus class="w-4 h-4" />
        {{ t('services.contracts.createContract') }}
      </Button>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Expiring Value (moved to first) -->
      <Card class="border-border/50 shadow-sm">
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('services.contracts.dashboard.stats.expiringValue') }}
              </p>
              <h3 class="text-3xl font-bold mt-2">
                {{ formatCurrency(contractStats.expiringValue) }}
              </h3>
              <p class="text-xs text-muted-foreground mt-1">
                {{ t('services.contracts.dashboard.stats.expiringValueDesc') }}
              </p>
            </div>
            <div class="p-3 bg-orange-50 rounded-lg">
              <DollarSign class="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Total Contracts -->
      <Card class="border-border/50 shadow-sm">
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('services.contracts.dashboard.stats.totalContracts') }}
              </p>
              <h3 class="text-3xl font-bold mt-2">{{ contractStats.total }}</h3>
              <p class="text-xs text-muted-foreground mt-1">
                {{ t('services.contracts.dashboard.stats.totalContractsDesc') }}
              </p>
            </div>
            <div class="p-3 bg-blue-50 rounded-lg">
              <FileText class="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Active Status -->
      <Card class="border-border/50 shadow-sm">
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('services.contracts.dashboard.stats.activeStatus') }}
              </p>
              <h3 class="text-3xl font-bold mt-2">{{ contractStats.active }}</h3>
              <p class="text-xs text-muted-foreground mt-1">
                {{ t('services.contracts.dashboard.stats.activeStatusDesc') }}
              </p>
            </div>
            <div class="p-3 bg-emerald-50 rounded-lg">
              <CheckCircle2 class="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Expiring Soon -->
      <Card class="border-orange-200 shadow-sm bg-orange-50/30">
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-orange-700">
                {{ t('services.contracts.dashboard.stats.expiringSoon') }}
              </p>
              <h3 class="text-3xl font-bold mt-2 text-orange-900">{{ contractStats.expiring }}</h3>
              <p class="text-xs text-orange-600 mt-1">
                {{
                  t('services.contracts.dashboard.stats.expiringSoonDesc', {
                    period: t(`services.contracts.dashboard.periods.${selectedPeriod}`),
                  })
                }}
              </p>
            </div>
            <div class="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle class="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filter Section -->
    <Card class="border-border/50 shadow-sm">
      <CardHeader class="pb-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <CardTitle class="text-lg">
              {{ t('services.contracts.status.expiring') }}
              {{ t('services.contracts.contractList') }}
            </CardTitle>
            <Tabs v-model="selectedPeriod" class="w-auto">
              <TabsList>
                <TabsTrigger value="1month" class="text-xs">
                  {{ t('services.contracts.dashboard.periods.1month') }}
                </TabsTrigger>
                <TabsTrigger value="3months" class="text-xs">
                  {{ t('services.contracts.dashboard.periods.3months') }}
                </TabsTrigger>
                <TabsTrigger value="6months" class="text-xs">
                  {{ t('services.contracts.dashboard.periods.6months') }}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div class="flex items-center gap-2">
            <!-- Search -->
            <div class="relative w-full md:w-64">
              <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                v-model="searchQuery"
                type="search"
                :placeholder="t('services.contracts.dashboard.filters.searchPlaceholder')"
                class="pl-8 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
            </div>
            <!-- Filter -->
            <Select v-model="statusFilter">
              <SelectTrigger class="w-[140px]">
                <div class="flex items-center gap-2 text-muted-foreground">
                  <Filter class="w-3.5 h-3.5" />
                  <SelectValue :placeholder="t('services.contracts.dashboard.filters.status')" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {{ t('services.contracts.dashboard.filters.allStatus') }}
                </SelectItem>
                <SelectItem value="Active">
                  {{ t('services.contracts.status.active') }}
                </SelectItem>
                <SelectItem value="Expiring">
                  {{ t('services.contracts.status.expiring') }}
                </SelectItem>
                <SelectItem value="Expired">
                  {{ t('services.contracts.status.expired') }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-20">
          <Spinner class="h-10 w-10 text-primary" />
        </div>

        <!-- Empty State -->
        <div
          v-else-if="filteredContracts.length === 0"
          class="text-center py-16 text-muted-foreground"
        >
          <div
            class="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Calendar class="w-8 h-8 text-slate-400" />
          </div>
          <h3 class="text-lg font-medium text-slate-900">
            {{ t('common.table.noResults') }}
          </h3>
          <p class="max-w-sm mx-auto mt-1">
            {{
              t('services.contracts.dashboard.stats.expiringSoonDesc', {
                period: t(`services.contracts.dashboard.periods.${selectedPeriod}`),
              })
            }}
          </p>
        </div>

        <!-- Table -->
        <div v-else class="rounded-md border overflow-hidden">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th class="px-4 py-3">{{ t('services.contracts.dashboard.table.title') }}</th>
                <th class="px-4 py-3">{{ t('services.contracts.dashboard.table.type') }}</th>
                <th class="px-4 py-3">{{ t('services.contracts.dashboard.table.department') }}</th>
                <th class="px-4 py-3">{{ t('services.contracts.dashboard.table.duration') }}</th>
                <th class="px-4 py-3 text-center">
                  {{ t('services.contracts.dashboard.table.daysLeft') }}
                </th>
                <th class="px-4 py-3 text-right">
                  {{ t('services.contracts.dashboard.table.value') }}
                </th>
                <th class="px-4 py-3 text-center">
                  {{ t('services.contracts.dashboard.table.status') }}
                </th>
                <th class="px-4 py-3 text-right">
                  {{ t('services.contracts.dashboard.table.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="contract in filteredContracts"
                :key="contract.id"
                :class="[
                  'group transition-colors',
                  getRowHighlight(getDaysRemaining(contract.endDate)),
                ]"
              >
                <td class="px-4 py-3 font-medium text-slate-900">
                  <div class="flex items-center gap-2">
                    <div class="p-1.5 rounded bg-blue-50 text-blue-600">
                      <FileText class="w-4 h-4" />
                    </div>
                    {{ contract.title }}
                  </div>
                </td>
                <td class="px-4 py-3 text-slate-600">
                  {{ t(`services.contracts.types.${contract.contractType.toLowerCase()}`) }}
                </td>
                <td class="px-4 py-3 text-slate-600">{{ contract.department }}</td>
                <td class="px-4 py-3">
                  <div class="text-xs text-slate-900 whitespace-nowrap">
                    {{ formatDate(contract.startDate) }} → {{ formatDate(contract.endDate) }}
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  <Badge
                    :class="[
                      'font-semibold border',
                      getUrgencyColor(getDaysRemaining(contract.endDate)),
                    ]"
                  >
                    {{ formatDaysRemaining(getDaysRemaining(contract.endDate)) }}
                  </Badge>
                </td>
                <td class="px-4 py-3 text-right font-medium text-slate-700">
                  {{ formatCurrency(contract.cost) }}
                </td>
                <td class="px-4 py-3 text-center">
                  <Badge :class="['border', getStatusColor(contract.status)]">
                    {{ t(`services.contracts.status.${contract.status.toLowerCase()}`) }}
                  </Badge>
                </td>
                <td class="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" class="h-8 w-8 p-0">
                        <span class="sr-only">Open menu</span>
                        <MoreHorizontal class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        {{ t('services.contracts.dashboard.table.actions') }}
                      </DropdownMenuLabel>
                      <DropdownMenuItem @click="handleEdit(contract.id)">
                        <Edit class="mr-2 h-4 w-4" />
                        {{ t('services.contracts.actions.edit') }}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download class="mr-2 h-4 w-4" />
                        {{ t('services.contracts.actions.download') }}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        @click="handleDelete(contract.id)"
                        class="text-red-600 focus:text-red-600"
                      >
                        <Trash2 class="mr-2 h-4 w-4" />
                        {{ t('services.contracts.actions.delete') }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- All Contracts Table -->
    <Card class="border-border/50 shadow-sm">
      <CardHeader class="pb-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <CardTitle class="text-lg">
            {{ t('services.contracts.dashboard.table.allContracts') }}
          </CardTitle>
          <div class="text-sm text-muted-foreground">
            {{ t('services.contracts.dashboard.table.total', { count: contracts.length }) }}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-20">
          <Spinner class="h-10 w-10 text-primary" />
        </div>

        <!-- DataTable with Pagination -->
        <ContractsDataTable
          v-else
          :contracts="contracts"
          :on-edit="handleEdit"
          :on-delete="handleDelete"
        />
      </CardContent>
    </Card>
  </div>
</template>
