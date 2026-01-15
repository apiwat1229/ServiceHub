<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { bookingsApi } from '@/services/bookings';
import { poolsApi, type Pool } from '@/services/pools';
import {
  Calendar,
  ChevronRight,
  Database,
  FlaskConical,
  Info,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { toast } from 'vue-sonner';

const props = defineProps<{
  open: boolean;
  pool: Pool | null;
}>();

const emit = defineEmits(['update:open', 'refresh']);

const activeTab = ref<'items' | 'add'>('items');
const isLoading = ref(false);
const poolDetails = ref<Pool | null>(null);

// Add Items state
const dateRange = ref({
  start: new Date().toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0],
});
const candidates = ref<any[]>([]);
const isSearching = ref(false);
const searchQuery = ref('');
const selectedIds = ref<string[]>([]);

const fetchPoolDetails = async () => {
  if (!props.pool?.id) return;
  isLoading.value = true;
  try {
    poolDetails.value = await poolsApi.getOne(props.pool.id);
    activeTab.value = poolDetails.value.status === 'empty' ? 'add' : 'items';
  } catch (error) {
    toast.error('Failed to load pool details');
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.open,
  (val) => {
    if (val) {
      fetchPoolDetails();
      selectedIds.value = [];
      searchQuery.value = '';
      activeTab.value = props.pool?.status === 'empty' ? 'add' : 'items';
    }
  }
);

const searchCandidates = async () => {
  isSearching.value = true;
  try {
    // In this project, bookingsApi.getAll() returns all. We might need to filter by date.
    // Assuming backend supports date filtering eventually, but for now we filter in frontend.
    const allBookings = await bookingsApi.getAll();

    // Filter by date range and Ensure they have grade/DRC (recorded)
    candidates.value = allBookings
      .filter((b: any) => {
        const bDate = b.date.split('T')[0];
        const inRange = bDate >= dateRange.value.start && bDate <= dateRange.value.end;
        const hasResult = b.lotNo && b.labSamples && b.labSamples.length > 0;

        // Filter out if already in a pool?
        // For now, simple filter.

        // If pool has grade/type, must match
        if (poolDetails.value && poolDetails.value.status !== 'empty') {
          const typeMatch = b.displayRubberType === poolDetails.value.rubberType;
          const gradeMatch = b.displayGrade === poolDetails.value.grade;
          if (!typeMatch || !gradeMatch) return false;
        }

        return inRange && hasResult;
      })
      .map((b: any) => ({
        ...b,
        // Create a normalized displayWeight for the UI
        displayWeight: b.displayWeight || b.netWeight || b.totalWeight || 0,
      }));
  } catch (error) {
    toast.error('Search failed');
  } finally {
    isSearching.value = false;
  }
};

const handleAddItems = async () => {
  if (!poolDetails.value || selectedIds.value.length === 0) return;

  isLoading.value = true;
  try {
    const itemsToAdd = candidates.value.filter((c) => selectedIds.value.includes(c.id));
    await poolsApi.addItems(poolDetails.value.id, itemsToAdd);
    toast.success('Items added to pool');
    emit('refresh');
    await fetchPoolDetails();
    selectedIds.value = [];
    activeTab.value = 'items';
  } catch (error) {
    toast.error('Failed to add items');
  } finally {
    isLoading.value = false;
  }
};

const handleRemoveItem = async (bookingId: string) => {
  if (!poolDetails.value) return;
  try {
    await poolsApi.removeItem(poolDetails.value.id, bookingId);
    toast.success('Item removed');
    emit('refresh');
    await fetchPoolDetails();
  } catch (error) {
    toast.error('Failed to remove item');
  }
};

const handleClosePool = async () => {
  if (!poolDetails.value) return;
  try {
    await poolsApi.close(poolDetails.value.id);
    toast.success('Pool closed');
    emit('refresh');
    await fetchPoolDetails();
  } catch (error) {
    toast.error('Failed to close pool');
  }
};

const handleReopenPool = async () => {
  if (!poolDetails.value) return;
  try {
    await poolsApi.reopen(poolDetails.value.id);
    toast.success('Pool reopened');
    emit('refresh');
    await fetchPoolDetails();
  } catch (error) {
    toast.error('Failed to reopen pool');
  }
};

const filteredCandidates = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return candidates.value.filter(
    (c) =>
      c.lotNo.toLowerCase().includes(query) ||
      c.supplierName.toLowerCase().includes(query) ||
      c.supplierCode.toLowerCase().includes(query)
  );
});

const poolDuration = computed(() => {
  if (!poolDetails.value?.fillingDate) return '-';
  const start = new Date(poolDetails.value.fillingDate);
  const end = poolDetails.value.closeDate ? new Date(poolDetails.value.closeDate) : new Date();
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays} Days`;
});

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const d = date.getDate();
  const m = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent
      class="sm:max-w-[900px] h-[80vh] flex flex-col p-0 overflow-hidden border-slate-200"
    >
      <DialogHeader
        class="p-6 pb-2 border-b border-slate-50 flex flex-row items-center justify-between"
      >
        <div class="space-y-1">
          <DialogTitle class="text flex items-center gap-2">
            <Database class="w-5 h-5 text-blue-600" />
            {{ pool?.name }} Management
          </DialogTitle>
        </div>

        <div v-if="poolDetails" class="flex gap-6 pr-8">
          <div class="flex flex-col items-center">
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
              >วันที่เปิดใช้งาน</span
            >
            <span class="text-xs font-black text-slate-900">{{
              formatDate(poolDetails.fillingDate)
            }}</span>
          </div>
          <div class="flex flex-col items-center">
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
              >วันที่ปิดบ่อ</span
            >
            <span class="text-xs font-black text-slate-900">{{
              formatDate(poolDetails.closeDate)
            }}</span>
          </div>
          <div class="flex flex-col items-center">
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
              >(DURATION)</span
            >
            <span class="text-xs font-black text-amber-600">{{ poolDuration }}</span>
          </div>
          <div class="flex flex-col items-center">
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
              >Status</span
            >
            <span
              :class="[
                'text-xs font-black uppercase',
                poolDetails.status === 'closed' ? 'text-red-500' : 'text-emerald-500',
              ]"
              >{{ poolDetails.status }}</span
            >
          </div>
          <div class="flex flex-col items-center">
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
              >Grade</span
            >
            <span class="text-xs font-black text-slate-900 uppercase">{{
              poolDetails.grade || '-'
            }}</span>
          </div>
          <div class="flex flex-col items-center">
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
              >Net Weight</span
            >
            <span class="text-xs font-black text-blue-600 uppercase"
              >{{ (poolDetails.totalWeight / 1000).toFixed(2) }} Ton</span
            >
          </div>
        </div>
      </DialogHeader>

      <!-- Tabs Navigation -->
      <div class="px-6 py-2 border-b border-slate-50 flex gap-6 bg-slate-50/50">
        <button
          @click="activeTab = 'items'"
          :class="[
            'text-[11px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all',
            activeTab === 'items'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400',
          ]"
        >
          Lots in Pool ({{ poolDetails?.items?.length || 0 }})
        </button>
        <button
          @click="activeTab = 'add'"
          :class="[
            'text-[11px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all',
            activeTab === 'add'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400',
          ]"
          :disabled="poolDetails?.status === 'closed'"
        >
          Add New Lots
        </button>
      </div>

      <!-- Tab Content: Items -->
      <div v-if="activeTab === 'items'" class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 px-6 overflow-y-auto custom-scrollbar">
          <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 class="w-8 h-8 text-blue-600 animate-spin" />
            <span class="text-xs font-bold text-slate-400 uppercase tracking-widest"
              >Retrieving data...</span
            >
          </div>

          <div
            v-else-if="!poolDetails?.items?.length"
            class="flex flex-col items-center justify-center py-20 text-center gap-4"
          >
            <div class="p-4 bg-slate-100 rounded-full">
              <FlaskConical class="w-10 h-10 text-slate-300" />
            </div>
            <div class="space-y-1">
              <p class="text-sm font-black text-slate-900 uppercase tracking-tighter">
                This pool is empty
              </p>
              <p class="text-[11px] text-slate-400 font-bold max-w-xs uppercase leading-relaxed">
                No rubber lots have been allocated to this storage node yet.
              </p>
            </div>
            <Button
              size="sm"
              @click="activeTab = 'add'"
              class="bg-blue-600 font-bold uppercase text-[10px] tracking-widest gap-2"
            >
              <Plus class="w-3 h-3" /> Start Allocation
            </Button>
          </div>

          <Table v-else>
            <TableHeader class="sticky top-0 bg-white z-10 shadow-sm">
              <TableRow class="hover:bg-transparent border-slate-100">
                <TableHead class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >Lot Number</TableHead
                >
                <TableHead class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >Supplier</TableHead
                >
                <TableHead class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >Date</TableHead
                >
                <TableHead
                  class="text-right text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >Net Weight</TableHead
                >
                <TableHead class="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="item in poolDetails.items"
                :key="item.id"
                class="border-slate-50 hover:bg-slate-50/50 group"
              >
                <TableCell class="text-xs font-black text-blue-600">{{ item.lotNumber }}</TableCell>
                <TableCell>
                  <div class="flex flex-col">
                    <span class="text-xs font-bold text-slate-900 leading-none">{{
                      item.supplierCode
                    }}</span>
                    <span class="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{{
                      item.supplierName
                    }}</span>
                  </div>
                </TableCell>
                <TableCell class="text-[10px] font-bold text-slate-500 uppercase">{{
                  new Date(item.date).toLocaleDateString('en-GB')
                }}</TableCell>
                <TableCell class="text-right text-xs font-black text-slate-700"
                  >{{ (item.netWeight || 0).toLocaleString() }}
                  <span class="text-[10px] text-slate-400 font-bold ml-0.5">KG</span></TableCell
                >
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    @click="handleRemoveItem(item.bookingId)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Actions Footer -->
        <div
          class="p-6 pt-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30"
        >
          <div class="flex items-center gap-2 text-slate-400">
            <Info class="w-3 h-3" />
            <span class="text-[9px] font-black uppercase tracking-tighter"
              >Items are synchronized in real-time with logistics ledger</span
            >
          </div>
          <div class="flex gap-2">
            <Button
              v-if="poolDetails?.status === 'closed'"
              @click="handleReopenPool"
              class="h-9 px-6 bg-emerald-600 hover:bg-emerald-700 font-black text-[10px] uppercase tracking-widest"
            >
              Re-Open Node
            </Button>
            <Button
              v-else-if="poolDetails && poolDetails.items && poolDetails.items.length > 0"
              @click="handleClosePool"
              class="h-9 px-6 bg-red-500 hover:bg-red-600 font-black text-[10px] uppercase tracking-widest"
            >
              Close & Lock Node
            </Button>
            <Button
              variant="outline"
              @click="$emit('update:open', false)"
              class="h-9 px-6 font-black text-[10px] uppercase tracking-widest border-slate-200"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>

      <!-- Tab Content: Add -->
      <div v-else class="flex-1 flex flex-col overflow-hidden">
        <div class="p-6 py-4 bg-slate-50/50 border-b border-white space-y-4">
          <div class="flex items-end gap-4">
            <div class="space-y-1.5 flex-1">
              <Label class="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1"
                >Date Range Range</Label
              >
              <div class="flex items-center gap-2">
                <Input type="date" v-model="dateRange.start" class="h-9 font-bold text-xs" />
                <ChevronRight class="w-4 h-4 text-slate-300" />
                <Input type="date" v-model="dateRange.end" class="h-9 font-bold text-xs" />
              </div>
            </div>
            <Button
              @click="searchCandidates"
              :disabled="isSearching"
              class="bg-slate-900 h-9 font-black uppercase text-[10px] tracking-widest px-6 gap-2"
            >
              <Search v-if="!isSearching" class="w-3 h-3" />
              <Loader2 v-else class="w-3 h-3 animate-spin" />
              Find Available Lots
            </Button>
          </div>

          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              v-model="searchQuery"
              placeholder="FILTER BY LOT OR SUPPLIER..."
              class="h-9 pl-10 text-[10px] font-bold uppercase tracking-widest border-slate-200 placeholder:text-slate-300"
            />
          </div>
        </div>

        <div class="flex-1 px-6 overflow-y-auto custom-scrollbar">
          <div
            v-if="!candidates.length && !isSearching"
            class="flex flex-col items-center justify-center py-20 text-center gap-4 opacity-40"
          >
            <Calendar class="w-12 h-12 text-slate-300" />
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Select date range and search for recorded lots
            </p>
          </div>

          <Table v-else>
            <TableHeader class="sticky top-0 bg-white z-10 shadow-sm">
              <TableRow class="hover:bg-transparent border-slate-100">
                <TableHead class="w-[40px]"></TableHead>
                <TableHead class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >Lot Number</TableHead
                >
                <TableHead class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >Grade</TableHead
                >
                <TableHead class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >Supplier</TableHead
                >
                <TableHead
                  class="text-right text-[10px] font-black uppercase tracking-widest text-slate-400"
                  >Net Weight</TableHead
                >
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="c in filteredCandidates"
                :key="c.id"
                :class="[
                  'border-slate-50 cursor-pointer transition-colors',
                  selectedIds.includes(c.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50/50',
                ]"
                @click="
                  selectedIds.includes(c.id)
                    ? (selectedIds = selectedIds.filter((id) => id !== c.id))
                    : selectedIds.push(c.id)
                "
              >
                <TableCell>
                  <div
                    class="h-4 w-4 border-2 rounded flex items-center justify-center transition-colors"
                    :class="
                      selectedIds.includes(c.id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-slate-200'
                    "
                  >
                    <Plus v-if="selectedIds.includes(c.id)" class="w-3 h-3 text-white" />
                  </div>
                </TableCell>
                <TableCell class="text-xs font-black text-slate-900">{{ c.lotNo }}</TableCell>
                <TableCell>
                  <Badge variant="outline" class="font-black text-[9px] px-1.5 py-0">{{
                    c.displayGrade || '-'
                  }}</Badge>
                </TableCell>
                <TableCell class="text-[10px] font-bold text-slate-500 uppercase"
                  >{{ c.supplierCode }} - {{ c.supplierName }}</TableCell
                >
                <TableCell class="text-right text-xs font-black text-slate-700"
                  >{{ (c.displayWeight || 0).toLocaleString() }}
                  <span class="text-[10px] text-slate-400 font-bold ml-0.5">KG</span></TableCell
                >
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Selection Footer -->
        <div
          class="p-6 pt-4 border-t border-slate-50 flex items-center justify-between bg-blue-50/30"
        >
          <div class="flex items-center gap-4">
            <div class="flex flex-col">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                >Selected Items</span
              >
              <span class="text-[14px] font-black text-blue-700"
                >{{ selectedIds.length }} Lots</span
              >
            </div>
            <div class="w-px h-6 bg-blue-100"></div>
            <div class="flex flex-col">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                >Selected Weight</span
              >
              <span class="text-[14px] font-black text-blue-700"
                >{{
                  (
                    candidates
                      .filter((c) => selectedIds.includes(c.id))
                      .reduce((sum, c) => sum + c.displayWeight, 0) / 1000
                  ).toFixed(2)
                }}
                Ton</span
              >
            </div>
          </div>
          <div class="flex gap-2">
            <Button
              variant="outline"
              @click="activeTab = 'items'"
              class="h-9 px-6 font-black text-[10px] uppercase tracking-widest border-slate-200"
            >
              Clear Selection
            </Button>
            <Button
              :disabled="selectedIds.length === 0 || isLoading"
              @click="handleAddItems"
              class="h-9 px-8 bg-blue-600 hover:bg-blue-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
            >
              <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
              Allocate to Pool
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
