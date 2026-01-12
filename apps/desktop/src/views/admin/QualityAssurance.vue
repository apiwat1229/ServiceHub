<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { bookingsApi } from '@/services/bookings';
import { rubberTypesApi, type RubberType } from '@/services/rubberTypes';
import { ClipboardList, FlaskConical, List, Tags, TestTubes, Waves } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import ClPoPriTab from './tabs/ClPoPriTab.vue';
import UssPoPriTab from './tabs/UssPoPriTab.vue';

const { t } = useI18n();
const router = useRouter();

const isLoading = ref(false);
const bookings = ref<any[]>([]);
const rubberTypes = ref<RubberType[]>([]);

const currentTab = ref('cl-po-pri');

const tabs = [
  { id: 'cl-po-pri', label: 'CL PO PRI', icon: ClipboardList },
  { id: 'cl-lab', label: 'CL Lab', icon: TestTubes },
  { id: 'cuplump-pool', label: 'Cuplump Pool', icon: Waves },
  { id: 'select-pool', label: 'Select Pool', icon: Tags },
  { id: 'uss-po-pri', label: 'USS PO PRI', icon: ClipboardList },
  { id: 'uss-summary', label: 'USS Summary', icon: List },
];

const fetchData = async () => {
  isLoading.value = true;
  try {
    const [bookingsData, typesData] = await Promise.all([
      bookingsApi.getAll(),
      rubberTypesApi.getAll(),
    ]);
    // Filter for bookings that are relevant to QA (e.g., Checked In, Weight In, etc.)
    // For now, showing all or those that have lab data potential
    bookings.value = bookingsData;
    rubberTypes.value = typesData;
  } catch (error) {
    console.error('Failed to load data:', error);
    toast.error(t('common.errorLoading'));
  } finally {
    isLoading.value = false;
  }
};

const getRubberTypeName = (code: string) => {
  const type = rubberTypes.value.find((t) => t.code === code);
  return type ? type.name : code;
};

const filteredBookings = computed(() => {
  return bookings.value;
});

const navigateToDetail = (booking: any) => {
  if (booking.rubberType === 'Coagulating Cup Lumps' || booking.rubberType.includes('Cup')) {
    router.push({
      name: 'CuplumpDetail',
      params: { id: booking.id },
      query: { isTrailer: 'false', partLabel: 'Main Truck' },
    });
  } else {
    router.push({
      name: 'UssDetail',
      params: { id: booking.id },
      query: { isTrailer: 'false', partLabel: 'Main Truck' },
    });
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'PENDING':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'CANCELLED':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    default:
      return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="h-full flex flex-col p-6 max-w-[1600px] mx-auto space-y-6">
    <!-- Header -->
    <!-- Header with Controls -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight flex items-center gap-2">
            {{ t('services.qa.name') }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ t('services.qa.description') }}
          </p>
        </div>
      </div>

      <!-- Center Tabs -->
      <div class="flex-1 flex justify-end overflow-x-auto pb-2 md:pb-0">
        <Tabs v-model="currentTab" class="w-auto">
          <TabsList class="bg-muted p-1 rounded-lg w-full h-auto flex flex-wrap justify-end gap-1">
            <TabsTrigger
              v-for="tab in tabs"
              :key="tab.id"
              :value="tab.id"
              class="gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all rounded-md text-sm font-medium"
            >
              <component :is="tab.icon" class="w-4 h-4" v-if="tab.icon" />
              {{ tab.label }}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>

    <div v-if="currentTab === 'cl-po-pri'">
      <ClPoPriTab />
    </div>

    <div v-else-if="currentTab === 'uss-po-pri'">
      <UssPoPriTab />
    </div>

    <!-- Fallback / Other Tabs (Placeholder for now) -->
    <div v-else>
      <!-- Existing Table Logic can be moved here or adapted per tab -->
      <Card class="flex-1 overflow-hidden border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader class="px-6 py-4 border-b bg-muted/50">
          <div class="flex items-center justify-between">
            <CardTitle class="text-base font-semibold"
              >Active Bookings ({{ currentTab }})</CardTitle
            >
            <Badge variant="secondary">{{ filteredBookings.length }} Items</Badge>
          </div>
        </CardHeader>
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow class="hover:bg-transparent">
                <TableHead>Booking Code</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Truck</TableHead>
                <TableHead>Rubber Type</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead class="text-center">Status</TableHead>
                <TableHead class="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="isLoading">
                <TableCell colspan="7" class="h-24 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
              <TableRow v-else-if="filteredBookings.length === 0">
                <TableCell colspan="7" class="h-24 text-center text-muted-foreground">
                  No bookings found.
                </TableCell>
              </TableRow>
              <TableRow
                v-else
                v-for="booking in filteredBookings"
                :key="booking.id"
                class="group hover:bg-muted/50 transition-colors"
              >
                <TableCell class="font-medium font-mono">
                  {{ booking.bookingCode }}
                </TableCell>
                <TableCell>
                  <div class="flex flex-col">
                    <span class="font-medium">{{ booking.supplierName }}</span>
                    <span class="text-xs text-muted-foreground">{{ booking.supplierCode }}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Badge variant="outline" class="font-mono text-xs">
                      {{ booking.truckRegister }}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {{ getRubberTypeName(booking.rubberType) }}
                </TableCell>
                <TableCell>
                  <div class="flex flex-col">
                    <span class="text-sm">
                      {{ new Date(booking.date).toLocaleDateString() }}
                    </span>
                    <span class="text-xs text-muted-foreground">
                      {{ booking.timeSlot }}
                    </span>
                  </div>
                </TableCell>
                <TableCell class="text-center">
                  <Badge :class="getStatusColor(booking.status)" variant="outline">
                    {{ booking.status }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    class="gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    @click="navigateToDetail(booking)"
                  >
                    <FlaskConical class="w-4 h-4" />
                    Results
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
