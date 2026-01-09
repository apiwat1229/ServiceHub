<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock,
  Plus,
  Slash,
  XCircle,
} from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  history: any[];
}>();

const { t } = useI18n();

const actionConfig: Record<string, { label: string; icon: any; color: string }> = {
  CREATED: { label: t('approval.history.created'), icon: Plus, color: 'text-blue-600' },
  APPROVED: { label: t('approval.history.approved'), icon: CheckCircle2, color: 'text-green-600' },
  REJECTED: { label: t('approval.history.rejected'), icon: XCircle, color: 'text-red-600' },
  RETURNED: { label: t('approval.history.returned'), icon: ArrowLeft, color: 'text-blue-600' },
  CANCELLED: { label: t('approval.history.cancelled'), icon: Ban, color: 'text-rose-400' },
  VOIDED: { label: t('approval.history.voided'), icon: Slash, color: 'text-red-600' },
  EXPIRED: { label: t('approval.history.expired'), icon: AlertTriangle, color: 'text-orange-600' },
  DELETED: { label: t('approval.history.deleted'), icon: XCircle, color: 'text-gray-600' },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getConfig = (action: string) => {
  return actionConfig[action] || { label: action, icon: Clock, color: 'text-gray-600' };
};
</script>

<template>
  <div class="space-y-4">
    <div v-if="history.length === 0" class="text-center py-8 text-muted-foreground">
      {{ t('approval.noHistory') }}
    </div>

    <!-- Timeline -->
    <div v-else class="relative space-y-6">
      <!-- Timeline line -->
      <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <!-- Timeline items -->
      <div v-for="log in history" :key="log.id" class="relative pl-12">
        <!-- Timeline dot -->
        <div
          class="absolute left-0 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center"
          :class="[
            getConfig(log.action).color,
            {
              'bg-rose-50 border-rose-100': getConfig(log.action).color === 'text-rose-400',
            },
          ]"
        >
          <component :is="getConfig(log.action).icon" class="w-4 h-4" />
        </div>

        <!-- Timeline content -->
        <Card>
          <CardContent class="pt-4">
            <div class="flex items-start justify-between mb-2">
              <div>
                <h4 class="font-semibold text-base" :class="getConfig(log.action).color">
                  {{ getConfig(log.action).label }}
                </h4>
                <p class="text-xs text-muted-foreground">
                  {{ formatDate(log.createdAt) }}
                </p>
              </div>
              <div class="flex flex-col items-end gap-1.5">
                <!-- Compact Changes (After) -->
                <div
                  v-if="log.newValue && Object.keys(log.newValue).length > 0"
                  class="flex flex-wrap justify-end gap-1"
                >
                  <div
                    v-for="(value, key) in log.newValue"
                    :key="key"
                    class="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 shadow-sm uppercase font-bold"
                  >
                    <span class="opacity-60"
                      >{{
                        String(key)
                          .replace(/([A-Z])/g, ' $1')
                          .trim()
                      }}:</span
                    >
                    <span>{{ value }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <p class="text-sm">
                <span class="font-medium">{{ t('approval.history.performedBy') }}:</span>
                {{ log.actorName }}
              </p>

              <p v-if="log.remark" class="text-sm">
                <span class="font-medium">{{ t('approval.history.note') }}:</span>
                {{ log.remark }}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
