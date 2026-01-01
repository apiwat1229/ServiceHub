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
import { Ban, Loader2 } from 'lucide-vue-next';
import { ref } from 'vue';
import { toast } from 'vue-sonner';

const props = defineProps<{
  requestId: string;
}>();

const emit = defineEmits<{
  success: [];
}>();

const isOpen = defineModel<boolean>('open');
const reason = ref('');
const isLoading = ref(false);

const handleCancel = async () => {
  try {
    isLoading.value = true;

    await approvalsApi.cancel(props.requestId, {
      reason: reason.value || undefined,
    });

    toast.success('Request cancelled successfully');

    emit('success');
    isOpen.value = false;
    reason.value = '';
  } catch (err: any) {
    handleApiError(err, 'Failed to cancel request');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Cancel Request</DialogTitle>
        <DialogDescription> Are you sure you want to cancel this request? </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div>
          <Label>Reason (Optional)</Label>
          <Textarea v-model="reason" placeholder="Enter reason..." :disabled="isLoading" />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isOpen = false" :disabled="isLoading"> Close </Button>
        <Button variant="destructive" @click="handleCancel" :disabled="isLoading">
          <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
          <Ban v-else class="w-4 h-4 mr-2" />
          {{ isLoading ? 'Processing...' : 'Cancel Request' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
