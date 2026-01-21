<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/services/api';
import { format } from 'date-fns';
import { FileText, Loader2, RefreshCw } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import RawMaterialPlanViewModal from './RawMaterialPlanViewModal.vue';

const { t } = useI18n();
const props = defineProps<{
  searchQuery?: string;
  date?: any;
}>();

const emit = defineEmits<{
  (e: 'edit', plan: any): void;
}>();

// Data states
const plans = ref<any[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Modal state
const isViewModalOpen = ref(false);
const selectedPlanId = ref<string | null>(null);
const isAutoPrint = ref(false);

const openViewModal = (id: string, autoPrint = false) => {
  selectedPlanId.value = id;
  isAutoPrint.value = autoPrint;
  isViewModalOpen.value = true;
};

const fetchPlans = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await api.get('/raw-material-plans');
    plans.value = response.data;
  } catch (err: any) {
    console.error('Failed to fetch plans:', err);
    error.value = 'Failed to load plans. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchPlans();
});

const formatDate = (date: string | Date) => {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd-MMM-yy');
  } catch (e) {
    return date;
  }
};

const filteredPlans = computed(() => {
  if (!props.searchQuery) return plans.value;
  const q = props.searchQuery.toLowerCase();
  return plans.value.filter(
    (p) =>
      p.planNo.toLowerCase().includes(q) ||
      p.refProductionNo?.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q) ||
      p.creator?.toLowerCase().includes(q) ||
      p.revisionNo?.toLowerCase().includes(q)
  );
});

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'default';
    case 'CLOSED':
      return 'secondary';
    case 'DRAFT':
      return 'outline';
    default:
      return 'outline';
  }
};
</script>

<template>
  <div class="space-y-4">
    <!-- Independent Header -->
    <!-- Header with Refresh Button -->
    <div class="flex items-center justify-between px-1">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-black text-slate-800 uppercase tracking-tight">
          {{ t('qa.tabs.planList') }}
        </h3>
        <Badge
          v-if="filteredPlans.length"
          variant="outline"
          class="text-[10px] h-5 px-1.5 font-bold"
        >
          {{ filteredPlans.length }} plans
        </Badge>
      </div>
      <Button
        variant="ghost"
        size="sm"
        @click="fetchPlans"
        :disabled="isLoading"
        class="h-8 gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-all rounded-md"
      >
        <RefreshCw :class="{ 'animate-spin': isLoading }" class="w-3.5 h-3.5" />
        {{ t('common.refresh') || 'Refresh' }}
      </Button>
    </div>

    <!-- Table Container -->
    <div class="border rounded-lg bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader class="bg-slate-50">
          <TableRow>
            <TableHead class="w-32 font-black text-slate-700 uppercase tracking-tighter text-[10px]"
              >Date</TableHead
            >
            <TableHead class="w-24 font-black text-slate-700 uppercase tracking-tighter text-[10px]"
              >Plan No.</TableHead
            >
            <TableHead class="w-16 font-black text-slate-700 uppercase tracking-tighter text-[10px]"
              >Revision</TableHead
            >
            <TableHead class="font-black text-slate-700 uppercase tracking-tighter text-[10px]"
              >Reference Production</TableHead
            >
            <TableHead class="font-black text-slate-700 uppercase tracking-tighter text-[10px]"
              >Created By</TableHead
            >
            <TableHead
              class="w-24 font-black text-slate-700 uppercase tracking-tighter text-[10px] text-center"
              >Status</TableHead
            >
            <TableHead
              class="w-32 font-black text-slate-700 uppercase tracking-tighter text-[10px] text-right"
              >Actions</TableHead
            >
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="plan in filteredPlans"
            :key="plan.id"
            class="hover:bg-slate-50 transition-colors"
          >
            <TableCell class="font-medium text-slate-500">{{
              formatDate(plan.issuedDate)
            }}</TableCell>
            <TableCell>
              <span
                class="font-bold text-primary cursor-pointer hover:underline"
                @click="emit('edit', plan)"
              >
                {{ plan.planNo }}
              </span>
            </TableCell>
            <TableCell class="text-center font-mono">{{ plan.revisionNo }}</TableCell>
            <TableCell>{{ plan.refProductionNo }}</TableCell>
            <TableCell class="text-muted-foreground">{{ plan.creator }}</TableCell>
            <TableCell class="text-center">
              <Badge
                :variant="getStatusVariant(plan.status)"
                class="rounded-full px-3 text-[9px] font-black uppercase tracking-widest"
              >
                {{ plan.status }}
              </Badge>
            </TableCell>
            <TableCell class="text-right">
              <div class="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  @click="openViewModal(plan.id, false)"
                >
                  <FileText class="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="plans.length === 0 && !isLoading">
            <TableCell colspan="7" class="h-32 text-center text-slate-400 italic">
              {{ error || 'No plans found.' }}
              <Button v-if="error" variant="link" @click="fetchPlans" class="ml-2"> Retry </Button>
            </TableCell>
          </TableRow>
          <TableRow v-if="isLoading">
            <TableCell colspan="7" class="h-32 text-center">
              <div class="flex flex-col items-center justify-center gap-2">
                <Loader2 class="w-8 h-8 animate-spin text-primary/40" />
                <span class="text-xs text-muted-foreground animate-pulse">Loading data...</span>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- View/Print Modal -->
    <RawMaterialPlanViewModal
      v-if="selectedPlanId"
      :plan-id="selectedPlanId"
      v-model:open="isViewModalOpen"
      :auto-print="isAutoPrint"
    />
  </div>
</template>
