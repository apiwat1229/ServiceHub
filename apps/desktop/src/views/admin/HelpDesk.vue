<script setup lang="ts">
import AssetRequestForm from '@/components/helpdesk/AssetRequestForm.vue';
import NewTicketForm from '@/components/helpdesk/NewTicketForm.vue';
import PrinterUsageAnalytics from '@/components/helpdesk/PrinterUsageAnalytics.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/auth';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit2,
  LayoutDashboard,
  Monitor,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Ticket,
} from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const authStore = useAuthStore();
const searchQuery = ref('');
const isAssetModalOpen = ref(false);
const isTicketModalOpen = ref(false);
const isStockModalOpen = ref(false);
const editingStockItem = ref<any>(null);

// Mock Stock Data
const itStock = ref([
  { id: 'S-001', name: 'Dell Latitude 3440', category: 'Laptop', stock: 5, status: 'In Stock' },
  {
    id: 'S-002',
    name: 'Logitech MX Master 3S',
    category: 'Peripheral',
    stock: 12,
    status: 'In Stock',
  },
  { id: 'S-003', name: 'Dell UltraSharp 27"', category: 'Monitor', stock: 3, status: 'Low Stock' },
  {
    id: 'S-004',
    name: 'Cisco Webex Desk Hub',
    category: 'Hardware',
    stock: 0,
    status: 'Out of Stock',
  },
]);

// Mock Data
const tickets = [
  {
    id: 'T-1024',
    title: 'Cannot access ERP system',
    status: 'In Progress',
    priority: 'High',
    category: 'Software',
    created: '2 hours ago',
    assignee: 'Jack S.',
  },
  {
    id: 'T-1023',
    title: 'Printer jamming repeatedly',
    status: 'Open',
    priority: 'Medium',
    category: 'Hardware',
    created: '5 hours ago',
    assignee: 'Unassigned',
  },
  {
    id: 'T-1020',
    title: 'Request for new monitor',
    status: 'Resolved',
    priority: 'Low',
    category: 'Asset',
    created: '1 day ago',
    assignee: 'Sarah M.',
  },
];

const kbArticles = [
  { title: 'How to reset your password', views: 1250, category: 'Account' },
  { title: 'Connecting to Office Wi-Fi', views: 890, category: 'Network' },
  { title: 'VPN connection guide', views: 760, category: 'Network' },
];

// Pagination State
const currentPage = ref(1);
const itemsPerPage = ref(5);
const pageSizeOptions = [5, 10, 20, 50];

// Computed
const paginatedTickets = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return tickets.slice(start, end);
});

const totalPages = computed(() => Math.ceil(tickets.length / itemsPerPage.value));

const startItemIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value + 1);
const endItemIndex = computed(() =>
  Math.min(currentPage.value * itemsPerPage.value, tickets.length)
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

const handleEditStock = (item: any) => {
  editingStockItem.value = item;
  isStockModalOpen.value = true;
};

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
      <TabsContent value="kb">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            v-for="(article, index) in kbArticles"
            :key="index"
            class="cursor-pointer hover:shadow-md transition-all"
          >
            <CardHeader>
              <CardTitle class="text-lg">{{ article.title }}</CardTitle>
              <CardDescription>{{ article.category }}</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="flex items-center text-sm text-muted-foreground">
                <BookOpen class="h-4 w-4 mr-1" /> {{ article.views }} views
              </div>
            </CardContent>
          </Card>
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
            <div class="border rounded-lg overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-muted/50 border-b">
                  <tr>
                    <th class="text-left p-3 font-medium">
                      {{ t('services.itHelp.stock.deviceName') }}
                    </th>
                    <th class="text-left p-3 font-medium">
                      {{ t('services.itHelp.stock.category') }}
                    </th>
                    <th class="text-center p-3 font-medium">
                      {{ t('services.itHelp.stock.count') }}
                    </th>
                    <th class="text-left p-3 font-medium">{{ t('common.status') }}</th>
                    <th class="text-right p-3 font-medium">{{ t('common.actions') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr
                    v-for="item in itStock"
                    :key="item.id"
                    class="hover:bg-slate-50 transition-colors"
                  >
                    <td class="p-3">
                      <div class="font-medium">{{ item.name }}</div>
                      <div class="text-xs text-muted-foreground">{{ item.id }}</div>
                    </td>
                    <td class="p-3">{{ item.category }}</td>
                    <td class="p-3 text-center font-bold">{{ item.stock }}</td>
                    <td class="p-3">
                      <Badge
                        variant="secondary"
                        :class="{
                          'bg-green-100 text-green-700': item.status === 'In Stock',
                          'bg-orange-100 text-orange-700': item.status === 'Low Stock',
                          'bg-red-100 text-red-700': item.status === 'Out of Stock',
                        }"
                      >
                        {{ item.status }}
                      </Badge>
                    </td>
                    <td class="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8"
                        @click="handleEditStock(item)"
                      >
                        <Edit2 class="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
          <!-- Stats Section -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium">{{
                  t('services.itHelp.stats.openTickets')
                }}</CardTitle>
                <Ticket class="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">12</div>
                <p class="text-xs text-muted-foreground mt-1">+2 from yesterday</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium">{{
                  t('services.itHelp.stats.avgResponse')
                }}</CardTitle>
                <Clock class="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">1.5h</div>
                <p class="text-xs text-muted-foreground mt-1">-15m from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium">{{
                  t('services.itHelp.stats.resolvedTickets')
                }}</CardTitle>
                <CheckCircle2 class="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">45</div>
                <p class="text-xs text-muted-foreground mt-1">+5 from last week</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{{ t('services.itHelp.tickets.title') }}</CardTitle>
              <CardDescription>{{ t('services.itHelp.tickets.subtitle') }}</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div
                  v-for="ticket in paginatedTickets"
                  :key="ticket.id"
                  class="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div class="flex items-center gap-4">
                    <div
                      class="h-10 w-10 rounded-full flex items-center justify-center"
                      :class="
                        ticket.priority === 'High'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-50 text-blue-600'
                      "
                    >
                      <AlertCircle v-if="ticket.priority === 'High'" class="h-5 w-5" />
                      <Ticket v-else class="h-5 w-5" />
                    </div>
                    <div>
                      <h4 class="font-semibold">{{ ticket.title }}</h4>
                      <div class="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{{ ticket.id }}</span>
                        <span>•</span>
                        <span>{{ ticket.category }}</span>
                        <span>•</span>
                        <span>{{ ticket.created }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <Badge variant="secondary" :class="getStatusColor(ticket.status)">
                      {{ ticket.status }}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
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
        <NewTicketForm @success="isTicketModalOpen = false" @cancel="isTicketModalOpen = false" />
      </DialogContent>
    </Dialog>

    <!-- IT Stock Dialog -->
    <Dialog v-model:open="isStockModalOpen">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{{
            editingStockItem
              ? t('services.itHelp.stock.editItem')
              : t('services.itHelp.stock.addItem')
          }}</DialogTitle>
          <DialogDescription>{{ t('services.itHelp.stock.subtitle') }}</DialogDescription>
        </DialogHeader>
        <!-- <ITStockForm
          :initial-data="editingStockItem"
          @success="isStockModalOpen = false"
          @cancel="isStockModalOpen = false"
        /> -->
        <div>Temporarily Disabled</div>
      </DialogContent>
    </Dialog>
  </div>
</template>
