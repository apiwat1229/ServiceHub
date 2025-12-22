<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { rolesApi } from '@/services/roles';
import { usersApi, type User } from '@/services/users';
import type { Role, UpdateRoleDto } from '@my-app/types';
import {
  Briefcase,
  Edit2,
  Layers,
  Lock,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Trash2,
  User as UserIcon,
  Users,
} from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

const { t } = useI18n();

// --- Constants ---
const ICON_MAP: Record<string, any> = {
  Shield,
  Briefcase,
  User: UserIcon,
  Users,
  Layers,
  Lock,
};

// Initial Mock Roles (Fallback)
const INITIAL_ROLES = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access and configuration',
    icon: 'Shield',
    color: 'bg-blue-600',
  },
  {
    id: 'md',
    name: 'Managing Director',
    description: 'Executive oversight and approval',
    icon: 'Briefcase',
    color: 'bg-purple-600',
  },
  {
    id: 'gm',
    name: 'General Manager',
    description: 'General management and strategy',
    icon: 'Briefcase',
    color: 'bg-purple-500',
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Departmental management',
    icon: 'Briefcase',
    color: 'bg-orange-500',
  },
  {
    id: 'asst_mgr',
    name: 'Assistant Manager',
    description: 'Support departmental management',
    icon: 'Briefcase',
    color: 'bg-orange-400',
  },
  {
    id: 'senior_sup',
    name: 'Senior Supervisor',
    description: 'Senior team supervision',
    icon: 'Users',
    color: 'bg-indigo-500',
  },
  {
    id: 'supervisor',
    name: 'Supervisor',
    description: 'Team supervision and operations',
    icon: 'Users',
    color: 'bg-indigo-400',
  },
  {
    id: 'senior_staff_2',
    name: 'Senior Staff 2',
    description: 'Advanced operational tasks',
    icon: 'User',
    color: 'bg-green-500',
  },
  {
    id: 'senior_staff_1',
    name: 'Senior Staff 1',
    description: 'Advanced operational tasks',
    icon: 'User',
    color: 'bg-green-500',
  },
  {
    id: 'staff_2',
    name: 'Staff 2',
    description: 'Standard operations',
    icon: 'User',
    color: 'bg-emerald-500',
  },
  {
    id: 'staff_1',
    name: 'Staff 1',
    description: 'Standard operations',
    icon: 'User',
    color: 'bg-emerald-500',
  },
  {
    id: 'op_leader',
    name: 'Operator Leader',
    description: 'Line leadership',
    icon: 'Layers',
    color: 'bg-slate-500',
  },
];

const PERMISSION_MODULES = [
  { id: 'users', label: 'User Management' },
  { id: 'roles', label: 'Roles & Permissions' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'rubber_types', label: 'Rubber Types' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'bookings', label: 'Booking Queue' },
];

const PERMISSION_ACTIONS = ['read', 'create', 'update', 'delete', 'approve'];

// --- Types ---
interface RoleWithMetadata extends Role {
  usersCount?: number;
  avatars?: string[];
}

// --- State ---
const roles = ref<RoleWithMetadata[]>([]);
const users = ref<User[]>([]);
const isLoading = ref(true);
const isRoleModalOpen = ref(false);
// Use RoleWithMetadata for consistency, though editing might only need Role fields
const editingRole = ref<Partial<RoleWithMetadata> | null>(null);
const searchTerm = ref('');

// Modals
const viewingRole = ref<RoleWithMetadata | null>(null);
const deleteId = ref<string | null>(null);

// --- Computed ---
const assignedUsersCount = computed(() => users.value.filter((u) => u.role).length);
const unassignedUsersCount = computed(() => users.value.filter((u) => !u.role).length);

// --- Methods ---

const fetchData = async () => {
  try {
    isLoading.value = true;
    const [usersData, rolesData] = await Promise.all([
      usersApi.getAll(),
      rolesApi.getAll().catch(() => []),
    ]);
    users.value = usersData;

    // Merge API roles with INITIAL_ROLES logic
    const baseRoles = rolesData.length > 0 ? rolesData : INITIAL_ROLES;

    // Map users count
    roles.value = baseRoles.map((role: any) => {
      const roleUsers = usersData.filter((u: any) => u.role === role.id);
      return {
        ...role,
        usersCount: roleUsers.length,
        avatars: roleUsers.map((u: User) => u.avatar || ''),
        permissions: role.permissions || {},
      };
    });
  } catch (error) {
    console.error('Failed to fetch data', error);
    toast.error(t('common.errorLoading'));
  } finally {
    isLoading.value = false;
  }
};

const getRoleIcon = (iconName?: string) => {
  if (!iconName) return Shield;
  return ICON_MAP[iconName] || Shield;
};

const handleEditRole = (role: RoleWithMetadata) => {
  // Deep copy to avoid mutating direct state
  editingRole.value = JSON.parse(JSON.stringify(role));
  isRoleModalOpen.value = true;
};

const handleSaveRole = async () => {
  if (!editingRole.value || !editingRole.value.id) return;

  try {
    const updateDto: UpdateRoleDto = {
      name: editingRole.value.name,
      description: editingRole.value.description || '',
      permissions: editingRole.value.permissions,
      color: editingRole.value.color,
      icon: editingRole.value.icon,
    };

    await rolesApi.update(editingRole.value.id, updateDto);
    toast.success(t('common.success'));
    isRoleModalOpen.value = false;
    fetchData();
  } catch (error) {
    console.error('Failed to save role', error);
    toast.error(t('common.error'));
  }
};

const togglePermission = (moduleId: string, action: string) => {
  if (!editingRole.value) return;
  if (!editingRole.value.permissions) editingRole.value.permissions = {};
  if (!editingRole.value.permissions[moduleId]) editingRole.value.permissions[moduleId] = {};

  editingRole.value.permissions[moduleId][action] =
    !editingRole.value.permissions[moduleId][action];
};

const handleRemoveUserFromRole = async (userId: string) => {
  try {
    await usersApi.update(userId, { role: 'staff_1' } as any); // Reset to default
    toast.success(t('common.success'));
    fetchData();
    // If viewing specific role users, might need to refresh that view logic?
    // Since `users` is reactive and used in the modal, it should update automatically.
  } catch (error) {
    console.error(error);
    toast.error(t('common.error'));
  }
};

// Start Delete Logic (Placeholder)
const handleDeleteRole = async () => {
  if (!deleteId.value) return;
  try {
    await rolesApi.delete(deleteId.value);
    toast.success(t('common.success'));
    fetchData();
  } catch (error) {
    console.error(error);
    toast.error('Failed to delete role');
  } finally {
    deleteId.value = null;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Stats / Header Card -->
    <Card class="p-6 border-border/60 shadow-sm relative overflow-hidden">
      <div class="absolute top-1/2 right-12 -translate-y-1/2 pointer-events-none opacity-5">
        <Shield class="w-64 h-64" />
      </div>

      <div class="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div class="flex items-center gap-6 w-full md:w-auto">
          <div
            class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400"
          >
            <Shield class="h-8 w-8" />
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight text-foreground">
              {{ t('admin.roles.title') }}
            </h1>
            <p class="text-sm text-muted-foreground mt-1">{{ t('admin.roles.subtitle') }}</p>
          </div>
        </div>

        <div
          class="flex items-center gap-8 md:gap-12 justify-center md:justify-end text-center w-full md:w-auto"
        >
          <div>
            <p class="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {{ t('admin.roles.totalRoles') }}
            </p>
            <p class="text-2xl font-bold">{{ roles.length }}</p>
          </div>
          <div>
            <p class="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
              {{ t('admin.roles.assignedUsers') }}
            </p>
            <p class="text-2xl font-bold text-emerald-600">{{ assignedUsersCount }}</p>
          </div>
          <div>
            <p class="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">
              {{ t('admin.roles.unassigned') }}
            </p>
            <p class="text-2xl font-bold text-orange-500">{{ unassignedUsersCount }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 w-full xl:w-auto justify-end">
          <!-- Add Role Button (Mock) -->
          <Button
            @click="handleEditRole({} as any)"
            class="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
          >
            <Plus class="w-4 h-4 mr-2" />
            {{ t('admin.roles.addRole') }}
          </Button>
        </div>
      </div>
    </Card>

    <!-- Roles Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <Card
        v-for="role in roles"
        :key="role.id"
        class="flex flex-col justify-between hover:shadow-md transition-shadow"
      >
        <CardContent class="p-6 pt-6">
          <!-- Removed default CardHeader padding issues by using Content directly or customize -->
          <div class="flex justify-between items-start mb-4">
            <div
              :class="`p-3 rounded-xl ${role.color?.replace('bg-', 'bg-opacity-10 bg-') || 'bg-slate-100'} text-foreground`"
            >
              <component :is="getRoleIcon(role.icon)" class="w-6 h-6" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground">
                  <MoreHorizontal class="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="handleEditRole(role)">
                  <Edit2 class="w-4 h-4 mr-2" />
                  {{ t('roles.editRole') }}
                </DropdownMenuItem>
                <DropdownMenuItem @click="viewingRole = role">
                  <Users class="w-4 h-4 mr-2" />
                  {{ t('roles.assignUsers') }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  @click="deleteId = role.id"
                  class="text-red-600 focus:text-red-600"
                >
                  <Trash2 class="w-4 h-4 mr-2" />
                  {{ t('common.delete') }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <h3 class="font-bold text-lg mb-1">{{ role.name }}</h3>
          <p class="text-sm text-muted-foreground line-clamp-2 h-10 mb-6">
            {{ role.description }}
          </p>

          <div
            class="flex items-center justify-between pt-4 border-t border-dashed border-border mt-auto"
          >
            <div class="flex -space-x-2">
              <template v-for="(avatar, i) in role.avatars?.slice(0, 3)" :key="i">
                <Avatar class="w-8 h-8 border-2 border-background">
                  <AvatarImage :src="avatar" />
                  <AvatarFallback>U{{ i + 1 }}</AvatarFallback>
                </Avatar>
              </template>
              <div
                v-if="(role.usersCount || 0) > 3"
                class="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium"
              >
                +{{ (role.usersCount || 0) - 3 }}
              </div>
            </div>
            <span class="text-sm text-muted-foreground font-medium"
              >{{ role.usersCount }} {{ t('common.users') }}</span
            >
          </div>
        </CardContent>
      </Card>
    </div>
  </div>

  <!-- Edit Role Modal -->
  <Dialog :open="isRoleModalOpen" @update:open="isRoleModalOpen = $event">
    <DialogContent class="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle
          >{{ t('admin.roles.editRole') }}:
          <span class="text-primary">{{ editingRole?.name }}</span></DialogTitle
        >
        <DialogDescription>{{ t('admin.roles.editDescription') }}</DialogDescription>
      </DialogHeader>

      <div class="py-6 space-y-6" v-if="editingRole">
        <!-- Basic Info inputs could go here if editable name/desc is allowed, skipping for permission focus -->

        <div>
          <h3 class="text-lg font-semibold mb-4">{{ t('admin.roles.roleAccess') }}</h3>
          <div class="border border-border/40 rounded-xl overflow-hidden shadow-sm bg-card">
            <!-- Header -->
            <div
              class="grid grid-cols-6 gap-4 p-4 bg-muted/40 border-b border-border/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <div class="col-span-1 pl-2">Module</div>
              <div v-for="action in PERMISSION_ACTIONS" :key="action" class="text-center">
                {{ action }}
              </div>
            </div>

            <!-- Rows -->
            <div class="divide-y divide-border/40">
              <div
                v-for="module in PERMISSION_MODULES"
                :key="module.id"
                class="grid grid-cols-6 gap-4 p-4 hover:bg-muted/30 items-center"
              >
                <span class="font-medium col-span-1 text-sm pl-2">{{ module.label }}</span>
                <div v-for="action in PERMISSION_ACTIONS" :key="action" class="flex justify-center">
                  <Checkbox
                    :checked="editingRole.permissions?.[module.id]?.[action] || false"
                    @update:checked="togglePermission(module.id, action)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isRoleModalOpen = false">{{ t('common.cancel') }}</Button>
        <Button @click="handleSaveRole">{{ t('common.save') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- View Users / Assign Modal -->
  <Dialog :open="!!viewingRole" @update:open="if (!$event) viewingRole = null;">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{{ t('common.users') }} in {{ viewingRole?.name }}</DialogTitle>
        <DialogDescription>{{ t('admin.roles.assignUsersDesc') }}</DialogDescription>
      </DialogHeader>

      <div class="py-4">
        <div class="mb-4 relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input v-model="searchTerm" :placeholder="t('common.search')" class="pl-9" />
        </div>

        <div class="border rounded-md max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead class="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="user in users.filter((u) => u.role === viewingRole?.id)"
                :key="user.id"
              >
                <TableCell class="flex items-center gap-2">
                  <Avatar class="w-6 h-6">
                    <AvatarImage :src="user.avatar || ''" />
                    <AvatarFallback>{{ user.firstName?.charAt(0) }}</AvatarFallback>
                  </Avatar>
                  <span class="font-medium text-sm">{{ user.firstName }} {{ user.lastName }}</span>
                </TableCell>
                <TableCell>{{ user.email }}</TableCell>
                <TableCell class="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-6 text-red-600 hover:text-red-700"
                    @click="handleRemoveUserFromRole(user.id)"
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow v-if="users.filter((u) => u.role === viewingRole?.id).length === 0">
                <TableCell colspan="3" class="text-center h-24 text-muted-foreground">
                  {{ t('common.noData') }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="viewingRole = null">{{ t('common.close') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Delete Confirmation Modal -->
  <Dialog :open="!!deleteId" @update:open="if (!$event) deleteId = null;">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('common.delete') }}</DialogTitle>
        <DialogDescription>{{ t('common.confirmDelete') }}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="deleteId = null">{{ t('common.cancel') }}</Button>
        <Button variant="destructive" @click="handleDeleteRole">{{ t('common.delete') }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
