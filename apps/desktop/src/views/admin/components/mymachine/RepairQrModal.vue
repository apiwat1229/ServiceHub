<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, Download, ExternalLink, QrCode, Wrench } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';
import { toast } from 'vue-sonner';

const props = defineProps<{
  repair: any;
}>();

const emit = defineEmits(['close']);

// Public URL for the specific repair log (Production domain)
const publicUrl = `https://app.ytrc.co.th/#/public/log/${props.repair.id}`;

const copyLink = () => {
  navigator.clipboard.writeText(publicUrl);
  toast.success('Log link copied to clipboard');
};

const downloadQr = () => {
  const canvas = document.querySelector('.repair-qr-container canvas') as HTMLCanvasElement;
  if (canvas) {
    const link = document.createElement('a');
    link.download = `Log-${props.repair.machineName}-${props.repair.date}.png`;
    link.href = canvas.toDataURL();
    link.click();
    toast.success('QR Code downloaded');
  }
};
</script>

<template>
  <DialogContent class="sm:max-w-[425px] overflow-hidden">
    <DialogHeader>
      <div class="flex items-center gap-3 mb-2">
        <div class="p-2 bg-blue-50 rounded-lg">
          <Wrench class="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <DialogTitle class="text-xl">Repair Log QR</DialogTitle>
          <DialogDescription>
            Scannable link for this specific maintenance record.
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>

    <div class="flex flex-col items-center justify-center py-6">
      <!-- QR Preview -->
      <div
        class="repair-qr-container bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm mb-6 relative group"
      >
        <div
          class="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center"
        >
          <QrCode class="h-12 w-12 text-blue-600/20" />
        </div>
        <QrcodeVue
          :value="publicUrl"
          :size="200"
          level="H"
          render-as="canvas"
          class="relative z-10"
        />
      </div>

      <!-- Info Card -->
      <div class="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >Public Log Link</span
          >
          <Button variant="ghost" size="sm" class="h-7 px-2 text-blue-600" @click="copyLink">
            <Copy class="h-3 w-3 mr-1" />
            Copy
          </Button>
        </div>
        <div class="flex items-center gap-2 text-sm text-slate-600 break-all font-medium">
          <ExternalLink class="h-4 w-4 flex-shrink-0 text-slate-400" />
          {{ publicUrl }}
        </div>
      </div>

      <!-- Quick Stats Ref -->
      <div class="grid grid-cols-2 gap-3 w-full">
        <div class="bg-white border border-slate-100 rounded-lg p-3 text-center">
          <p class="text-[0.625rem] text-slate-400 uppercase font-bold mb-0.5">Asset</p>
          <p class="text-sm font-semibold text-slate-700">{{ repair.machineName }}</p>
        </div>
        <div class="bg-white border border-slate-100 rounded-lg p-3 text-center">
          <p class="text-[0.625rem] text-slate-400 uppercase font-bold mb-0.5">Repair Date</p>
          <p class="text-sm font-semibold text-slate-700">{{ repair.date }}</p>
        </div>
      </div>
    </div>

    <DialogFooter class="flex sm:justify-between gap-2">
      <Button variant="outline" class="flex-1" @click="emit('close')"> Close </Button>
      <Button class="flex-1 bg-blue-600 hover:bg-blue-700" @click="downloadQr">
        <Download class="h-4 w-4 mr-2" />
        Download Image
      </Button>
    </DialogFooter>
  </DialogContent>
</template>
