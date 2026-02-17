<script setup lang="ts">
import AssetRequestForm from '@/components/helpdesk/AssetRequestForm.vue';
import BarcodePreview from '@/components/helpdesk/BarcodePreview.vue';
import ITStockForm from '@/components/helpdesk/ITStockForm.vue';
import NewTicketForm from '@/components/helpdesk/NewTicketForm.vue';
import PrinterUsageAnalytics from '@/components/helpdesk/PrinterUsageAnalytics.vue';
import TicketDetailModal from '@/components/helpdesk/TicketDetailModal.vue';
import KnowledgeBookCard from '@/components/knowledge-center/KnowledgeBookCard.vue';
import KnowledgeBookEdit from '@/components/knowledge-center/KnowledgeBookEdit.vue';
import KnowledgeBookUpload from '@/components/knowledge-center/KnowledgeBookUpload.vue';
import KnowledgeBookViewer from '@/components/knowledge-center/KnowledgeBookViewer.vue';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import DateRangePicker from '@/components/ui/date-range-picker.vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner/Spinner.vue';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { itAssetsApi, type ITAsset } from '@/services/it-assets';
import { itTicketsApi, type ITTicket } from '@/services/it-tickets';
import { knowledgeBooksApi, type KnowledgeBook } from '@/services/knowledge-books';
import { socketService } from '@/services/socket';
import { useAuthStore } from '@/stores/auth';
import { getLocalTimeZone, today } from '@internationalized/date';
import type { ColumnDef } from '@tanstack/vue-table';
import { format, formatDistanceToNowStrict, intervalToDuration } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  AlertTriangle,
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit2,
  FileText,
  Monitor,
  Package,
  Plus,
  Search,
  Ticket,
  Upload,
  Zap,
} from 'lucide-vue-next';
import type { DateRange } from 'reka-ui';
import { computed, h, onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

import { usePermissions } from '@/composables/usePermissions';

const route = useRoute();
const router = useRouter();
const activeTab = ref(route.query.tab?.toString() || 'overview');

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab) {
      activeTab.value = newTab.toString();
    }
  }
);
const { isAdmin } = usePermissions();
const isDetailModalOpen = ref(false);
const selectedTicket = ref<ITTicket | null>(null);
const loadingTickets = ref(false);

const handleTicketClick = (ticket: ITTicket) => {
  selectedTicket.value = ticket;
  isDetailModalOpen.value = true;
};

const onTicketUpdated = (updatedTicket: ITTicket) => {
  const index = tickets.value.findIndex((t) => t.id === updatedTicket.id);
  if (index !== -1) {
    tickets.value[index] = updatedTicket;
  }
  selectedTicket.value = updatedTicket;
};

watch(
  () => route.query.ticketId,
  async (newId) => {
    if (newId && typeof newId === 'string') {
      try {
        // If tickets aren't loaded yet, we might need to fetch this specific ticket or wait.
        // For now, let's fetch individual ticket to ensure we have it.
        loadingTickets.value = true;
        const ticket = await itTicketsApi.getById(newId);
        if (ticket) {
          handleTicketClick(ticket);
        }
      } catch (e) {
        console.error('Failed to load deep linked ticket', e);
        toast.error('Failed to load ticket details');
      } finally {
        loadingTickets.value = false;
      }
    }
  },
  { immediate: true }
);

watch(activeTab, (newTab) => {
  const query = { ...route.query, tab: newTab };
  router.replace({ query });
});

const { t } = useI18n();
const authStore = useAuthStore();

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

const getSLAStatus = (ticket: ITTicket) => {
  if (ticket.status === 'Cancelled') return null;

  if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
    const created = new Date(ticket.createdAt);
    const resolved = ticket.resolvedAt ? new Date(ticket.resolvedAt) : new Date(ticket.updatedAt);
    const durationHrs = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
    const threshold = getSLAThreshold(ticket.priority);

    if (durationHrs <= threshold) return { label: 'Met', color: 'text-green-600 bg-green-50' };
    return { label: 'Breached', color: 'text-red-600 bg-red-50' };
  }

  const created = new Date(ticket.createdAt);
  const now = new Date();
  const durationHrs = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  const threshold = getSLAThreshold(ticket.priority);

  if (durationHrs > threshold) return { label: 'Breached', color: 'text-red-600 bg-red-100/50' };
  if (durationHrs > threshold * 0.8)
    return { label: 'Warning', color: 'text-amber-600 bg-amber-50' };
  return { label: 'On Track', color: 'text-blue-600 bg-blue-50' };
};
const exportTicketsToCSV = () => {
  if (tickets.value.length === 0) {
    toast.error('No tickets to export');
    return;
  }

  const headers = [
    'Ticket No',
    'Title',
    'Category',
    'Priority',
    'Status',
    'Location',
    'Requester',
    'Assignee',
    'Created At',
    'Resolved At',
  ];

  const rows = tickets.value.map((t) => [
    t.ticketNo,
    `"${t.title.replace(/"/g, '""')}"`,
    t.category,
    t.priority,
    t.status,
    t.location || '',
    t.requester?.displayName || '',
    t.assignee?.displayName || '',
    t.createdAt ? format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm:ss') : '',
    t.resolvedAt ? format(new Date(t.resolvedAt), 'yyyy-MM-dd HH:mm:ss') : '',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `it-tickets-${format(new Date(), 'yyyyMMdd-HHmmss')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success('Tickets exported successfully');
};

const exportTicketsToPDF = async () => {
  if (tickets.value.length === 0) {
    toast.error('No tickets to export');
    return;
  }

  const loadingToast = toast.loading('Generating PDF report...');

  try {
    // Create hidden container for PDF content
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '794px'; // 210mm at 96 DPI
    container.style.backgroundColor = 'white';
    container.style.padding = '0';
    container.style.margin = '0';
    container.style.color = '#000';

    // Header Section
    const dateStr = format(new Date(), 'dd MMM yyyy HH:mm');
    const rangeStr =
      dateRange.value?.start && dateRange.value?.end
        ? `${dateRange.value.start.toDate(getLocalTimeZone()).toLocaleDateString()} - ${dateRange.value.end.toDate(getLocalTimeZone()).toLocaleDateString()}`
        : 'All Time';

    // SLA Calculation for Summary
    const resolvedInPeriod = tickets.value.filter(
      (t) => t.status === 'Resolved' || t.status === 'Closed'
    );
    const slaMet = resolvedInPeriod.filter((t) => getSLAStatus(t)?.label === 'Met').length;
    const slaRate = resolvedInPeriod.length
      ? ((slaMet / resolvedInPeriod.length) * 100).toFixed(0)
      : '0';

    container.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap');
        * { box-sizing: border-box; font-family: 'Sarabun', sans-serif !important; }
      </style>
      <div style="padding: 40px; background: white; min-height: 1123px;">
        <div style="border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h1 style="font-size: 28px; font-weight: 800; color: #0f172a; margin: 0;">IT Help Desk Report</h1>
            <p style="font-size: 16px; color: #64748b; margin: 4px 0 0 0;">Generated on ${dateStr}</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 14px; font-weight: 600; color: #3b82f6; background-color: #eff6ff; padding: 6px 16px; border-radius: 99px; display: inline-block;">${rangeStr}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px;">
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
            <p style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Total Tickets</p>
            <p style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 4px 0 0 0;">${ticketStats.value.total}</p>
          </div>
          <div style="background-color: #eff6ff; padding: 16px; border-radius: 12px; text-align: center; border: 1px solid #bfdbfe;">
            <p style="font-size: 12px; font-weight: 600; color: #2563eb; text-transform: uppercase;">Open Tickets</p>
            <p style="font-size: 24px; font-weight: 700; color: #1e40af; margin: 4px 0 0 0;">${ticketStats.value.openCount + ticketStats.value.inProgressCount}</p>
          </div>
          <div style="background-color: #f0fdf4; padding: 16px; border-radius: 12px; text-align: center; border: 1px solid #bbf7d0;">
            <p style="font-size: 12px; font-weight: 600; color: #16a34a; text-transform: uppercase;">Resolved</p>
            <p style="font-size: 24px; font-weight: 700; color: #166534; margin: 4px 0 0 0;">${ticketStats.value.resolved}</p>
          </div>
          <div style="background-color: #fffbeb; padding: 16px; border-radius: 12px; text-align: center; border: 1px solid #fde68a;">
            <p style="font-size: 12px; font-weight: 600; color: #d97706; text-transform: uppercase;">SLA Met Rate</p>
            <p style="font-size: 24px; font-weight: 700; color: #92400e; margin: 4px 0 0 0;">${slaRate}%</p>
          </div>
        </div>

        <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 16px;">Detailed Ticket Log</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: left;">
              <th style="padding: 12px 8px; border-bottom: 2px solid #e2e8f0; color: #475569;">No.</th>
              <th style="padding: 12px 8px; border-bottom: 2px solid #e2e8f0; color: #475569;">Subject</th>
              <th style="padding: 12px 8px; border-bottom: 2px solid #e2e8f0; color: #475569;">Status</th>
              <th style="padding: 12px 8px; border-bottom: 2px solid #e2e8f0; color: #475569;">Assignee</th>
              <th style="padding: 12px 8px; border-bottom: 2px solid #e2e8f0; color: #475569;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${tickets.value
              .slice(0, 50) // Limit to 50 for clarity in summary report
              .map(
                (t) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px 8px; color: #64748b; font-family: 'Sarabun', monospace;">${t.ticketNo}</td>
                <td style="padding: 12px 8px; font-weight: 600; color: #0f172a;">${t.title}</td>
                <td style="padding: 12px 8px;">
                  <span style="padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; background-color: #f1f5f9; color: #475569;">${t.status}</span>
                </td>
                <td style="padding: 12px 8px; color: #475569;">${t.assignee?.displayName || '-'}</td>
                <td style="padding: 12px 8px; color: #64748b;">${format(new Date(t.createdAt), 'dd/MM/yy')}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8;">
          This report is automatically generated by ServiceHub IT Management System.
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

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    pdf.save(`it-report-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`);

    document.body.removeChild(container);
    toast.dismiss(loadingToast);
    toast.success('PDF report exported successfully');
  } catch (err) {
    console.error('PDF Export Error:', err);
    toast.dismiss(loadingToast);
    toast.error('Failed to export PDF');
  }
};

// ... existing imports ...

const searchQuery = ref('');
const isAssetModalOpen = ref(false);
const isTicketModalOpen = ref(false);
const isStockModalOpen = ref(false);
const editingStockItem = ref<ITAsset | null>(null);

// eBook State
const isUploadModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isViewerModalOpen = ref(false);
const selectedBook = ref<KnowledgeBook | null>(null);
const books = ref<KnowledgeBook[]>([]);
const loadingBooks = ref(false);
const selectedCategory = ref<string>('');
const ebookCategories = ref<string[]>([]);
const loadingCategories = ref(false);

const handleEditBook = (book: KnowledgeBook) => {
  selectedBook.value = book;
  isEditModalOpen.value = true;
};

const onBookUpdated = () => {
  loadBooks();
};

// Delete Confirmation State
const isDeleteConfirmOpen = ref(false);
const bookToDelete = ref<KnowledgeBook | null>(null);

// IT Stock State
const itStock = ref<ITAsset[]>([]);
const loadingStock = ref(false);
const isStockDeleteConfirmOpen = ref(false);
const stockItemToDelete = ref<ITAsset | null>(null);
const stockCategoryFilter = ref<string>('ALL');

const stockCategories = computed(() => {
  const cats = new Set(itStock.value.map((item) => item.category).filter(Boolean));
  return Array.from(cats).sort();
});

const filteredITStock = computed(() => {
  let filtered = itStock.value;

  if (stockCategoryFilter.value && stockCategoryFilter.value !== 'ALL') {
    filtered = filtered.filter((item) => item.category === stockCategoryFilter.value);
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
    );
  }

  return filtered;
});

// Ticket State
const tickets = ref<ITTicket[]>([]);

const assetRequests = computed(() => {
  return tickets.value.filter((t) => t.isAssetRequest);
});

const getImageUrl = (path: string | null) => {
  if (!path) return null;
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

const formatTicketDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  const formatted = format(date, 'dd MMM yyyy, HH:mm');

  const now = new Date();
  const duration = intervalToDuration({ start: date, end: now });

  let timeAgo = '';
  if (duration.years) timeAgo = formatDistanceToNowStrict(date, { addSuffix: true });
  else if (duration.months) timeAgo = formatDistanceToNowStrict(date, { addSuffix: true });
  else if (duration.days) {
    timeAgo = `${duration.days}d ${duration.hours ?? 0}h ago`;
  } else if (duration.hours) {
    timeAgo = `${duration.hours}h ${duration.minutes ?? 0}m ago`;
  } else {
    timeAgo = `${duration.minutes ?? 0}m ago`;
  }

  return `${formatted} (${timeAgo})`;
};

const itAssetColumns: ColumnDef<ITAsset>[] = [
  {
    id: 'index',
    header: () => h('div', { class: 'text-center' }, 'No.'),
    cell: ({ row }) => h('div', { class: 'text-center' }, row.index + 1),
  },
  {
    accessorKey: 'name',
    header: () => h('div', t('services.itHelp.stock.deviceName')),
    cell: ({ row }) => {
      const item = row.original;
      return h(
        HoverCard,
        { openDelay: 200 },
        {
          default: () => [
            h(
              HoverCardTrigger,
              { asChild: true },
              {
                default: () =>
                  h('div', { class: 'flex flex-col cursor-help group' }, [
                    h(
                      'div',
                      { class: 'font-medium group-hover:text-primary transition-colors' },
                      item.name
                    ),
                    h('div', { class: 'text-xs text-muted-foreground' }, item.code),
                  ]),
              }
            ),
            h(
              HoverCardContent,
              { class: 'w-80 shadow-2xl' },
              {
                default: () =>
                  h('div', { class: 'space-y-3' }, [
                    item.image
                      ? h(
                          'div',
                          {
                            class:
                              'relative aspect-video rounded-md overflow-hidden bg-muted border',
                          },
                          [
                            h('img', {
                              src: getImageUrl(item.image),
                              class: 'absolute inset-0 w-full h-full object-contain',
                            }),
                          ]
                        )
                      : h(
                          'div',
                          {
                            class:
                              'aspect-video rounded-md bg-muted flex items-center justify-center border',
                          },
                          [h(Monitor, { class: 'w-8 h-8 opacity-20' })]
                        ),
                    h('div', { class: 'space-y-1' }, [
                      h('div', { class: 'text-sm font-bold' }, item.name),
                      h(
                        'div',
                        { class: 'grid grid-cols-[80px_1fr] gap-x-2 gap-y-0.5 text-[0.6875rem]' },
                        [
                          h('span', { class: 'text-muted-foreground' }, 'Device Code:'),
                          h('span', { class: 'font-mono' }, item.code),
                          h('span', { class: 'text-muted-foreground' }, 'Category:'),
                          h(
                            'span',
                            item.category
                              ? item.category.charAt(0).toUpperCase() + item.category.slice(1)
                              : '-'
                          ),
                          h('span', { class: 'text-muted-foreground' }, 'Location:'),
                          h('span', item.location || '-'),
                        ]
                      ),
                      item.barcode
                        ? h('div', { class: 'pt-2' }, [
                            h(BarcodePreview, { value: item.barcode, height: 35, fontSize: 10 }),
                          ])
                        : null,
                    ]),
                  ]),
              }
            ),
          ],
        }
      );
    },
  },
  {
    accessorKey: 'category',
    header: () => h('div', t('services.itHelp.stock.category')),
    cell: ({ row }) => {
      const category = row.getValue('category') as string;
      return h('div', category ? category.charAt(0).toUpperCase() + category.slice(1) : '-');
    },
  },
  {
    accessorKey: 'stock',
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
          class: 'text-center w-full hover:bg-muted font-bold px-0 gap-2',
        },
        () => [t('services.itHelp.stock.count'), h(ArrowUpDown, { class: 'h-4 w-4' })]
      );
    },
    cell: ({ row }) => h('div', { class: 'text-center font-bold' }, row.getValue('stock')),
  },
  {
    id: 'status',
    header: () => h('div', { class: 'text-center' }, t('common.status')),
    cell: ({ row }) => {
      const item = row.original;
      const status = getStockStatus(item);
      let badgeClass = 'bg-green-100 text-green-700';
      if (status === 'Low Stock') badgeClass = 'bg-orange-100 text-orange-700';
      if (status === 'Out of Stock') badgeClass = 'bg-red-100 text-red-700';

      return h(
        'div',
        { class: 'text-center' },
        h(
          Badge,
          {
            variant: 'secondary',
            class: badgeClass,
          },
          () => status
        )
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    header: () => h('div', { class: 'text-center' }, t('common.actions')),
    cell: ({ row }) => {
      const item = row.original;
      return h('div', { class: 'text-center flex items-center justify-center gap-1' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8',
            onClick: (e: Event) => {
              e.stopPropagation();
              handleEditStock(item);
            },
          },
          () => h(Edit2, { class: 'w-4 h-4' })
        ),
      ]);
    },
  },
];

const dateRange = ref({
  start: today(getLocalTimeZone()).subtract({ months: 1 }),
  end: today(getLocalTimeZone()),
}) as Ref<DateRange>;

const ticketStats = computed(() => {
  if (!tickets.value.length) {
    return {
      total: 0,
      open: 0,
      openCount: 0,
      inProgressCount: 0,
      openTrend: 0,
      avgResponse: 0,
      resolved: 0,
      resolvedTrend: 0,
    };
  }

  // Filter tickets for the selected date range
  const filteredTickets = tickets.value.filter((t) => {
    // Exclude Cancelled tickets first
    if (t.status === 'Cancelled') return false;

    if (!dateRange.value?.start || !dateRange.value?.end) return true;

    const ticketDate = new Date(t.createdAt);
    const start = dateRange.value.start.toDate(getLocalTimeZone());
    const end = dateRange.value.end.toDate(getLocalTimeZone());
    // Add 1 day to end date to include the full end day
    end.setDate(end.getDate() + 1);

    return ticketDate >= start && ticketDate < end;
  });

  const openTickets = filteredTickets.filter(
    (t) => t.status === 'Open' || t.status === 'In Progress'
  );
  const openCount = filteredTickets.filter((t) => t.status === 'Open').length;
  const inProgressCount = filteredTickets.filter((t) => t.status === 'In Progress').length;

  const resolvedTickets = filteredTickets.filter(
    (t) => t.status === 'Resolved' || t.status === 'Closed'
  );

  // For trends, we show total count in this period as per user request
  const createdInPeriod = filteredTickets.length;
  const resolvedInPeriod = resolvedTickets.length;

  let totalResolutionTime = 0;
  let minTimeMs = Infinity;

  resolvedTickets.forEach((t) => {
    const created = new Date(t.createdAt);
    const resolved = t.resolvedAt ? new Date(t.resolvedAt) : new Date(t.updatedAt);
    const diff = resolved.getTime() - created.getTime();
    totalResolutionTime += diff;
    if (diff < minTimeMs) {
      minTimeMs = diff;
    }
  });
  const avgTimeMs = resolvedTickets.length ? totalResolutionTime / resolvedTickets.length : 0;
  const avgTimeHours = (avgTimeMs / (1000 * 60 * 60)).toFixed(2);
  const bestTimeHours = minTimeMs !== Infinity ? (minTimeMs / (1000 * 60 * 60)).toFixed(2) : '0.00';

  return {
    total: filteredTickets.length,
    open: openTickets.length,
    openCount,
    inProgressCount,
    openTrend: createdInPeriod,
    resolved: resolvedTickets.length,
    resolvedTrend: resolvedInPeriod,
    avgResponse: avgTimeHours,
    bestResponse: bestTimeHours,
  };
});
const assetStats = computed(() => {
  if (!assetRequests.value.length) {
    return {
      total: 0,
      open: 0,
      openCount: 0,
      inProgressCount: 0,
      resolved: 0,
      avgResponse: '0.00',
      bestResponse: '0.00',
    };
  }

  // Filter asset requests for the selected date range
  const filtered = assetRequests.value.filter((t) => {
    // Exclude Cancelled tickets first
    if (t.status === 'Cancelled') return false;

    if (!dateRange.value?.start || !dateRange.value?.end) return true;

    const ticketDate = new Date(t.createdAt);
    const start = dateRange.value.start.toDate(getLocalTimeZone());
    const end = dateRange.value.end.toDate(getLocalTimeZone());
    // Add 1 day to end date to include the full end day
    end.setDate(end.getDate() + 1);

    return ticketDate >= start && ticketDate < end;
  });

  const openTickets = filtered.filter((t) => t.status === 'Open' || t.status === 'In Progress');
  const openCount = filtered.filter((t) => t.status === 'Open').length;
  const inProgressCount = filtered.filter((t) => t.status === 'In Progress').length;

  const resolvedTickets = filtered.filter((t) => t.status === 'Resolved' || t.status === 'Closed');

  let totalResolutionTime = 0;
  let minTimeMs = Infinity;

  resolvedTickets.forEach((t) => {
    const created = new Date(t.createdAt);
    const resolved = t.resolvedAt ? new Date(t.resolvedAt) : new Date(t.updatedAt);
    const diff = resolved.getTime() - created.getTime();
    totalResolutionTime += diff;
    if (diff < minTimeMs) {
      minTimeMs = diff;
    }
  });
  const avgTimeMs = resolvedTickets.length ? totalResolutionTime / resolvedTickets.length : 0;
  const avgTimeHours = (avgTimeMs / (1000 * 60 * 60)).toFixed(2);
  const bestTimeHours = minTimeMs !== Infinity ? (minTimeMs / (1000 * 60 * 60)).toFixed(2) : '0.00';

  return {
    total: filtered.length,
    open: openTickets.length,
    openCount,
    inProgressCount,
    resolved: resolvedTickets.length,
    avgResponse: avgTimeHours,
    bestResponse: bestTimeHours,
  };
});

const stockStats = computed(() => {
  if (!itStock.value.length) {
    return {
      totalItems: 0,
      totalStock: 0,
      lowStock: 0,
      outOfStock: 0,
      alerts: 0,
    };
  }
  const totalItems = itStock.value.length;
  const totalStock = itStock.value.reduce((acc, item) => acc + (item.stock || 0), 0);
  const lowStock = itStock.value.filter((item) => getStockStatus(item) === 'Low Stock').length;
  const outOfStock = itStock.value.filter((item) => getStockStatus(item) === 'Out of Stock').length;
  return {
    totalItems,
    totalStock,
    lowStock,
    outOfStock,
    alerts: lowStock + outOfStock,
  };
});

const loadITAssets = async () => {
  loadingStock.value = true;
  try {
    itStock.value = await itAssetsApi.getAll();
  } catch (error) {
    console.error('Failed to load IT assets:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    loadingStock.value = false;
  }
};

const loadTickets = async () => {
  loadingTickets.value = true;
  try {
    tickets.value = await itTicketsApi.getAll();
  } catch (error) {
    console.error('Failed to load tickets:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    loadingTickets.value = false;
  }
};

const handleStockSuccess = () => {
  isStockModalOpen.value = false;
  loadITAssets();
  toast.success(t('services.itHelp.stock.saveSuccess'));
};

const handleTicketSuccess = () => {
  isTicketModalOpen.value = false;
  loadTickets();
  toast.success(t('services.itHelp.request.saveSuccess') || 'Ticket submitted successfully');
};

const getStockStatus = (item: ITAsset) => {
  if (item.stock <= 0) return 'Out of Stock';
  if (item.stock <= (item.minStock || 0)) return 'Low Stock';
  return 'In Stock';
};

// Pagination State (for tickets)
const currentPage = ref(1);
const itemsPerPage = ref(5);
const pageSizeOptions = [5, 10, 20, 50];

// Computed
const paginatedTickets = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return tickets.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(tickets.value.length / itemsPerPage.value));

const startItemIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value + 1);
const endItemIndex = computed(() =>
  Math.min(currentPage.value * itemsPerPage.value, tickets.value.length)
);

// Methods
const handlePageChange = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const handleAddStock = () => {
  editingStockItem.value = null;
  isStockModalOpen.value = true;
};

const handleEditStock = (item: ITAsset) => {
  editingStockItem.value = { ...item };
  isStockModalOpen.value = true;
};

const handleDeleteStock = (item: ITAsset | null) => {
  if (!item) return;
  stockItemToDelete.value = item;
  isStockDeleteConfirmOpen.value = true;
};

const confirmDeleteStock = async () => {
  if (!stockItemToDelete.value) return;

  try {
    await itAssetsApi.delete(stockItemToDelete.value.id);
    toast.success(t('common.success'), {
      description: t('services.itHelp.stock.deleteSuccess') || 'Item deleted successfully',
    });
    loadITAssets();
  } catch (error) {
    console.error('Failed to delete stock item:', error);
    toast.error(t('common.error'), {
      description: 'Failed to delete item',
    });
  } finally {
    isStockDeleteConfirmOpen.value = false;
    stockItemToDelete.value = null;
  }
};

const handleUploadSuccess = () => {
  loadBooks();
};

onMounted(() => {
  loadBooks();
  loadCategories();
  loadTickets();
  if (isITDepartment.value) {
    loadITAssets();
  }

  // Real-time Listeners
  socketService.on('ticket:created', loadTickets);
  socketService.on('ticket:updated', (updatedTicket: ITTicket) => {
    onTicketUpdated(updatedTicket);
  });
  socketService.on('ticket:deleted', loadTickets);
  socketService.on('ticket:commented', () => {
    // Refresh the list to ensure comment counts/info are up to date
    loadTickets();
  });
});

onUnmounted(() => {
  socketService.off('ticket:created', loadTickets);
  socketService.off('ticket:updated');
  socketService.off('ticket:deleted', loadTickets);
  socketService.off('ticket:commented');
});

const isITDepartment = computed(() => {
  if (isAdmin.value) return true;
  const userDept = authStore.user?.department;
  // Check against both English and Thai values to ensure it works regardless of current locale
  return userDept === 'Information Technology' || userDept === 'เทคโนโลยีสารสนเทศ (IT)';
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Open':
      return 'bg-blue-100 text-blue-800';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'Pending':
      return 'bg-orange-100 text-orange-800';
    case 'Resolved':
      return 'bg-green-100 text-green-800';
    case 'Closed':
      return 'bg-gray-100 text-gray-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

const getPriorityIconStyles = (priority: string) => {
  switch (priority) {
    case 'Critical':
      return 'bg-red-50 text-red-600 border-red-100/50 group-hover:bg-red-100 group-hover:border-red-200';
    case 'High':
      return 'bg-orange-50 text-orange-600 border-orange-100/50 group-hover:bg-orange-100 group-hover:border-orange-200';
    case 'Medium':
      return 'bg-blue-50 text-blue-600 border-blue-100/50 group-hover:bg-blue-100 group-hover:border-blue-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100/50 group-hover:bg-slate-100 group-hover:border-slate-200';
  }
};

// eBook Functions
async function loadCategories() {
  loadingCategories.value = true;
  try {
    ebookCategories.value = await knowledgeBooksApi.getCategories();
  } catch (error) {
    console.error('Failed to load categories:', error);
  } finally {
    loadingCategories.value = false;
  }
}

async function loadBooks() {
  loadingBooks.value = true;
  try {
    books.value = await knowledgeBooksApi.getAll({
      category: selectedCategory.value === 'ALL' ? undefined : selectedCategory.value || undefined,
      search: searchQuery.value || undefined,
    });
  } catch (error) {
    console.error('Failed to load books:', error);
  } finally {
    loadingBooks.value = false;
  }
}

// Watch global search to reload books
watch(searchQuery, () => {
  if (activeTab.value === 'kb') {
    loadBooks();
  }
});

// Also reload books when switching back to KB tab
watch(activeTab, (newTab) => {
  if (newTab === 'kb') {
    loadBooks();
  }
});

function handleViewBook(book: KnowledgeBook) {
  if (book.fileType !== 'pdf' && book.fileType !== 'pptx') {
    toast.info(t('services.itHelp.kb.pptxDirectDownload'));
    handleDownloadBook(book);
    return;
  }
  selectedBook.value = book;
  isViewerModalOpen.value = true;
}

async function handleDownloadBook(book: KnowledgeBook) {
  const link = document.createElement('a');
  link.href = knowledgeBooksApi.getDownloadUrl(book.id);
  link.download = book.fileName;
  link.click();

  // Increment download count locally
  const bookIndex = books.value.findIndex((b) => b.id === book.id);
  if (bookIndex !== -1) {
    books.value[bookIndex].downloads++;
  }
}

function onViewTracked(bookId: string) {
  const bookIndex = books.value.findIndex((b) => b.id === bookId);
  if (bookIndex !== -1) {
    books.value[bookIndex].views++;
  }
}

async function handleDeleteBook(book: KnowledgeBook) {
  bookToDelete.value = book;
  isDeleteConfirmOpen.value = true;
}

async function confirmDelete() {
  if (!bookToDelete.value) return;

  try {
    await knowledgeBooksApi.delete(bookToDelete.value.id);
    await loadBooks();
    // Use a toast or alert for success
    toast.success('eBook deleted successfully');
  } catch (error) {
    console.error('Failed to delete book:', error);
    toast.error('Failed to delete eBook');
  } finally {
    isDeleteConfirmOpen.value = false;
    bookToDelete.value = null;
  }
}

const filteredBooks = computed(() => {
  return books.value;
});

const categories = computed(() => {
  return ebookCategories.value;
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <Tabs v-model="activeTab" class="w-full space-y-6">
      <div class="mb-2">
        <!-- Tabs List would normally go here, but this design uses a different approach -->
      </div>

      <!-- Main Content Tabs -->

      <!-- Overview Tab -->
      <TabsContent value="overview" class="space-y-6">
        <!-- Main Stats Summary -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card class="bg-gradient-to-br from-white to-slate-50 border-slate-200">
            <CardContent class="p-6">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Total Tickets
                </p>
                <div class="p-2 bg-blue-50 rounded-lg">
                  <Ticket class="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div class="flex items-baseline gap-2">
                <h4 class="text-3xl font-bold text-slate-900">{{ ticketStats.total }}</h4>
                <p class="text-xs text-muted-foreground">tickets logged</p>
              </div>
            </CardContent>
          </Card>

          <Card class="bg-gradient-to-br from-white to-blue-50/20 border-blue-100">
            <CardContent class="p-6">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-blue-600 uppercase tracking-wider">
                  Active Tasks
                </p>
                <div class="p-2 bg-blue-100/50 rounded-lg">
                  <Clock class="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div class="flex items-baseline gap-2">
                <h4 class="text-3xl font-bold text-blue-700">
                  {{ ticketStats.openCount + ticketStats.inProgressCount }}
                </h4>
                <p class="text-xs text-blue-600/70">pending response</p>
              </div>
            </CardContent>
          </Card>

          <Card class="bg-gradient-to-br from-white to-green-50/20 border-green-100">
            <CardContent class="p-6">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-green-600 uppercase tracking-wider">
                  Successfully Resolved
                </p>
                <div class="p-2 bg-green-100/50 rounded-lg">
                  <CheckCircle2 class="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div class="flex items-baseline gap-2">
                <h4 class="text-3xl font-bold text-green-700">{{ ticketStats.resolved }}</h4>
                <p class="text-xs text-green-600/70">issues fixed</p>
              </div>
            </CardContent>
          </Card>

          <Card class="bg-gradient-to-br from-white to-primary/5 border-primary/10">
            <CardContent class="p-6">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-primary uppercase tracking-wider">
                  SLA Efficiency
                </p>
                <div class="p-2 bg-primary/10 rounded-lg">
                  <Zap class="w-5 h-5 text-primary" />
                </div>
              </div>
              <div class="flex items-baseline gap-2">
                <h4 class="text-3xl font-bold text-primary">{{ ticketStats.bestResponse }}h</h4>
                <p class="text-xs text-primary/70">fastest resolution</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- System & Service Management Status -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card class="border-slate-200">
            <CardHeader class="pb-2">
              <CardTitle class="text-lg font-bold flex items-center gap-2">
                <ClipboardList class="w-5 h-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-3 pb-6">
              <Button
                variant="outline"
                class="h-16 justify-start gap-4 border-2 border-primary/10 hover:border-primary/30 hover:bg-primary/5 group"
                @click="isTicketModalOpen = true"
              >
                <div
                  class="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors"
                >
                  <Plus class="w-5 h-5 text-primary" />
                </div>
                <div class="text-left">
                  <div class="text-sm font-bold">New Repair Ticket</div>
                  <div class="text-[0.625rem] text-muted-foreground">Report technical issues</div>
                </div>
              </Button>
              <Button
                variant="outline"
                class="h-16 justify-start gap-4 border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 group"
                @click="isAssetModalOpen = true"
              >
                <div class="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                  <Monitor class="w-5 h-5 text-slate-600" />
                </div>
                <div class="text-left">
                  <div class="text-sm font-bold">Request Equipment</div>
                  <div class="text-[0.625rem] text-muted-foreground">
                    Order hardware or software
                  </div>
                </div>
              </Button>
              <Button
                v-if="isITDepartment"
                variant="outline"
                class="h-16 justify-start gap-4 border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 group"
                @click="activeTab = 'stock'"
              >
                <div class="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                  <Package class="w-5 h-5 text-slate-600" />
                </div>
                <div class="text-left">
                  <div class="text-sm font-bold">Inventory Management</div>
                  <div class="text-[0.625rem] text-muted-foreground">Manage IT assets stock</div>
                </div>
              </Button>
              <Button
                variant="outline"
                class="h-16 justify-start gap-4 border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 group"
                @click="activeTab = 'kb'"
              >
                <div class="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                  <BookOpen class="w-5 h-5 text-slate-600" />
                </div>
                <div class="text-left">
                  <div class="text-sm font-bold">Help Documents</div>
                  <div class="text-[0.625rem] text-muted-foreground">Manuals & Guides</div>
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card class="border-slate-200 overflow-hidden">
            <CardHeader class="pb-2 border-b bg-slate-50/50">
              <div class="flex items-center justify-between">
                <CardTitle class="text-sm font-bold uppercase tracking-wider text-slate-500"
                  >Service Performance</CardTitle
                >
                <div
                  class="px-2 py-0.5 bg-green-100 text-green-700 text-[0.625rem] font-bold rounded-full uppercase"
                >
                  All Systems Operating
                </div>
              </div>
            </CardHeader>
            <CardContent class="p-0">
              <div class="divide-y">
                <div
                  class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <div>
                      <div class="text-sm font-medium">Average Resolution Time</div>
                      <div class="text-xs text-muted-foreground">
                        Performance across all categories
                      </div>
                    </div>
                  </div>
                  <div class="text-lg font-bold text-slate-700">{{ ticketStats.avgResponse }}h</div>
                </div>
                <div
                  class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div>
                      <div class="text-sm font-medium">Active User Inquiries</div>
                      <div class="text-xs text-muted-foreground">Tickets waiting for IT action</div>
                    </div>
                  </div>
                  <div class="text-lg font-bold text-slate-700">{{ ticketStats.openCount }}</div>
                </div>
                <div
                  class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <div>
                      <div class="text-sm font-medium">Monthly Tickets Growth</div>
                      <div class="text-xs text-muted-foreground">
                        Based on current period activity
                      </div>
                    </div>
                  </div>
                  <div class="text-sm font-bold text-slate-700">
                    +{{ ticketStats.total }} this period
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- Knowledge Base Tab -->
      <TabsContent value="kb" class="space-y-4">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold">{{ t('services.itHelp.kb.title') }}</h3>
            <p class="text-sm text-muted-foreground">{{ t('services.itHelp.kb.subtitle') }}</p>
          </div>
          <div class="flex items-center gap-3">
            <Select v-model="selectedCategory" @update:model-value="loadBooks">
              <SelectTrigger class="w-[180px] h-9">
                <SelectValue :placeholder="t('services.itHelp.kb.allCategories')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{{ t('services.itHelp.kb.allCategories') }}</SelectItem>
                <SelectItem v-for="cat in categories" :key="cat" :value="cat">
                  {{ cat }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              v-if="isITDepartment"
              size="sm"
              @click="isUploadModalOpen = true"
              class="gap-2 h-9 whitespace-nowrap bg-primary text-white hover:bg-primary/90 shadow-sm font-bold"
            >
              <Upload class="w-4 h-4" />
              {{ t('services.itHelp.kb.uploadBtn') }}
            </Button>
          </div>
        </div>

        <!-- eBook Grid -->
        <div v-if="loadingBooks" class="flex justify-center py-12">
          <Spinner class="h-8 w-8 text-primary" />
        </div>

        <div v-else-if="filteredBooks.length === 0" class="text-center py-12">
          <BookOpen class="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h3 class="text-lg font-medium mb-2">{{ t('services.itHelp.kb.noBooks') }}</h3>
          <p class="text-muted-foreground mb-4">
            {{
              searchQuery || selectedCategory
                ? t('services.itHelp.kb.adjustFilters')
                : t('services.itHelp.kb.uploadFirst')
            }}
          </p>
          <Button
            v-if="isITDepartment"
            variant="outline"
            @click="isUploadModalOpen = true"
            class="gap-2"
          >
            <Upload class="w-4 h-4" />
            {{ t('services.itHelp.kb.uploadBtn') }}
          </Button>
        </div>

        <div v-else class="relative px-12">
          <Carousel
            class="w-full"
            :opts="{
              align: 'start',
              loop: true,
            }"
          >
            <CarouselContent class="-ml-4">
              <CarouselItem
                v-for="book in filteredBooks"
                :key="book.id"
                class="pl-4 md:basis-1/2 lg:basis-1/3"
              >
                <KnowledgeBookCard
                  :book="book"
                  :can-delete="isITDepartment"
                  @view="handleViewBook(book)"
                  @download="handleDownloadBook(book)"
                  @delete="handleDeleteBook(book)"
                  @edit="handleEditBook(book)"
                />
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious class="-left-12 h-10 w-10" />
            <CarouselNext class="-right-12 h-10 w-10" />
          </Carousel>
        </div>
      </TabsContent>

      <!-- IT Stock Tab (Admin/IT Only) -->
      <TabsContent v-if="isITDepartment" value="stock" class="space-y-4">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-muted-foreground">Inventory Overview</h3>
            <div class="flex items-center gap-3">
              <!-- Search Popover -->
              <Popover>
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    size="icon"
                    class="h-9 w-9 text-muted-foreground hover:text-primary bg-white/50 hover:bg-white shadow-sm border-slate-200"
                  >
                    <Search class="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-80 p-2" align="start">
                  <div class="flex items-center gap-2">
                    <Search class="h-4 w-4 text-muted-foreground" />
                    <Input
                      v-model="searchQuery"
                      :placeholder="t('services.itHelp.searchPlaceholder')"
                      class="h-8 border-none focus-visible:ring-0 shadow-none"
                      auto-focus
                    />
                  </div>
                </PopoverContent>
              </Popover>

              <!-- Date Picker -->
              <DateRangePicker
                v-model="dateRange"
                class="h-9 w-[280px] justify-center text-foreground font-normal bg-white/50 hover:bg-white shadow-sm transition-all border-slate-200 text-xs"
              />
            </div>
          </div>

          <!-- Stats Section -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <CardContent class="flex items-center justify-between p-3">
                <div
                  class="flex-1 flex flex-col items-center justify-center border-r border-border pr-2"
                >
                  <div
                    class="text-[0.7rem] font-medium text-muted-foreground mb-1 uppercase tracking-tight"
                  >
                    Total Hardware
                  </div>
                  <div class="text-xl font-bold">{{ stockStats.totalItems }}</div>
                </div>
                <div class="flex-1 flex flex-col items-center justify-center pl-2">
                  <div
                    class="text-[0.7rem] font-medium text-primary flex items-center gap-1 mb-1 uppercase tracking-tight"
                  >
                    <Monitor class="w-3 h-3" /> Total Units
                  </div>
                  <div class="text-xl font-bold">{{ stockStats.totalStock }}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent class="flex items-center justify-between p-3">
                <div
                  class="flex-1 flex flex-col items-center justify-center border-r border-border pr-2"
                >
                  <div
                    class="text-[0.7rem] font-medium text-orange-600 mb-1 uppercase tracking-tight"
                  >
                    Low Stock
                  </div>
                  <div class="text-xl font-bold text-orange-600">{{ stockStats.lowStock }}</div>
                </div>
                <div class="flex-1 flex flex-col items-center justify-center pl-2">
                  <div class="text-[0.7rem] font-medium text-red-600 mb-1 uppercase tracking-tight">
                    Out of Stock
                  </div>
                  <div class="text-xl font-bold text-red-600">{{ stockStats.outOfStock }}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent class="flex items-center justify-between p-3 bg-red-50/50">
                <div class="flex-1 flex flex-col items-center justify-center">
                  <div
                    class="text-[0.7rem] font-medium text-red-700 flex items-center gap-1 mb-1 uppercase tracking-tight"
                  >
                    <AlertTriangle class="w-3 h-3" /> Stock Alerts
                  </div>
                  <div class="text-2xl font-black text-red-700 line-height-1">
                    {{ stockStats.alerts }}
                  </div>
                  <div
                    class="text-[0.55rem] text-red-600/70 mt-0.5 uppercase tracking-wider font-bold"
                  >
                    Items needing attention
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <div class="space-y-1">
              <CardTitle>{{ t('services.itHelp.stock.title') }}</CardTitle>
              <CardDescription>{{ t('services.itHelp.stock.subtitle') }}</CardDescription>
            </div>
            <div class="flex items-center gap-3">
              <Select v-model="stockCategoryFilter">
                <SelectTrigger class="w-[180px] h-9">
                  <SelectValue :placeholder="t('services.itHelp.stock.category') || 'Category'" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{{ t('services.itHelp.kb.allCategories') }}</SelectItem>
                  <SelectItem v-for="cat in stockCategories" :key="cat" :value="cat">
                    {{ cat.charAt(0).toUpperCase() + cat.slice(1) }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                class="gap-2 h-9 font-bold bg-primary text-white hover:bg-primary/90 shadow-sm"
                @click="handleAddStock"
              >
                <Plus class="w-4 h-4" /> {{ t('services.itHelp.stock.addItem') }}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="loadingStock" class="flex justify-center py-12">
              <Spinner class="h-8 w-8 text-primary" />
            </div>
            <DataTable v-else :columns="itAssetColumns" :data="filteredITStock" />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent v-if="isITDepartment" value="analytics" class="space-y-4">
        <PrinterUsageAnalytics />
      </TabsContent>

      <!-- Assets Tab -->
      <TabsContent value="asset-requests" class="space-y-4">
        <!-- Assets Overview Stats (Always shown for IT Department) -->
        <template v-if="isITDepartment">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-muted-foreground">Assets Overview</h3>
            <div class="flex items-center gap-3">
              <!-- Search Popover -->
              <Popover>
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    size="icon"
                    class="h-9 w-9 text-muted-foreground hover:text-primary bg-white/50 hover:bg-white shadow-sm border-slate-200"
                  >
                    <Search class="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-80 p-2" align="start">
                  <div class="flex items-center gap-2">
                    <Search class="h-4 w-4 text-muted-foreground" />
                    <Input
                      v-model="searchQuery"
                      :placeholder="t('services.itHelp.searchPlaceholder')"
                      class="h-8 border-none focus-visible:ring-0 shadow-none"
                      auto-focus
                    />
                  </div>
                </PopoverContent>
              </Popover>

              <!-- Date Picker -->
              <DateRangePicker
                v-model="dateRange"
                class="h-9 w-[280px] justify-center text-foreground font-normal bg-white/50 hover:bg-white shadow-sm transition-all border-slate-200 text-xs"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Card>
              <CardContent class="p-3 text-center">
                <p class="text-[0.7rem] font-medium text-muted-foreground uppercase tracking-tight">
                  Total
                </p>
                <h4 class="text-xl font-bold">{{ assetStats.total }}</h4>
              </CardContent>
            </Card>
            <Card>
              <CardContent class="p-3 text-center">
                <p class="text-[0.7rem] font-medium text-blue-600 uppercase tracking-tight">Open</p>
                <h4 class="text-xl font-bold text-blue-600">{{ assetStats.openCount }}</h4>
              </CardContent>
            </Card>
            <Card class="border-l-4 border-l-primary overflow-hidden">
              <CardContent class="p-3 text-center">
                <p
                  class="text-[0.7rem] font-medium text-primary uppercase tracking-tight flex items-center justify-center gap-1"
                >
                  <Clock class="w-3 h-3" /> In Progress
                </p>
                <h4 class="text-xl font-bold">{{ assetStats.inProgressCount }}</h4>
              </CardContent>
            </Card>
            <Card>
              <CardContent class="p-3 text-center bg-green-50/30">
                <p
                  class="text-[0.7rem] font-medium text-green-600 uppercase tracking-tight flex items-center justify-center gap-1"
                >
                  <CheckCircle2 class="w-3 h-3" /> Resolved
                </p>
                <h4 class="text-xl font-bold text-green-600">{{ assetStats.resolved }}</h4>
              </CardContent>
            </Card>
            <Card class="col-span-1">
              <CardContent class="p-3 text-center">
                <p class="text-[0.7rem] font-medium text-muted-foreground uppercase tracking-tight">
                  Avg Time
                </p>
                <h4 class="text-lg font-bold">{{ assetStats.avgResponse }}h</h4>
              </CardContent>
            </Card>
            <Card class="col-span-1">
              <CardContent class="p-3 text-center bg-primary/5">
                <p
                  class="text-[0.7rem] font-medium text-primary uppercase tracking-tight flex items-center justify-center gap-1"
                >
                  <Zap class="w-3 h-3 font-bold" /> Best
                </p>
                <h4 class="text-lg font-bold text-primary">{{ assetStats.bestResponse }}h</h4>
              </CardContent>
            </Card>
          </div>
        </template>

        <!-- Asset Requests List -->
        <template v-if="assetRequests.length > 0">
          <Card>
            <CardHeader
              class="pb-3 border-b border-muted flex flex-row items-center justify-between"
            >
              <div class="space-y-1">
                <CardTitle class="text-xl font-bold">{{
                  t('services.itHelp.tabs.assetRequests')
                }}</CardTitle>
                <CardDescription> Track your equipment and hardware requests. </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                class="h-9 border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all font-bold"
                @click="isAssetModalOpen = true"
              >
                <Package class="w-4 h-4 mr-2" />
                {{ t('services.itHelp.requestEquipment') }}
              </Button>
            </CardHeader>
            <CardContent class="p-0">
              <div class="divide-y divide-border/50">
                <div
                  v-for="ticket in assetRequests"
                  :key="ticket.id"
                  class="p-4 hover:bg-muted/30 transition-colors group flex items-center gap-4"
                >
                  <!-- Icon -->
                  <div
                    class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border bg-slate-50 text-slate-600 border-slate-100"
                  >
                    <Monitor class="w-5 h-5" />
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1.5 w-full">
                      <span
                        class="font-semibold text-base text-foreground truncate block hover:underline cursor-pointer"
                        @click="handleTicketClick(ticket)"
                      >
                        {{ ticket.title }}
                      </span>
                    </div>
                    <div class="flex items-center gap-3 text-xs text-muted-foreground">
                      <div class="flex items-center gap-1.5">
                        <span class="text-muted-foreground/70">{{
                          ticket.category || 'Asset'
                        }}</span>
                        <span v-if="ticket.assetId" class="text-muted-foreground/40">&gt;</span>
                        <span v-if="ticket.assetId"> {{ ticket.quantity }} items</span>
                      </div>
                      <span class="text-muted-foreground/40">&bull;</span>
                      <span class="flex items-center gap-1.5">
                        <Clock class="w-3 h-3 text-muted-foreground/70" />
                        {{ formatTicketDate(ticket.createdAt) }}
                      </span>
                    </div>
                  </div>

                  <!-- Right Side: Ticket No & Status -->
                  <div class="flex items-center gap-3 flex-shrink-0 pl-4">
                    <Badge
                      variant="secondary"
                      class="text-[0.625rem] h-5 px-1.5 font-mono font-medium text-muted-foreground bg-muted border border-border rounded pointer-events-none"
                    >
                      {{ ticket.ticketNo }}
                    </Badge>
                    <Badge
                      :class="[
                        getStatusColor(ticket.status),
                        'px-2.5 py-0.5 text-[0.625rem] font-bold border-0 rounded uppercase tracking-wide pointer-events-none',
                      ]"
                    >
                      {{ ticket.status }}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </template>
        <Card v-else>
          <CardContent class="pt-6">
            <div class="text-center py-10 text-muted-foreground">
              <Monitor class="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 class="text-lg font-medium">{{ t('services.itHelp.assets.noAssets') }}</h3>
              <p class="mb-6">{{ t('services.itHelp.assets.noAssetsDesc') }}</p>
              <Button variant="outline" class="gap-2" @click="isAssetModalOpen = true">
                <Plus class="w-4 h-4" />
                {{ t('services.itHelp.assets.requestNew') }}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="tickets" class="space-y-4">
        <div v-if="loadingTickets" class="flex justify-center py-12">
          <Spinner class="h-8 w-8 text-primary" />
        </div>
        <template v-else-if="tickets.length > 0">
          <!-- Stats Header & Filter -->
          <template v-if="isITDepartment">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-muted-foreground">
                {{ t('services.itHelp.stats.overview') }}
              </h3>
              <div class="flex items-center gap-3">
                <!-- Search Popover -->
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      size="icon"
                      class="h-9 w-9 text-muted-foreground hover:text-primary bg-white/50 hover:bg-white shadow-sm border-slate-200"
                    >
                      <Search class="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-80 p-2" align="start">
                    <div class="flex items-center gap-2">
                      <Search class="h-4 w-4 text-muted-foreground" />
                      <Input
                        v-model="searchQuery"
                        :placeholder="t('services.itHelp.searchPlaceholder')"
                        class="h-8 border-none focus-visible:ring-0 shadow-none"
                        auto-focus
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                <!-- Date Picker -->
                <DateRangePicker
                  v-model="dateRange"
                  class="h-9 w-[280px] justify-center text-foreground font-normal bg-white/50 hover:bg-white shadow-sm transition-all border-slate-200 text-xs"
                />
              </div>
            </div>

            <!-- Stats Section -->
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <Card>
                <CardContent class="p-3 text-center">
                  <p
                    class="text-[0.7rem] font-medium text-muted-foreground uppercase tracking-tight"
                  >
                    Total Tickets
                  </p>
                  <h4 class="text-xl font-bold">{{ ticketStats.total }}</h4>
                </CardContent>
              </Card>
              <Card class="border-l-4 border-l-blue-600 overflow-hidden">
                <CardContent class="p-3 text-center">
                  <p class="text-[0.7rem] font-medium text-blue-600 uppercase tracking-tight">
                    Open
                  </p>
                  <h4 class="text-xl font-bold text-blue-600">{{ ticketStats.openCount }}</h4>
                </CardContent>
              </Card>
              <Card class="border-l-4 border-l-primary overflow-hidden">
                <CardContent class="p-3 text-center">
                  <p class="text-[0.7rem] font-medium text-primary uppercase tracking-tight">
                    In Progress
                  </p>
                  <h4 class="text-xl font-bold text-primary">{{ ticketStats.inProgressCount }}</h4>
                </CardContent>
              </Card>

              <Card>
                <CardContent class="p-3 text-center bg-green-50/30">
                  <p
                    class="text-[0.7rem] font-medium text-green-600 uppercase tracking-tight flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 class="w-3 h-3" /> Resolved
                  </p>
                  <h4 class="text-xl font-bold text-green-600">{{ ticketStats.resolved }}</h4>
                </CardContent>
              </Card>

              <Card>
                <CardContent class="p-3 text-center">
                  <p
                    class="text-[0.7rem] font-medium text-muted-foreground uppercase tracking-tight"
                  >
                    Avg Time
                  </p>
                  <h4 class="text-lg font-bold">{{ ticketStats.avgResponse }}h</h4>
                </CardContent>
              </Card>

              <Card class="col-span-1 bg-primary/5 border-primary/20">
                <CardContent class="p-3 text-center">
                  <p
                    class="text-[0.7rem] font-medium text-primary uppercase tracking-tight flex items-center justify-center gap-1"
                  >
                    <Zap class="w-3 h-3 font-bold" /> Best
                  </p>
                  <h4 class="text-lg font-bold text-primary">{{ ticketStats.bestResponse }}h</h4>
                </CardContent>
              </Card>
            </div>
          </template>

          <Card>
            <CardHeader
              class="pb-3 border-b border-muted flex flex-row items-center justify-between"
            >
              <div class="space-y-1">
                <CardTitle class="text-xl font-bold">{{
                  t('services.itHelp.tickets.title')
                }}</CardTitle>
                <CardDescription>{{ t('services.itHelp.tickets.subtitle') }}</CardDescription>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  class="h-9 gap-2 border-primary/20 text-primary hover:bg-primary/5 hidden md:flex"
                  @click="exportTicketsToPDF"
                >
                  <FileText class="w-4 h-4" /> PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="h-9 border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all font-bold"
                  @click="isTicketModalOpen = true"
                >
                  <Plus class="w-4 h-4 mr-2" />
                  {{ t('services.itHelp.newTicket') }}
                </Button>
              </div>
            </CardHeader>
            <CardContent class="p-0">
              <div class="divide-y divide-border/50">
                <div
                  v-for="ticket in paginatedTickets"
                  :key="ticket.id"
                  class="p-4 hover:bg-muted/30 transition-colors group flex items-center gap-4"
                >
                  <!-- Icon -->
                  <div
                    :class="[
                      'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border transition-colors duration-300',
                      getPriorityIconStyles(ticket.priority),
                    ]"
                  >
                    <Ticket class="w-5 h-5" />
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1.5 w-full">
                      <span
                        class="font-semibold text-base text-foreground truncate block hover:underline cursor-pointer"
                        @click="handleTicketClick(ticket)"
                      >
                        {{ ticket.title }}
                      </span>
                    </div>
                    <div class="flex items-center gap-3 text-xs text-muted-foreground">
                      <div class="flex items-center gap-1.5">
                        <span class="text-muted-foreground/70">{{
                          ticket.location || 'Unknown'
                        }}</span>
                        <span class="text-muted-foreground/40">&gt;</span>
                        <span>{{ ticket.category }}</span>
                      </div>
                      <span class="text-muted-foreground/40">&bull;</span>
                      <span class="flex items-center gap-1.5">
                        <Clock class="w-3 h-3 text-muted-foreground/70" />
                        {{ formatTicketDate(ticket.createdAt) }}
                      </span>
                    </div>
                  </div>

                  <!-- Right Side: Ticket No & Status -->
                  <div class="flex items-center gap-3 flex-shrink-0 pl-4">
                    <div v-if="getSLAStatus(ticket)" class="hidden lg:block">
                      <Badge
                        variant="outline"
                        :class="[
                          getSLAStatus(ticket)?.color,
                          'px-1.5 py-0.5 text-[0.625rem] font-medium border-0 rounded uppercase tracking-wide pointer-events-none',
                        ]"
                      >
                        SLA: {{ getSLAStatus(ticket)?.label }}
                      </Badge>
                    </div>
                    <Badge
                      variant="secondary"
                      class="text-[0.625rem] h-5 px-1.5 font-mono font-medium text-muted-foreground bg-muted border border-border rounded pointer-events-none"
                    >
                      {{ ticket.ticketNo }}
                    </Badge>
                    <Badge
                      :class="[
                        getStatusColor(ticket.status),
                        'px-2.5 py-0.5 text-[0.625rem] font-bold border-0 rounded uppercase tracking-wide pointer-events-none',
                      ]"
                    >
                      {{ ticket.status }}
                    </Badge>
                  </div>
                </div>
              </div>

              <!-- Pagination Controls -->
              <div class="flex items-center justify-between p-4 border-t bg-muted/5">
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Rows per page:</span>
                  <Select
                    :model-value="itemsPerPage.toString()"
                    @update:model-value="(v) => (itemsPerPage = parseInt(v))"
                  >
                    <SelectTrigger class="h-8 w-[60px] bg-background">
                      <SelectValue :placeholder="itemsPerPage.toString()" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="size in pageSizeOptions"
                        :key="size"
                        :value="size.toString()"
                      >
                        {{ size }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                  <div>{{ startItemIndex }} - {{ endItemIndex }} of {{ tickets.length }}</div>
                  <div class="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      class="h-8 px-3 bg-background"
                      :disabled="currentPage === 1"
                      @click="handlePageChange(currentPage - 1)"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      class="h-8 px-3 bg-background"
                      :disabled="currentPage === totalPages"
                      @click="handlePageChange(currentPage + 1)"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </template>

        <!-- Empty State -->
        <Card v-else>
          <CardContent class="pt-6">
            <div class="text-center py-10 text-muted-foreground">
              <Ticket class="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 class="text-lg font-medium">{{ t('services.itHelp.tickets.noTickets') }}</h3>
              <p class="mb-6">{{ t('services.itHelp.tickets.noTicketsDesc') }}</p>
              <Button variant="outline" class="gap-2" @click="isTicketModalOpen = true">
                <Plus class="w-4 h-4" />
                {{ t('services.itHelp.request.createTicket') }}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <!-- Dialogs -->
    <Dialog v-model:open="isAssetModalOpen">
      <DialogContent class="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>{{ t('services.itHelp.request.title') }}</DialogTitle>
          <DialogDescription>{{ t('services.itHelp.request.subtitle') }}</DialogDescription>
        </DialogHeader>
        <AssetRequestForm @success="isAssetModalOpen = false" @cancel="isAssetModalOpen = false" />
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isTicketModalOpen">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{{ t('services.itHelp.newTicket') }}</DialogTitle>
          <DialogDescription>{{ t('services.itHelp.tickets.subtitle') }}</DialogDescription>
        </DialogHeader>
        <NewTicketForm @success="handleTicketSuccess" @cancel="isTicketModalOpen = false" />
      </DialogContent>
    </Dialog>

    <!-- IT Stock Dialog -->
    <Dialog v-model:open="isStockModalOpen">
      <DialogContent class="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>{{
            editingStockItem
              ? t('services.itHelp.stock.editItem')
              : t('services.itHelp.stock.addItem')
          }}</DialogTitle>
          <DialogDescription>{{ t('services.itHelp.stock.subtitle') }}</DialogDescription>
        </DialogHeader>
        <ITStockForm
          :initial-data="editingStockItem"
          @success="handleStockSuccess"
          @cancel="isStockModalOpen = false"
          @delete="handleDeleteStock(editingStockItem)"
        />
      </DialogContent>
    </Dialog>

    <!-- eBook Upload Modal -->
    <KnowledgeBookUpload v-model:open="isUploadModalOpen" @uploaded="handleUploadSuccess" />

    <!-- eBook Viewer Modal -->
    <KnowledgeBookViewer
      v-model:open="isViewerModalOpen"
      :book="selectedBook"
      @view-tracked="onViewTracked"
    />

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="isDeleteConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{
            t('common.areYouSure') || 'Are you absolutely sure?'
          }}</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete
            <b>{{ bookToDelete?.title }}</b>
            and remove its data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('common.cancel') || 'Cancel' }}</AlertDialogCancel>
          <AlertDialogAction @click="confirmDelete" class="bg-red-600 hover:bg-red-700">
            {{ t('common.delete') || 'Delete' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Stock Delete Confirmation Dialog -->
    <AlertDialog v-model:open="isStockDeleteConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('common.areYouSure') }}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <b>{{ stockItemToDelete?.name }}</b
            >? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="confirmDeleteStock" class="bg-red-600 hover:bg-red-700">
            {{ t('common.delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <TicketDetailModal
      v-model:open="isDetailModalOpen"
      :ticket="selectedTicket"
      @ticket-updated="onTicketUpdated"
    />
    <KnowledgeBookEdit
      v-model:open="isEditModalOpen"
      :book="selectedBook"
      @updated="onBookUpdated"
    />
  </div>
</template>
