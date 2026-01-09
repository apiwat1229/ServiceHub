<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogContent } from '@/components/ui/dialog';
import { Calendar, ClipboardList, Clock, Package, User, Wrench } from 'lucide-vue-next';

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
  <DialogContent class="sm:max-w-[650px] p-0 overflow-hidden border-none shadow-2xl">
    <div class="bg-slate-900 p-8 text-white relative overflow-hidden">
      <!-- Decorative background icon -->
      <Wrench class="absolute -right-8 -bottom-8 w-40 h-40 text-white/5 rotate-12" />

      <div class="relative z-10">
        <div class="flex items-center gap-3 mb-4">
          <Badge
            variant="outline"
            :class="`border-white/20 text-white font-bold uppercase tracking-widest text-[10px] bg-white/10 px-2 py-1`"
          >
            Maintenance Record
          </Badge>
          <div class="flex items-center gap-1.5 text-white/60 text-xs">
            <Clock class="w-3 h-3" />
            {{ repair.date }}
          </div>
        </div>

        <h2 class="text-3xl font-black tracking-tight mb-2">{{ repair.machineName }}</h2>
        <p class="text-white/60 flex items-center gap-2 text-sm font-medium">
          <Calendar class="w-4 h-4" />
          Processed on {{ repair.date }}
        </p>
      </div>
    </div>

    <div class="p-8 bg-white space-y-8">
      <!-- Summary Grid -->
      <div class="grid grid-cols-2 gap-6">
        <div class="space-y-1.5">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Primary Technician
          </p>
          <div class="flex items-center gap-2 text-slate-900 font-bold">
            <div
              class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200"
            >
              <User class="w-4 h-4 text-slate-500" />
            </div>
            {{ repair.technician || 'Not assigned' }}
          </div>
        </div>
        <div class="space-y-1.5">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Service Category
          </p>
          <div class="flex items-center gap-2">
            <Badge
              :class="`rounded-full font-bold uppercase tracking-tight text-[10px] px-3 ${getStatusColor(repair.totalCost)}`"
            >
              {{ repair.totalCost > 10000 ? 'Major Repair' : 'Routine Service' }}
            </Badge>
          </div>
        </div>
      </div>

      <!-- Detail Sections -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 text-slate-900 font-bold">
          <ClipboardList class="w-5 h-5 text-blue-600" />
          <h3>Description of Issue</h3>
        </div>
        <div
          class="bg-slate-50 border border-slate-100 rounded-xl p-5 text-slate-700 leading-relaxed italic"
        >
          "{{ repair.issue }}"
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center gap-2 text-slate-900 font-bold">
          <Package class="w-5 h-5 text-indigo-600" />
          <h3>Resources & Parts Used</h3>
        </div>

        <div
          v-if="repair.parts && repair.parts.length > 0"
          class="border rounded-xl overflow-hidden divide-y divide-slate-100"
        >
          <div
            v-for="(part, idx) in repair.parts"
            :key="idx"
            class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200"
              >
                <Package class="w-5 h-5" />
              </div>
              <div>
                <p class="font-bold text-slate-900 text-sm">{{ part.name }}</p>
                <p class="text-[10px] font-mono text-slate-400">{{ part.code }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-bold text-slate-900 text-sm">{{ part.qty }} {{ part.unit }}</p>
              <p class="text-[10px] text-slate-400">@ {{ formatCurrency(part.price) }}</p>
            </div>
          </div>
        </div>
        <div
          v-else
          class="text-center py-10 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200"
        >
          <p class="text-slate-400 text-sm">No replacement parts were used in this service.</p>
        </div>
      </div>

      <!-- Cost Section -->
      <div class="pt-6 border-t flex items-center justify-between">
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Economic Valuation
          </p>
          <p class="text-2xl font-black text-slate-900">{{ formatCurrency(repair.totalCost) }}</p>
        </div>
        <Button variant="outline" class="gap-2 border-slate-200" @click="emit('close')">
          Close Record
        </Button>
      </div>
    </div>
  </DialogContent>
</template>
