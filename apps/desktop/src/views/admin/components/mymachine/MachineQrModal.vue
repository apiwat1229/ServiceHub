<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { DialogContent } from '@/components/ui/dialog';
import { Copy, Download, Monitor, QrCode } from 'lucide-vue-next';
import QrcodeVue from 'qrcode.vue';
import { ref } from 'vue';
import { toast } from 'vue-sonner';

const props = defineProps<{
  machine: any;
}>();

const emit = defineEmits(['close']);

const publicUrl = ref(`https://ytre.co.th/asset/${props.machine.id}`);

const copyToClipboard = () => {
  navigator.clipboard.writeText(publicUrl.value);
  toast.success('Link copied to clipboard');
};

const downloadQr = () => {
  const canvas = document.querySelector('.qr-container canvas') as HTMLCanvasElement;
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `QR-${props.machine.name}.png`;
  link.href = canvas.toDataURL();
  link.click();
};
</script>

<template>
  <DialogContent class="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
    <div class="bg-blue-600 p-6 text-white text-center relative overflow-hidden">
      <!-- Decorative background -->
      <QrCode class="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />

      <div class="relative z-10 space-y-2">
        <h2 class="text-2xl font-black tracking-tight">Generate Asset QR</h2>
        <p class="text-blue-100 text-sm">Public link for external status tracking</p>
      </div>
    </div>

    <div class="p-8 bg-white flex flex-col items-center gap-6">
      <div
        class="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100"
      >
        <div
          class="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm border border-slate-100"
        >
          <Monitor class="w-6 h-6" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-slate-900 truncate">{{ machine.name }}</p>
          <p class="text-xs text-slate-500 truncate">{{ machine.model }}</p>
        </div>
      </div>

      <div class="qr-container bg-white p-6 rounded-2xl border-2 border-slate-50 shadow-inner">
        <QrcodeVue :value="publicUrl" :size="200" level="H" render-as="canvas" class="mx-auto" />
      </div>

      <div class="w-full space-y-4">
        <div class="relative">
          <input
            type="text"
            readonly
            :value="publicUrl"
            class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-500 pr-10"
          />
          <button
            @click="copyToClipboard"
            class="absolute right-2 top-1.5 p-1 hover:bg-slate-200 rounded transition-colors text-slate-400"
          >
            <Copy class="w-4 h-4" />
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <Button variant="outline" class="w-full gap-2 border-slate-200" @click="downloadQr">
            <Download class="w-4 h-4" /> Download
          </Button>
          <Button
            variant="default"
            class="w-full gap-2 bg-blue-600 hover:bg-blue-700"
            @click="emit('close')"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  </DialogContent>
</template>
