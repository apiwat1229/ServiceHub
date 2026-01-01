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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import approvalsApi from '@/services/approvals';
import { handleApiError } from '@/utils/errorHandler';
import { CheckCircle2, Loader2 } from 'lucide-vue-next';
import { ref } from 'vue';
import { toast } from 'vue-sonner';

const props = defineProps<{
  requestId: string;
}>();

const emit = defineEmits<{
  success: [];
}>();

const isOpen = defineModel<boolean>('open');
const remark = ref('');
const isLoading = ref(false);

const handleApprove = async () => {
  try {
    isLoading.value = true;

    await approvalsApi.approve(props.requestId, {
      remark: remark.value || undefined,
    });

    toast.success('Request approved successfully');

    emit('success');
    isOpen.value = false;
    remark.value = '';
  } catch (err: any) {
    handleApiError(err, 'Failed to approve request');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Approve Request</DialogTitle>
        <DialogDescription> Do you want to approve this request? </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div>
          <Label>Remark (Optional)</Label>
          <Textarea v-model="remark" placeholder="Enter remark..." :disabled="isLoading" />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isOpen = false" :disabled="isLoading"> Cancel </Button>
        <Button
          class="bg-green-600 hover:bg-green-700"
          @click="handleApprove"
          :disabled="isLoading"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
          <CheckCircle2 v-else class="w-4 h-4 mr-2" />
          {{ isLoading ? 'Processing...' : 'Approve' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
