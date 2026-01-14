<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RotateCcw } from 'lucide-vue-next';
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  open: boolean;
  image: string;
}>();

const emit = defineEmits(['update:open', 'crop', 'cancel']);

const { t } = useI18n();
const canvas = ref<HTMLCanvasElement | null>(null);
const img = ref<HTMLImageElement | null>(null);
const cropArea = ref({
  x: 0,
  y: 0,
  size: 280, // Fixed size
});
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const zoom = ref(1.0); // Zoom level: 0.5 to 3.0
const imageOffset = ref({ x: 0, y: 0 });

// Watch for image changes and initialize crop area
watch(
  () => [props.open, props.image],
  ([isOpen, newImage]) => {
    if (isOpen && newImage) {
      zoom.value = 1.0;
      imageOffset.value = { x: 0, y: 0 };
      isDragging.value = false;
      setTimeout(() => {
        initializeCropArea();
      }, 100);
    }
  }
);

const initializeCropArea = () => {
  if (!img.value || !canvas.value) return;

  const canvasWidth = canvas.value.width;
  const canvasHeight = canvas.value.height;

  // Center the fixed-size crop area
  cropArea.value = {
    x: (canvasWidth - cropArea.value.size) / 2,
    y: (canvasHeight - cropArea.value.size) / 2,
    size: cropArea.value.size,
  };

  drawCanvas();
};

const drawCanvas = () => {
  if (!canvas.value || !img.value) return;

  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;

  const canvasWidth = canvas.value.width;
  const canvasHeight = canvas.value.height;
  const imgWidth = img.value.naturalWidth;
  const imgHeight = img.value.naturalHeight;

  // Calculate scale with zoom
  const baseScale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
  const scale = baseScale * zoom.value;
  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;

  // Center the image with offset
  const offsetX = (canvasWidth - scaledWidth) / 2 + imageOffset.value.x;
  const offsetY = (canvasHeight - scaledHeight) / 2 + imageOffset.value.y;

  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Fill background
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw image
  ctx.save();
  ctx.drawImage(img.value, offsetX, offsetY, scaledWidth, scaledHeight);
  ctx.restore();

  // Draw overlay (darkened area outside crop)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Clear crop area
  ctx.clearRect(cropArea.value.x, cropArea.value.y, cropArea.value.size, cropArea.value.size);

  // Redraw image in crop area
  ctx.save();
  ctx.beginPath();
  ctx.rect(cropArea.value.x, cropArea.value.y, cropArea.value.size, cropArea.value.size);
  ctx.clip();
  ctx.drawImage(img.value, offsetX, offsetY, scaledWidth, scaledHeight);
  ctx.restore();

  // Draw crop border
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 3;
  ctx.strokeRect(cropArea.value.x, cropArea.value.y, cropArea.value.size, cropArea.value.size);

  // Draw corner indicators (non-interactive)
  const cornerSize = 20;
  const cornerThickness = 3;
  const corners = [
    { x: cropArea.value.x, y: cropArea.value.y }, // Top-left
    { x: cropArea.value.x + cropArea.value.size, y: cropArea.value.y }, // Top-right
    { x: cropArea.value.x, y: cropArea.value.y + cropArea.value.size }, // Bottom-left
    {
      x: cropArea.value.x + cropArea.value.size,
      y: cropArea.value.y + cropArea.value.size,
    }, // Bottom-right
  ];

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = cornerThickness;
  ctx.lineCap = 'square';

  corners.forEach((corner, index) => {
    // Draw L-shaped corner indicators
    ctx.beginPath();
    if (index === 0) {
      // Top-left
      ctx.moveTo(corner.x, corner.y + cornerSize);
      ctx.lineTo(corner.x, corner.y);
      ctx.lineTo(corner.x + cornerSize, corner.y);
    } else if (index === 1) {
      // Top-right
      ctx.moveTo(corner.x - cornerSize, corner.y);
      ctx.lineTo(corner.x, corner.y);
      ctx.lineTo(corner.x, corner.y + cornerSize);
    } else if (index === 2) {
      // Bottom-left
      ctx.moveTo(corner.x, corner.y - cornerSize);
      ctx.lineTo(corner.x, corner.y);
      ctx.lineTo(corner.x + cornerSize, corner.y);
    } else {
      // Bottom-right
      ctx.moveTo(corner.x - cornerSize, corner.y);
      ctx.lineTo(corner.x, corner.y);
      ctx.lineTo(corner.x, corner.y - cornerSize);
    }
    ctx.stroke();
  });
};

const handleMouseDown = (e: MouseEvent) => {
  if (!canvas.value) return;
  const rect = canvas.value.getBoundingClientRect();
  const scaleX = canvas.value.width / rect.width;
  const scaleY = canvas.value.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  // Check if click is inside crop area for dragging
  if (
    x >= cropArea.value.x &&
    x <= cropArea.value.x + cropArea.value.size &&
    y >= cropArea.value.y &&
    y <= cropArea.value.y + cropArea.value.size
  ) {
    isDragging.value = true;
    dragStart.value = { x: x - cropArea.value.x, y: y - cropArea.value.y };
  }
};

const handleMouseMove = (e: MouseEvent) => {
  if (!canvas.value) return;

  const rect = canvas.value.getBoundingClientRect();
  const scaleX = canvas.value.width / rect.width;
  const scaleY = canvas.value.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  // Update cursor
  if (!isDragging.value) {
    if (
      x >= cropArea.value.x &&
      x <= cropArea.value.x + cropArea.value.size &&
      y >= cropArea.value.y &&
      y <= cropArea.value.y + cropArea.value.size
    ) {
      canvas.value.style.cursor = 'move';
    } else {
      canvas.value.style.cursor = 'default';
    }
  }

  // Handle dragging
  if (isDragging.value) {
    let newX = x - dragStart.value.x;
    let newY = y - dragStart.value.y;

    // Constrain to canvas bounds
    const canvasWidth = canvas.value.width;
    const canvasHeight = canvas.value.height;
    newX = Math.max(0, Math.min(newX, canvasWidth - cropArea.value.size));
    newY = Math.max(0, Math.min(newY, canvasHeight - cropArea.value.size));

    cropArea.value.x = newX;
    cropArea.value.y = newY;

    drawCanvas();
  }
};

const handleMouseUp = () => {
  isDragging.value = false;
  if (canvas.value) {
    canvas.value.style.cursor = 'default';
  }
};

const handleWheel = (e: WheelEvent) => {
  e.preventDefault();

  // Zoom in/out based on wheel direction
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  zoom.value = Math.max(0.5, Math.min(zoom.value + delta, 3.0));

  drawCanvas();
};

const handleReset = () => {
  zoom.value = 1.0;
  imageOffset.value = { x: 0, y: 0 };
  initializeCropArea();
};

const handleCrop = () => {
  if (!canvas.value || !img.value) return;

  const canvasWidth = canvas.value.width;
  const canvasHeight = canvas.value.height;
  const imgWidth = img.value.naturalWidth;
  const imgHeight = img.value.naturalHeight;

  // Calculate scale with zoom
  const baseScale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
  const scale = baseScale * zoom.value;
  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;
  const offsetX = (canvasWidth - scaledWidth) / 2 + imageOffset.value.x;
  const offsetY = (canvasHeight - scaledHeight) / 2 + imageOffset.value.y;

  // Calculate crop coordinates in original image
  const cropX = (cropArea.value.x - offsetX) / scale;
  const cropY = (cropArea.value.y - offsetY) / scale;
  const cropSize = cropArea.value.size / scale;

  // Create output canvas
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = 400;
  outputCanvas.height = 400;
  const ctx = outputCanvas.getContext('2d');

  if (ctx) {
    ctx.drawImage(img.value, cropX, cropY, cropSize, cropSize, 0, 0, 400, 400);

    const croppedImage = outputCanvas.toDataURL('image/jpeg', 0.85);
    emit('crop', croppedImage);
    emit('update:open', false);
  }
};

const handleCancel = () => {
  emit('cancel');
  emit('update:open', false);
};

const handleImageLoad = () => {
  initializeCropArea();
};

onMounted(() => {
  if (props.open && props.image) {
    initializeCropArea();
  }
});
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[650px] p-0 overflow-hidden border-none shadow-2xl bg-white">
      <DialogHeader class="px-6 pt-6 pb-3 text-left">
        <DialogTitle class="text-xl font-bold text-slate-900">
          {{ t('services.maintenance.forms.image.cropTitle') }}
        </DialogTitle>
        <DialogDescription class="text-slate-500 text-sm">
          Drag the crop area to adjust. Use mouse wheel to zoom. Max 2MB.
        </DialogDescription>
      </DialogHeader>

      <div class="px-6 pb-4">
        <!-- Zoom Display and Reset -->
        <div class="flex items-center justify-center gap-2 mb-3">
          <span class="text-xs font-medium text-slate-600 min-w-[60px] text-center">
            Zoom: {{ Math.round(zoom * 100) }}%
          </span>
          <Button type="button" variant="outline" size="sm" @click="handleReset" class="h-8 px-3">
            <RotateCcw class="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>

        <div class="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <img
            v-show="false"
            ref="img"
            :src="image"
            @load="handleImageLoad"
            crossorigin="anonymous"
          />
          <canvas
            ref="canvas"
            width="600"
            height="400"
            class="w-full cursor-move select-none"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseUp"
            @wheel="handleWheel"
          />
        </div>
        <p class="text-[10px] text-slate-500 mt-2 text-center">
          Drag the blue square to move • Scroll mouse wheel to zoom image
        </p>
      </div>

      <DialogFooter class="px-6 py-4 bg-slate-50 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" @click="handleCancel" class="text-slate-500 font-bold">
          {{ t('services.maintenance.forms.common.cancel') }}
        </Button>
        <Button
          size="sm"
          @click="handleCrop"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6"
        >
          {{ t('services.maintenance.forms.image.cropAction') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
canvas {
  display: block;
}
</style>
