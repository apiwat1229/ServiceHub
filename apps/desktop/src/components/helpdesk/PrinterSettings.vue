<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { printerService } from '@/services/printer';
import { PrinterDepartmentDto, PrinterUserMappingDto } from '@my-app/types';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Database,
  Edit2,
  Plus,
  Search,
  Settings2,
  Trash2,
  Users,
} from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();

const props = defineProps<{
  importedUsers?: string[];
  historyRecords?: any[];
}>();

const emit = defineEmits(['dataChanged']);

// State
const departments = ref<PrinterDepartmentDto[]>([]);
const mappings = ref<PrinterUserMappingDto[]>([]);
const isLoading = ref(false);

// Dialog State
const isDeptModalOpen = ref(false);
const editingDept = ref<Partial<PrinterDepartmentDto> | null>(null);
const departmentForm = ref({
  name: '',
  description: '',
});

// Manual Mapping Dialog
const isMappingModalOpen = ref(false);
const mappingForm = ref({
  userNames: [] as string[],
  departmentId: '',
});
const isUserSelectOpen = ref(false); // Popover state
const isDeleteDialogOpen = ref(false);
const periodToDelete = ref<{ iso: string; label: string } | null>(null);

// Search
const mappingSearchQuery = ref('');
const deptSearchQuery = ref('');

const filteredDepartments = computed(() => {
  if (!deptSearchQuery.value) return departments.value;
  const q = deptSearchQuery.value.toLowerCase();
  return departments.value.filter(
    (d) => d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)
  );
});

const availableUsers = computed(() => {
  if (!props.importedUsers) return [];
  const mappedUserNames = new Set(mappings.value.map((m) => m.userName));

  // Return all users with mapped status
  return props.importedUsers.map((userName) => ({
    userName,
    isMapped: mappedUserNames.has(userName),
    department: mappings.value.find((m) => m.userName === userName)?.department?.name,
  }));
});

// Load Data
const loadData = async () => {
  isLoading.value = true;
  try {
    const [deptsRes, mappingsRes] = await Promise.all([
      printerService.getDepartments(),
      printerService.getMappings(),
    ]);
    if (deptsRes.success) departments.value = deptsRes.data || [];
    if (mappingsRes.success) mappings.value = mappingsRes.data || [];
  } catch (error) {
    console.error('Failed to load printer settings:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadData);

// Department Actions
const handleAddDept = () => {
  editingDept.value = null;
  departmentForm.value = { name: '', description: '' };
  isDeptModalOpen.value = true;
};

const handleEditDept = (dept: PrinterDepartmentDto) => {
  editingDept.value = dept;
  departmentForm.value = {
    name: dept.name,
    description: dept.description || '',
  };
  isDeptModalOpen.value = true;
};

const saveDepartment = async () => {
  if (!departmentForm.value.name) return;
  try {
    if (editingDept.value?.id) {
      await printerService.updateDepartment(editingDept.value.id, departmentForm.value);
    } else {
      await printerService.createDepartment(departmentForm.value);
    }
    isDeptModalOpen.value = false;
    loadData();
    emit('dataChanged');
    toast.success(t('common.saveSuccess') || 'Saved successfully');
  } catch (error) {
    toast.error(t('common.error') || 'Error');
  }
};

const deleteDepartment = async (id: string) => {
  if (!confirm(t('services.admin.users.deleteConfirm') || 'Are you sure?')) return;
  try {
    await printerService.deleteDepartment(id);
    loadData();
    emit('dataChanged');
    toast.success(t('common.deleteSuccess') || 'Deleted successfully');
  } catch (error) {
    toast.error(t('common.error') || 'Error');
  }
};

// Mapping Actions
const handleAddMapping = () => {
  mappingForm.value = { userNames: [], departmentId: '' };
  isMappingModalOpen.value = true;
};

const saveManualMapping = async () => {
  if (mappingForm.value.userNames.length === 0 || !mappingForm.value.departmentId) return;

  try {
    const promises = mappingForm.value.userNames.map((userName) =>
      printerService.upsertMapping({ userName, departmentId: mappingForm.value.departmentId })
    );

    const results = await Promise.all(promises);

    // Update local state immediately without reload
    const department = departments.value.find((d) => d.id === mappingForm.value.departmentId);
    results.forEach((result) => {
      if (result.success && result.data) {
        // Check if mapping already exists
        const existingIndex = mappings.value.findIndex((m) => m.userName === result.data!.userName);
        if (existingIndex >= 0) {
          // Update existing mapping
          mappings.value[existingIndex] = {
            ...result.data!,
            department: department,
          };
        } else {
          // Add new mapping
          mappings.value.push({
            ...result.data,
            department: department,
          });
        }
      }
    });

    isMappingModalOpen.value = false;
    mappingForm.value = { userNames: [], departmentId: '' };
    emit('dataChanged');
    toast.success(t('services.itHelp.printer.settings.mappingSuccess'));
  } catch (error) {
    toast.error(t('services.itHelp.printer.settings.mappingError'));
  }
};

const deleteMapping = async (id: string) => {
  if (!confirm('Are you sure you want to delete this mapping?')) return;
  try {
    await printerService.deleteMapping(id);

    // Remove from local state immediately
    const index = mappings.value.findIndex((m) => m.id === id);
    if (index >= 0) {
      mappings.value.splice(index, 1);
    }

    toast.success('Mapping deleted');
    emit('dataChanged');
  } catch (error) {
    toast.error('Failed to delete mapping');
  }
};

const filteredMappings = computed(() => {
  let result = mappings.value;
  if (mappingSearchQuery.value) {
    const q = mappingSearchQuery.value.toLowerCase();
    result = result.filter(
      (m) => m.userName.toLowerCase().includes(q) || m.department?.name.toLowerCase().includes(q)
    );
  }
  return result;
});

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);

const totalPages = computed(() => Math.ceil(filteredMappings.value.length / pageSize.value));

const paginatedMappings = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredMappings.value.slice(start, end);
});

// Reset page when search/filter changes
watch(mappingSearchQuery, () => {
  currentPage.value = 1;
});

// Import Summary
const importSummary = computed(() => {
  if (!props.historyRecords || props.historyRecords.length === 0) {
    return { totalMonths: 0, periods: [] };
  }

  const uniquePeriods = [...new Set(props.historyRecords.map((r) => r.period))];
  const sortedPeriods = uniquePeriods.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return {
    totalMonths: sortedPeriods.length,
    periods: sortedPeriods.map((p) => ({
      iso: p,
      label: formatPeriodLabel(p),
    })),
  };
});

const formatPeriodLabel = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const openDeleteDialog = (period: { iso: string; label: string }) => {
  periodToDelete.value = period;
  isDeleteDialogOpen.value = true;
};

const confirmDelete = async () => {
  if (!periodToDelete.value) return;

  try {
    await printerService.deletePeriod(periodToDelete.value.iso);
    toast.success('Period data deleted successfully');
    isDeleteDialogOpen.value = false;
    periodToDelete.value = null;
    emit('dataChanged');
  } catch (error) {
    console.error('Failed to delete period:', error);
    toast.error('Failed to delete period data');
  }
};
</script>

<template>
  <!-- Import Summary -->
  <Card class="mb-6 shadow-sm border-slate-200">
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Database class="w-5 h-5 text-primary" />
          <div>
            <CardTitle class="text-lg">Import Summary</CardTitle>
            <CardDescription class="text-xs">Manage imported printer usage data</CardDescription>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <Badge variant="secondary" class="text-sm font-semibold">
            {{ importSummary.totalMonths }}
            {{ importSummary.totalMonths === 1 ? 'Month' : 'Months' }}
          </Badge>
          <slot name="upload-button"></slot>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div
        v-if="importSummary.totalMonths === 0"
        class="py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/20"
      >
        <div class="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
          <Database class="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 class="text-lg font-semibold mb-1">No data imported yet</h3>
        <p class="text-xs text-muted-foreground">Upload CSV files to see usage history</p>
      </div>
      <div v-else class="relative">
        <!-- Horizontal Scrollable Container -->
        <div class="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
          <div
            v-for="period in importSummary.periods"
            :key="period.iso"
            class="group flex-shrink-0 w-[280px] snap-start"
          >
            <div
              class="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all h-full"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-md bg-primary/10">
                  <Calendar class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div class="text-sm font-semibold text-slate-700">{{ period.label }}</div>
                  <div class="text-xs text-slate-500">Imported data</div>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                class="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                @click="openDeleteDialog(period)"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <!-- Scroll Hint -->
        <div
          v-if="importSummary.totalMonths > 3"
          class="text-xs text-center text-slate-400 mt-2 flex items-center justify-center gap-1"
        >
          <span>← Scroll to see more →</span>
        </div>
      </div>
    </CardContent>
  </Card>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Departments Management -->
    <Card class="lg:col-span-1 shadow-sm border-slate-200">
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <Settings2 class="w-5 h-5 text-primary" />
            <CardTitle class="text-lg">{{
              t('services.itHelp.printer.settings.deptManagement')
            }}</CardTitle>
          </div>
          <Button size="sm" variant="ghost" class="h-8 w-8 p-0" @click="handleAddDept">
            <Plus class="w-4 h-4" />
          </Button>
        </div>
        <Input v-model="deptSearchQuery" placeholder="Search departments..." class="h-8 text-xs" />
      </CardHeader>
      <CardContent>
        <div class="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          <div
            v-if="filteredDepartments.length === 0"
            class="text-center py-4 text-slate-400 text-sm italic"
          >
            No departments found
          </div>
          <div
            v-for="dept in filteredDepartments"
            :key="dept.id"
            class="group flex items-center justify-between p-2 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
          >
            <div>
              <div class="font-medium text-sm">{{ dept.name }}</div>
              <div class="text-xs text-slate-500 truncate max-w-[150px]">
                {{ dept.description }}
              </div>
            </div>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" class="h-7 w-7" @click="handleEditDept(dept)">
                <Edit2 class="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                class="h-7 w-7 text-red-500 hover:text-red-600"
                @click="deleteDepartment(dept.id)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- User Mappings -->
    <Card class="lg:col-span-2 shadow-sm border-slate-200">
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <div class="flex items-center gap-2">
          <Users class="w-5 h-5 text-primary" />
          <div>
            <CardTitle class="text-lg">{{
              t('services.itHelp.printer.settings.userMapping')
            }}</CardTitle>
            <CardDescription class="text-xs">{{
              t('services.itHelp.printer.settings.mappingDesc')
            }}</CardDescription>
          </div>
        </div>
        <Button size="sm" class="gap-2" @click="handleAddMapping">
          <Plus class="w-4 h-4" /> {{ t('common.add') || 'Add' }}
        </Button>
      </CardHeader>
      <CardContent>
        <div class="mb-4 relative">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input v-model="mappingSearchQuery" placeholder="Search username..." class="pl-9 h-9" />
        </div>

        <div class="border rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-slate-50/50 border-b">
              <tr>
                <th class="text-left p-3 font-medium">
                  {{ t('services.itHelp.printer.table.userName') }}
                </th>
                <th class="text-left p-3 font-medium">
                  {{ t('services.itHelp.printer.table.department') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="paginatedMappings.length === 0">
                <td colspan="2" class="p-8 text-center text-slate-400 italic">No mappings found</td>
              </tr>
              <tr
                v-for="mapping in paginatedMappings"
                :key="mapping.id"
                class="hover:bg-slate-50/50 transition-colors"
              >
                <td class="p-3 font-medium">{{ mapping.userName }}</td>
                <td class="p-3">
                  <span class="text-sm">
                    {{
                      departments.find((d) => d.id === mapping.departmentId)?.name ||
                      mapping.departmentId
                    }}
                  </span>
                </td>
                <td class="p-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    @click="deleteMapping(mapping.id)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="flex items-center justify-between px-2 pt-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">Rows per page</span>
            <Select
              :model-value="pageSize.toString()"
              @update:model-value="(v) => (pageSize = Number(v))"
            >
              <SelectTrigger class="h-8 w-[70px]">
                <SelectValue :placeholder="pageSize.toString()" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">
              Page {{ currentPage }} of {{ totalPages || 1 }}
            </span>
            <div class="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8"
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                <ChevronLeft class="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8"
                :disabled="currentPage >= totalPages"
                @click="currentPage++"
              >
                <ChevronRight class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

  <!-- Dept Modal -->
  <Dialog v-model:open="isDeptModalOpen">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{
          editingDept
            ? t('services.itHelp.printer.settings.editDept')
            : t('services.itHelp.printer.settings.addDept')
        }}</DialogTitle>
        <DialogDescription>
          Define a department name for grouping printer usage.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <label class="text-sm font-medium">{{
            t('services.itHelp.printer.settings.deptName')
          }}</label>
          <Input v-model="departmentForm.name" placeholder="e.g. Accounting" />
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium">{{
            t('services.itHelp.printer.settings.description')
          }}</label>
          <Input v-model="departmentForm.description" placeholder="Short description..." />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="isDeptModalOpen = false">{{
          t('common.cancel') || 'Cancel'
        }}</Button>
        <Button @click="saveDepartment">{{ t('common.save') || 'Save' }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Manual Mapping Modal -->
  <Dialog v-model:open="isMappingModalOpen">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{{ t('services.itHelp.printer.settings.userMapping') }}</DialogTitle>
        <DialogDescription> Map multiple users to a department at once. </DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <!-- Multi-Select Users -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">{{
            t('services.itHelp.printer.table.userName')
          }}</label>

          <Popover v-model:open="isUserSelectOpen">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                role="combobox"
                :aria-expanded="isUserSelectOpen"
                class="w-full justify-between h-auto min-h-[40px] py-2"
              >
                <div class="flex flex-wrap gap-1 items-center">
                  <span
                    v-if="mappingForm.userNames.length === 0"
                    class="text-muted-foreground font-normal"
                  >
                    Select users...
                  </span>
                  <Badge
                    v-for="user in mappingForm.userNames.slice(0, 5)"
                    :key="user"
                    variant="secondary"
                    class="mr-1"
                  >
                    {{ user }}
                  </Badge>
                  <span
                    v-if="mappingForm.userNames.length > 5"
                    class="text-xs text-muted-foreground"
                  >
                    +{{ mappingForm.userNames.length - 5 }} more
                  </span>
                </div>
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[550px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search users..." />
                <CommandEmpty>No user found.</CommandEmpty>
                <CommandList>
                  <CommandGroup class="max-h-[300px] overflow-auto">
                    <CommandItem
                      v-for="user in availableUsers"
                      :key="user.userName"
                      :value="user.userName"
                      @select="
                        () => {
                          const index = mappingForm.userNames.indexOf(user.userName);
                          if (index >= 0) {
                            mappingForm.userNames.splice(index, 1);
                          } else {
                            mappingForm.userNames.push(user.userName);
                          }
                        }
                      "
                    >
                      <div
                        :class="
                          cn(
                            'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                            mappingForm.userNames.includes(user.userName)
                              ? 'bg-primary text-primary-foreground'
                              : 'opacity-50 [&_svg]:invisible'
                          )
                        "
                      >
                        <Check class="h-4 w-4" />
                      </div>
                      <span class="flex-1">{{ user.userName }}</span>
                      <Badge v-if="user.isMapped" variant="secondary" class="text-[0.625rem] ml-2">
                        {{ user.department || 'Mapped' }}
                      </Badge>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <div class="text-[0.625rem] text-muted-foreground flex justify-between">
            <span>Selected: {{ mappingForm.userNames.length }} users</span>
            <span
              v-if="mappingForm.userNames.length > 0"
              class="cursor-pointer text-primary hover:underline"
              @click="mappingForm.userNames = []"
            >
              Clear all
            </span>
          </div>
        </div>

        <!-- Department Select -->
        <div class="grid gap-2">
          <label class="text-sm font-medium">{{
            t('services.itHelp.printer.table.department')
          }}</label>
          <Select v-model="mappingForm.departmentId">
            <SelectTrigger>
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="dept in departments" :key="dept.id" :value="dept.id">
                {{ dept.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="isMappingModalOpen = false">{{
          t('common.cancel') || 'Cancel'
        }}</Button>
        <Button
          @click="saveManualMapping"
          :disabled="mappingForm.userNames.length === 0 || !mappingForm.departmentId"
          >{{ t('services.itHelp.printer.settings.saveMapping') }}</Button
        >
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Delete Confirmation Dialog -->
  <Dialog v-model:open="isDeleteDialogOpen">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2 text-red-600">
          <Trash2 class="w-5 h-5" />
          Delete Period Data
        </DialogTitle>
        <DialogDescription>
          This action cannot be undone. All printer usage data for this period will be permanently
          deleted.
        </DialogDescription>
      </DialogHeader>
      <div v-if="periodToDelete" class="py-4">
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center gap-3">
            <Calendar class="w-5 h-5 text-red-600" />
            <div>
              <div class="font-semibold text-red-900">{{ periodToDelete.label }}</div>
              <div class="text-sm text-red-700">All usage records will be deleted</div>
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="isDeleteDialogOpen = false">Cancel</Button>
        <Button variant="destructive" @click="confirmDelete">
          <Trash2 class="w-4 h-4 mr-2" />
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```
