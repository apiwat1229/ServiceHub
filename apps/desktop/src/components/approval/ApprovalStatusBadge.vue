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

const props = defineProps<{
  status: string;
}>();

const statusConfig = computed(() => {
  const configs: Record<string, { label: string; variant: string; icon: any }> = {
    PENDING: {
      label: 'Pending Approval',
      variant: 'warning',
      icon: Clock,
    },
    APPROVED: {
      label: 'Approved',
      variant: 'success',
      icon: CheckCircle2,
    },
    REJECTED: {
      label: 'Rejected',
      variant: 'destructive',
      icon: XCircle,
    },
    RETURNED: {
      label: 'Returned for Edit',
      variant: 'info',
      icon: ArrowLeft,
    },
    CANCELLED: {
      label: 'Cancelled',
      variant: 'secondary',
      icon: Ban,
    },
    VOID: {
      label: 'Void',
      variant: 'destructive',
      icon: Slash,
    },
    EXPIRED: {
      label: 'Expired',
      variant: 'secondary',
      icon: AlertTriangle,
    },
  };

  return configs[props.status] || configs.PENDING;
});
</script>

<template>
  <Badge :variant="statusConfig.variant" class="inline-flex items-center gap-1.5">
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
