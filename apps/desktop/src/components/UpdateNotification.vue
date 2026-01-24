<template>
  <Transition name="slide-fade">
    <div v-if="showNotification" class="update-notification">
      <div class="update-content">
        <div class="update-header">
          <div class="update-icon">
            <svg
              v-if="updateState === 'checking'"
              class="animate-spin"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" stroke-width="2" stroke-linecap="round" />
            </svg>
            <svg
              v-else-if="updateState === 'available'"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M7 10l5 5 5-5M12 15V3"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg
              v-else-if="updateState === 'downloaded'"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M20 6L9 17l-5-5"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg
              v-else-if="updateState === 'error'"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg
              v-else-if="updateState === 'checked'"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M22 4L12 14.01l-3-3"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div class="update-text">
            <h3>{{ title }}</h3>
            <p>{{ message }}</p>
          </div>
          <button @click="closeNotification" class="close-btn" aria-label="ปิด">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M6 18L18 6M6 6l12 12"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <!-- Progress Bar -->
        <div v-if="downloadProgress" class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: downloadProgress.percent + '%' }"></div>
          </div>
          <div class="progress-info">
            <span class="progress-percent">{{ Math.round(downloadProgress.percent) }}%</span>
            <span class="progress-speed">{{ formatSpeed(downloadProgress.bytesPerSecond) }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="update-actions">
          <button
            v-if="updateState === 'available' && !downloading"
            @click="downloadUpdate"
            class="btn-primary"
          >
            Download Update
          </button>
          <button v-if="updateState === 'downloaded'" @click="installUpdate" class="btn-success">
            Install & Restart
          </button>
          <button
            v-if="updateState === 'downloaded'"
            @click="closeNotification"
            class="btn-secondary"
          >
            Install Later
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

interface ProgressInfo {
  total: number;
  delta: number;
  transferred: number;
  percent: number;
  bytesPerSecond: number;
}

const showNotification = ref(false);
const title = ref('');
const message = ref('');
const updateState = ref<
  'checking' | 'available' | 'downloading' | 'downloaded' | 'error' | 'checked' | null
>(null);
const downloading = ref(false);
const downloadProgress = ref<ProgressInfo | null>(null);

const formatSpeed = (bytesPerSecond: number): string => {
  const mbps = bytesPerSecond / (1024 * 1024);
  return `${mbps.toFixed(2)} MB/s`;
};

const downloadUpdate = () => {
  if (window.ipcRenderer?.autoUpdate) {
    window.ipcRenderer.autoUpdate.downloadUpdate();
  }
};

const installUpdate = () => {
  if (window.ipcRenderer?.autoUpdate) {
    window.ipcRenderer.autoUpdate.installUpdate();
  }
};

const closeNotification = () => {
  showNotification.value = false;
  updateState.value = null;
  downloadProgress.value = null;
};

let cleanupFunctions: (() => void)[] = [];

onMounted(() => {
  if (window.ipcRenderer?.autoUpdate) {
    // Checking for update
    const unsubChecking = window.ipcRenderer.autoUpdate.onChecking(() => {
      showNotification.value = true;
      updateState.value = 'checking';
      title.value = 'Checking for updates...';
      message.value = 'Please wait...';
    });

    // Update available
    const unsubAvailable = window.ipcRenderer.autoUpdate.onUpdateAvailable((info: UpdateInfo) => {
      showNotification.value = true;
      updateState.value = 'available';
      title.value = 'New version available!';
      message.value = `Version ${info.version} is available for download`;
    });

    // Update not available
    const unsubNotAvailable = window.ipcRenderer.autoUpdate.onUpdateNotAvailable(() => {
      showNotification.value = true;
      updateState.value = 'checked';
      title.value = 'Up to date';
      message.value = 'You are using the latest version';

      // Auto close after 10 seconds
      setTimeout(() => {
        showNotification.value = false;
      }, 10000);
    });

    // Download progress
    const unsubProgress = window.ipcRenderer.autoUpdate.onDownloadProgress(
      (progress: ProgressInfo) => {
        downloading.value = true;
        updateState.value = 'downloading';
        downloadProgress.value = progress;
        title.value = 'Downloading...';
        message.value = 'Downloading update...';
      }
    );

    // Update downloaded
    const unsubDownloaded = window.ipcRenderer.autoUpdate.onUpdateDownloaded((info: UpdateInfo) => {
      downloading.value = false;
      updateState.value = 'downloaded';
      downloadProgress.value = null;
      title.value = 'Download complete!';
      message.value = `Version ${info.version} is ready to install`;
    });

    // Error
    const unsubError = window.ipcRenderer.autoUpdate.onError((error: string) => {
      showNotification.value = true;
      updateState.value = 'error';
      title.value = 'Error';
      message.value = error;
      downloading.value = false;
      downloadProgress.value = null;
    });

    cleanupFunctions = [
      unsubChecking,
      unsubAvailable,
      unsubNotAvailable,
      unsubProgress,
      unsubDownloaded,
      unsubError,
    ];
  }
});

onUnmounted(() => {
  cleanupFunctions.forEach((cleanup) => cleanup());
});
</script>

<style scoped>
.update-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  padding: 20px;
  max-width: 400px;
  min-width: 350px;
  z-index: 9999;
  border: 1px solid #e5e7eb;
}

.update-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.update-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f3f4f6;
  color: #3b82f6;
}

.update-icon svg {
  width: 24px;
  height: 24px;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.update-text {
  flex: 1;
}

.update-text h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.update-text p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.close-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #6b7280;
}

.progress-container {
  margin-bottom: 16px;
}

.progress-bar {
  position: relative;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
}

.progress-percent {
  font-weight: 600;
  color: #3b82f6;
}

.update-actions {
  display: flex;
  gap: 8px;
}

.update-actions button {
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-secondary {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-secondary:hover {
  background: #e5e7eb;
  color: #4b5563;
}

/* Transition */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
