<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { plcApi, type Db54Data, type LineUseData, type PlcStatus } from '@/services/plc';
import { Activity, Cpu, Lightbulb, Monitor, RefreshCw, Save, Zap } from 'lucide-vue-next';
import { onMounted, onUnmounted, ref } from 'vue';
import { toast } from 'vue-sonner';

const status = ref<PlcStatus | null>(null);
const lineUse = ref<LineUseData | null>(null);
const isLoading = ref(false);
const isWriting = ref(false);

const brightnessOptions = [
  { value: '0', label: '0%', icon: '🌑' },
  { value: '1', label: '25%', icon: '🌘' },
  { value: '2', label: '50%', icon: '🌗' },
  { value: '3', label: '75%', icon: '🌖' },
  { value: '4', label: '100%', icon: '🌕' },
];

const colorOptions = [
  { value: '0', label: 'Red', display: 'แดง', color: 'bg-red-500', shadow: 'shadow-red-200' },
  {
    value: '1',
    label: 'Yellow',
    display: 'เหลือง',
    color: 'bg-yellow-400',
    shadow: 'shadow-yellow-100',
  },
  {
    value: '2',
    label: 'Green',
    display: 'เขียว',
    color: 'bg-green-500',
    shadow: 'shadow-green-200',
  },
  { value: '3', label: 'Sky', display: 'ฟ้า', color: 'bg-sky-400', shadow: 'shadow-sky-200' },
  {
    value: '4',
    label: 'Blue',
    display: 'น้ำเงิน',
    color: 'bg-blue-600',
    shadow: 'shadow-blue-200',
  },
  { value: '5', label: 'Pink', display: 'ชมพู', color: 'bg-pink-400', shadow: 'shadow-pink-200' },
];

const textOptions = [
  { value: '0', label: 'EUDR' },
  { value: '1', label: 'FSC' },
  { value: '2', label: 'REG' },
];

const internalBrightness = ref('4');
const internalPositions = ref(Array.from({ length: 23 }, () => ({ color: '0', text: '0' })));

const loadData = async () => {
  isLoading.value = true;
  try {
    const [statusRes, lineRes, dbRes] = await Promise.all([
      plcApi.getStatus(),
      plcApi.getLineUse(),
      plcApi.getDb54(),
    ]);
    status.value = statusRes;
    lineUse.value = lineRes;

    if (dbRes) {
      internalBrightness.value = dbRes.brightness.toString();
      internalPositions.value = dbRes.positions.map((p) => ({
        color: p.color.toString(),
        text: p.text.toString(),
      }));
    }
  } catch (error) {
    console.error('Failed to load PLC data:', error);
    toast.error('Sync error.');
  } finally {
    isLoading.value = false;
  }
};

const handleWrite = async () => {
  isWriting.value = true;
  try {
    const dataToSend: Db54Data = {
      brightness: parseInt(internalBrightness.value),
      positions: internalPositions.value.map((p) => ({
        color: parseInt(p.color),
        text: parseInt(p.text),
      })),
    };
    await plcApi.updateDb54(dataToSend);
    toast.success('Wall updated.');
    await loadData();
  } catch (error) {
    toast.error('Write failed.');
  } finally {
    isWriting.value = false;
  }
};

const toggleLine = async (index: number, current: boolean) => {
  try {
    await plcApi.updateLineUse(index, !current);
    toast.success(`L${index} OK.`);
    const lineRes = await plcApi.getLineUse();
    lineUse.value = lineRes;
  } catch (error) {
    toast.error('Error.');
  }
};

const getColorClass = (val: string) => {
  const opt = colorOptions.find((o) => o.value === val);
  return opt ? [opt.color, opt.shadow] : ['bg-slate-200', ''];
};

const getColorLabel = (val: string) => {
  const opt = colorOptions.find((o) => o.value === val);
  return opt ? opt.label : 'N/A';
};

let interval: any;
onMounted(() => {
  loadData();
  interval = setInterval(async () => {
    try {
      status.value = await plcApi.getStatus();
      lineUse.value = await plcApi.getLineUse();
    } catch (e) {}
  }, 5000);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});
</script>

<template>
  <div class="w-full min-h-screen p-4 lg:p-6 bg-slate-50/30 flex flex-col gap-6 font-sans">
    <!-- Compact Header -->
    <header
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3 px-5 bg-white border border-slate-200 rounded-xl shadow-sm"
    >
      <div class="flex items-center gap-4">
        <div class="p-2 bg-primary/10 rounded-lg border border-primary/5">
          <Cpu class="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 class="text-xl font-black tracking-tight text-slate-900 leading-none">
            MATRIX <span class="text-primary">CORE</span>
          </h2>
          <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            Cuplump Pool Control System
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- Status -->
        <div
          :class="[
            'flex items-center gap-2.5 px-4 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-tight bg-white',
            status?.isConnected
              ? 'border-emerald-100 text-emerald-600'
              : 'border-red-100 text-red-500',
          ]"
        >
          <div
            :class="[
              'w-2 h-2 rounded-full',
              status?.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500',
            ]"
          ></div>
          {{ status?.isConnected ? 'Online' : 'Offline' }}
          <span
            v-if="status?.ip"
            class="ml-2 pl-2 border-l border-slate-100 opacity-60 font-mono"
            >{{ status.ip }}</span
          >
        </div>

        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="loadData"
            :disabled="isLoading"
            class="h-9 rounded-lg border-slate-200 hover:bg-slate-50 relative group"
          >
            <RefreshCw :class="['w-4 h-4 mr-2', isLoading && 'animate-spin']" />
            Sync from PLC
          </Button>
          <Button
            size="sm"
            class="h-9 px-5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-2"
            @click="handleWrite"
            :disabled="isWriting || !status?.isConnected"
          >
            <Save class="w-4 h-4" />
            Write & Pulse
          </Button>
        </div>
      </div>
    </header>

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1">
      <!-- Side Controls -->
      <div class="xl:col-span-3 space-y-6">
        <!-- Brightness Card -->
        <Card class="border-slate-200 rounded-xl shadow-sm overflow-hidden bg-white">
          <CardHeader class="p-4 border-b border-slate-50">
            <CardTitle
              class="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
            >
              <Lightbulb class="w-4 h-4 text-amber-500" />
              Intensity
            </CardTitle>
          </CardHeader>
          <CardContent class="p-4">
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="opt in brightnessOptions"
                :key="opt.value"
                @click="internalBrightness = opt.value"
                :class="[
                  'flex flex-col items-center gap-1.5 py-3 rounded-lg border transition-all text-[9px] font-black',
                  internalBrightness === opt.value
                    ? 'bg-amber-50 border-amber-200 text-amber-600'
                    : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:bg-slate-50',
                ]"
              >
                <span class="text-xl">{{ opt.icon }}</span>
                {{ opt.label }}
              </button>
            </div>
          </CardContent>
        </Card>

        <!-- Line Status Card -->
        <Card class="border-slate-200 rounded-xl shadow-sm overflow-hidden bg-white">
          <CardHeader class="p-4 border-b border-slate-50">
            <CardTitle
              class="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
            >
              <Zap class="w-4 h-4 text-emerald-500" />
              Neural Paths
            </CardTitle>
          </CardHeader>
          <CardContent class="p-3 space-y-2">
            <div
              v-for="i in 4"
              :key="i"
              @click="toggleLine(i, !!lineUse?.[`line${i}` as keyof LineUseData])"
              class="cursor-pointer p-3 rounded-lg border border-slate-100 flex items-center justify-between transition-all"
              :class="
                lineUse?.[`line${i}` as keyof LineUseData]
                  ? 'bg-emerald-50 border-emerald-100'
                  : 'bg-white'
              "
            >
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-8 h-8 rounded-lg flex items-center justify-center border',
                    lineUse?.[`line${i}` as keyof LineUseData]
                      ? 'bg-emerald-500 text-white border-emerald-400'
                      : 'bg-slate-50 text-slate-400 border-slate-100',
                  ]"
                >
                  <Activity class="w-4 h-4" />
                </div>
                <span class="text-xs font-bold text-slate-700">Line {{ i }}</span>
              </div>
              <div
                :class="[
                  'w-9 h-4.5 rounded-full relative ring-2 ring-slate-50',
                  lineUse?.[`line${i}` as keyof LineUseData] ? 'bg-emerald-500' : 'bg-slate-200',
                ]"
              >
                <div
                  :class="[
                    'w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all',
                    lineUse?.[`line${i}` as keyof LineUseData]
                      ? 'translate-x-5'
                      : 'translate-x-0.5',
                  ]"
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Matrix Grid Area -->
      <div class="xl:col-span-9 h-full">
        <Card
          class="border-slate-200 rounded-xl shadow-sm bg-white flex flex-col h-full overflow-hidden"
        >
          <CardHeader class="p-5 border-b border-slate-50">
            <div class="flex items-center justify-between">
              <CardTitle
                class="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
              >
                <Monitor class="w-4 h-4 text-primary" />
                Node Configuration Matrix
              </CardTitle>
              <div
                class="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100"
              >
                23 ACTIVE NODES
              </div>
            </div>
          </CardHeader>

          <CardContent class="flex-1 p-5 overflow-y-auto custom-scrollbar">
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-3">
              <div
                v-for="(pos, idx) in internalPositions"
                :key="idx"
                class="relative bg-slate-50/50 border border-slate-100 rounded-lg p-3 group hover:border-primary/30 hover:bg-white hover:shadow-md transition-all h-fit"
              >
                <!-- Index -->
                <div
                  class="absolute -top-2 -left-2 w-6 h-6 rounded-md bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:text-primary group-hover:border-primary/30 z-10 transition-colors"
                >
                  {{ idx + 1 }}
                </div>

                <div class="space-y-3 pt-1">
                  <!-- Color -->
                  <div class="space-y-1">
                    <Select v-model="pos.color">
                      <SelectTrigger
                        class="h-8 bg-white border-slate-200 rounded-md text-[10px] px-2 shadow-sm"
                      >
                        <div class="flex items-center gap-2 truncate">
                          <div
                            class="w-3 h-3 rounded-full shrink-0 border border-black/5"
                            :class="getColorClass(pos.color)"
                          ></div>
                          <span class="font-bold text-slate-700 truncate">{{
                            getColorLabel(pos.color)
                          }}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent
                        class="border-slate-200 rounded-lg bg-white shadow-xl min-w-[160px]"
                      >
                        <SelectItem
                          v-for="opt in colorOptions"
                          :key="opt.value"
                          :value="opt.value"
                          class="py-2 focus:bg-slate-50 rounded-md mx-1 my-0.5"
                        >
                          <div class="flex items-center gap-3">
                            <div
                              :class="[
                                'w-4 h-4 rounded-full border border-black/5 shadow-sm',
                                opt.color,
                              ]"
                            ></div>
                            <span class="text-[10px] font-bold text-slate-700">{{
                              opt.label
                            }}</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <!-- Text -->
                  <div class="space-y-1">
                    <Select v-model="pos.text">
                      <SelectTrigger
                        class="h-8 bg-white border-slate-200 rounded-md text-[10px] px-2 shadow-sm font-mono font-bold text-slate-800"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent class="border-slate-200 rounded-lg bg-white shadow-xl">
                        <SelectItem
                          v-for="opt in textOptions"
                          :key="opt.value"
                          :value="opt.value"
                          class="py-2 font-mono text-[10px] font-bold focus:bg-primary/5"
                        >
                          {{ opt.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <!-- Compact Footer HUD -->
          <div
            class="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-8"
          >
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm animate-pulse"></div>
              <span class="text-[9px] font-black text-slate-500 tracking-widest uppercase"
                >Buffer: DB54</span
              >
            </div>
            <div class="w-px h-3 bg-slate-200"></div>
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-primary shadow-sm"></div>
              <span class="text-[9px] font-black text-slate-500 tracking-widest uppercase"
                >Node: P1-P23</span
              >
            </div>
            <div class="w-px h-3 bg-slate-200"></div>
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm"></div>
              <span class="text-[9px] font-black text-slate-500 tracking-widest uppercase"
                >Ack: %M150.0</span
              >
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Radius Override for consistency */
.rounded-xl {
  border-radius: 12px;
}
.rounded-lg {
  border-radius: 8px;
}
.rounded-md {
  border-radius: 6px;
}

/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* Crisp Text */
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
