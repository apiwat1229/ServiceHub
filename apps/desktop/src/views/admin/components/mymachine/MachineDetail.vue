<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { useMyMachine } from '@/composables/useMyMachine';
import {
  Activity,
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  History,
  Layout,
  Package,
  User,
  Wrench,
} from 'lucide-vue-next';
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps<{
  machineId?: string;
}>();

const route = useRoute();
const router = useRouter();
const { machines, repairs, loadData } = useMyMachine();

const effectiveMachineId = computed(() => props.machineId || (route.params.id as string));

const machine = computed(() => {
  return machines.value.find((m) => m.id === effectiveMachineId.value);
});

const machineRepairs = computed(() => {
  return repairs.value
    .filter((r) => r.machineId === effectiveMachineId.value)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

const totalRepairCost = computed(() => {
  return machineRepairs.value.reduce((acc, r) => acc + (r.totalCost || 0), 0);
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Maintenance':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'Inactive':
      return 'bg-slate-50 text-slate-700 border-slate-100';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-100';
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div
    v-if="machine"
    :class="[effectiveMachineId ? '' : 'h-full bg-slate-100/50 overflow-hidden', 'font-sans']"
  >
    <!-- Centered Scrollable Document Container (Only for full page) -->
    <div :class="effectiveMachineId ? '' : 'h-full overflow-y-auto scrolling-touch py-10 px-4'">
      <div
        :class="[
          effectiveMachineId
            ? 'border-none shadow-none'
            : 'max-w-4xl mx-auto bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-sm border border-slate-200',
          'overflow-hidden',
        ]"
      >
        <!-- Body Content -->
        <div :class="effectiveMachineId ? 'px-10 py-6 space-y-6' : 'p-10 space-y-12'">
          <!-- Back Button (Only for full page) -->
          <div
            v-if="!effectiveMachineId"
            class="flex items-center justify-between border-b border-slate-100 pb-6 -mt-2"
          >
            <button
              @click="router.back()"
              class="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <div
                class="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"
              >
                <ArrowLeft class="w-4 h-4" />
              </div>
              <span class="text-[0.625rem] font-black uppercase tracking-[0.2em]"
                >Back to List</span
              >
            </button>
            <div class="text-right">
              <p class="text-[0.5rem] font-black text-slate-300 uppercase tracking-widest">
                Document Ref
              </p>
              <p class="text-[0.625rem] font-black text-slate-900 uppercase tracking-tighter">
                ASSET-{{ machine.id.split('-')[0].toUpperCase() }}
              </p>
            </div>
          </div>

          <!-- Section 1: Asset Information Table -->
          <section class="space-y-4">
            <div class="flex items-center gap-2 border-b border-slate-900 pb-3">
              <FileText class="w-4 h-4 text-slate-900" />
              <h2 class="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">
                Asset Specifications
              </h2>
            </div>

            <div class="grid grid-cols-2 gap-x-12 gap-y-6">
              <!-- Top Identity Info integrated into specs -->
              <div class="flex justify-between items-end border-b border-slate-50 pb-2">
                <span class="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest"
                  >Asset Name</span
                >
                <span class="text-sm font-black text-slate-900">{{ machine.name }}</span>
              </div>
              <div class="flex justify-between items-end border-b border-slate-50 pb-2">
                <span class="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest"
                  >Register ID</span
                >
                <span class="text-sm font-black text-slate-900"
                  >#{{ machine.id.toUpperCase() }}</span
                >
              </div>

              <div class="flex justify-between items-end border-b border-slate-50 pb-2">
                <span class="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest"
                  >Model Name</span
                >
                <span class="text-sm font-black text-slate-900">{{ machine.model }}</span>
              </div>
              <div class="flex justify-between items-end border-b border-slate-50 pb-2">
                <span class="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest"
                  >Location Zone</span
                >
                <span class="text-sm font-black text-slate-900">{{ machine.location }}</span>
              </div>
              <div class="flex justify-between items-end border-b border-slate-50 pb-2">
                <span class="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest"
                  >Commission Date</span
                >
                <span class="text-sm font-black text-slate-900">{{
                  new Date(machine.createdAt).toLocaleDateString('th-TH')
                }}</span>
              </div>
              <div class="flex justify-between items-end border-b border-slate-50 pb-2">
                <span class="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest"
                  >Status</span
                >
                <Badge
                  :class="`rounded-sm font-black uppercase tracking-widest text-[0.5625rem] px-2 py-0.5 border ${getStatusColor(machine.status)}`"
                >
                  {{ machine.status }}
                </Badge>
              </div>
            </div>
          </section>

          <!-- Section 2: Performance Summary -->
          <section class="space-y-4">
            <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Activity class="w-4 h-4 text-slate-900" />
              <h2 class="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">
                Performance Summary
              </h2>
            </div>

            <div
              class="flex items-center gap-12 bg-slate-50/50 p-4 border border-slate-100 rounded-sm"
            >
              <div class="flex-1 space-y-1 text-center">
                <p class="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest">
                  Lifetime Cost
                </p>
                <p class="text-3xl font-black text-slate-900 tracking-tighter">
                  {{ formatCurrency(totalRepairCost) }}
                </p>
                <p class="text-[0.5625rem] font-bold text-slate-400 uppercase">
                  Total Maintenance Expenditure
                </p>
              </div>
              <div class="w-px h-12 bg-slate-200"></div>
              <div class="flex-1 space-y-1 text-center">
                <p class="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest">
                  Maintenance Frequency
                </p>
                <p class="text-3xl font-black text-slate-900 tracking-tighter">
                  {{ machineRepairs.length }} Events
                </p>
                <p class="text-[0.5625rem] font-bold text-slate-400 uppercase">
                  Confirmed Recorded Logs
                </p>
              </div>
            </div>
          </section>

          <!-- Section 3: Maintenance Log Book (Expanded Details) -->
          <section class="space-y-4">
            <div class="flex items-center justify-between border-b border-slate-900 pb-3">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 bg-slate-900 text-white rounded-sm flex items-center justify-center shadow-sm"
                >
                  <History class="w-4 h-4" />
                </div>
                <h2 class="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">
                  Maintenance Log Book
                </h2>
              </div>
              <span class="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest"
                >{{ machineRepairs.length }} entries recorded</span
              >
            </div>

            <div v-if="machineRepairs.length > 0" class="space-y-8">
              <div
                v-for="repair in machineRepairs"
                :key="repair.id"
                class="relative pl-8 border-l-2 border-slate-100 last:border-l-0 pb-4"
              >
                <!-- Timeline Dot -->
                <div
                  class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-slate-900 shadow-sm"
                ></div>

                <div class="space-y-4">
                  <!-- Entry Header -->
                  <div class="flex items-start justify-between">
                    <div class="space-y-1">
                      <div class="flex items-center gap-3">
                        <span
                          class="text-xs font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2"
                        >
                          <Calendar class="w-3.5 h-3.5 text-slate-400" />
                          {{ repair.date }}
                        </span>
                        <span class="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                        <span
                          class="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"
                        >
                          <User class="w-3.5 h-3.5 text-slate-300" />
                          TECH: {{ repair.technician || 'N/A' }}
                        </span>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">
                        {{ formatCurrency(repair.totalCost) }}
                      </p>
                      <p class="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                        Service Fee
                      </p>
                    </div>
                  </div>

                  <!-- Issue Description -->
                  <div
                    class="bg-slate-50 border border-slate-100 rounded-sm p-6 relative overflow-hidden"
                  >
                    <div class="absolute top-0 right-0 p-3 opacity-[0.03]">
                      <Wrench class="w-12 h-12 text-slate-900" />
                    </div>
                    <div class="relative z-10">
                      <div class="flex items-center gap-2 mb-3">
                        <Clock class="w-3.5 h-3.5 text-blue-500" />
                        <p
                          class="text-[0.625rem] font-black text-blue-600 uppercase tracking-widest leading-none"
                        >
                          Maintenance Description / Detail
                        </p>
                      </div>
                      <p class="text-sm font-bold text-slate-800 leading-relaxed">
                        {{ repair.issue }}
                      </p>
                    </div>
                  </div>

                  <!-- Parts Used (If any) -->
                  <div v-if="repair.parts && repair.parts.length > 0" class="space-y-3">
                    <div class="flex items-center gap-2">
                      <Package class="w-3.5 h-3.5 text-slate-400" />
                      <p
                        class="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest"
                      >
                        Parts & Materials Used
                      </p>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        v-for="(part, pIdx) in repair.parts"
                        :key="pIdx"
                        class="flex items-center justify-between p-3 border border-slate-100 rounded-sm bg-white hover:border-slate-300 transition-colors shadow-sm"
                      >
                        <div class="flex items-center gap-3">
                          <div
                            class="w-8 h-8 rounded-sm bg-slate-50 flex items-center justify-center border border-slate-100"
                          >
                            <Package class="w-4 h-4 text-slate-300" />
                          </div>
                          <div>
                            <p
                              class="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none mb-1"
                            >
                              {{ part.name }}
                            </p>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">
                              {{ (part as any).code || 'N/A' }}
                            </p>
                          </div>
                        </div>
                        <div class="text-right">
                          <p class="text-sm font-black text-slate-900 leading-none mb-1">
                            {{ part.qty }} {{ (part as any).unit || 'Units' }}
                          </p>
                          <p class="text-xs font-black text-blue-600 uppercase tracking-tighter">
                            @ {{ formatCurrency(part.price) }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-else
              class="py-20 text-center bg-slate-50 border border-slate-100 border-dashed rounded-sm"
            >
              <div class="space-y-4">
                <Wrench class="w-10 h-10 text-slate-200 mx-auto" />
                <div class="space-y-1">
                  <p class="text-xs font-black text-slate-900 uppercase tracking-widest">
                    Clean Log Book
                  </p>
                  <p
                    class="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed"
                  >
                    No official maintenance history recorded for this asset.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <!-- Section 4: Document Footer / Verification -->
          <footer class="pt-8 border-t-2 border-slate-100 flex items-center justify-between">
            <div class="space-y-1">
              <p class="text-[0.5625rem] font-black text-slate-400 uppercase tracking-[0.2em]">
                Generated By System
              </p>
              <div class="flex items-center gap-2">
                <Layout class="w-3.5 h-3.5 text-slate-300" />
                <p class="text-[0.625rem] font-bold text-slate-500 uppercase tracking-widest">
                  Asset Management Module v1.0
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-[0.5625rem] font-black text-slate-300 uppercase tracking-widest">
                Official Record
              </p>
              <p
                class="text-[0.625rem] font-black text-slate-900 uppercase tracking-tighter leading-none"
              >
                DO NOT REMOVE
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>

    <!-- Repair Detail Modal removed as details are now expanded above -->
  </div>

  <div v-else class="h-full flex items-center justify-center bg-slate-50">
    <div class="text-center animate-pulse">
      <div
        class="w-16 h-16 bg-white border border-slate-200 rounded-sm flex items-center justify-center mx-auto mb-6 shadow-sm"
      >
        <FileText class="w-8 h-8 text-slate-400" />
      </div>
      <p class="text-slate-400 font-black uppercase text-[0.625rem] tracking-[0.3em] text-center">
        Pulling Official Records...
      </p>
    </div>
  </div>
</template>
