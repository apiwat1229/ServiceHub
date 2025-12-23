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
import { CardContent } from '@/components/ui/card';
import DataTable from '@/components/ui/data-table/DataTable.vue';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { rolesApi } from '@/services/roles';
import { usersApi, type User } from '@/services/users';
import type { RoleDto, UpdateRoleDto } from '@my-app/types';
import type { ColumnDef } from '@tanstack/vue-table';
import {
  Briefcase,
  Edit2,
  Layers,
  Lock,
  MoreHorizontal,
  Plus,
  Shield,
  Trash2,
  User as UserIcon,
  Users,
} from 'lucide-vue-next';
import { computed, h, onMounted, ref } from 'vue';
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

// Helper function to get gradient colors for roles
const getRoleGradient = (colorClass: string | undefined) => {
  const colorMap: Record<string, { from: string; to: string; shadow: string }> = {
    'bg-blue-600': { from: '#2563eb', to: '#1e40af', shadow: 'rgba(37, 99, 235, 0.5)' },
    'bg-purple-600': { from: '#9333ea', to: '#7e22ce', shadow: 'rgba(147, 51, 234, 0.5)' },
    'bg-emerald-500': { from: '#10b981', to: '#059669', shadow: 'rgba(16, 185, 129, 0.5)' },
    'bg-orange-500': { from: '#f97316', to: '#ea580c', shadow: 'rgba(249, 115, 22, 0.5)' },
    'bg-orange-400': { from: '#fb923c', to: '#f97316', shadow: 'rgba(251, 146, 60, 0.5)' },
    'bg-indigo-500': { from: '#6366f1', to: '#4f46e5', shadow: 'rgba(99, 102, 241, 0.5)' },
    'bg-indigo-400': { from: '#818cf8', to: '#6366f1', shadow: 'rgba(129, 140, 248, 0.5)' },
    'bg-green-500': { from: '#22c55e', to: '#16a34a', shadow: 'rgba(34, 197, 94, 0.5)' },
    'bg-slate-500': { from: '#64748b', to: '#475569', shadow: 'rgba(100, 116, 139, 0.5)' },
  };

  return (
    colorMap[colorClass || ''] || {
      from: '#94a3b8',
      to: '#64748b',
      shadow: 'rgba(148, 163, 184, 0.5)',
    }
  );
};

// --- Types ---
interface RoleWithMetadata extends RoleDto {
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

// Modals
const viewingRole = ref<RoleWithMetadata | null>(null);
const deleteId = ref<string | null>(null);

// Table columns for user assignment
const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }) => {
      const user = row.original;
      return h('div', { class: 'flex items-center gap-3' }, [
        h(Avatar, { class: 'w-9 h-9 border' }, () => [
          h(AvatarImage, { src: user.avatar || '' }),
          h(AvatarFallback, {}, user.firstName?.charAt(0) || 'U'),
        ]),
        h('div', { class: 'flex flex-col' }, [
          h(
            'span',
            { class: 'font-medium text-sm' },
            `${user.firstName || ''} ${user.lastName || ''}`
          ),
          h('span', { class: 'text-xs text-muted-foreground' }, user.employeeId || user.email),
        ]),
      ]);
    },
  },
  {
    accessorKey: 'department',
    header: 'Department',
    cell: ({ row }) =>
      h(Badge, { variant: 'outline', class: 'font-normal' }, () => row.original.department || '-'),
  },
  {
    accessorKey: 'position',
    header: 'Position',
    cell: ({ row }) =>
      h(Badge, { variant: 'outline', class: 'font-normal' }, () => row.original.position || '-'),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(
        Badge,
        { variant: row.original.status === 'ACTIVE' ? 'default' : 'secondary' },
        () => row.original.status
      ),
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right' }, 'Action'),
    cell: ({ row }) => {
      const user = row.original;
      const isAssigned = user.role === viewingRole.value?.id;

      return h('div', { class: 'text-right' }, [
        isAssigned
          ? h(
              Button,
              {
                variant: 'ghost',
                size: 'sm',
                class: 'h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50',
                onClick: () => handleRemoveUserFromRole(user.id),
              },
              () => h(Trash2, { class: 'w-4 h-4' })
            )
          : h(
              Button,
              {
                variant: 'ghost',
                size: 'sm',
                class: 'h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50',
                onClick: () => handleAssignUserToRole(user.id),
              },
              () => [h(Plus, { class: 'w-4 h-4 mr-1' }), 'Assign']
            ),
      ]);
    },
  },
];

// --- Computed ---
const assignedUsersCount = computed(
  () => users.value.filter((u) => u.role && (u.role as string) !== '').length
);
const unassignedUsersCount = computed(
  () => users.value.filter((u) => !u.role || (u.role as string) === '').length
);

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
    roles.value = baseRoles
      .map((role: any) => {
        const roleUsers = usersData.filter((u: any) => u.role === role.id);

        return {
          ...role,
          usersCount: roleUsers.length,
          avatars: roleUsers.map((u: User) => u.avatar || ''),
          permissions: role.permissions || {},
        };
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
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

const handleCreateRole = () => {
  // Initialize empty role for creation
  editingRole.value = {
    name: '',
    description: '',
    icon: 'User',
    color: 'bg-slate-500',
    permissions: {},
  };
  isRoleModalOpen.value = true;
};

const handleSaveRole = async () => {
  if (!editingRole.value) return;

  try {
    // Deep clone permissions to ensure a plain JSON object is sent
    const permissionsPayload = JSON.parse(JSON.stringify(editingRole.value.permissions || {}));

    if (editingRole.value.id) {
      // Update existing role
      const updateDto: UpdateRoleDto = {
        name: editingRole.value.name,
        description: editingRole.value.description || '',
        permissions: permissionsPayload,
        color: editingRole.value.color,
        icon: editingRole.value.icon,
      };
      await rolesApi.update(editingRole.value.id, updateDto);
    } else {
      // Create new role
      const createDto = {
        name: editingRole.value.name!,
        description: editingRole.value.description || '',
        permissions: permissionsPayload,
        color: editingRole.value.color || 'bg-slate-500',
        icon: editingRole.value.icon || 'User',
      };
      await rolesApi.create(createDto);
    }

    toast.success(t('common.success'));
    isRoleModalOpen.value = false;
    await fetchData();
  } catch (error) {
    console.error('Failed to save role', error);
    toast.error(t('common.error'));
  }
  isRoleModalOpen.value = false;
};

const isDeleteUserModalOpen = ref(false);
const userToDeleteId = ref<string | null>(null);

// --- Delete User from Role ---
const handleRemoveUserFromRole = (userId: string) => {
  userToDeleteId.value = userId;
  isDeleteUserModalOpen.value = true;
};

const confirmRemoveUser = async () => {
  if (!userToDeleteId.value) return;

  try {
    // Set role to empty string to mark as unassigned (Prisma schema requires non-null string)
    await usersApi.update(userToDeleteId.value, { role: '' } as any);

    // Refresh data
    await fetchData();
    toast.success(t('common.success'));
  } catch (error) {
    console.error('Failed to remove user from role:', error);
    toast.error(t('common.error'));
  } finally {
    isDeleteUserModalOpen.value = false;
    userToDeleteId.value = null;
  }
};

// --- Assign User to Role ---
const handleAssignUserToRole = async (userId: string) => {
  if (!viewingRole.value?.id) return;

  try {
    // Assign user to the current viewing role
    await usersApi.update(userId, { role: viewingRole.value.id } as any);

    // Refresh data
    await fetchData();
    toast.success(t('common.success'));
  } catch (error) {
    console.error('Failed to assign user to role:', error);
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
  <div>
    <div class="space-y-6">
      <!-- Stats / Header Card -->
      <div
        class="rounded-xl border border-border/60 bg-card/40 backdrop-blur-xl p-6 relative overflow-hidden shadow-sm"
      >
        <div class="absolute top-1/2 right-12 -translate-y-1/2 pointer-events-none opacity-[0.03]">
          <Shield class="w-64 h-64 rotate-12" />
        </div>

        <div class="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div class="flex items-center gap-4 w-full md:w-auto">
            <div
              class="h-12 w-12 flex items-center justify-center bg-blue-100/50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 shadow-sm backdrop-blur-sm"
            >
              <Shield class="h-6 w-6" />
            </div>
            <div>
              <h1 class="text-xl font-bold tracking-tight text-foreground">
                {{ t('admin.roles.title') }}
              </h1>
              <p class="text-sm text-muted-foreground mt-0.5">{{ t('admin.roles.subtitle') }}</p>
            </div>
          </div>

          <div
            class="flex items-center gap-8 md:gap-12 justify-center md:justify-end text-center w-full md:w-auto"
          >
            <div>
              <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                {{ t('admin.roles.totalRoles') }}
              </p>
              <p class="text-2xl font-bold text-foreground">{{ roles.length }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                {{ t('admin.roles.assignedUsers') }}
              </p>
              <p class="text-2xl font-bold text-emerald-600">{{ assignedUsersCount }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">
                {{ t('admin.roles.unassigned') }}
              </p>
              <p class="text-2xl font-bold text-orange-500">{{ unassignedUsersCount }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full xl:w-auto justify-end">
            <!-- Add Role Button -->
            <Button
              @click="handleCreateRole"
              class="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 font-medium text-sm"
            >
              <Plus class="w-4 h-4 mr-2" />
              {{ t('admin.roles.addRole') }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Roles Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="role in roles"
          :key="role.id"
          class="group flex flex-col justify-between rounded-lg border-2 border-border bg-card/20 backdrop-blur-md p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-border/80 relative overflow-hidden"
        >
          <!-- Watermark Icon -->
          <component
            :is="getRoleIcon(role.icon)"
            class="absolute -right-3 -bottom-3 w-20 h-20 opacity-[0.03] group-hover:opacity-20 rotate-[-15deg] transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-5deg] pointer-events-none"
            :style="{
              color: getRoleGradient(role.color).from,
            }"
          />

          <CardContent class="p-0 z-10">
            <div class="flex justify-between items-start mb-3">
              <!-- Beautiful Icon Container with Gradient -->
              <div
                class="relative h-12 w-12 flex items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg"
                :style="{
                  background: `linear-gradient(135deg, ${getRoleGradient(role.color).from} 0%, ${getRoleGradient(role.color).to} 100%)`,
                  boxShadow: `0 10px 25px -5px ${getRoleGradient(role.color).shadow}, 0 8px 10px -6px ${getRoleGradient(role.color).shadow}`,
                }"
              >
                <component :is="getRoleIcon(role.icon)" class="w-6 h-6 text-white drop-shadow-md" />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-full"
                  >
                    <MoreHorizontal class="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  class="rounded-lg border-border/60 backdrop-blur-md bg-card/90"
                >
                  <DropdownMenuItem @click="viewingRole = role">
                    <Users class="w-4 h-4 mr-2" />
                    {{ t('admin.roles.assignUsers') }}
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="handleEditRole(role)">
                    <Edit2 class="w-4 h-4 mr-2" />
                    {{ t('admin.roles.editRole') }}
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

            <h3 class="font-bold text-base mb-0.5 text-foreground tracking-tight">
              {{ role.name }}
            </h3>
            <p class="text-[11px] text-muted-foreground line-clamp-2 h-7 mb-2 leading-relaxed">
              {{ role.description }}
            </p>

            <div
              class="flex items-center justify-between pt-2.5 border-t border-dashed border-border/40 mt-auto"
            >
              <div class="flex -space-x-2 hover:space-x-1 transition-all duration-300">
                <template v-for="(avatar, i) in role.avatars?.slice(0, 3)" :key="i">
                  <Avatar
                    class="w-6 h-6 border-2 border-background ring-2 ring-background transition-transform hover:scale-110 hover:z-10"
                  >
                    <AvatarImage :src="avatar" />
                    <AvatarFallback class="text-[9px] bg-muted text-muted-foreground font-bold"
                      >U{{ i + 1 }}</AvatarFallback
                    >
                  </Avatar>
                </template>
                <div
                  v-if="(role.usersCount || 0) > 3"
                  class="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground z-0 pl-0.5"
                >
                  +{{ (role.usersCount || 0) - 3 }}
                </div>
              </div>

              <Badge variant="secondary" class="text-[10px] px-2 py-0.5 font-semibold">
                {{ role.usersCount || 0 }} {{ t('common.users') }}
              </Badge>
            </div>
          </CardContent>
        </div>
      </div>
    </div>

    <!-- Edit Role Modal -->
    <Dialog :open="isRoleModalOpen" @update:open="isRoleModalOpen = $event">
      <DialogContent class="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle v-if="editingRole?.id"
            >{{ t('admin.roles.editRole') }}:
            <span class="text-primary">{{ editingRole?.name }}</span></DialogTitle
          >
          <DialogTitle v-else>{{ t('admin.roles.createRole') }}</DialogTitle>
          <DialogDescription>{{ t('admin.roles.editDescription') }}</DialogDescription>
        </DialogHeader>

        <div class="py-6 space-y-6" v-if="editingRole">
          <!-- Basic Info Section -->
          <div class="space-y-4 pb-6 border-b">
            <h3 class="text-lg font-semibold">{{ t('admin.roles.basicInfo') }}</h3>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>{{ t('admin.roles.roleName') }} *</Label>
                <Input
                  :model-value="editingRole.name || ''"
                  @update:model-value="
                    (val: string | number) => {
                      if (editingRole) editingRole.name = String(val);
                    }
                  "
                  :placeholder="t('admin.roles.roleNamePlaceholder')"
                  required
                />
              </div>

              <div class="space-y-2">
                <Label>{{ t('admin.roles.description') }}</Label>
                <Input
                  :model-value="editingRole.description || ''"
                  @update:model-value="
                    (val: string | number) => {
                      if (editingRole) editingRole.description = String(val);
                    }
                  "
                  :placeholder="t('admin.roles.descriptionPlaceholder')"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>{{ t('admin.roles.icon') }}</Label>
                <Select
                  :model-value="editingRole.icon || 'User'"
                  @update:model-value="
                    (val: string) => {
                      if (editingRole) editingRole.icon = val;
                    }
                  "
                >
                  <SelectTrigger>
                    <SelectValue :placeholder="t('admin.roles.selectIcon')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shield">Shield (Admin)</SelectItem>
                    <SelectItem value="Briefcase">Briefcase (Manager)</SelectItem>
                    <SelectItem value="Users">Users (Supervisor)</SelectItem>
                    <SelectItem value="User">User (Staff)</SelectItem>
                    <SelectItem value="Layers">Layers (Operator)</SelectItem>
                    <SelectItem value="Lock">Lock (Security)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label>{{ t('admin.roles.color') }}</Label>
                <Select
                  :model-value="editingRole.color || 'bg-slate-500'"
                  @update:model-value="
                    (val: string) => {
                      if (editingRole) editingRole.color = val;
                    }
                  "
                >
                  <SelectTrigger>
                    <SelectValue :placeholder="t('admin.roles.selectColor')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bg-blue-600">Blue</SelectItem>
                    <SelectItem value="bg-purple-600">Purple</SelectItem>
                    <SelectItem value="bg-emerald-500">Emerald</SelectItem>
                    <SelectItem value="bg-orange-500">Orange</SelectItem>
                    <SelectItem value="bg-indigo-500">Indigo</SelectItem>
                    <SelectItem value="bg-green-500">Green</SelectItem>
                    <SelectItem value="bg-slate-500">Slate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isRoleModalOpen = false">{{
            t('common.cancel')
          }}</Button>
          <Button @click="handleSaveRole">{{ t('common.save') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- View Users / Assign Modal -->
    <Dialog :open="!!viewingRole" @update:open="if (!$event) viewingRole = null;">
      <DialogContent class="sm:max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <div class="flex items-center gap-3">
            <div
              class="h-10 w-10 flex items-center justify-center rounded-lg shadow-sm"
              :class="[
                viewingRole?.color?.replace('bg-', 'bg-opacity-10 bg-') || 'bg-slate-100',
                viewingRole?.color?.replace('bg-', 'text-') || 'text-slate-600',
              ]"
            >
              <component :is="getRoleIcon(viewingRole?.icon)" class="w-5 h-5" />
            </div>
            <div>
              <DialogTitle class="text-xl">{{ viewingRole?.name }}</DialogTitle>
              <DialogDescription>{{ t('admin.roles.assignUsersDesc') }}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs default-value="assigned" class="mt-4">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="assigned" class="relative">
              Assigned Users
              <Badge
                v-if="users.filter((u) => u.role === viewingRole?.id).length > 0"
                class="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {{ users.filter((u) => u.role === viewingRole?.id).length }}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="available" class="relative">
              Available Users
              <Badge
                v-if="
                  users.filter((u) => !(u.role as string) || (u.role as string) === '').length > 0
                "
                variant="secondary"
                class="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {{ users.filter((u) => !(u.role as string) || (u.role as string) === '').length }}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" class="mt-4">
            <DataTable
              :columns="userColumns"
              :data="users.filter((u) => (u.role as string) === viewingRole?.id)"
            />
          </TabsContent>

          <TabsContent value="available" class="mt-4">
            <DataTable
              :columns="userColumns"
              :data="users.filter((u) => !(u.role as string) || (u.role as string) === '')"
            />
          </TabsContent>
        </Tabs>

        <DialogFooter class="mt-4">
          <Button variant="outline" @click="viewingRole = null">{{ t('common.close') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Modal -->
    <AlertDialog :open="!!deleteId" @update:open="if (!$event) deleteId = null;">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('admin.roles.deleteConfirm') }}</AlertDialogTitle>
          <AlertDialogDescription>{{ t('admin.roles.deleteMessage') }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="deleteId = null">{{ t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 hover:bg-red-700 focus:ring-red-600 border-0 text-white"
            @click="handleDeleteRole"
          >
            {{ t('common.delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Confirm Remove User Dialog -->
    <AlertDialog
      :open="isDeleteUserModalOpen"
      @update:open="if (!$event) isDeleteUserModalOpen = false;"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('admin.roles.confirmRemoveUser') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('admin.roles.confirmRemoveUserDesc') }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteUserModalOpen = false">{{
            t('common.cancel')
          }}</AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 hover:bg-red-700 focus:ring-red-600 border-0 text-white"
            @click="confirmRemoveUser"
          >
            {{ t('common.confirm') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
