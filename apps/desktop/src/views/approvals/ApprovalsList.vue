<script setup lang="ts">
import ApprovalStatusBadge from '@/components/approval/ApprovalStatusBadge.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { handleApiError } from '@/utils/errorHandler';
import { h, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const approvals = ref<ApprovalRequest[]>([]);
const isLoading = ref(false);

// Filters
const filters = ref({
  status: '',
  showDeleted: false,
});

const columns = [
  {
    accessorKey: 'requestType',
    header: 'Type',
    cell: ({ row }: any) => {
      const isVoided = row.original.status === 'VOID';
      return h(
        'div',
        {
          class: isVoided ? 'line-through text-muted-foreground' : '',
        },
        row.original.requestType
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }: any) => h(ApprovalStatusBadge, { status: row.original.status }),
  },
  {
    accessorKey: 'requester',
    header: 'Requester',
    cell: ({ row }: any) =>
      row.original.requester?.displayName || row.original.requester?.email || '-',
  },
  {
    accessorKey: 'submittedAt',
    header: 'Submitted Date',
    cell: ({ row }: any) => {
      const date = new Date(row.original.submittedAt);
      return new Intl.DateTimeFormat('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }: any) =>
      h(
        Button,
        {
          size: 'sm',
          onClick: () => router.push(`/admin/approvals/${row.original.id}`),
        },
        () => 'View Details'
      ),
  },
];

const fetchApprovals = async () => {
  try {
    isLoading.value = true;
    const response = await approvalsApi.getAll({
      status: filters.value.status || undefined,
      includeDeleted: filters.value.showDeleted,
    });
    approvals.value = response.data;
  } catch (error: any) {
    handleApiError(error, 'Failed to load approval requests');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchApprovals();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">Approval Requests</h1>
        <p class="text-muted-foreground">Manage all approval requests</p>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        <CardDescription>Filter approval requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex flex-wrap gap-4">
          <!-- Status Filter -->
          <div class="w-64">
            <Label>Status</Label>
            <Select v-model="filters.status" @update:model-value="fetchApprovals">
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending Approval</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="RETURNED">Returned for Edit</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="VOID">Void</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Show Deleted Checkbox -->
          <div class="flex items-end gap-2">
            <div class="flex items-center gap-2">
              <Checkbox
                :checked="filters.showDeleted"
                @update:checked="
                  (val: boolean) => {
                    filters.showDeleted = val;
                    fetchApprovals();
                  }
                "
              />
              <Label>Show Deleted Items</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Data Table -->
    <Card>
      <CardContent class="pt-6">
        <DataTable :columns="columns" :data="approvals" :loading="isLoading" />
      </CardContent>
    </Card>
  </div>
</template>
