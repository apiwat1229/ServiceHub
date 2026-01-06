<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUsers } from '@/composables/useUsers';
import { cn } from '@/lib/utils';
import { itTicketsApi } from '@/services/it-tickets';
import type { ITTicket, UpdateITTicketDto } from '@my-app/types';
import { format } from 'date-fns';
import { Clock, FileText, History, MapPin, Save } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { toast } from 'vue-sonner';

const props = defineProps<{
  open: boolean;
  ticket: ITTicket | null;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'ticketUpdated', ticket: ITTicket): void;
  (e: 'close'): void;
}>();

const { users: allUsers } = useUsers();

const loading = ref(false);
const localTicket = ref<ITTicket | null>(null);
const comment = ref('');

// Form states
const selectedStatus = ref('');
const selectedPriority = ref('');
const selectedAssignee = ref('');

// Initialize local state when ticket changes
watch(
  () => props.ticket,
  (newTicket) => {
    if (newTicket) {
      localTicket.value = { ...newTicket };
      selectedStatus.value = newTicket.status;
      selectedPriority.value = newTicket.priority;
      selectedAssignee.value = newTicket.assigneeId || 'unassigned';
    }
  },
  { immediate: true }
);

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Open':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    case 'Resolved':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'Closed':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    default:
      return 'outline';
  }
};

const formatDate = (date: string | Date) => {
  return format(new Date(date), 'PPp');
};

const userInitials = (user?: any) => {
  if (!user || (!user.firstName && !user.displayName)) return 'U';
  const name = user.displayName || user.firstName;
  return name.charAt(0).toUpperCase();
};

const saveChanges = async () => {
  if (!localTicket.value) return;

  try {
    loading.value = true;
    const updateDto: UpdateITTicketDto = {};
    let hasChanges = false;

    if (selectedStatus.value !== localTicket.value.status) {
      updateDto.status = selectedStatus.value as any;
      hasChanges = true;
    }
    if (selectedPriority.value !== localTicket.value.priority) {
      updateDto.priority = selectedPriority.value as any;
      hasChanges = true;
    }

    const assigneeVal = selectedAssignee.value === 'unassigned' ? null : selectedAssignee.value;
    if (assigneeVal !== localTicket.value.assigneeId) {
      (updateDto as any).assigneeId = assigneeVal;
      hasChanges = true;
    }

    if (!hasChanges && !comment.value) {
      isOpen.value = false;
      return;
    }

    if (hasChanges) {
      const updated = await itTicketsApi.update(localTicket.value.id, updateDto);
      emit('ticketUpdated', updated);
      toast.success('Ticket updated successfully');
    }

    isOpen.value = false;
  } catch (error) {
    console.error(error);
    toast.error('Failed to update ticket');
  } finally {
    loading.value = false;
  }
};

const availableAssignees = computed(() => {
  return allUsers.value || [];
});
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[800px] p-0 gap-0 overflow-hidden bg-white shadow-xl border">
      <DialogDescription class="sr-only">
        Details for ticket {{ localTicket?.ticketNo }}
      </DialogDescription>
      <!-- Header Area -->
      <div class="p-6 pr-14 border-b bg-muted/10">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1.5 basis-3/4">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <span class="font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{{
                localTicket?.ticketNo
              }}</span>
              <span>&bull;</span>
              <span>{{ localTicket?.category }}</span>
              <span v-if="localTicket?.location">&bull; {{ localTicket.location }}</span>
            </div>
            <DialogTitle class="text-xl font-semibold leading-tight tracking-tight">
              {{ localTicket?.title }}
            </DialogTitle>
            <div class="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <Clock class="w-3.5 h-3.5" />
              <span>Created {{ localTicket ? formatDate(localTicket.createdAt) : '' }}</span>
            </div>
          </div>

          <div class="flex flex-col items-end gap-2">
            <Badge
              :class="
                cn(
                  'px-3 py-1 text-sm font-medium shadow-sm transition-all',
                  getStatusColor(localTicket?.status || '')
                )
              "
            >
              {{ localTicket?.status }}
            </Badge>
          </div>
        </div>
      </div>

      <div class="flex flex-col md:flex-row h-[600px]">
        <!-- Main Content (Scrollable) -->
        <div class="flex-1 p-6 overflow-y-auto border-r border-border/50">
          <div class="space-y-8">
            <!-- Description Section -->
            <div class="space-y-3">
              <h4 class="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                <FileText class="w-4 h-4 text-primary" /> Description
              </h4>
              <div
                class="p-4 bg-muted/30 rounded-lg text-sm leading-relaxed border border-border/50 shadow-sm min-h-[120px]"
              >
                {{ localTicket?.description || 'No description provided.' }}
              </div>
            </div>

            <!-- Activity Section (Timeline Design) -->
            <div class="space-y-4">
              <h4 class="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                <History class="w-4 h-4 text-primary" /> Activity
              </h4>
              <div class="relative pl-4 border-l-2 border-muted ml-2 space-y-6">
                <!-- Mock Current Event -->
                <div class="relative">
                  <div
                    class="absolute -left-[21px] top-1 w-3 h-3 bg-primary rounded-full ring-4 ring-background"
                  ></div>
                  <div class="bg-background border rounded-lg p-3 shadow-sm">
                    <div class="flex items-center gap-2 mb-2">
                      <Avatar class="w-6 h-6">
                        <AvatarFallback class="text-[10px] bg-primary/10 text-primary"
                          >me</AvatarFallback
                        >
                      </Avatar>
                      <span class="text-xs font-medium">You</span>
                      <span class="text-[10px] text-muted-foreground ml-auto">Just now</span>
                    </div>
                    <Textarea
                      placeholder="Write a comment..."
                      v-model="comment"
                      class="min-h-[80px] bg-muted/20 resize-none text-sm border-0 focus-visible:ring-0 px-0 shadow-none"
                    />
                    <div class="flex justify-between items-center mt-2 border-t pt-2">
                      <span class="text-[10px] text-muted-foreground">Visible to requester</span>
                      <Button size="sm" variant="ghost" class="h-7 text-xs" disabled
                        >Post Comment</Button
                      >
                    </div>
                  </div>
                </div>

                <!-- Mock Past Event -->
                <div class="relative pb-2">
                  <div
                    class="absolute -left-[21px] top-1.5 w-2.5 h-2.5 bg-muted-foreground/30 rounded-full ring-4 ring-background"
                  ></div>
                  <div class="text-xs text-muted-foreground">
                    <span class="font-medium text-foreground">{{
                      localTicket?.requester?.displayName || 'User'
                    }}</span>
                    created this ticket.
                    <div class="text-[10px] opacity-70 mt-0.5">
                      {{ localTicket ? formatDate(localTicket.createdAt) : '' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar (Fixed Width) -->
        <div class="w-full md:w-[280px] bg-muted/5 flex flex-col">
          <!-- Replaced ScrollArea with standard div for scrolling if needed -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-5 space-y-6">
              <!-- Actions -->
              <div class="grid gap-2">
                <Button @click="saveChanges" :disabled="loading" class="w-full shadow-sm">
                  <Save class="w-4 h-4 mr-2" /> Save Changes
                </Button>
              </div>

              <div class="my-4 border-b bg-border/60"></div>

              <!-- Requester Card -->
              <div class="bg-white rounded-lg border p-3 shadow-sm space-y-3">
                <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Requester
                </div>
                <div class="flex items-center gap-3">
                  <Avatar class="w-9 h-9 border border-border/50">
                    <AvatarImage :src="localTicket?.requester?.avatar || ''" />
                    <AvatarFallback class="bg-primary/5 text-primary">{{
                      userInitials(localTicket?.requester)
                    }}</AvatarFallback>
                  </Avatar>
                  <div class="flex flex-col overflow-hidden">
                    <span class="text-sm font-semibold truncate">{{
                      localTicket?.requester?.displayName || localTicket?.requester?.username
                    }}</span>
                    <span class="text-xs text-muted-foreground truncate">{{
                      localTicket?.requester?.email
                    }}</span>
                  </div>
                </div>
                <div
                  v-if="localTicket?.location"
                  class="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-1.5 rounded"
                >
                  <MapPin class="w-3 h-3" /> {{ localTicket.location }}
                </div>
              </div>

              <!-- Properties Form -->
              <div class="space-y-4">
                <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Properties
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-medium">Status</label>
                  <Select v-model="selectedStatus">
                    <SelectTrigger class="h-9 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open" class="text-blue-600"
                        ><div class="flex items-center gap-2">
                          <div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          Open
                        </div></SelectItem
                      >
                      <SelectItem value="In Progress" class="text-yellow-600"
                        ><div class="flex items-center gap-2">
                          <div class="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                          In Progress
                        </div></SelectItem
                      >
                      <SelectItem value="Resolved" class="text-green-600"
                        ><div class="flex items-center gap-2">
                          <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          Resolved
                        </div></SelectItem
                      >
                      <SelectItem value="Closed" class="text-gray-600"
                        ><div class="flex items-center gap-2">
                          <div class="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                          Closed
                        </div></SelectItem
                      >
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-medium">Priority</label>
                  <Select v-model="selectedPriority">
                    <SelectTrigger class="h-9 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low"
                        ><Badge variant="outline" class="font-normal text-slate-500"
                          >Low</Badge
                        ></SelectItem
                      >
                      <SelectItem value="Medium"
                        ><Badge
                          variant="outline"
                          class="font-normal border-blue-200 text-blue-700 bg-blue-50"
                          >Medium</Badge
                        ></SelectItem
                      >
                      <SelectItem value="High"
                        ><Badge
                          variant="outline"
                          class="font-normal border-orange-200 text-orange-700 bg-orange-50"
                          >High</Badge
                        ></SelectItem
                      >
                      <SelectItem value="Critical"
                        ><Badge
                          variant="outline"
                          class="font-normal border-red-200 text-red-700 bg-red-50"
                          >Critical</Badge
                        ></SelectItem
                      >
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-medium">Assignee</label>
                  <Select v-model="selectedAssignee">
                    <SelectTrigger class="h-9 bg-background">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned" class="text-muted-foreground"
                        >Unassigned</SelectItem
                      >
                      <SelectItem
                        v-for="user in availableAssignees"
                        :key="user.id"
                        :value="user.id"
                      >
                        <div class="flex items-center gap-2">
                          <Avatar class="w-5 h-5">
                            <AvatarImage :src="user.avatar || ''" />
                            <AvatarFallback class="text-[9px]">{{
                              userInitials(user)
                            }}</AvatarFallback>
                          </Avatar>
                          {{ user.displayName || user.username }}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
