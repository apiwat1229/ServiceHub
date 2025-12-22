<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/ui/data-table/DataTable.vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usersApi, type User } from '@/services/users';
import type { ColumnDef } from '@tanstack/vue-table';
import { ArrowUpDown, Edit, Plus, Search, Trash2, Users } from 'lucide-vue-next';
import { computed, h, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

// --- State ---
const users = ref<User[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');

// Filters
const filterRole = ref<string>('all');
const filterStatus = ref<string>('all');

// Modal State
const isModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const itemToDelete = ref<string | null>(null);
const editingItem = ref<User | null>(null);

const { t } = useI18n();

// --- Constants ---
const ROLE_OPTIONS = computed(() => [
  { value: 'admin', label: t('admin.users.roles.admin') },
  { value: 'md', label: t('admin.positions.md') },
  { value: 'gm', label: t('admin.positions.gm') },
  { value: 'manager', label: t('admin.positions.manager') },
  { value: 'asst_mgr', label: t('admin.positions.asstMgr') },
  { value: 'senior_sup', label: t('admin.positions.seniorSup') },
  { value: 'supervisor', label: t('admin.positions.sup') },
  { value: 'senior_staff_2', label: t('admin.positions.seniorStaff2') },
  { value: 'senior_staff_1', label: t('admin.positions.seniorStaff1') },
  { value: 'staff_2', label: t('admin.positions.staff2') },
  { value: 'staff_1', label: t('admin.positions.staff1') },
  { value: 'op_leader', label: t('admin.positions.opLeader') },
  // Legacy support
  { value: 'ADMIN', label: 'Admin (Old)' },
  { value: 'USER', label: 'User (Old)' },
]);

const DEPARTMENT_OPTIONS = computed(() => [
  t('admin.departments.qa'),
  t('admin.departments.it'),
  t('admin.departments.hr'),
  t('admin.departments.accounting'),
  t('admin.departments.sales'),
  t('admin.departments.production'),
  t('admin.departments.rawMaterial'),
  t('admin.departments.finance'),
  t('admin.departments.purchasing'),
  t('admin.departments.shipping'),
  'Maintenance',
  'Safety',
  'General Affairs',
  'Management',
]);

const POSITION_OPTIONS = computed(() => [
  t('admin.positions.md'),
  t('admin.positions.gm'),
  t('admin.positions.manager'),
  t('admin.positions.asstMgr'),
  t('admin.positions.seniorSup'),
  t('admin.positions.sup'),
  t('admin.positions.seniorStaff2'),
  t('admin.positions.seniorStaff1'),
  t('admin.positions.staff2'),
  t('admin.positions.staff1'),
  t('admin.positions.opLeader'),
  t('admin.positions.op'),
  'Leader',
  'Senior Staff',
  'Staff',
  'Officer',
  'Driver',
  'Worker',
]);

const getRoleLabel = (roleVal: string) => {
  const found = ROLE_OPTIONS.value.find((r) => r.value === roleVal);
  return found ? found.label : roleVal;
};

// Form Data
const formData = ref<Partial<User>>({
  email: '',
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  displayName: '',
  role: 'staff_1',
  department: '',
  position: '',
  status: 'ACTIVE',
  employeeId: '',
  forceChangePassword: true,
});

// --- Computed ---
const stats = computed(() => ({
  total: users.value.length,
  active: users.value.filter((u) => u.status === 'ACTIVE').length,
  inactive: users.value.filter((u) => u.status === 'INACTIVE').length,
  suspended: users.value.filter((u) => u.status === 'SUSPENDED').length,
}));

const filteredData = computed(() => {
  let data = users.value;

  // Global Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    data = data.filter(
      (u) =>
        u.firstName?.toLowerCase().includes(query) ||
        u.lastName?.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.username?.toLowerCase().includes(query)
    );
  }

  // Filter Role
  if (filterRole.value && filterRole.value !== 'all') {
    data = data.filter((u) => u.role === filterRole.value);
  }

  // Filter Status
  if (filterStatus.value && filterStatus.value !== 'all') {
    data = data.filter((u) => u.status === filterStatus.value);
  }

  return data;
});

// --- Actions ---
const fetchData = async () => {
  try {
    isLoading.value = true;
    users.value = await usersApi.getAll();
  } catch (error) {
    console.error('Failed to fetch users:', error);
    toast.error('Failed to fetch users');
  } finally {
    isLoading.value = false;
  }
};

const handleOpenCreate = () => {
  editingItem.value = null;
  formData.value = {
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    displayName: '',
    role: 'staff_1',
    department: '',
    position: '',
    status: 'ACTIVE',
    employeeId: '',
    forceChangePassword: true,
  };
  isModalOpen.value = true;
};

const handleOpenEdit = (item: User) => {
  editingItem.value = item;
  formData.value = { ...item };
  isModalOpen.value = true;
};

const handleSubmit = async () => {
  try {
    const payload: Partial<User> = {
      username: formData.value.username,
      email: formData.value.email,
      firstName: formData.value.firstName,
      lastName: formData.value.lastName,
      displayName: formData.value.displayName,
      department: formData.value.department,
      position: formData.value.position,
      role: formData.value.role,
      status: formData.value.status,
      employeeId: formData.value.employeeId,
      pinCode: formData.value.pinCode,
      // hodId: formData.value.hodId, // Uncomment if used
      forceChangePassword: formData.value.forceChangePassword,
    };

    if (formData.value.password) {
      payload.password = formData.value.password;
    }

    if (editingItem.value) {
      await usersApi.update(editingItem.value.id, payload);
      toast.success('User updated successfully');
    } else {
      await usersApi.create(payload as User);
      toast.success('User created successfully');
    }
    isModalOpen.value = false;
    await fetchData();
  } catch (error) {
    console.error('Failed to save user:', error);
    toast.error('Failed to save user');
  }
};

const handleDeleteClick = (id: string) => {
  itemToDelete.value = id;
  isDeleteModalOpen.value = true;
};

const confirmDelete = async () => {
  if (!itemToDelete.value) return;
  try {
    await usersApi.delete(itemToDelete.value);
    toast.success('User deleted successfully');
    isDeleteModalOpen.value = false;
    itemToDelete.value = null;
    await fetchData();
  } catch (error) {
    console.error('Failed to delete user:', error);
    toast.error('Failed to delete user');
  }
};

// --- Columns ---
const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'firstName', // Using firstName as primary sort/display key along with lastName
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Name', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
      );
    },
    cell: ({ row }) => {
      const u = row.original;
      const name = u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username;
      return h('div', { class: 'font-medium' }, name);
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Email', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
      );
    },
    cell: ({ row }) => h('div', row.getValue('email')),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const roleVal = row.getValue('role') as string;
      const label = getRoleLabel(roleVal);
      // Use different color variants if needed, or simple outline
      return h(Badge, { variant: 'outline' }, () => label);
    },
  },
  {
    accessorKey: 'department',
    header: 'Department',
    cell: ({ row }) => h('div', row.getValue('department') || '-'),
  },
  {
    accessorKey: 'position',
    header: 'Position',
    cell: ({ row }) => h('div', row.getValue('position') || '-'),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const colorClass =
        status === 'ACTIVE'
          ? 'bg-emerald-500/10 text-emerald-500'
          : status === 'SUSPENDED'
            ? 'bg-orange-500/10 text-orange-500'
            : 'bg-muted text-muted-foreground';

      return h(
        'span',
        {
          class: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`,
        },
        status
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    header: () => h('div', { class: 'text-right' }, 'Actions'),
    cell: ({ row }) => {
      const item = row.original;
      return h('div', { class: 'flex items-center justify-end gap-2' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-muted-foreground hover:text-foreground',
            onClick: () => handleOpenEdit(item),
          },
          () => h(Edit, { class: 'h-4 w-4' })
        ),
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 text-muted-foreground hover:text-destructive',
            onClick: () => handleDeleteClick(item.id),
          },
          () => h(Trash2, { class: 'h-4 w-4' })
        ),
      ]);
    },
  },
];

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-6 space-y-8 max-w-[1600px] mx-auto">
    <!-- Header / Stats -->
    <div
      class="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 rounded-xl border border-border bg-card shadow-sm relative overflow-hidden"
    >
      <div class="absolute top-1/2 right-12 -translate-y-1/2 pointer-events-none opacity-5">
        <Users class="w-64 h-64" />
      </div>
      <div class="md:col-span-2 flex items-center gap-6 z-10">
        <div
          class="p-4 bg-primary/10 rounded-xl text-primary flex items-center justify-center h-16 w-16"
        >
          <Users class="h-8 w-8" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-foreground">Users Management</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Manage system users, roles, and permissions.
          </p>
        </div>
      </div>
      <div class="md:col-span-2 flex items-center justify-between gap-8 z-10 pl-8 border-l">
        <div class="text-center">
          <div class="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Total
          </div>
          <div class="text-3xl font-bold">{{ stats.total }}</div>
        </div>
        <div class="text-center">
          <div class="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Active</div>
          <div class="text-3xl font-bold text-emerald-500">{{ stats.active }}</div>
        </div>
        <div class="text-center">
          <div class="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">
            Suspended
          </div>
          <div class="text-3xl font-bold text-orange-500">{{ stats.suspended }}</div>
        </div>
        <div class="ml-auto">
          <Button @click="handleOpenCreate" size="lg" class="shadow-lg shadow-primary/20">
            <Plus class="mr-2 h-5 w-5" />
            Add New
          </Button>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-between gap-4">
      <div class="relative w-full max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Search users..." class="pl-9" />
      </div>
      <div class="flex items-center gap-2">
        <Select v-model="filterRole">
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem v-for="option in ROLE_OPTIONS" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="filterStatus">
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Data Display -->
    <DataTable :columns="columns" :data="filteredData" />

    <!-- Create/Edit Modal -->
    <Dialog v-model:open="isModalOpen">
      <DialogContent class="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{{ editingItem ? 'Edit User' : 'Add New User' }}</DialogTitle>
          <DialogDescription>Fill in the user details below.</DialogDescription>
        </DialogHeader>

        <Tabs default-value="basic" class="w-full">
          <TabsList class="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="work">Work Info</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <!-- Basic Info -->
          <TabsContent value="basic" class="space-y-4 py-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Username</Label>
                <Input v-model="formData.username" placeholder="jdoe" />
              </div>
              <div class="space-y-2">
                <Label>Email</Label>
                <Input v-model="formData.email" type="email" placeholder="john@example.com" />
              </div>
              <div class="space-y-2">
                <Label>First Name</Label>
                <Input v-model="formData.firstName" />
              </div>
              <div class="space-y-2">
                <Label>Last Name</Label>
                <Input v-model="formData.lastName" />
              </div>
              <div class="col-span-2 space-y-2">
                <Label>Display Name</Label>
                <Input v-model="formData.displayName" />
              </div>
            </div>
          </TabsContent>

          <!-- Work Info -->
          <TabsContent value="work" class="space-y-4 py-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Employee ID</Label>
                <Input v-model="formData.employeeId" placeholder="EMP-001" />
              </div>
              <div class="space-y-2">
                <Label>Role</Label>
                <Select v-model="formData.role">
                  <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="option in ROLE_OPTIONS"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-2">
                <Label>Department</Label>
                <Select v-model="formData.department">
                  <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="dept in DEPARTMENT_OPTIONS" :key="dept" :value="dept">
                      {{ dept }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-2">
                <Label>Position</Label>
                <Select v-model="formData.position">
                  <SelectTrigger><SelectValue placeholder="Select Position" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="pos in POSITION_OPTIONS" :key="pos" :value="pos">
                      {{ pos }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <!-- Security -->
          <TabsContent value="security" class="space-y-4 py-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Status</Label>
                <Select v-model="formData.status">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div v-if="!editingItem" class="space-y-2">
                <Label>Password</Label>
                <Input v-model="formData.password" type="password" placeholder="••••••" />
              </div>
              <div class="flex items-center space-x-2 mt-8">
                <input
                  type="checkbox"
                  id="forcePwd"
                  v-model="formData.forceChangePassword"
                  class="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <Label for="forcePwd">Force Password Change on Next Login</Label>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" @click="isModalOpen = false">Cancel</Button>
          <Button @click="handleSubmit">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation -->
    <Dialog v-model:open="isDeleteModalOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete User?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="isDeleteModalOpen = false">Cancel</Button>
          <Button variant="destructive" @click="confirmDelete">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
