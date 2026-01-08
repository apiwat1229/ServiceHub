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
import { type Contract } from '@/services/contracts';
import { AlertTriangle, Calendar, ChevronRight } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  open: boolean;
  contracts: Contract[];
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'view-contract': [id: string];
}>();

const expiringContracts = computed(() => {
  // In a real app, filtering logic would be here if not passed pre-filtered
  return props.contracts;
});

const handleView = (id: string) => {
  emit('view-contract', id);
  emit('update:open', false);
};
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <div class="flex items-center gap-2 text-amber-600 mb-2">
          <AlertTriangle class="h-6 w-6" />
          <DialogTitle class="text-xl">Contracts Expiring Soon</DialogTitle>
        </div>
        <DialogDescription>
          The following {{ expiringContracts.length }} contracts are expiring within the next 60
          days. Please review them for renewal.
        </DialogDescription>
      </DialogHeader>

      <div class="h-[300px] overflow-y-auto pr-4 mt-2">
        <div class="space-y-3">
          <div
            v-for="contract in expiringContracts"
            :key="contract.id"
            class="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group cursor-pointer"
            @click="handleView(contract.id)"
          >
            <div class="space-y-1">
              <div class="font-medium group-hover:text-primary transition-colors">
                {{ contract.title }}
              </div>
              <div class="flex items-center gap-3 text-xs text-muted-foreground">
                <div class="flex items-center gap-1">
                  <Calendar class="h-3 w-3" />
                  Ends: {{ new Date(contract.endDate).toLocaleDateString() }}
                </div>
                <div>•</div>
                <div>{{ contract.responsiblePerson }}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100"
              >
                Expiring
              </span>
              <ChevronRight class="h-4 w-4 text-muted-foreground/50 group-hover:text-primary" />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="sm:justify-between items-center border-t pt-4 mt-2">
        <div class="text-xs text-muted-foreground italic">Sorted by expiration date</div>
        <Button variant="secondary" @click="$emit('update:open', false)"> Dismiss </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
