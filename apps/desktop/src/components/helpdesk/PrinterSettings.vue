<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { printerService } from '@/services/printer';
import { PrinterDepartmentDto, PrinterUserMappingDto } from '@my-app/types';
import { Edit2, Plus, Search, Settings2, Trash2, Users } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();

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
  userName: '',
  departmentId: '',
});

// Search
const mappingSearchQuery = ref('');

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
    toast.success(t('common.deleteSuccess') || 'Deleted successfully');
  } catch (error) {
    toast.error(t('common.error') || 'Error');
  }
};

// Mapping Actions
const handleAddMapping = () => {
  mappingForm.value = { userName: '', departmentId: '' };
  isMappingModalOpen.value = true;
};

const saveManualMapping = async () => {
  if (!mappingForm.value.userName || !mappingForm.value.departmentId) return;
  try {
    await printerService.upsertMapping(mappingForm.value);
    isMappingModalOpen.value = false;
    loadData();
    toast.success(t('services.itHelp.printer.settings.mappingSuccess'));
  } catch (error) {
    toast.error(t('services.itHelp.printer.settings.mappingError'));
  }
};

const updateMapping = async (userName: string, deptId: string) => {
  try {
    await printerService.upsertMapping({ userName, departmentId: deptId });
    toast.success(t('services.itHelp.printer.settings.mappingSuccess'));
    loadData();
  } catch (error) {
    toast.error(t('services.itHelp.printer.settings.mappingError'));
  }
};

const filteredMappings = computed(() => {
  if (!mappingSearchQuery.value) return mappings.value;
  const q = mappingSearchQuery.value.toLowerCase();
  return mappings.value.filter(
    (m) => m.userName.toLowerCase().includes(q) || m.department?.name.toLowerCase().includes(q)
  );
});
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Departments Management -->
    <Card class="lg:col-span-1 shadow-sm border-slate-200">
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <div class="flex items-center gap-2">
          <Settings2 class="w-5 h-5 text-primary" />
          <CardTitle class="text-lg">{{
            t('services.itHelp.printer.settings.deptManagement')
          }}</CardTitle>
        </div>
        <Button size="sm" variant="ghost" class="h-8 w-8 p-0" @click="handleAddDept">
          <Plus class="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <div
            v-if="departments.length === 0"
            class="text-center py-4 text-slate-400 text-sm italic"
          >
            No departments defined
          </div>
          <div
            v-for="dept in departments"
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
              <tr v-if="filteredMappings.length === 0">
                <td colspan="2" class="p-8 text-center text-slate-400 italic">No mappings found</td>
              </tr>
              <tr
                v-for="mapping in filteredMappings"
                :key="mapping.id"
                class="hover:bg-slate-50/50 transition-colors"
              >
                <td class="p-3 font-medium">{{ mapping.userName }}</td>
                <td class="p-3">
                  <Select
                    :model-value="mapping.departmentId"
                    @update:model-value="(v) => updateMapping(mapping.userName, v)"
                  >
                    <SelectTrigger class="h-8 w-full max-w-[200px] text-xs">
                      <SelectValue placeholder="Select Dept" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="dept in departments" :key="dept.id" :value="dept.id">
                        {{ dept.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            </tbody>
          </table>
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
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ t('services.itHelp.printer.settings.userMapping') }}</DialogTitle>
        <DialogDescription>
          Manually add or update a user-to-department mapping.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <label class="text-sm font-medium">{{
            t('services.itHelp.printer.table.userName')
          }}</label>
          <Input v-model="mappingForm.userName" placeholder="Username as seen in logs" />
        </div>
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
        <Button @click="saveManualMapping">{{
          t('services.itHelp.printer.settings.saveMapping')
        }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
