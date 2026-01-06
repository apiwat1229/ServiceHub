<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import type { ITTicket, UpdateITTicketDto } from '@/services/it-tickets';
import { itTicketsApi } from '@/services/it-tickets';
import { useAuthStore } from '@/stores/auth';
import {
  AlertCircle,
  Check,
  Clock,
  FileText,
  History,
  MapPin,
  Pencil,
  Save,
  Trash2,
} from 'lucide-vue-next';
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
const authStore = useAuthStore();

const loading = ref(false);
const localTicket = ref<ITTicket | null>(null);
const comment = ref('');

// Form states
const selectedStatus = ref('');
const selectedPriority = ref('');
const selectedAssignee = ref('');
const isDeleteDialogOpen = ref(false);
const isRejectDialogOpen = ref(false);
const isEditingTitle = ref(false);

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
      return 'bg-blue-100 text-blue-800';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'Approved':
      return 'bg-purple-100 text-purple-800';
    case 'Resolved':
      return 'bg-green-100 text-green-800';
    case 'Closed':
      return 'bg-gray-100 text-gray-800';
    case 'Pending':
      return 'bg-orange-100 text-orange-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'outline';
  }
};

import { format, formatDistanceToNowStrict, intervalToDuration } from 'date-fns';

const formatDate = (date: string | Date | undefined) => {
  if (!date) return '';
  const d = new Date(date);
  const formatted = format(d, 'dd MMM yyyy, HH:mm');
  const now = new Date();
  const duration = intervalToDuration({ start: d, end: now });

  let timeAgo = '';
  if (duration.years) timeAgo = formatDistanceToNowStrict(d, { addSuffix: true });
  else if (duration.months) timeAgo = formatDistanceToNowStrict(d, { addSuffix: true });
  else if (duration.days) {
    timeAgo = `${duration.days}d ${duration.hours ?? 0}h ago`;
  } else if (duration.hours) {
    timeAgo = `${duration.hours}h ${duration.minutes ?? 0}m ago`;
  } else {
    timeAgo = `${duration.minutes ?? 0}m ago`;
  }

  return `${formatted} (${timeAgo})`;
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

const isOwner = computed(() => {
  if (!localTicket.value || !authStore.user) return false;
  // Check if requesterId matches current user
  return localTicket.value.requesterId === authStore.user.id;
});

const isApprover = computed(() => {
  if (
    !localTicket.value ||
    !authStore.user ||
    !localTicket.value.isAssetRequest ||
    localTicket.value.status === 'Approved'
  )
    return false;
  return localTicket.value.approverId === authStore.user.id;
});

const isEditable = computed(() => {
  if (!localTicket.value) return false;
  return !['Approved', 'Closed', 'Resolved', 'Cancelled'].includes(localTicket.value.status);
});

const startEditingTitle = () => {
  if (isOwner.value && isEditable.value) {
    isEditingTitle.value = true;
  }
};

const approveRequest = async () => {
  if (!localTicket.value) return;
  try {
    loading.value = true;
    const updated = await itTicketsApi.update(localTicket.value.id, {
      status: 'Approved',
    });
    emit('ticketUpdated', updated);
    toast.success('Request Approved Successfully');
    isOpen.value = false;
  } catch (error) {
    console.error('Failed to approve request:', error);
    toast.error('Failed to approve request');
  } finally {
    loading.value = false;
  }
};

const rejectRequest = async () => {
  if (!localTicket.value) return;
  try {
    loading.value = true;
    const updated = await itTicketsApi.update(localTicket.value.id, {
      status: 'Cancelled',
    });
    emit('ticketUpdated', updated);
    toast.success('Request Rejected (Cancelled)');
    isOpen.value = false;
  } catch (error) {
    console.error('Failed to reject request:', error);
    toast.error('Failed to reject request');
  } finally {
    loading.value = false;
    isRejectDialogOpen.value = false;
  }
};

const handleDelete = () => {
  isDeleteDialogOpen.value = true;
};

const confirmDelete = async () => {
  if (!localTicket.value) return;

  try {
    loading.value = true;
    await itTicketsApi.delete(localTicket.value.id);
    toast.success('Ticket deleted successfully');
    emit('ticketUpdated', localTicket.value); // Trigger refresh
    emit('close');
    isOpen.value = false;
  } catch (error) {
    console.error('Failed to delete ticket:', error);
    toast.error('Failed to delete ticket');
  } finally {
    loading.value = false;
    isDeleteDialogOpen.value = false;
  }
};

const handlePostComment = async () => {
  if (!localTicket.value || !comment.value.trim()) return;

  try {
    loading.value = true;
    const newComment = await itTicketsApi.addComment(localTicket.value.id, comment.value);

    // Add to local list
    if (!localTicket.value.comments) {
      localTicket.value.comments = [];
    }
    localTicket.value.comments.unshift(newComment);

    comment.value = '';
    toast.success('Comment posted');
  } catch (error) {
    console.error('Failed to post comment:', error);
    toast.error('Failed to post comment');
  } finally {
    loading.value = false;
  }
};
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
          <div class="space-y-1.5 flex-1">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <span class="font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{{
                localTicket?.ticketNo
              }}</span>
              <span>&bull;</span>
              <span>{{ localTicket?.category }}</span>
              <span v-if="localTicket?.location">&bull; {{ localTicket.location }}</span>
            </div>
            <div v-if="isEditingTitle" class="w-full relative group">
              <DialogTitle class="sr-only">{{ localTicket?.title }}</DialogTitle>
              <Input
                v-model="localTicket!.title"
                @blur="isEditingTitle = false"
                @keyup.enter="isEditingTitle = false"
                autoFocus
                class="text-xl font-semibold h-auto px-2 py-1 -ml-2 border-transparent hover:border-border focus-visible:border-primary w-full"
              />
            </div>
            <DialogTitle
              v-else
              class="text-xl font-semibold leading-tight tracking-tight flex items-center gap-2 group cursor-pointer"
              @click="startEditingTitle"
            >
              {{ localTicket?.title }}
              <Button
                v-if="isOwner && isEditable"
                variant="ghost"
                size="icon"
                class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil class="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </DialogTitle>
            <div class="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <Clock class="w-3.5 h-3.5" />
              <span>Created {{ localTicket ? formatDate(localTicket.createdAt) : '' }}</span>
            </div>
          </div>

          <div class="flex flex-col items-end gap-2 shrink-0">
            <Badge
              :class="
                cn(
                  'px-3 py-1 text-sm font-medium shadow-sm pointer-events-none',
                  getStatusColor(localTicket?.status || '')
                )
              "
            >
              {{ localTicket?.status }}
            </Badge>
          </div>
        </div>
      </div>

      <!-- Approver Action Banner -->
      <div v-if="isApprover" class="px-6 mt-6 mb-2">
        <div
          class="bg-purple-50 border border-purple-100 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4"
        >
          <div class="flex items-start gap-3">
            <div class="p-2 bg-white rounded-lg text-purple-600 shadow-sm mt-0.5">
              <Check class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-sm font-semibold text-purple-900">Approval Required</h4>
              <p class="text-xs text-purple-700 mt-1">This asset request requires your approval.</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Button
              size="sm"
              class="bg-red-600 text-white hover:bg-red-700 border-0 shadow-sm"
              @click="isRejectDialogOpen = true"
              :disabled="loading"
            >
              Reject
            </Button>
            <Button
              size="sm"
              class="bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-sm"
              @click="approveRequest"
              :disabled="loading"
            >
              {{ loading ? 'Processing...' : 'Approve' }}
            </Button>
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
                v-if="isOwner && isEditable"
                class="rounded-lg border border-border/50 shadow-sm"
              >
                <Textarea
                  v-model="localTicket!.description"
                  class="min-h-[120px] bg-muted/30 border-0 focus-visible:ring-0 resize-none text-sm leading-relaxed p-4"
                  placeholder="Review the description..."
                />
              </div>
              <div
                v-else
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
                <!-- New Comment Input -->
                <div v-if="isEditable" class="relative">
                  <div
                    class="absolute -left-[21px] top-1 w-3 h-3 bg-primary rounded-full ring-4 ring-background"
                  ></div>
                  <div class="bg-background border rounded-lg p-3 shadow-sm">
                    <div class="flex items-center gap-2 mb-2">
                      <Avatar class="w-6 h-6">
                        <AvatarImage :src="authStore.user?.avatar || ''" />
                        <AvatarFallback class="text-[10px] bg-primary/10 text-primary">
                          {{ authStore.user?.displayName?.substring(0, 2).toUpperCase() || 'ME' }}
                        </AvatarFallback>
                      </Avatar>
                      <span class="text-xs font-medium">You</span>
                      <span class="text-[10px] text-muted-foreground ml-auto">Now</span>
                    </div>
                    <Textarea
                      placeholder="Write a comment..."
                      v-model="comment"
                      class="min-h-[80px] bg-muted/20 resize-none text-sm border-0 focus-visible:ring-0 px-0 shadow-none"
                    />
                    <div class="flex justify-between items-center mt-2 border-t pt-2">
                      <span class="text-[10px] text-muted-foreground">Visible to everyone</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        class="h-7 text-xs"
                        :disabled="!comment.trim() || loading"
                        @click="handlePostComment"
                      >
                        {{ loading ? 'Posting...' : 'Post Comment' }}
                      </Button>
                    </div>
                  </div>
                </div>

                <!-- Comments List -->
                <div
                  v-for="ticketComment in localTicket?.comments || []"
                  :key="ticketComment.id"
                  class="relative"
                >
                  <div
                    class="absolute -left-[21px] top-1 w-3 h-3 bg-muted-foreground/30 rounded-full ring-4 ring-background"
                  ></div>
                  <div class="bg-muted/10 border rounded-lg p-3 shadow-sm">
                    <div class="flex items-center gap-2 mb-1">
                      <Avatar class="w-6 h-6">
                        <AvatarImage :src="ticketComment.user.avatar || ''" />
                        <AvatarFallback class="text-[10px] bg-muted text-muted-foreground">
                          {{ ticketComment.user.displayName?.substring(0, 2).toUpperCase() }}
                        </AvatarFallback>
                      </Avatar>
                      <span class="text-xs font-medium">{{ ticketComment.user.displayName }}</span>
                      <span class="text-[10px] text-muted-foreground ml-auto">
                        {{ formatDate(ticketComment.createdAt) }}
                      </span>
                    </div>
                    <p class="text-sm text-foreground/90 whitespace-pre-wrap">
                      {{ ticketComment.content }}
                    </p>
                  </div>
                </div>

                <!-- Created Event -->
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
              <!-- Actions -->
              <div
                v-if="
                  !['Approved', 'Closed', 'Resolved', 'Cancelled'].includes(
                    localTicket?.status || ''
                  )
                "
                class="grid gap-2"
              >
                <Button @click="saveChanges" :disabled="loading" class="w-full shadow-sm">
                  <Save class="w-4 h-4 mr-2" /> Save Changes
                </Button>
                <Button
                  v-if="isOwner"
                  @click="handleDelete"
                  :disabled="loading"
                  variant="outline"
                  class="w-full shadow-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                >
                  <Trash2 class="w-4 h-4 mr-2" /> Delete Ticket
                </Button>
                <div class="my-4 border-b bg-border/60"></div>
              </div>

              <!-- Requester Card -->
              <div
                class="bg-white rounded-lg border p-4 shadow-sm flex items-center justify-between gap-4"
              >
                <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Requester
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex flex-col items-end overflow-hidden text-right">
                    <span class="text-sm font-semibold truncate">{{
                      localTicket?.requester?.displayName || localTicket?.requester?.username
                    }}</span>
                    <span class="text-[10px] text-muted-foreground truncate">{{
                      localTicket?.requester?.email
                    }}</span>
                  </div>
                  <Avatar class="w-8 h-8 border border-border/50">
                    <AvatarImage :src="localTicket?.requester?.avatar || ''" />
                    <AvatarFallback class="bg-primary/5 text-primary text-xs">{{
                      userInitials(localTicket?.requester)
                    }}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div
                v-if="localTicket?.location"
                class="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded justify-center"
              >
                <MapPin class="w-3 h-3" /> {{ localTicket.location }}
              </div>

              <!-- Properties Form -->
              <div class="space-y-4">
                <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Properties
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-medium">Status</label>
                  <Select v-model="selectedStatus" :disabled="!isEditable">
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
                      <SelectItem value="Approved" class="text-purple-600"
                        ><div class="flex items-center gap-2">
                          <div class="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                          Approved
                        </div></SelectItem
                      >
                      <SelectItem value="Pending" class="text-orange-600"
                        ><div class="flex items-center gap-2">
                          <div class="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                          Pending
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
                      <SelectItem value="Cancelled" class="text-red-600"
                        ><div class="flex items-center gap-2">
                          <div class="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                          Cancelled
                        </div></SelectItem
                      >
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-medium">Priority</label>
                  <Select v-model="selectedPriority" :disabled="!isEditable">
                    <SelectTrigger class="h-9 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low" class="text-slate-600">
                        <div class="flex items-center gap-2">
                          <div class="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                          Low
                        </div>
                      </SelectItem>
                      <SelectItem value="Medium" class="text-blue-600">
                        <div class="flex items-center gap-2">
                          <div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          Medium
                        </div>
                      </SelectItem>
                      <SelectItem value="High" class="text-orange-600">
                        <div class="flex items-center gap-2">
                          <div class="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                          High
                        </div>
                      </SelectItem>
                      <SelectItem value="Critical" class="text-red-600">
                        <div class="flex items-center gap-2">
                          <div class="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                          Critical
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-medium">Assignee</label>
                  <Select v-model="selectedAssignee" :disabled="!isEditable">
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

  <AlertDialog v-model:open="isDeleteDialogOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you sure you want to delete this ticket?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete the ticket
          <strong>{{ localTicket?.ticketNo }}</strong> and all its comments.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          @click="confirmDelete"
          class="bg-red-600 hover:bg-red-700 focus:ring-red-600"
        >
          Delete Ticket
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <AlertDialog v-model:open="isRejectDialogOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle class="flex items-center gap-2 text-red-600">
          <AlertCircle class="w-5 h-5" />
          Reject Asset Request
        </AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to reject this asset request? The status will be changed to
          <strong>Cancelled</strong>.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          @click="rejectRequest"
          class="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
        >
          Confirm Reject
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
