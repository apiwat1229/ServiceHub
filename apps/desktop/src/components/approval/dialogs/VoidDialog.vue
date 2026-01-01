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
import { Loader2, Slash } from 'lucide-vue-next';
import { computed, ref } from 'vue';
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
const error = ref('');

const isFormValid = computed(() => reason.value.trim().length > 0);

const handleVoid = async () => {
  if (!isFormValid.value) {
    error.value = 'Please provide a reason for voiding';
    return;
  }

  try {
    isLoading.value = true;
    error.value = '';

    await approvalsApi.void(props.requestId, {
      reason: reason.value,
    });

    toast.success('Request voided successfully');

    emit('success');
    isOpen.value = false;
    reason.value = '';
  } catch (err: any) {
    handleApiError(err, 'Failed to void request');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Void Request</DialogTitle>
        <DialogDescription class="text-red-600">
          ⚠️ Voiding will cancel the previous approval
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div>
          <Label>Reason for Voiding *</Label>
          <Textarea
            v-model="reason"
            placeholder="e.g.: Incorrect amount entered"
            :disabled="isLoading"
            required
          />
          <p v-if="error" class="text-sm text-red-600 mt-1">{{ error }}</p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isOpen = false" :disabled="isLoading"> Cancel </Button>
        <Button variant="destructive" @click="handleVoid" :disabled="!isFormValid || isLoading">
          <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
          <Slash v-else class="w-4 h-4 mr-2" />
          {{ isLoading ? 'Processing...' : 'Void' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
