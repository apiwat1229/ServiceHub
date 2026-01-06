<script setup lang="ts">
import AssetRequestForm from '@/components/helpdesk/AssetRequestForm.vue';
import BarcodePreview from '@/components/helpdesk/BarcodePreview.vue';
import NewTicketForm from '@/components/helpdesk/NewTicketForm.vue';
import PrinterUsageAnalytics from '@/components/helpdesk/PrinterUsageAnalytics.vue';
import KnowledgeBookCard from '@/components/knowledge-center/KnowledgeBookCard.vue';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { itAssetsApi, type ITAsset } from '@/services/it-assets';
import { itTicketsApi, type ITTicket } from '@/services/it-tickets';
import { knowledgeBooksApi, type KnowledgeBook } from '@/services/knowledge-books';
import { getLocalTimeZone, today } from '@internationalized/date';
import type { ColumnDef } from '@tanstack/vue-table';
import { format, formatDistanceToNowStrict, intervalToDuration } from 'date-fns';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Edit2,
  LayoutDashboard,
  Monitor,
  Package,
  Plus,
  Search,
  Ticket,
  Trash2,
  Upload,
  Zap,
} from 'lucide-vue-next';
import type { DateRange } from 'reka-ui';
import { computed, h, onMounted, ref, watch, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { toast } from 'vue-sonner';

import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const isDetailModalOpen = ref(false);
const selectedTicket = ref<ITTicket | null>(null);

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
        const ticket = await itTicketsApi.getById(newId);
        if (ticket) handleTicketClick(ticket);
      } catch (e) {
        console.error('Failed to load deep linked ticket', e);
      }
    }
  },
  { immediate: true }
);

const { t } = useI18n();
const authStore = useAuthStore();

// ... existing imports ...

const searchQuery = ref('');
const isAssetModalOpen = ref(false);
const isTicketModalOpen = ref(false);
const isStockModalOpen = ref(false);
const editingStockItem = ref<ITAsset | null>(null);

// eBook State
const isUploadModalOpen = ref(false);
const isViewerModalOpen = ref(false);
const selectedBook = ref<KnowledgeBook | null>(null);
const books = ref<KnowledgeBook[]>([]);
const loadingBooks = ref(false);
const selectedCategory = ref<string>('');
const ebookSearchQuery = ref('');
const ebookCategories = ref<string[]>([]);
const loadingCategories = ref(false);

// Delete Confirmation State
const isDeleteConfirmOpen = ref(false);
const bookToDelete = ref<KnowledgeBook | null>(null);

// IT Stock State
const itStock = ref<ITAsset[]>([]);
const loadingStock = ref(false);
const isStockDeleteConfirmOpen = ref(false);
const stockItemToDelete = ref<ITAsset | null>(null);

// Ticket State
const tickets = ref<ITTicket[]>([]);
const loadingTickets = ref(false);

const getImageUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:2530';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
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
                        { class: 'grid grid-cols-[80px_1fr] gap-x-2 gap-y-0.5 text-[11px]' },
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
    header: () => h('div', { class: 'text-center' }, t('services.itHelp.stock.count')),
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
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50',
            onClick: (e: Event) => {
              e.stopPropagation();
              handleDeleteStock(item);
            },
          },
          () => h(Trash2, { class: 'w-4 h-4' })
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
    const updated = new Date(t.updatedAt);
    const diff = updated.getTime() - created.getTime();
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

const handleDeleteStock = (item: ITAsset) => {
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
});

const isITDepartment = computed(() => {
  const userDept = authStore.user?.department;
  // Check against both English and Thai values to ensure it works regardless of current locale
  return userDept === 'Information Technology' || userDept === 'เทคโนโลยีสารสนเทศ (IT)';
});

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-yellow-100 text-yellow-800';
    case 'in progress':
      return 'bg-blue-100 text-blue-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
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
      search: ebookSearchQuery.value || undefined,
    });
  } catch (error) {
    console.error('Failed to load books:', error);
  } finally {
    loadingBooks.value = false;
  }
}

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
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">{{ t('services.itHelp.name') }}</h1>
        <p class="text-muted-foreground mt-1">
          {{ t('services.itHelp.subtitle') }}
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" class="gap-2" @click="isAssetModalOpen = true">
          <Package class="w-4 h-4" />
          {{ t('services.itHelp.requestEquipment') }}
        </Button>
        <Button class="gap-2" @click="isTicketModalOpen = true">
          <Plus class="w-4 h-4" />
          {{ t('services.itHelp.newTicket') }}
        </Button>
      </div>
    </div>

    <!-- Main Content Tabs -->
    <Tabs defaultValue="kb" class="w-full">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <TabsList class="bg-muted p-1 rounded-lg">
          <TabsTrigger
            value="kb"
            class="gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
          >
            <BookOpen class="w-4 h-4" /> {{ t('services.itHelp.tabs.kb') }}
          </TabsTrigger>
          <TabsTrigger
            v-if="isITDepartment"
            value="stock"
            class="gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
          >
            <Package class="w-4 h-4" /> {{ t('services.itHelp.tabs.stock') }}
          </TabsTrigger>
          <TabsTrigger
            v-if="isITDepartment"
            value="printer"
            class="gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
          >
            <LayoutDashboard class="w-4 h-4" /> {{ t('services.itHelp.tabs.printer') }}
          </TabsTrigger>
          <TabsTrigger
            value="assets"
            class="gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
          >
            <Monitor class="w-4 h-4" /> {{ t('services.itHelp.tabs.assetRequest') }}
          </TabsTrigger>
          <TabsTrigger
            value="tickets"
            class="gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
          >
            <Ticket class="w-4 h-4" /> {{ t('services.itHelp.tabs.myTickets') }}
          </TabsTrigger>
        </TabsList>

        <div class="relative w-full sm:w-64">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            :placeholder="t('services.itHelp.searchPlaceholder')"
            class="pl-9"
            v-model="searchQuery"
          />
        </div>
      </div>

      <!-- Knowledge Base Tab -->
      <TabsContent value="kb" class="space-y-4">
        <!-- Header with Upload Button -->
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">{{ t('services.itHelp.kb.title') }}</h3>
            <p class="text-sm text-muted-foreground">{{ t('services.itHelp.kb.subtitle') }}</p>
          </div>
          <Button v-if="isITDepartment" @click="isUploadModalOpen = true" class="gap-2">
            <Upload class="w-4 h-4" />
            {{ t('services.itHelp.kb.uploadBtn') }}
          </Button>
        </div>

        <!-- Filters -->
        <div class="flex gap-4">
          <div class="relative flex-1">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              :placeholder="t('services.itHelp.kb.searchPlaceholder')"
              class="pl-9"
              v-model="ebookSearchQuery"
              @input="loadBooks"
            />
          </div>
          <Select v-model="selectedCategory" @update:model-value="loadBooks">
            <SelectTrigger class="w-[200px]">
              <SelectValue :placeholder="t('services.itHelp.kb.allCategories')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{{ t('services.itHelp.kb.allCategories') }}</SelectItem>
              <SelectItem v-for="cat in categories" :key="cat" :value="cat">
                {{ cat }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- eBook Grid -->
        <div v-if="loadingBooks" class="text-center py-12">
          <p class="text-muted-foreground">{{ t('services.itHelp.kb.loading') }}</p>
        </div>

        <div v-else-if="filteredBooks.length === 0" class="text-center py-12">
          <BookOpen class="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h3 class="text-lg font-medium mb-2">{{ t('services.itHelp.kb.noBooks') }}</h3>
          <p class="text-muted-foreground mb-4">
            {{
              ebookSearchQuery || selectedCategory
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

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KnowledgeBookCard
            v-for="book in filteredBooks"
            :key="book.id"
            :book="book"
            :can-delete="isITDepartment"
            @view="handleViewBook(book)"
            @download="handleDownloadBook(book)"
            @delete="handleDeleteBook(book)"
          />
        </div>
      </TabsContent>

      <!-- IT Stock Tab (Admin/IT Only) -->
      <TabsContent v-if="isITDepartment" value="stock" class="space-y-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{{ t('services.itHelp.stock.title') }}</CardTitle>
              <CardDescription>{{ t('services.itHelp.stock.subtitle') }}</CardDescription>
            </div>
            <Button size="sm" class="gap-2" @click="handleAddStock">
              <Plus class="w-4 h-4" /> {{ t('services.itHelp.stock.addItem') }}
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable :columns="itAssetColumns" :data="itStock" />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent v-if="isITDepartment" value="printer" class="space-y-4">
        <PrinterUsageAnalytics />
      </TabsContent>

      <!-- Assets Tab -->
      <TabsContent value="assets">
        <Card>
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
        <template v-if="tickets.length > 0">
          <!-- Stats Header & Filter -->
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-muted-foreground">
              {{ t('services.itHelp.stats.overview') }}
            </h3>
            <div class="flex items-center gap-2">
              <DateRangePicker v-model="dateRange" />
            </div>
          </div>

          <!-- Stats Section -->
          <!-- Stats Section -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent class="flex items-center justify-between p-6">
                <div
                  class="flex-1 flex flex-col items-center justify-center border-r border-border pr-4"
                >
                  <div class="text-sm font-medium text-muted-foreground mb-2">Total Tickets</div>
                  <div class="text-3xl font-bold">{{ ticketStats.total }}</div>
                </div>
                <div class="flex-1 flex flex-col items-center justify-center pl-4">
                  <div class="text-sm font-medium text-green-600 flex items-center gap-1 mb-2">
                    <CheckCircle2 class="w-4 h-4" /> Total Resolved
                  </div>
                  <div class="text-3xl font-bold text-green-600">{{ ticketStats.resolved }}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent class="flex items-center justify-between p-6">
                <div
                  class="flex-1 flex flex-col items-center justify-center border-r border-border pr-4"
                >
                  <div class="text-sm font-medium text-blue-600 mb-2">Open</div>
                  <div class="text-3xl font-bold text-blue-600">{{ ticketStats.openCount }}</div>
                </div>
                <div class="flex-1 flex flex-col items-center justify-center pl-4">
                  <div class="text-sm font-medium text-yellow-600 mb-2">In Progress</div>
                  <div class="text-3xl font-bold text-yellow-600">
                    {{ ticketStats.inProgressCount }}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent class="flex items-center justify-between p-6">
                <div
                  class="flex-1 flex flex-col items-center justify-center border-r border-border pr-4"
                >
                  <div class="text-sm font-medium text-muted-foreground mb-2">
                    {{ t('services.itHelp.stats.avgResponse') }}
                  </div>
                  <div class="text-3xl font-bold">{{ ticketStats.avgResponse }}h</div>
                </div>
                <div class="flex-1 flex flex-col items-center justify-center pl-4">
                  <div class="text-sm font-medium text-green-600 flex items-center gap-1 mb-2">
                    <Zap class="w-4 h-4" /> Best Time
                  </div>
                  <div class="text-3xl font-bold text-green-600">
                    {{ ticketStats.bestResponse }}h
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader class="pb-3 border-b border-muted">
              <div class="flex items-center justify-between">
                <div>
                  <CardTitle class="text-lg">{{ t('services.itHelp.tickets.title') }}</CardTitle>
                  <CardDescription>{{ t('services.itHelp.tickets.subtitle') }}</CardDescription>
                </div>
                <div
                  v-if="loadingTickets"
                  class="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"
                />
              </div>
            </CardHeader>
            <CardContent class="p-0">
              <div class="divide-y divide-muted">
                <div
                  v-for="ticket in paginatedTickets"
                  :key="ticket.id"
                  class="p-4 hover:bg-muted/30 transition-colors group cursor-pointer flex items-center gap-4"
                  @click="handleTicketClick(ticket)"
                >
                  <!-- Icon -->
                  <div
                    class="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"
                  >
                    <Ticket class="w-5 h-5" />
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-semibold text-foreground truncate">
                        {{ ticket.title }}
                      </span>
                      <Badge
                        variant="outline"
                        class="text-[10px] h-5 px-1.5 font-mono text-muted-foreground bg-muted/50 border-muted"
                      >
                        {{ ticket.ticketNo }}
                      </Badge>
                    </div>
                    <div class="flex items-center gap-3 text-xs text-muted-foreground">
                      <span class="flex items-center gap-1.5">
                        {{ ticket.category }}
                      </span>
                      <span class="text-muted-foreground/40">&bull;</span>
                      <span class="flex items-center gap-1.5">
                        <Clock class="w-3 h-3" />
                        {{ formatTicketDate(ticket.createdAt) }}
                      </span>
                    </div>
                  </div>

                  <!-- Status -->
                  <div class="flex-shrink-0">
                    <Badge
                      :class="[
                        getStatusColor(ticket.status),
                        'px-2.5 py-1 font-medium border-0 rounded-md',
                      ]"
                    >
                      {{ ticket.status.toUpperCase() }}
                    </Badge>
                  </div>
                </div>
              </div>

              <!-- Pagination Controls -->
              <div class="flex items-center justify-between pt-4 border-t mt-4">
                <div class="flex items-center gap-2">
                  <p class="text-sm text-muted-foreground">
                    {{ t('common.table.rowsPerPage') }}
                  </p>
                  <Select
                    :model-value="itemsPerPage.toString()"
                    @update:model-value="(v) => (itemsPerPage = parseInt(v))"
                  >
                    <SelectTrigger class="w-[70px]">
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

                <div class="flex items-center gap-2">
                  <div class="text-sm text-muted-foreground mr-2">
                    {{ startItemIndex }} - {{ endItemIndex }} of {{ tickets.length }}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="currentPage === 1"
                    @click="handlePageChange(currentPage - 1)"
                  >
                    {{ t('common.previous') }}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="currentPage === totalPages"
                    @click="handlePageChange(currentPage + 1)"
                  >
                    {{ t('common.next') }}
                  </Button>
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
      <DialogContent class="sm:max-w-[600px]">
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
        />
      </DialogContent>
    </Dialog>

    <!-- eBook Upload Modal -->
    <KnowledgeBookUpload v-model:open="isUploadModalOpen" @uploaded="handleUploadSuccess" />

    <!-- eBook Viewer Modal -->
    <KnowledgeBookViewer v-model:open="isViewerModalOpen" :book="selectedBook" />

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
  </div>
</template>
