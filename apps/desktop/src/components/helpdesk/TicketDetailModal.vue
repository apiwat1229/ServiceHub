```
<script setup lang="ts">
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DatePicker from '@/components/ui/date-picker.vue';
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
import Time24hPicker from '@/components/ui/time-picker/Time24hPicker.vue';
import { usePermissions } from '@/composables/usePermissions';
import { useUsers } from '@/composables/useUsers';
import { cn, getAvatarUrl } from '@/lib/utils';
import type { ITTicket, UpdateITTicketDto } from '@/services/it-tickets';
import { itTicketsApi } from '@/services/it-tickets';
import { socketService } from '@/services/socket';
import { useAuthStore } from '@/stores/auth';
import { format, formatDistanceToNowStrict, intervalToDuration } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  AlertCircle,
  Check,
  Clock,
  FileText,
  History,
  MapPin,
  Monitor,
  Pencil,
  Printer,
  Save,
  Star,
  Trash2,
} from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
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
const { isAdmin } = usePermissions();

const loading = ref(false);
const localTicket = ref<ITTicket | null>(null);
const comment = ref('');

// Form states
const selectedStatus = ref('');
const selectedPriority = ref('');
const selectedAssignee = ref('');
const isDeleteDialogOpen = ref(false);
const isRejectDialogOpen = ref(false);
const isStatusConfirmDialogOpen = ref(false);
const isEditingTitle = ref(false);
const resolvedDate = ref<string | null>(null);
const resolvedTime = ref('00:00');
const isEditingCreated = ref(false);
const createdDate = ref<string | null>(null);
const createdTime = ref('00:00');

// Initialize local state when ticket changes
watch(
  () => props.ticket,
  (newTicket) => {
    if (newTicket) {
      localTicket.value = { ...newTicket };
      selectedStatus.value = newTicket.status;
      selectedPriority.value = newTicket.priority;
      selectedAssignee.value = newTicket.assigneeId || 'unassigned';
      if (newTicket.resolvedAt) {
        const d = new Date(newTicket.resolvedAt);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        resolvedDate.value = `${year}-${month}-${day}`;
        resolvedTime.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      } else if (['Resolved', 'Closed'].includes(newTicket.status)) {
        // Fallback to updatedAt if resolvedAt is missing but status is resolved/closed
        const d = new Date(newTicket.updatedAt);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        resolvedDate.value = `${year}-${month}-${day}`;
        resolvedTime.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      } else {
        resolvedDate.value = null;
        resolvedTime.value = '00:00';
      }

      if (newTicket.createdAt) {
        const d = new Date(newTicket.createdAt);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        createdDate.value = `${year}-${month}-${day}`;
        createdTime.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }
  },
  { immediate: true }
);

// Watch for status changes to set default resolved date
watch(selectedStatus, (newStatus) => {
  if (['Resolved', 'Closed'].includes(newStatus) && !resolvedDate.value) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    resolvedDate.value = `${year}-${month}-${day}`;
    resolvedTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
});

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

const resolutionDuration = computed(() => {
  if (!localTicket.value || !localTicket.value.resolvedAt) return null;
  const created = new Date(localTicket.value.createdAt);
  const resolved = new Date(localTicket.value.resolvedAt);

  const duration = intervalToDuration({ start: created, end: resolved });

  if (duration.years || duration.months) {
    return formatDistanceToNowStrict(created, { addSuffix: false });
  }

  let parts = [];
  if (duration.days) parts.push(`${duration.days}d`);
  if (duration.hours) parts.push(`${duration.hours}h`);
  if (duration.minutes) parts.push(`${duration.minutes}m`);
  if (parts.length === 0) return 'less than 1m';

  return parts.join(' ');
});

const refreshTicket = async () => {
  if (!props.ticket?.id) return;
  try {
    const fresh = await itTicketsApi.getById(props.ticket.id);
    if (fresh) {
      localTicket.value = fresh as any;
      selectedStatus.value = fresh.status;
      selectedPriority.value = fresh.priority;
      selectedAssignee.value = fresh.assigneeId || 'unassigned';
      emit('ticketUpdated', fresh as any);
    }
  } catch (error) {
    console.error('Failed to refresh ticket:', error);
  }
};

onMounted(() => {
  socketService.on('ticket:updated', (updatedTicket: ITTicket) => {
    if (updatedTicket.id === props.ticket?.id) {
      refreshTicket();
    }
  });

  socketService.on('ticket:commented', ({ ticketId }: { ticketId: string }) => {
    if (ticketId === props.ticket?.id) {
      refreshTicket();
    }
  });
});

onUnmounted(() => {
  socketService.off('ticket:updated');
  socketService.off('ticket:commented');
});

const mergedTimeline = computed(() => {
  if (!localTicket.value) return [];

  const comments = (localTicket.value.comments || []).map((c) => ({
    ...c,
    timelineType: 'comment',
  }));

  const activities = (localTicket.value.activities || []).map((a) => ({
    ...a,
    timelineType: 'activity',
  }));

  return [...comments, ...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) as any[];
});

const getSLAStatusDetail = computed(() => {
  if (!localTicket.value) return { label: 'N/A', color: 'bg-muted' };

  const getSLAThreshold = (priority: string): number => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 4;
      case 'medium':
        return 8;
      case 'low':
        return 24;
      default:
        return 8;
    }
  };

  if (localTicket.value.status === 'Resolved' || localTicket.value.status === 'Closed') {
    const created = new Date(localTicket.value.createdAt);
    const resolved = localTicket.value.resolvedAt
      ? new Date(localTicket.value.resolvedAt)
      : new Date(localTicket.value.updatedAt);
    const durationHrs = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
    const threshold = getSLAThreshold(localTicket.value.priority);

    if (durationHrs <= threshold) return { label: 'Met', color: 'bg-green-100 text-green-800' };
    return { label: 'Breached', color: 'bg-red-100 text-red-800' };
  }

  const created = new Date(localTicket.value.createdAt);
  const now = new Date();
  const durationHrs = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  const threshold = getSLAThreshold(localTicket.value.priority);

  if (durationHrs > threshold) return { label: 'Breached', color: 'bg-red-100 text-red-800' };
  if (durationHrs > threshold * 0.8)
    return { label: 'Warning', color: 'bg-amber-100 text-amber-800' };
  return { label: 'On Track', color: 'bg-blue-100 text-blue-800' };
});

const saveChanges = async (confirmed = false) => {
  if (!localTicket.value) return;

  const isClosing = ['Resolved', 'Closed'].includes(selectedStatus.value);
  const wasNotClosing = !['Resolved', 'Closed'].includes(localTicket.value.status);

  if (isClosing && wasNotClosing && !confirmed) {
    isStatusConfirmDialogOpen.value = true;
    return;
  }

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

    if (['Resolved', 'Closed'].includes(selectedStatus.value)) {
      // Check if we have a resolved date set in the UI
      if (resolvedDate.value) {
        const [year, month, day] = resolvedDate.value.split('-').map(Number);
        const [hours, minutes] = resolvedTime.value.split(':').map(Number);

        // Construct date using local time
        const newResolvedAtDate = new Date(year, month - 1, day, hours, minutes);
        const newResolvedAt = newResolvedAtDate.toISOString();

        // ALWAYS update the resolvedAt if status is resolved/closed and we have a date
        // This fixes the issue where sometimes the date doesn't update if it thinks it's the same
        (updateDto as any).resolvedAt = newResolvedAt;
        hasChanges = true;
        console.log('[DEBUG] Setting resolvedAt:', newResolvedAt);
      }
    }

    // Handle createdAt update (Admin only)
    if (isAdmin.value && createdDate.value) {
      try {
        const [year, month, day] = createdDate.value.split('-').map(Number);
        let hours = 0,
          minutes = 0;

        if (createdTime.value) {
          const timeParts = createdTime.value.split(':').map(Number);
          if (timeParts.length >= 2) {
            hours = timeParts[0];
            minutes = timeParts[1];
          }
        }

        const newCreatedAtDate = new Date(year, month - 1, day, hours, minutes);
        const newCreatedAt = newCreatedAtDate.toISOString();

        console.log('[DEBUG] Admin updating createdAt:', {
          old: localTicket.value.createdAt,
          new: newCreatedAt,
          isDiff: newCreatedAt !== localTicket.value.createdAt,
        });

        if (newCreatedAt !== localTicket.value.createdAt) {
          (updateDto as any).createdAt = newCreatedAt;
          hasChanges = true;
        }
      } catch (err) {
        console.error('[DEBUG] Date processing error:', err);
      }
    }

    if (!hasChanges) {
      toast.info('No changes to save');
      loading.value = false;
      return;
    }

    console.log('[DEBUG] Sending updateDto:', updateDto);

    const updatedTicket = await itTicketsApi.update(props.ticket!.id, updateDto);
    // console.log('[DEBUG] Received updatedTicket:', updatedTicket); // Removed debug log

    toast.success('Ticket updated successfully');
    emit('ticketUpdated', updatedTicket);

    if (comment.value.trim()) {
      await handlePostComment();
    }

    emit('update:open', false);
  } catch (error) {
    console.error(error);
    toast.error('Failed to update ticket');
  } finally {
    loading.value = false;
    isStatusConfirmDialogOpen.value = false;
  }
};

const availableAssignees = computed(() => {
  return allUsers.value || [];
});

const isOwner = computed(() => {
  if (!localTicket.value || !authStore.user) return false;
  // Check if requesterId matches current user or if admin
  return localTicket.value.requesterId === authStore.user.id || isAdmin.value;
});

const isApprover = computed(() => {
  if (
    !localTicket.value ||
    !authStore.user ||
    !localTicket.value.isAssetRequest ||
    localTicket.value.status === 'Approved'
  )
    return false;
  // Admins can also approve/reject
  return localTicket.value.approverId === authStore.user.id || isAdmin.value;
});

const isITDepartment = computed(() => {
  const userDept = authStore.user?.department;
  return userDept === 'IT' || userDept === 'Information Technology';
});

const isEditable = computed(() => {
  if (isAdmin.value) return true;
  if (!localTicket.value) return false;
  // IT Department can always edit
  if (isITDepartment.value) return true;
  return !['Approved', 'Closed', 'Resolved', 'Cancelled'].includes(localTicket.value.status);
});

const canManage = computed(() => {
  return isOwner.value || isITDepartment.value;
});

const startEditingTitle = () => {
  if ((isOwner.value || isAdmin.value || isITDepartment.value) && isEditable.value) {
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

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return undefined;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'https://app.ytrc.co.th';
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (
    cleanBaseUrl.includes('app.ytrc.co.th') &&
    !cleanBaseUrl.endsWith('/api') &&
    !cleanPath.startsWith('/api')
  ) {
    return `${cleanBaseUrl}/api${cleanPath}`;
  }

  return `${cleanBaseUrl}${cleanPath}`;
};

const exportJobOrderPDF = async () => {
  if (!localTicket.value) return;

  const loadingToast = toast.loading('Generating Job Order PDF...');

  try {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '794px'; // Exactly 210mm at 96 DPI
    container.style.height = '1123px'; // Exactly 297mm at 96 DPI
    container.style.backgroundColor = 'white';
    container.style.overflow = 'hidden';
    // Remove individual padding here so the internal div can handle border/padding
    container.style.padding = '0';
    container.style.color = '#000';
    container.style.fontFamily = "'Sarabun', sans-serif";

    const t = localTicket.value;
    const dateStr = format(new Date(), 'dd/MM/yyyy');
    const createdDate = format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm');

    container.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap');
        * { box-sizing: border-box; font-family: 'Sarabun', sans-serif !important; }
      </style>
      <div style="border: 2px solid #000; margin: 30px; padding: 25px; height: 1063px; position: relative; background: white;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
          <div style="flex: 1;">
            <h1 style="font-size: 32px; font-weight: bold; margin: 0; text-align: center; text-decoration: underline;">ใบแจ้งซ่อม / ใบสั่งงาน (Job Order)</h1>
          </div>
          <div style="width: 170px; border: 1px solid #000; padding: 10px; font-size: 16px;">
            <div style="font-weight: bold;">Doc NO: ${t.ticketNo}</div>
            <div style="margin-top: 5px;">วันที่พิมพ์: ${dateStr}</div>
          </div>
        </div>

        <!-- Section 1: Requester Information -->
        <div style="background-color: #f1f5f9; padding: 10px; font-weight: bold; border: 1px solid #000; font-size: 18px; border-bottom: none;">
          1. ส่วนของผู้แจ้งซ่อม (Requester Section)
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #000; padding: 15px; gap: 15px; font-size: 16px;">
          <div><b style="font-weight: 700;">ชื่อผู้แจ้ง:</b> ${t.requester?.displayName || t.requester?.username || '-'}</div>
          <div><b style="font-weight: 700;">ฝ่าย/แผนก:</b> ${t.location || '-'}</div>
          <div><b style="font-weight: 700;">วันที่แจ้ง:</b> ${createdDate}</div>
          <div><b style="font-weight: 700;">ประเภทงาน:</b> ${t.category}</div>
        </div>
        <div style="border: 1px solid #000; border-top: none; padding: 15px; font-size: 16px;">
          <div style="font-weight: bold; margin-bottom: 10px;">รายละเอียดปัญหา / ความต้องการ (Subject & Description):</div>
          <div style="font-weight: bold; margin-bottom: 8px; color: #1e40af; font-size: 17px;">[ ${t.title} ]</div>
          <div style="min-height: 100px; border: 1.5px dashed #94a3b8; padding: 15px; line-height: 1.6; color: #1e293b; background: white;">
            ${t.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
          </div>
        </div>
        <div style="display: flex; justify-content: space-around; border: 1px solid #000; border-top: none; padding: 35px 15px; font-size: 15px; text-align: center;">
          <div style="width: 250px;">
            <div style="margin-bottom: 45px; border-bottom: 1px dotted #000;">&nbsp;</div>
            <div style="font-weight: bold;">( ${t.requester?.displayName || 'ลงชื่อผู้แจ้งซ่อม'} )</div>
            <div style="margin-top: 6px; color: #475569;">ผู้แจ้งซ่อม / วันที่</div>
          </div>
          <div style="width: 250px;">
            <div style="margin-bottom: 45px; border-bottom: 1px dotted #000;">&nbsp;</div>
            <div style="font-weight: bold;">( ................................................... )</div>
            <div style="margin-top: 6px; color: #475569;">หัวหน้างาน / ผู้รับรอง</div>
          </div>
        </div>

        <!-- Section 2: IT Section -->
        <div style="margin-top: 25px; background-color: #f1f5f9; padding: 10px; font-weight: bold; border: 1px solid #000; font-size: 18px; border-bottom: none;">
          2. ส่วนของเจ้าหน้าที่ IT (Technician Section)
        </div>
        <div style="border: 1px solid #000; padding: 15px; font-size: 16px;">
          <div style="font-weight: bold; margin-bottom: 10px;">ผลการตรวจสอบ / การดำเนินการแก้ไข (Diagnosis & Resolution):</div>
          <div style="min-height: 120px; border: 1.5px dashed #94a3b8; padding: 15px; line-height: 1.6; color: #1e293b; background: white;">
            ${t.status === 'Resolved' || t.status === 'Closed' ? 'งานเสร็จสิ้นตามแผนงาน - ทำการตรวจสอบและแก้ไขปัญหาตามที่ได้รับแจ้งเรียบร้อยแล้ว' : 'กำลังดำเนินการ / รอการเข้ารับบริการ'}
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #000; border-top: none; padding: 15px; gap: 15px; font-size: 16px;">
          <div><b style="font-weight: 700;">ผู้รับผิดชอบ (Assignee):</b> ${t.assignee?.displayName || '-'}</div>
          <div><b style="font-weight: 700;">ระดับความสำคัญ:</b> ${t.priority}</div>
          <div><b style="font-weight: 700;">สถานะปัจจุบัน:</b> ${t.status}</div>
          <div><b style="font-weight: 700;">SLA Status:</b> ${getSLAStatusDetail.value.label}</div>
        </div>
        <div style="display: flex; justify-content: space-around; border: 1px solid #000; border-top: none; padding: 35px 15px; font-size: 15px; text-align: center;">
          <div style="width: 250px;">
            <div style="margin-bottom: 45px; border-bottom: 1px dotted #000;">&nbsp;</div>
            <div style="font-weight: bold;">( ${t.assignee?.displayName || 'ลงชื่อเจ้าหน้าที่'} )</div>
            <div style="margin-top: 6px; color: #475569;">เจ้าหน้าที่ดำเนินการ / วันที่</div>
          </div>
          <div style="width: 250px;">
            <div style="margin-bottom: 45px; border-bottom: 1px dotted #000;">&nbsp;</div>
            <div style="font-weight: bold;">( ................................................... )</div>
            <div style="margin-top: 6px; color: #475569;">ผู้ตรวจรับงาน / IT Manager</div>
          </div>
        </div>

        <!-- Section 3: User Acceptance -->
        <div style="margin-top: 25px; background-color: #f1f5f9; padding: 10px; font-weight: bold; border: 1px solid #000; font-size: 18px; border-bottom: none;">
          3. ส่วนการตรวจรับงาน (User Acceptance Section)
        </div>
        <div style="border: 1px solid #000; padding: 20px; font-size: 16px;">
          <div style="display: flex; gap: 40px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 18px; height: 18px; border: 1.5px solid #000;"></div> แก้ไขเรียบร้อยแล้ว (Fixed)
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 18px; height: 18px; border: 1.5px solid #000;"></div> ไม่สามารถแก้ไขได้ (Unfixed)
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 18px; height: 18px; border: 1.5px solid #000;"></div> อื่นๆ ...........................
            </div>
          </div>
          <div style="display: flex; gap: 25px; align-items: center;">
            <div style="font-weight: bold;">ความพึงพอใจ:</div>
            <div style="display: flex; gap: 20px;">
              <span>[ ] ดีมาก</span> <span>[ ] ดี</span> <span>[ ] พอใช้</span> <span>[ ] ปรับปรุง</span>
            </div>
          </div>
          <div style="margin-top: 15px; color: #475569; font-size: 14px;">ข้อเสนอแนะ: ...........................................................................................................................................................</div>
        </div>
        <div style="display: flex; justify-content: space-around; border: 1px solid #000; border-top: none; padding: 35px 15px; font-size: 15px; text-align: center;">
          <div style="width: 250px;">
            <div style="margin-bottom: 45px; border-bottom: 1px dotted #000;">&nbsp;</div>
            <div style="font-weight: bold;">( ................................................... )</div>
            <div style="margin-top: 6px; color: #475569;">ผู้ส่งมอบงาน / IT</div>
          </div>
          <div style="width: 250px;">
            <div style="margin-bottom: 45px; border-bottom: 1px dotted #000;">&nbsp;</div>
            <div style="font-weight: bold;">( ................................................... )</div>
            <div style="margin-top: 6px; color: #475569;">ผู้ตรวจรับผลงาน / วันที่</div>
          </div>
        </div>

        <!-- Footer -->
        <div style="position: absolute; bottom: 25px; left: 25px; right: 25px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b;">
          <div>ServiceHub IT Management System</div>
          <div>Printed on ${format(new Date(), 'dd MMM yyyy HH:mm:ss')}</div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.82);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    pdf.save(`JobOrder-${t.ticketNo}.pdf`);

    document.body.removeChild(container);
    toast.dismiss(loadingToast);
    toast.success('Job Order PDF generated successfully');
  } catch (err) {
    console.error('PDF Export Error:', err);
    toast.dismiss(loadingToast);
    toast.error('Failed to export Job Order');
  }
};
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent
      class="sm:max-w-[850px] w-full max-h-[90vh] p-0 gap-0 overflow-hidden bg-white shadow-xl border flex flex-col"
    >
      <DialogDescription class="sr-only">
        Details for ticket {{ localTicket?.ticketNo }}
      </DialogDescription>
      <!-- Header Area -->
      <div class="p-6 pr-14 border-b bg-muted/10 shrink-0">
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
                v-if="canManage && isEditable"
                variant="ghost"
                size="icon"
                class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil class="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </DialogTitle>
            <div
              class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1"
            >
              <div class="flex items-center gap-1 group">
                <Clock class="w-3.5 h-3.5" />
                <span
                  v-if="!isEditingCreated"
                  :class="{
                    'cursor-pointer hover:underline decoration-dashed': isAdmin || isITDepartment,
                  }"
                  @click="isAdmin || isITDepartment ? (isEditingCreated = true) : null"
                  :title="isAdmin || isITDepartment ? 'Click to edit' : ''"
                >
                  Created {{ localTicket ? formatDate(localTicket.createdAt) : '' }}
                </span>
                <div v-else class="flex items-center gap-1 h-6">
                  <DatePicker v-model="createdDate" class="h-6 w-[110px] text-xs px-2" />
                  <input
                    type="time"
                    v-model="createdTime"
                    class="h-6 w-[60px] text-xs border rounded px-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    class="h-6 w-6 hover:bg-green-50"
                    @click="isEditingCreated = false"
                  >
                    <Check class="w-3.5 h-3.5 text-green-600" />
                  </Button>
                </div>
              </div>
              <div
                v-if="resolutionDuration"
                class="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100"
              >
                <Check class="w-3.5 h-3.5" />
                <span>Resolved in {{ resolutionDuration }}</span>
              </div>
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
            <Badge
              v-if="localTicket?.status !== 'Resolved' && localTicket?.status !== 'Closed'"
              :class="[
                'px-3 py-1 text-sm font-medium shadow-sm pointer-events-none ml-2',
                getSLAStatusDetail.color,
              ]"
            >
              SLA: {{ getSLAStatusDetail.label }}
            </Badge>
          </div>
        </div>
      </div>

      <!-- Approver Action Banner -->
      <div v-if="isApprover" class="px-6 mt-6 mb-2 shrink-0">
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

      <!-- Rating / Feedback Banner (For Requester on Resolved/Closed) -->
      <div
        v-if="localTicket?.status === 'Resolved' && isOwner && !localTicket.rating"
        class="px-6 mt-6 mb-2 shrink-0"
      >
        <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm">
          <div class="flex items-start gap-3">
            <div class="p-2 bg-white rounded-lg text-amber-600 shadow-sm mt-0.5">
              <Star class="w-5 h-5 fill-amber-600" />
            </div>
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-amber-900">How did we do?</h4>
              <p class="text-xs text-amber-700 mt-1">Please rate the resolution of your ticket.</p>

              <div class="flex items-center gap-1.5 mt-3">
                <button
                  v-for="star in 5"
                  :key="star"
                  @click="localTicket!.rating = star"
                  class="transition-transform hover:scale-110"
                >
                  <Star
                    class="w-6 h-6"
                    :class="
                      star <= (localTicket?.rating || 0)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-amber-200'
                    "
                  />
                </button>
              </div>

              <div v-if="localTicket?.rating" class="mt-3">
                <Textarea
                  v-model="localTicket!.feedback"
                  placeholder="Share your feedback (optional)..."
                  class="bg-white border-amber-100 text-sm h-20"
                />
                <Button
                  size="sm"
                  class="mt-2 bg-amber-600 hover:bg-amber-700 text-white border-0"
                  @click="saveChanges"
                  :disabled="loading"
                >
                  Submit Feedback
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden h-[600px]">
        <!-- Main Content (Scrollable) -->
        <div class="flex-1 p-6 overflow-y-auto border-r border-border/50">
          <div class="space-y-8">
            <!-- Description Section -->
            <div class="space-y-3">
              <h4 class="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                <FileText class="w-4 h-4 text-primary" /> Details
              </h4>

              <!-- Asset Request Card -->
              <div
                v-if="localTicket?.isAssetRequest && localTicket?.asset"
                class="bg-white rounded-xl border shadow-sm overflow-hidden mb-4"
              >
                <div class="flex flex-col sm:flex-row">
                  <!-- Image Section -->
                  <div
                    class="sm:w-1/3 min-h-[160px] bg-muted/30 border-b sm:border-b-0 sm:border-r relative flex items-center justify-center p-4"
                  >
                    <img
                      v-if="localTicket.asset.image"
                      :src="getImageUrl(localTicket.asset.image)"
                      alt="Asset Image"
                      class="max-w-full max-h-[140px] object-contain drop-shadow-sm transition-transform hover:scale-105 duration-300"
                    />
                    <div
                      v-else
                      class="flex flex-col items-center justify-center text-muted-foreground/40"
                    >
                      <Monitor class="w-12 h-12 mb-2" />
                      <span class="text-xs font-medium">No Image</span>
                    </div>
                  </div>

                  <!-- Details Section -->
                  <div class="flex-1 p-5 flex flex-col justify-center space-y-3">
                    <div>
                      <div class="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          class="text-[0.65rem] font-mono uppercase tracking-wider bg-slate-50 text-slate-500 border-slate-200"
                        >
                          {{ localTicket.asset.code }}
                        </Badge>
                        <Badge
                          variant="secondary"
                          class="text-[0.65rem] capitalize bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          {{ localTicket.asset.category }}
                        </Badge>
                      </div>
                      <h3 class="text-lg font-bold text-foreground leading-tight">
                        {{ localTicket.asset.name }}
                      </h3>
                    </div>

                    <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm pt-2 border-t mt-2">
                      <div>
                        <span class="text-muted-foreground text-xs block mb-0.5">Location</span>
                        <span class="font-medium">{{ localTicket.asset.location || '-' }}</span>
                      </div>
                      <div>
                        <span class="text-muted-foreground text-xs block mb-0.5">Stock Status</span>
                        <span
                          :class="{
                            'text-green-600': (localTicket.asset.stock || 0) > 0,
                            'text-red-600': (localTicket.asset.stock || 0) <= 0,
                          }"
                          class="font-medium flex items-center gap-1.5"
                        >
                          <div
                            class="w-2 h-2 rounded-full"
                            :class="
                              (localTicket.asset.stock || 0) > 0 ? 'bg-green-500' : 'bg-red-500'
                            "
                          ></div>
                          {{ (localTicket.asset.stock || 0) > 0 ? 'In Stock' : 'Out of Stock' }} ({{
                            localTicket.asset.stock || 0
                          }})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Description Field -->
              <div>
                <h5 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Description / Reason
                </h5>
                <div
                  v-if="canManage && isEditable"
                  class="rounded-lg border border-border/50 shadow-sm"
                >
                  <Textarea
                    v-model="localTicket!.description"
                    class="min-h-[100px] bg-muted/30 border-0 focus-visible:ring-0 resize-none text-sm leading-relaxed p-4"
                    placeholder="Review description..."
                  />
                </div>
                <div
                  v-else
                  class="p-4 bg-muted/30 rounded-lg text-sm leading-relaxed border border-border/50 shadow-sm min-h-[80px]"
                >
                  {{ localTicket?.description || 'No additional description provided.' }}
                </div>
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
                        <AvatarImage :src="getAvatarUrl(authStore.user?.avatar)" />
                        <AvatarFallback class="text-[0.625rem] bg-primary/10 text-primary">
                          {{ authStore.user?.displayName?.substring(0, 2).toUpperCase() || 'ME' }}
                        </AvatarFallback>
                      </Avatar>
                      <span class="text-xs font-medium">You</span>
                      <span class="text-[0.625rem] text-muted-foreground ml-auto">Now</span>
                    </div>
                    <Textarea
                      placeholder="Write a comment..."
                      v-model="comment"
                      class="min-h-[80px] bg-muted/20 resize-none text-sm border-0 focus-visible:ring-0 px-0 shadow-none"
                    />
                    <div class="flex justify-between items-center mt-2 border-t pt-2">
                      <span class="text-[0.625rem] text-muted-foreground">Visible to everyone</span>
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

                <!-- Unified Timeline -->
                <div v-for="item in mergedTimeline" :key="item.id" class="relative">
                  <div
                    class="absolute -left-[21px] top-1 w-3 h-3 rounded-full ring-4 ring-background"
                    :class="
                      item.timelineType === 'comment' ? 'bg-muted-foreground/30' : 'bg-primary/40'
                    "
                  ></div>

                  <!-- Comment View -->
                  <div
                    v-if="item.timelineType === 'comment'"
                    class="bg-muted/10 border rounded-lg p-3 shadow-sm"
                  >
                    <div class="flex items-center gap-2 mb-1">
                      <Avatar class="w-6 h-6">
                        <AvatarImage :src="getAvatarUrl(item.user.avatar)" />
                        <AvatarFallback class="text-[0.625rem] bg-muted text-muted-foreground">
                          {{ item.user.displayName?.substring(0, 2).toUpperCase() }}
                        </AvatarFallback>
                      </Avatar>
                      <span class="text-xs font-medium">{{ item.user.displayName }}</span>
                      <span class="text-[0.625rem] text-muted-foreground ml-auto">
                        {{ formatDate(item.createdAt) }}
                      </span>
                    </div>
                    <p class="text-sm text-foreground/90 whitespace-pre-wrap">{{ item.content }}</p>
                  </div>

                  <!-- Activity View -->
                  <div v-else class="text-xs text-muted-foreground py-0.5">
                    <span class="font-medium text-foreground">{{
                      item.user?.displayName || 'User'
                    }}</span>
                    <span v-if="item.type === 'STATUS_CHANGE'">
                      changed status from
                      <span class="font-medium px-1.5 py-0.5 rounded bg-muted/50 text-foreground">{{
                        item.oldValue
                      }}</span>
                      to
                      <span class="font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">{{
                        item.newValue
                      }}</span>
                    </span>
                    <span v-else-if="item.type === 'ASSIGNMENT'">
                      assigned this ticket to
                      <span class="font-medium text-foreground">{{
                        item.newValue || 'Unassigned'
                      }}</span>
                    </span>
                    <span v-else-if="item.type === 'TICKET_CREATED'"> created this ticket. </span>
                    <span v-else>
                      {{ item.content || item.type }}
                    </span>
                    <div class="text-[0.625rem] opacity-70 mt-1">
                      {{ formatDate(item.createdAt) }}
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
              <div class="grid gap-2">
                <div v-if="isEditable" class="grid gap-2">
                  <Button @click="saveChanges" :disabled="loading" class="w-full shadow-sm">
                    <Save class="w-4 h-4 mr-2" /> Save Changes
                  </Button>
                  <Button
                    v-if="canManage"
                    @click="handleDelete"
                    :disabled="loading"
                    variant="outline"
                    class="w-full shadow-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                  >
                    <Trash2 class="w-4 h-4 mr-2" /> Delete Ticket
                  </Button>
                </div>

                <Button @click="exportJobOrderPDF" variant="outline" class="w-full shadow-sm">
                  <Printer class="w-4 h-4 mr-2" /> Export Job Order
                </Button>
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
                    <span class="text-[0.625rem] text-muted-foreground truncate">{{
                      localTicket?.requester?.email
                    }}</span>
                  </div>
                  <Avatar class="w-8 h-8 border border-border/50">
                    <AvatarImage :src="getAvatarUrl(localTicket?.requester?.avatar)" />
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
                  <div class="space-y-1.5" v-if="isAdmin || isITDepartment">
                    <label class="text-xs font-medium">Created Date & Time</label>
                    <div class="flex gap-2">
                      <DatePicker v-model="createdDate" class="flex-1" />
                      <Time24hPicker v-model="createdTime" class="w-[100px]" />
                    </div>
                  </div>

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
                  <div class="space-y-1.5" v-if="['Resolved', 'Closed'].includes(selectedStatus)">
                    <label class="text-xs font-medium">Resolution Date & Time</label>
                    <div class="flex gap-2">
                      <DatePicker v-model="resolvedDate" class="flex-1" />
                      <Time24hPicker v-model="resolvedTime" class="w-[100px]" />
                    </div>
                  </div>
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
                            <AvatarImage :src="getAvatarUrl(user.avatar)" />
                            <AvatarFallback class="text-[0.5625rem]">{{
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
      <AlertDialog v-model:open="isStatusConfirmDialogOpen">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Ticket Closure</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status to
              <span class="font-bold text-foreground">{{ selectedStatus }}</span
              >? This will mark the ticket as settled and calculate the final resolution time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel @click="selectedStatus = localTicket?.status || ''">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              class="bg-primary text-white hover:bg-primary/90"
              @click="saveChanges(true)"
            >
              Confirm & Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
