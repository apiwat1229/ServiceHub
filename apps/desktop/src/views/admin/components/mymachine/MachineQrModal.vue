<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, Download, ExternalLink, Monitor, QrCode } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';
import { ref } from 'vue';
import { toast } from 'vue-sonner';

const props = defineProps<{
  machine: any;
}>();

const emit = defineEmits(['close']);

const publicUrl = ref(`https://app.ytrc.co.th/#/public/machine/${props.machine.id}`);

const copyToClipboard = () => {
  navigator.clipboard.writeText(publicUrl.value);
  toast.success('Link copied to clipboard');
};

const downloadQr = () => {
  const canvas = document.querySelector('.machine-qr-container canvas') as HTMLCanvasElement;
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `QR-${props.machine.name}.png`;
  link.href = canvas.toDataURL();
  link.click();
  toast.success('QR Code downloaded');
};
</script>

<template>
  <DialogContent class="w-[95vw] sm:max-w-[425px] overflow-hidden bg-white">
    <DialogHeader class="px-6 py-4 md:p-6 pb-2 border-b border-slate-100 relative overflow-hidden">
      <div class="flex items-center gap-3 mb-2 relative z-10">
        <div class="p-2 bg-blue-50 rounded-lg">
          <Monitor class="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <DialogTitle class="text-lg sm:text-xl">Asset QR Code</DialogTitle>
          <DialogDescription class="text-[0.625rem] sm:text-xs">
            Scannable link for external asset status tracking.
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>

    <div class="flex flex-col items-center justify-center p-6 md:py-6">
      <!-- QR Preview -->
      <div
        class="machine-qr-container bg-white border-2 border-slate-100 rounded-2xl p-4 sm:p-6 shadow-sm mb-6 relative group"
      >
        <div
          class="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center"
        >
          <QrCode class="h-12 w-12 text-blue-600/20" />
        </div>
        <QrcodeVue
          :value="publicUrl"
          :size="180"
          :sm:size="200"
          level="H"
          render-as="canvas"
          class="relative z-10"
        />
      </div>

      <!-- Info Card -->
      <div class="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[0.625rem] font-semibold text-slate-500 uppercase tracking-wider"
            >Public Asset Link</span
          >
          <button
            @click="copyToClipboard"
            class="flex items-center gap-1.5 text-[0.625rem] text-blue-600 font-bold hover:text-blue-700 transition-colors"
          >
            <Copy class="h-3 w-3" />
            Copy
          </button>
        </div>
        <div
          class="flex items-center gap-2 text-xs sm:text-sm text-slate-600 break-all font-medium"
        >
          <ExternalLink class="h-4 w-4 flex-shrink-0 text-slate-400" />
          {{ publicUrl }}
        </div>
      </div>

      <!-- Quick Info Refernce -->
      <div class="grid grid-cols-2 gap-3 w-full">
        <div class="bg-white border border-slate-100 rounded-lg p-2.5 sm:p-3 text-center">
          <p class="text-[0.5625rem] sm:text-[0.625rem] text-slate-400 uppercase font-bold mb-0.5">
            Asset Name
          </p>
          <p class="text-xs sm:text-sm font-semibold text-slate-700 truncate px-1">
            {{ machine.name }}
          </p>
        </div>
        <div class="bg-white border border-slate-100 rounded-lg p-2.5 sm:p-3 text-center">
          <p class="text-[0.5625rem] sm:text-[0.625rem] text-slate-400 uppercase font-bold mb-0.5">Model</p>
          <p class="text-xs sm:text-sm font-semibold text-slate-700 truncate px-1">
            {{ machine.model }}
          </p>
        </div>
      </div>
    </div>

    <DialogFooter class="flex flex-col sm:flex-row gap-2 border-t p-4 sm:pt-4">
      <Button
        variant="outline"
        class="flex-1 h-10 font-bold text-slate-600 order-2 sm:order-1"
        @click="emit('close')"
      >
        Close
      </Button>
      <Button
        class="flex-1 bg-blue-600 hover:bg-blue-700 h-10 shadow-md order-1 sm:order-2"
        @click="downloadQr"
      >
        <Download class="h-4 w-4 mr-2" />
        Download Image
      </Button>
    </DialogFooter>
  </DialogContent>
</template>
