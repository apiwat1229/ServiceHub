<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogContent } from '@/components/ui/dialog';
import { Calendar, ClipboardList, Clock, Package, User } from 'lucide-vue-next';

const props = defineProps<{
  repair: any;
}>();

const emit = defineEmits(['close']);

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(val);
};

const getStatusColor = (cost: number) => {
  if (cost > 10000) return 'bg-indigo-50 text-indigo-700 border-indigo-100';
  return 'bg-emerald-50 text-emerald-700 border-emerald-100';
};
</script>

<template>
  <DialogContent
    class="w-[95vw] sm:max-w-[700px] p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white flex flex-col max-h-[95vh] rounded-sm"
  >
    <!-- Formal Document Header -->
    <div class="p-8 border-b-4 border-slate-900 bg-white">
      <div class="flex items-start justify-between mb-4">
        <div class="space-y-1">
          <p
            class="text-[0.625rem] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-1"
          >
            Official Maintenance Record
          </p>
          <h2 class="text-3xl font-black tracking-tighter text-slate-900 leading-none">
            {{ repair.machineName }}
          </h2>
        </div>
        <Badge
          variant="outline"
          class="border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[0.5625rem] bg-slate-50 px-2 py-1 flex-shrink-0"
        >
          LOG ID: #{{ repair.id.slice(-6).toUpperCase() }}
        </Badge>
      </div>

      <div class="flex items-center gap-4 pt-2 border-t border-slate-50 mt-4">
        <div class="flex items-center gap-2">
          <Calendar class="w-3.5 h-3.5 text-slate-400" />
          <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">{{
            repair.date
          }}</span>
        </div>
        <span class="text-slate-200">•</span>
        <div class="flex items-center gap-2">
          <Badge
            :class="`rounded-sm font-black uppercase tracking-tight text-[0.5625rem] px-2 py-0 border ${getStatusColor(repair.totalCost)}`"
          >
            {{ repair.totalCost > 10000 ? 'Major Repair' : 'Routine Service' }}
          </Badge>
        </div>
      </div>
    </div>

    <div class="p-8 flex-1 overflow-y-auto space-y-10 min-h-0 bg-white">
      <!-- Section 1: Personnel & Classification -->
      <section class="grid grid-cols-2 gap-12">
        <div class="space-y-4">
          <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
            <User class="w-3.5 h-3.5 text-slate-900" />
            <h3 class="text-[0.625rem] font-black uppercase tracking-widest text-slate-900">
              Personnel in Charge
            </h3>
          </div>
          <div class="space-y-1">
            <p class="text-sm font-black text-slate-900">
              {{ repair.technician || 'Not assigned' }}
            </p>
            <p class="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest">
              Certified Technical Lead
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Clock class="w-3.5 h-3.5 text-slate-900" />
            <h3 class="text-[0.625rem] font-black uppercase tracking-widest text-slate-900">
              Timestamp
            </h3>
          </div>
          <div class="space-y-1">
            <p class="text-sm font-black text-slate-900">{{ repair.date }}</p>
            <p class="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest">
              Recorded Date of Service
            </p>
          </div>
        </div>
      </section>

      <!-- Section 2: Technical Description -->
      <section class="space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
          <ClipboardList class="w-3.5 h-3.5 text-slate-900" />
          <h3 class="text-[0.625rem] font-black uppercase tracking-widest text-slate-900">
            Description of Issue / Detail
          </h3>
        </div>
        <div class="bg-slate-50 border border-slate-100 p-6 rounded-sm">
          <p class="text-sm font-bold text-slate-800 leading-relaxed italic">
            "{{ repair.issue }}"
          </p>
        </div>
      </section>

      <!-- Section 3: Resource Inventory -->
      <section class="space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Package class="w-3.5 h-3.5 text-slate-900" />
          <h3 class="text-[0.625rem] font-black uppercase tracking-widest text-slate-900">
            Resources & Materials Inventory
          </h3>
        </div>

        <div
          v-if="repair.parts && repair.parts.length > 0"
          class="border border-slate-100 rounded-sm overflow-hidden"
        >
          <table class="w-full text-left border-collapse">
            <thead
              class="bg-slate-50 border-b border-slate-100 text-[0.5625rem] font-black text-slate-400 uppercase tracking-[0.2em]"
            >
              <tr>
                <th class="px-4 py-3">Material Code / Description</th>
                <th class="px-4 py-3 text-right">Quantity</th>
                <th class="px-4 py-3 text-right">Unit Price</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr
                v-for="(part, idx) in repair.parts"
                :key="idx"
                class="hover:bg-slate-50/50 transition-colors"
              >
                <td class="px-4 py-4">
                  <p class="text-xs font-black text-slate-900 uppercase tracking-tighter">
                    {{ part.name }}
                  </p>
                  <p class="text-[0.5625rem] font-bold text-slate-400 uppercase tracking-widest">
                    {{ part.code || 'N/A' }}
                  </p>
                </td>
                <td class="px-4 py-4 text-right">
                  <span class="text-xs font-black text-slate-900">{{ part.qty }}</span>
                  <span class="text-[0.625rem] font-bold text-slate-400 ml-1 uppercase">{{
                    part.unit || 'Units'
                  }}</span>
                </td>
                <td class="px-4 py-4 text-right">
                  <p class="text-xs font-black text-slate-900 tracking-tight">
                    {{ formatCurrency(part.price) }}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          v-else
          class="text-center py-10 bg-slate-50 rounded-sm border border-slate-100 border-dashed"
        >
          <p class="text-slate-400 text-[0.625rem] font-black uppercase tracking-widest">
            No replacement materials utilized during this session.
          </p>
        </div>
      </section>
    </div>

    <!-- Formal Economic Footer -->
    <div
      class="p-8 border-t-2 border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6"
    >
      <div class="text-center sm:text-left">
        <p class="text-[0.5625rem] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
          Total Economic Valuation
        </p>
        <p class="text-3xl font-black text-slate-900 tracking-tighter">
          {{ formatCurrency(repair.totalCost) }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Button
          variant="ghost"
          class="h-10 px-6 font-black text-[0.625rem] uppercase tracking-widest text-slate-500 hover:text-slate-900"
          @click="emit('close')"
        >
          Cancel
        </Button>
        <Button
          class="h-10 px-10 rounded-sm bg-slate-900 text-white font-black text-[0.625rem] uppercase tracking-widest hover:bg-slate-800 shadow-sm"
          @click="emit('close')"
        >
          Close Record
        </Button>
      </div>
    </div>
  </DialogContent>
</template>
