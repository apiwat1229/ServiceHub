<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/composables/usePermissions';
import { ArrowLeft, Ban, CheckCircle2, Edit, Slash, XCircle } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  request: any;
  currentUserId: string;
  currentUserRole: string; // Kept for backward compat, but we prefer usePermissions
}>();

const emit = defineEmits<{
  approve: [];
  reject: [];
  return: [];
  cancel: [];
  void: [];
  edit: [];
}>();

const { t } = useI18n();
const { isAdmin, hasPermission } = usePermissions();

// Check if user is the requester
const isRequester = computed(() => props.request.requesterId === props.currentUserId);

// Check if user is admin/manager (Can approve)
const isApprover = computed(() => {
  // Allow if admin or has specific approve permission
  // Also keep legacy role check for safety
  return (
    isAdmin.value ||
    hasPermission('approvals:approve') ||
    ['ADMIN', 'admin', 'MANAGER', 'manager'].includes(props.currentUserRole)
  );
});

// Show approve/reject/return buttons (for approvers on pending requests)
const canApprove = computed(() => {
  return props.request.status === 'PENDING' && isApprover.value;
});

// Show cancel button (for requesters on pending requests)
const canCancel = computed(() => {
  return props.request.status === 'PENDING' && isRequester.value;
});

// Show void button (for admins on approved requests)
const canVoid = computed(() => {
  return props.request.status === 'APPROVED' && isAdmin.value;
});

// Show edit button (for requesters on returned requests)
const canEdit = computed(() => {
  return props.request.status === 'RETURNED' && isRequester.value;
});
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <!-- Approve Button -->
    <Button v-if="canApprove" @click="emit('approve')" class="bg-green-600 hover:bg-green-700">
      <CheckCircle2 class="w-4 h-4 mr-2" />
      {{ t('approval.actions.approve') }}
    </Button>

    <!-- Reject Button -->
    <Button v-if="canApprove" @click="emit('reject')" variant="destructive">
      <XCircle class="w-4 h-4 mr-2" />
      {{ t('approval.actions.reject') }}
    </Button>

    <!-- Return Button -->
    <Button
      v-if="canApprove"
      @click="emit('return')"
      variant="outline"
      class="border-blue-500 text-blue-600 hover:bg-blue-50"
    >
      <ArrowLeft class="w-4 h-4 mr-2" />
      {{ t('approval.actions.return') }}
    </Button>

    <!-- Cancel Button -->
    <Button v-if="canCancel" @click="emit('cancel')" variant="outline">
      <Ban class="w-4 h-4 mr-2" />
      {{ t('approval.actions.cancel') }}
    </Button>

    <!-- Void Button -->
    <Button v-if="canVoid" @click="emit('void')" variant="destructive">
      <Slash class="w-4 h-4 mr-2" />
      {{ t('approval.actions.void') }}
    </Button>

    <!-- Edit Button -->
    <Button v-if="canEdit" @click="emit('edit')" variant="default">
      <Edit class="w-4 h-4 mr-2" />
      {{ t('approval.actions.edit') }}
    </Button>

    <!-- No actions available -->
    <p
      v-if="!canApprove && !canCancel && !canVoid && !canEdit"
      class="text-sm text-muted-foreground"
    >
      {{ t('approval.noActions') }}
    </p>
  </div>
</template>
