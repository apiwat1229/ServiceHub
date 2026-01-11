<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Calendar, Clock, FileText, Package, Printer, User, Wrench } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const repair = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchRepairData = async () => {
  try {
    loading.value = true;
    console.log('[API] Fetching repair log for ID:', route.params.id);

    // Get Base API URL and ensure it has /api prefix
    let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:2530';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (!apiUrl.endsWith('/api')) apiUrl += '/api';

    console.log('[API] Using URL:', `${apiUrl}/mymachine/public/repairs/${route.params.id}`);

    const response = await axios.get(`${apiUrl}/mymachine/public/repairs/${route.params.id}`);
    console.log('[API] Response Received:', response.data);
    repair.value = response.data;
  } catch (e: any) {
    console.error('[API] Failed to fetch repair data:', e);
    const status = e.response?.status;
    if (status === 404) {
      error.value = `Maintenance record "${route.params.id}" was not found in the production database. Please ensure the record has been saved to the server.`;
    } else if (status === 403 || status === 401) {
      error.value = 'Access denied. This record is not public or your link is invalid.';
    } else {
      error.value =
        'A communication error occurred with the secure server. Please try again later.';
    }
  } finally {
    loading.value = false;
  }
};

const printRecord = () => {
  window.print();
};

onMounted(() => {
  fetchRepairData();
});

const getCategoryColor = (cost: number) => {
  if (cost > 1000) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
  return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-6 font-sans">
    <div v-if="loading" class="flex flex-col items-center gap-4">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      <p class="text-slate-500 text-sm font-medium tracking-wide">Retrieving secured record...</p>
    </div>

    <div
      v-else-if="error"
      class="max-w-md w-full bg-white rounded-2xl p-6 shadow-xl text-center border border-slate-100"
    >
      <div class="bg-rose-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Wrench class="h-6 w-6 text-rose-500" />
      </div>
      <h1 class="text-xl font-bold text-slate-900 mb-2">Request Failed</h1>
      <p class="text-slate-500 text-sm mb-6 leading-relaxed">{{ error }}</p>
      <Button variant="outline" class="w-full h-10 rounded-lg" @click="fetchRepairData"
        >Try Again</Button
      >
    </div>

    <div
      v-else
      class="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500 border border-slate-100"
    >
      <!-- Compact Dark Header -->
      <div
        class="bg-[#0f172a] bg-header-dark p-6 pb-5 text-white relative overflow-hidden print:bg-white print:text-black print:p-4"
      >
        <div class="absolute top-4 right-6 opacity-40 hover:opacity-100 transition-opacity">
          <img src="/logo-light.png" alt="Logo" class="h-8 w-auto object-contain" />
        </div>

        <div class="relative z-10">
          <div class="flex items-center gap-2 mb-4">
            <Badge
              variant="outline"
              class="bg-blue-500/10 text-blue-400 border-blue-500/30 font-bold tracking-wider px-2 py-0.5 text-[0.5625rem] uppercase"
            >
              Maintenance Record
            </Badge>
            <div class="flex items-center gap-1.5 text-[0.625rem] text-slate-400 font-medium">
              <Clock class="h-3 w-3" />
              {{ repair.date }}
            </div>
          </div>

          <h1 class="text-2xl font-black mb-1 tracking-tight">{{ repair.machineName }}</h1>
          <div class="flex items-center gap-2 text-[0.625rem] text-slate-400 font-medium">
            <Calendar class="h-3 w-3" />
            Processed on {{ repair.date }}
          </div>
        </div>
      </div>

      <!-- Compact Content Sections -->
      <div class="p-6 space-y-6">
        <!-- Main Info Row -->
        <div class="grid grid-cols-2 gap-4 pb-6 border-b border-slate-100">
          <div class="space-y-1.5">
            <p class="text-[0.5625rem] font-bold text-slate-400 uppercase tracking-widest">Technician</p>
            <div class="flex items-center gap-2">
              <div class="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center">
                <User class="h-3.5 w-3.5 text-slate-500" />
              </div>
              <p class="text-sm font-bold text-slate-800">{{ repair.technician }}</p>
            </div>
          </div>
          <div class="space-y-1.5 text-right">
            <p class="text-[0.5625rem] font-bold text-slate-400 uppercase tracking-widest">Category</p>
            <Badge
              variant="outline"
              :class="`h-7 px-2.5 rounded-lg text-[0.5625rem] font-bold uppercase tracking-wider ${getCategoryColor(repair.totalCost)}`"
            >
              {{ repair.totalCost > 1000 ? 'Major Repair' : 'Routine Service' }}
            </Badge>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <FileText class="h-3.5 w-3.5 text-blue-600" />
            <h3 class="font-bold text-slate-700 text-xs">Issue Description</h3>
          </div>
          <div
            class="bg-slate-50 rounded-xl p-3.5 border border-slate-100 italic text-[0.75rem] text-slate-600 leading-relaxed"
          >
            "{{ repair.issue }}"
          </div>
        </div>

        <!-- Resources & Parts -->
        <div v-if="repair.parts && repair.parts.length > 0" class="space-y-3">
          <div class="flex items-center gap-2">
            <Package class="h-3.5 w-3.5 text-blue-600" />
            <h3 class="font-bold text-slate-700 text-xs">Parts Used</h3>
          </div>
          <div class="space-y-1.5">
            <div
              v-for="part in repair.parts"
              :key="part.id"
              class="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl hover:border-blue-100 transition-all group"
            >
              <div class="flex items-center gap-3">
                <div
                  class="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors"
                >
                  <Package class="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500" />
                </div>
                <div>
                  <p class="text-[0.75rem] font-bold text-slate-800">{{ part.name }}</p>
                  <p class="text-[0.5625rem] font-semibold text-slate-400">
                    @ ฿{{ part.price.toLocaleString() }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-black text-slate-900">{{ part.qty }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Economic Valuation -->
        <div class="pt-6 border-t border-slate-100 flex items-end justify-between">
          <div class="space-y-1">
            <p class="text-[0.5625rem] font-bold text-slate-400 uppercase tracking-widest">
              Total Valuation
            </p>
            <p class="text-2xl font-black text-slate-900 tracking-tight">
              ฿{{ repair.totalCost?.toLocaleString() }}
            </p>
          </div>
          <Button
            @click="printRecord"
            variant="outline"
            class="rounded-lg h-8 px-3 text-[0.625rem] hover:bg-slate-50 border-slate-200 print:hidden"
          >
            <Printer class="h-3 w-3 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      <!-- Compact Footer -->
      <div class="bg-slate-50/50 py-3 text-center border-t border-slate-100">
        <p class="text-[0.5rem] font-bold text-slate-400 uppercase tracking-[0.2em]">
          SECURE SYSTEM • MAINTENANCE AUDIT TRAIL
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .min-h-screen {
    background-color: white !important;
    padding: 0 !important;
    display: block !important;
  }
  .max-w-xl {
    box-shadow: none !important;
    max-width: 100% !important;
    border: none !important;
  }
  .bg-header-dark {
    background-color: transparent !important;
    color: black !important;
  }
}
</style>
