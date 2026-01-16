<script setup lang="ts">
import ApprovalStatusBadge from '@/components/approval/ApprovalStatusBadge.vue';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import approvalsApi, { type ApprovalRequest } from '@/services/approvals';
import { socketService } from '@/services/socket';
import { handleApiError } from '@/utils/errorHandler';
import { ArrowUpDown, FileText, RefreshCw, Trash2 } from 'lucide-vue-next';
import { h, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const router = useRouter();
const approvals = ref<ApprovalRequest[]>([]);
const isLoading = ref(false);

// Filters
const filters = ref({
  status: 'PENDING', // Default to PENDING to make it clear what needs action
  showDeleted: false,
});

const { t } = useI18n();

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${day}-${month}-${year}, ${time}`;
};

// Delete handling
const deleteId = ref<string | null>(null);
const showDeleteDialog = ref(false);

const handleDelete = (id: string) => {
  deleteId.value = id;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!deleteId.value) return;

  try {
    await approvalsApi.softDelete(deleteId.value);
    fetchApprovals();
  } catch (error: any) {
    handleApiError(error, t('approval.list.deleteError'));
  } finally {
    showDeleteDialog.value = false;
    deleteId.value = null;
  }
};

const columns = [
  {
    accessorKey: 'submittedAt',
    header: ({ column }: any) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
          class: 'p-0 hover:bg-transparent px-2 font-semibold text-slate-700',
        },
        () => [t('approval.list.submittedDate'), h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
      );
    },
    cell: ({ row }: any) =>
      h('span', { class: 'text-sm text-slate-600' }, formatDate(row.original.submittedAt)),
  },
  {
    accessorKey: 'requestType',
    header: t('approval.list.type'),
    cell: ({ row }: any) => {
      const isVoided = row.original.status === 'VOID';
      return h(
        Badge,
        {
          variant: 'outline',
          class: isVoided ? 'line-through text-muted-foreground' : 'font-bold',
        },
        () => row.original.requestType
      );
    },
  },
  {
    accessorKey: 'requester',
    header: t('approval.list.requester'),
    cell: ({ row }: any) =>
      h(
        'span',
        { class: 'text-sm font-medium text-slate-900' },
        row.original.requester?.displayName || row.original.requester?.email || '-'
      ),
  },
  {
    accessorKey: 'reason',
    header: t('approval.list.reason'),
    cell: ({ row }: any) => {
      const reason = row.original.reason || '-';
      return h(
        'div',
        {
          class: 'max-w-[300px] truncate text-sm text-slate-600',
          title: reason,
        },
        reason
      );
    },
  },
  {
    accessorKey: 'status',
    header: t('approval.list.status'),
    cell: ({ row }: any) => h(ApprovalStatusBadge, { status: row.original.status }),
  },
  {
    id: 'actions',
    header: t('approval.list.actions'),
    cell: ({ row }: any) => {
      const isDeleted = !!row.original.deletedAt;
      return h('div', { class: 'flex items-center gap-1' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-slate-500 hover:text-slate-700',
            onClick: () => router.push(`/approvals/${row.original.id}`),
          },
          () => h(FileText, { class: 'w-4 h-4' })
        ),
        !isDeleted &&
          h(
            Button,
            {
              variant: 'ghost',
              size: 'icon',
              class: 'h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50',
              onClick: () => handleDelete(row.original.id),
            },
            () => h(Trash2, { class: 'w-4 h-4' })
          ),
      ]);
    },
  },
];

const fetchApprovals = async () => {
  try {
    isLoading.value = true;
    const response = await approvalsApi.getAll({
      status:
        filters.value.status && filters.value.status !== 'ALL' ? filters.value.status : undefined,
      includeDeleted: filters.value.showDeleted,
    });
    approvals.value = response.data;
  } catch (error: any) {
    handleApiError(error, t('approval.list.loadError'));
  } finally {
    isLoading.value = false;
  }
};

const handleNotification = (data: any) => {
  // Refresh if it's an approval related notification
  if (data.sourceApp === 'APPROVALS' || data.type === 'REQUEST' || data.type === 'APPROVE') {
    fetchApprovals();
  }
};

onMounted(() => {
  fetchApprovals();
  socketService.on('notification', handleNotification);
});

onUnmounted(() => {
  socketService.off('notification', handleNotification);
});
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 pb-20">
    <div class="w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-6">
      <div class="flex justify-between items-center px-1">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-slate-900">
            {{ t('approval.list.title') }}
          </h1>
          <p class="text-muted-foreground">{{ t('approval.list.description') }}</p>
        </div>
      </div>

      <!-- Unified Data Table Card -->
      <Card class="border-none shadow-sm shadow-slate-200/50 bg-white">
        <CardHeader class="pb-3 border-b bg-white rounded-t-xl">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-4 flex-1 max-w-2xl">
              <!-- Status Filter -->
              <div class="flex items-center gap-3 min-w-[280px]">
                <Label class="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
                  {{ t('approval.list.status') }}
                </Label>
                <Select v-model="filters.status" @update:model-value="fetchApprovals">
                  <SelectTrigger class="h-10 border-slate-200 focus:ring-blue-500">
                    <SelectValue :placeholder="t('approval.list.allStatuses')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{{ t('approval.list.allStatuses') }}</SelectItem>
                    <SelectItem value="PENDING">{{ t('approval.status.pending') }}</SelectItem>
                    <SelectItem value="APPROVED">{{ t('approval.status.approved') }}</SelectItem>
                    <SelectItem value="REJECTED">{{ t('approval.status.rejected') }}</SelectItem>
                    <SelectItem value="RETURNED">{{ t('approval.status.returned') }}</SelectItem>
                    <SelectItem value="VOID">{{ t('approval.status.void') || 'Void' }}</SelectItem>
                    <SelectItem value="CANCELLED">{{
                      t('approval.status.cancelled') || 'Cancelled'
                    }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Show Deleted -->
              <div class="flex items-center gap-3 px-6 border-l border-slate-100">
                <Checkbox
                  id="show-deleted"
                  :checked="filters.showDeleted"
                  class="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  @update:checked="
                    (val: boolean) => {
                      filters.showDeleted = val;
                      fetchApprovals();
                    }
                  "
                />
                <Label
                  for="show-deleted"
                  class="text-sm font-semibold text-slate-600 cursor-pointer"
                >
                  {{ t('approval.list.showDeleted') }}
                </Label>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              class="border-slate-200 text-slate-600 hover:bg-slate-50"
              @click="fetchApprovals"
              :disabled="isLoading"
            >
              <RefreshCw :class="['w-4 h-4 mr-2', isLoading && 'animate-spin']" />
              {{ t('common.refresh') || 'Refresh' }}
            </Button>
          </div>
        </CardHeader>
        <CardContent class="pt-6">
          <DataTable :columns="columns" :data="approvals" :loading="isLoading" />
        </CardContent>
      </Card>

      <!-- Delete Confirmation Dialog -->
      <AlertDialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{
              t('approval.list.confirmDeleteTitle') || 'Confirm Deletion'
            }}</AlertDialogTitle>
            <AlertDialogDescription>
              {{ t('approval.list.confirmDelete') }}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel @click="showDeleteDialog = false">{{
              t('common.cancel') || 'Cancel'
            }}</AlertDialogCancel>
            <AlertDialogAction
              @click="confirmDelete"
              class="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              {{ t('common.delete') || 'Delete' }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </div>
</template>
