<script setup lang="ts">
import JsBarcode from 'jsbarcode';
import { nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
}>();

const barcodeRef = ref<SVGSVGElement | null>(null);

const renderBarcode = async () => {
  if (!props.value) return;
  await nextTick();
  if (barcodeRef.value) {
    try {
      JsBarcode(barcodeRef.value, props.value, {
        format: 'CODE128',
        width: props.width || 2,
        height: props.height || 40,
        displayValue: true,
        fontSize: props.fontSize || 12,
        background: 'transparent',
      });
    } catch (e) {
      console.error('Barcode rendering failed:', e);
    }
  }
};

onMounted(renderBarcode);
watch(() => props.value, renderBarcode);
</script>

<template>
  <div class="flex justify-center w-full bg-white rounded p-1 border border-dashed">
    <svg ref="barcodeRef"></svg>
  </div>
</template>
