<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock,
  Slash,
  XCircle,
} from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  status: string;
}>();

const { t } = useI18n();
const statusConfig = computed(() => {
  const configs: Record<string, { label: string; className: string; icon: any }> = {
    PENDING: {
      label: t('approval.status.pending'),
      className: 'bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200',
      icon: Clock,
    },
    APPROVED: {
      label: t('approval.status.approved'),
      className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
      icon: CheckCircle2,
    },
    REJECTED: {
      label: t('approval.status.rejected'),
      className: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200',
      icon: XCircle,
    },
    RETURNED: {
      label: t('approval.status.returned'),
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200',
      icon: ArrowLeft,
    },
    CANCELLED: {
      label: t('approval.status.cancelled'),
      className: 'bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-200',
      icon: Ban,
    },
    VOID: {
      label: t('approval.status.void'),
      className: 'bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200',
      icon: Slash,
    },
    EXPIRED: {
      label: t('approval.status.expired'),
      className: 'bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200',
      icon: AlertTriangle,
    },
  };

  return configs[props.status] || configs.PENDING;
});
</script>

<template>
  <Badge :class="['inline-flex items-center gap-1.5', statusConfig.className]">
    <component :is="statusConfig.icon" class="w-3.5 h-3.5" />
    {{ statusConfig.label }}
  </Badge>
</template>

<style scoped>
/* Custom badge variants */
:deep(.badge) {
  font-weight: 500;
}
</style>
