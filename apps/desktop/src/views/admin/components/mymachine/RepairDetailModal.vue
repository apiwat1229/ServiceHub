<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Calendar, ClipboardList, Clock, Package, User } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  repair: any;
}>();

const emit = defineEmits(['close']);

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
    <DialogTitle class="sr-only">Repair Detail: {{ repair.machineName }}</DialogTitle>
    <DialogDescription class="sr-only">Full details of the maintenance record.</DialogDescription>

    <!-- Formal Document Header -->
    <div class="p-8 border-b-4 border-slate-900 bg-white">
      <div class="flex items-start justify-between mb-4">
        <div class="space-y-1">
          <p
            class="text-[0.625rem] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-1"
          >
            {{ t('services.myMachine.officialMaintenanceRecord') }}
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
            {{
              repair.totalCost > 10000
                ? t('services.myMachine.majorRepair')
                : t('services.myMachine.routineService')
            }}
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
              {{ t('services.myMachine.personnelInCharge') }}
            </h3>
          </div>
          <div class="space-y-1">
            <p class="text-sm font-black text-slate-900">
              {{ repair.technician || t('services.myMachine.notAssigned') }}
            </p>
            <p class="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest">
              {{ t('services.myMachine.certifiedTechnicalLead') }}
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Clock class="w-3.5 h-3.5 text-slate-900" />
            <h3 class="text-[0.625rem] font-black uppercase tracking-widest text-slate-900">
              {{ t('services.myMachine.timestamp') }}
            </h3>
          </div>
          <div class="space-y-1">
            <p class="text-sm font-black text-slate-900">{{ repair.date }}</p>
            <p class="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest">
              {{ t('services.myMachine.recordedDateOfService') }}
            </p>
          </div>
        </div>
      </section>

      <!-- Section 2: Technical Description -->
      <section class="space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
          <ClipboardList class="w-3.5 h-3.5 text-slate-900" />
          <h3 class="text-[0.625rem] font-black uppercase tracking-widest text-slate-900">
            {{ t('services.myMachine.descriptionOfIssueDetail') }}
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
            {{ t('services.myMachine.resourcesMaterialsInventory') }}
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
                <th class="px-4 py-3">{{ t('services.myMachine.materialCodeDescription') }}</th>
                <th class="px-4 py-3 text-right">{{ t('services.myMachine.quantity') }}</th>
                <th class="px-4 py-3 text-right">{{ t('services.myMachine.unitPrice') }}</th>
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
                    {{ part.code || t('services.myMachine.notApplicable') }}
                  </p>
                </td>
                <td class="px-4 py-4 text-right">
                  <span class="text-xs font-black text-slate-900">{{ part.qty }}</span>
                  <span class="text-[0.625rem] font-bold text-slate-400 ml-1 uppercase">{{
                    part.unit || t('services.myMachine.units')
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
            {{ t('services.myMachine.noReplacementMaterialsUtilized') }}
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
          {{ t('services.myMachine.totalEconomicValuation') }}
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
          {{ t('services.myMachine.forms.common.cancel') }}
        </Button>
        <Button
          class="h-10 px-10 rounded-sm bg-slate-900 text-white font-black text-[0.625rem] uppercase tracking-widest hover:bg-slate-800 shadow-sm"
          @click="emit('close')"
        >
          {{ t('services.myMachine.closeRecord') }}
        </Button>
      </div>
    </div>
  </DialogContent>
</template>
