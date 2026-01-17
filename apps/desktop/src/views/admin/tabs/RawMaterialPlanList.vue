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
import { Edit2, Eye, Printer, Trash2 } from 'lucide-vue-next';
import { computed, ref } from 'vue';

const props = defineProps<{
  searchQuery?: string;
  date?: any;
}>();

// Mock data for listing
const plans = ref([
  {
    id: '1',
    planNo: '2024#PL03',
    revisionNo: '01',
    issuedDate: '17-Jan-24',
    refProductionNo: '2024#P03',
    status: 'APPROVED',
    creator: 'Admin System',
  },
  {
    id: '2',
    planNo: '2024#PL02',
    revisionNo: '00',
    issuedDate: '10-Jan-24',
    refProductionNo: '2024#P02',
    status: 'CLOSED',
    creator: 'Admin System',
  },
]);

const filteredPlans = computed(() => {
  if (!props.searchQuery) return plans.value;
  const q = props.searchQuery.toLowerCase();
  return plans.value.filter(
    (p) =>
      p.planNo.toLowerCase().includes(q) ||
      p.refProductionNo.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q)
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
    <!-- Header Removed (Global Header Used) -->

    <!-- Table Container -->
    <div class="border rounded-lg bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader class="bg-slate-50">
          <TableRow>
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
              >Issued Date</TableHead
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
            <TableCell class="font-bold text-blue-600">{{ plan.planNo }}</TableCell>
            <TableCell class="text-center font-mono">{{ plan.revisionNo }}</TableCell>
            <TableCell>{{ plan.refProductionNo }}</TableCell>
            <TableCell>{{ plan.issuedDate }}</TableCell>
            <TableCell class="text-slate-500">{{ plan.creator }}</TableCell>
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
                  class="h-8 w-8 text-slate-400 hover:text-blue-600"
                >
                  <Eye class="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-slate-400 hover:text-amber-600"
                >
                  <Edit2 class="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-slate-400 hover:text-red-500"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-slate-400 hover:text-slate-900"
                >
                  <Printer class="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="plans.length === 0">
            <TableCell colspan="7" class="h-32 text-center text-slate-400 italic">
              No plans found.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
