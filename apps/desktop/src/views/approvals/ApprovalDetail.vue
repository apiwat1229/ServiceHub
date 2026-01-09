<script setup lang="ts">
import ApprovalActions from '@/components/approval/ApprovalActions.vue';
import ApprovalHistoryTimeline from '@/components/approval/ApprovalHistoryTimeline.vue';
import ApprovalStatusBadge from '@/components/approval/ApprovalStatusBadge.vue';
import VoidedWatermark from '@/components/approval/VoidedWatermark.vue';
import ApproveDialog from '@/components/approval/dialogs/ApproveDialog.vue';
import CancelDialog from '@/components/approval/dialogs/CancelDialog.vue';
import RejectDialog from '@/components/approval/dialogs/RejectDialog.vue';
import ReturnDialog from '@/components/approval/dialogs/ReturnDialog.vue';
import VoidDialog from '@/components/approval/dialogs/VoidDialog.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import approvalsApi, { type ApprovalLog, type ApprovalRequest } from '@/services/approvals';
import { bookingsApi } from '@/services/bookings';
import { useAuthStore } from '@/stores/auth';
import { handleApiError } from '@/utils/errorHandler';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const request = ref<ApprovalRequest | null>(null);
const history = ref<ApprovalLog[]>([]);
const isLoading = ref(false);
const bookingContext = ref<any>(null);

// Dialog states
const showApproveDialog = ref(false);
const showRejectDialog = ref(false);
const showVoidDialog = ref(false);
const showCancelDialog = ref(false);
const showReturnDialog = ref(false);

const { t, locale } = useI18n();

const currentUser = computed(() => authStore.user);
const isVoided = computed(() => request.value?.status === 'VOID');

const fetchRequest = async () => {
  try {
    isLoading.value = true;
    const id = route.params.id as string;

    const [requestRes, historyRes] = await Promise.all([
      approvalsApi.getOne(id),
      approvalsApi.getHistory(id),
    ]);

    request.value = requestRes.data;
    history.value = historyRes.data;

    // Fetch booking context if metadata is missing in currentData
    if (
      request.value &&
      (request.value.entityType?.toLowerCase() === 'booking' ||
        request.value.sourceApp?.toLowerCase() === 'booking') &&
      request.value.entityId &&
      (!request.value.currentData?.bookingCode || !request.value.currentData?.supplierName)
    ) {
      try {
        const booking = await bookingsApi.getById(request.value.entityId);
        if (booking) {
          bookingContext.value = booking;
        }
      } catch (err) {
        console.warn('Failed to fetch booking context:', err);
      }
    }
  } catch (error: any) {
    handleApiError(error, t('approval.detail.loadError'));
    router.push('/approvals');
  } finally {
    isLoading.value = false;
  }
};

const formatDateWithTime = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (locale.value === 'th') {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
      .format(date)
      .replace('เวลา', '') // Remove default 'เวลา' if present to avoid duplication if we add it manually, or just rely on standard format
      .replace(/(\d{2}:\d{2})/, 'เวลา $1'); // Custom format "9 มกราคม 2569 เวลา 13:00"
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
};

const formatDateOnly = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const formatValue = (val: any) => {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'number') {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }).format(val);
  }
  if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }).format(Number(val));
  }
  return val;
};

const prettifyKey = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const changedFields = computed(() => {
  if (!request.value?.proposedData) return {};
  const current = request.value.currentData || {};
  const proposed = request.value.proposedData;
  const changes: Record<string, any> = {};

  Object.keys(proposed).forEach((key) => {
    // loose comparison to match display logic (string vs number)
    if (String(current[key] ?? '') !== String(proposed[key] ?? '')) {
      changes[key] = proposed[key];
    }
  });
  return changes;
});

const handleSuccess = () => {
  fetchRequest();
};

onMounted(() => {
  fetchRequest();
});
</script>

<template>
  <div v-if="request" class="min-h-screen bg-slate-50/50 pb-20">
    <div class="w-full mx-auto px-4 sm:px-8 lg:px-12 py-6 space-y-4">
      <!-- Main Consolidated Approval Card -->
      <VoidedWatermark :is-voided="isVoided">
        <Card
          class="overflow-hidden border-none shadow-lg shadow-slate-200/50 transition-all duration-300"
        >
          <CardHeader class="border-b bg-slate-50/50 px-6 py-3">
            <div
              class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div class="space-y-0.5">
                <div class="flex items-center gap-2.5">
                  <h1
                    class="text-lg font-black tracking-tight text-slate-900"
                    :class="{ 'line-through text-slate-400': isVoided }"
                  >
                    {{ request.requestType }}
                  </h1>
                  <ApprovalStatusBadge :status="request.status" class="scale-75 origin-left" />
                </div>
                <p
                  class="text-xs font-semibold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide"
                >
                  {{ t('approval.detail.entityType') }}:
                  <span class="text-slate-700 font-bold">{{ request.entityType }}</span>
                </p>
              </div>

              <div v-if="currentUser" class="no-drag flex items-center gap-2 scale-90 origin-right">
                <ApprovalActions
                  :request="request"
                  :current-user-id="currentUser.id"
                  :current-user-role="currentUser.role"
                  @approve="showApproveDialog = true"
                  @reject="showRejectDialog = true"
                  @return="showReturnDialog = true"
                  @cancel="showCancelDialog = true"
                  @void="showVoidDialog = true"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent class="p-0">
            <!-- Section 1: Top Metadata (Booking Context) -->
            <div
              v-if="
                request.entityType?.toLowerCase() === 'booking' ||
                request.sourceApp?.toLowerCase() === 'booking'
              "
              class="px-6 py-4 bg-orange-50/30 border-b border-orange-100/40 relative"
            >
              <div class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-y-4 gap-x-6">
                <!-- Col 1 -->
                <div class="space-y-0.5">
                  <p class="text-xs text-orange-900/60 uppercase font-bold tracking-wider">
                    {{ t('common.bookingCode') }}
                  </p>
                  <p class="text-sm font-mono font-bold text-slate-900 leading-none">
                    {{ request.currentData?.bookingCode || bookingContext?.bookingCode || '-' }}
                  </p>
                </div>
                <!-- Col 2 -->
                <div class="space-y-0.5">
                  <p class="text-xs text-orange-900/60 uppercase font-bold tracking-wider">
                    {{ t('common.date') }}
                  </p>
                  <p class="text-xs font-bold text-slate-800 leading-none">
                    {{ formatDateOnly(request.currentData?.date || bookingContext?.date) }}
                    <span class="text-orange-600 font-black ml-1"
                      >({{ request.currentData?.slot || bookingContext?.slot || '-' }})</span
                    >
                  </p>
                </div>
                <!-- Col 3 -->
                <div class="space-y-0.5">
                  <p class="text-xs text-orange-900/60 uppercase font-bold tracking-wider">
                    {{ t('common.supplier') }}
                  </p>
                  <p
                    class="text-xs font-black text-slate-900 truncate leading-none"
                    :title="request.currentData?.supplierName || bookingContext?.supplierName"
                  >
                    {{
                      (request.currentData?.supplierCode || bookingContext?.supplierCode || '-') +
                      ' - ' +
                      (request.currentData?.supplierName || bookingContext?.supplierName || '-')
                    }}
                  </p>
                </div>
                <!-- Col 4 -->
                <div class="space-y-0.5">
                  <p class="text-xs text-emerald-700/60 uppercase font-bold tracking-wider">
                    {{ t('approval.detail.rubberAndTruck') }}
                  </p>
                  <div class="flex items-center gap-1.5 leading-none">
                    <span class="text-xs font-black text-emerald-800">{{
                      request.currentData?.rubberType || bookingContext?.rubberType || '-'
                    }}</span>
                    <span class="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                      {{ request.currentData?.truckType || bookingContext?.truckType || '-' }}
                    </span>
                    <span
                      class="text-[9px] font-mono font-black text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100"
                    >
                      {{
                        request.currentData?.truckRegister || bookingContext?.truckRegister || '-'
                      }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 2: Request Info (Requester, Date, Reason, Remark in horizontal grid) -->
            <div
              class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 divide-x divide-slate-100 border-b border-slate-100"
            >
              <!-- Meta: Requester & Date -->
              <div
                class="px-6 py-4 space-y-3 col-span-1 md:col-span-1 lg:col-span-1 border-r border-slate-100"
              >
                <div class="flex flex-col gap-1">
                  <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">{{
                    t('approval.detail.requester')
                  }}</span>
                  <div
                    class="flex items-center gap-1.5 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/50 w-fit"
                  >
                    <div
                      class="w-3.5 h-3.5 rounded bg-primary/20 flex items-center justify-center text-[8px] font-black text-primary"
                    >
                      {{ request.requester?.displayName?.charAt(0) || 'U' }}
                    </div>
                    <span class="text-[11px] font-black text-slate-700 truncate max-w-[100px]">{{
                      request.requester?.displayName || request.requester?.email || '-'
                    }}</span>
                  </div>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">{{
                    t('approval.detail.submittedDate')
                  }}</span>
                  <span class="text-[11px] font-bold text-slate-600">{{
                    formatDateWithTime(request.submittedAt)
                  }}</span>
                </div>
              </div>

              <!-- Reason -->
              <div
                class="px-6 py-4 bg-slate-50/5 col-span-1 md:col-span-2 lg:col-span-3 border-r border-slate-100"
              >
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">{{
                  t('approval.detail.reason')
                }}</span>
                <p class="mt-2 text-[11px] italic text-slate-600 font-medium leading-relaxed">
                  {{ request.reason || '-' }}
                </p>
              </div>

              <!-- Changes Summary (Replacing Remark) -->
              <div class="px-6 py-4 col-span-1 md:col-span-1 lg:col-span-2">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">{{
                  t('approval.detail.proposedChanges')
                }}</span>
                <div class="mt-2 space-y-2 overflow-y-auto max-h-[120px] scrollbar-hide">
                  <!-- Structured Proposed Data -->
                  <div v-if="Object.keys(changedFields).length > 0" class="space-y-1">
                    <div
                      v-for="(value, key) in changedFields"
                      :key="key"
                      class="flex items-center flex-wrap gap-x-2 gap-y-0.5"
                    >
                      <span class="text-[10px] text-slate-400 font-black uppercase tracking-tighter"
                        >{{ prettifyKey(String(key)) }}:</span
                      >
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <!-- Old Value -->
                        <span
                          class="text-[10px] text-slate-400 line-through decoration-slate-300 decoration-1"
                        >
                          {{ formatValue(request.currentData?.[key]) || '-' }}
                        </span>

                        <!-- Arrow indicator -->
                        <span class="text-[10px] text-slate-300">➜</span>

                        <!-- New Value -->
                        <span class="text-[11px] font-black text-primary">{{
                          formatValue(value)
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Any additional Remark/Notes -->
                  <div
                    v-if="request.remark"
                    class="pt-1.5 border-t border-slate-100/50 mt-1.5 first:mt-0 first:pt-0 first:border-0"
                  >
                    <p class="text-[11px] italic text-slate-500 font-medium leading-relaxed">
                      "{{ request.remark }}"
                    </p>
                  </div>

                  <!-- Fallback if absolutely nothing -->
                  <p
                    v-if="!Object.keys(changedFields).length && !request.remark"
                    class="text-[11px] text-slate-300 italic font-medium"
                  >
                    {{ t('approval.detail.noChanges') || 'No changes detected' }}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </VoidedWatermark>

      <!-- History Timeline -->
      <Card>
        <CardHeader class="pb-3 border-b">
          <CardTitle class="text-lg">{{ t('approval.detail.history') }}</CardTitle>
        </CardHeader>
        <CardContent class="pt-4">
          <ApprovalHistoryTimeline :history="history" />
        </CardContent>
      </Card>

      <!-- Dialogs -->
      <ApproveDialog
        v-model:open="showApproveDialog"
        :request-id="request.id"
        @success="handleSuccess"
      />
      <RejectDialog
        v-model:open="showRejectDialog"
        :request-id="request.id"
        @success="handleSuccess"
      />
      <VoidDialog v-model:open="showVoidDialog" :request-id="request.id" @success="handleSuccess" />
      <CancelDialog
        v-model:open="showCancelDialog"
        :request-id="request.id"
        @success="handleSuccess"
      />
      <ReturnDialog
        v-model:open="showReturnDialog"
        :request-id="request.id"
        @success="handleSuccess"
      />
    </div>
  </div>

  <!-- Loading State -->
  <div v-else-if="isLoading" class="flex items-center justify-center min-h-[400px]">
    <p class="text-muted-foreground">{{ t('common.loading') }}</p>
  </div>
</template>
