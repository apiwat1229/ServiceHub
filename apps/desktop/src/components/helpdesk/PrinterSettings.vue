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
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
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
  return props.importedUsers.filter((u) => !mappedUserNames.has(u));
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

    await Promise.all(promises);

    isMappingModalOpen.value = false;
    loadData();
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
    toast.success('Mapping deleted');
    loadData();
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
</script>

<template>
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
                      :key="user"
                      :value="user"
                      @select="
                        () => {
                          const index = mappingForm.userNames.indexOf(user);
                          if (index >= 0) {
                            mappingForm.userNames.splice(index, 1);
                          } else {
                            mappingForm.userNames.push(user);
                          }
                        }
                      "
                    >
                      <div
                        :class="
                          cn(
                            'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                            mappingForm.userNames.includes(user)
                              ? 'bg-primary text-primary-foreground'
                              : 'opacity-50 [&_svg]:invisible'
                          )
                        "
                      >
                        <Check class="h-4 w-4" />
                      </div>
                      <span>{{ user }}</span>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <div class="text-[10px] text-muted-foreground flex justify-between">
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
</template>
```
