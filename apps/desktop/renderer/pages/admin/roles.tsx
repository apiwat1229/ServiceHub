import {
  Briefcase,
  Check,
  Edit2,
  Eye,
  EyeOff,
  Layers,
  Lock,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import AdminLayout from '../../components/AdminLayout';
import ImageCropper from '../../components/ImageCropper';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DataTable } from '../../components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { rolesApi, usersApi } from '../../lib/api';
import { useUserColumns } from './users/columns';

// Mock Data for Roles (Integrated with Positions)
const INITIAL_ROLES = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access and configuration',
    usersCount: 0,
    icon: Shield,
    color: 'bg-blue-600',
    avatars: [] as string[],
  },
  {
    id: 'md',
    name: 'Managing Director',
    description: 'Executive oversight and approval',
    usersCount: 0,
    icon: Briefcase,
    color: 'bg-purple-600',
  },
  {
    id: 'gm',
    name: 'General Manager',
    description: 'General management and strategy',
    usersCount: 0,
    icon: Briefcase,
    color: 'bg-purple-500',
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Departmental management',
    usersCount: 0,
    icon: Briefcase,
    color: 'bg-orange-500',
  },
  {
    id: 'asst_mgr',
    name: 'Assistant Manager',
    description: 'Support departmental management',
    usersCount: 0,
    icon: Briefcase,
    color: 'bg-orange-400',
  },
  {
    id: 'senior_sup',
    name: 'Senior Supervisor',
    description: 'Senior team supervision',
    usersCount: 0,
    icon: Users,
    color: 'bg-indigo-500',
  },
  {
    id: 'supervisor',
    name: 'Supervisor',
    description: 'Team supervision and operations',
    usersCount: 0,
    icon: Users,
    color: 'bg-indigo-400',
  },
  {
    id: 'senior_staff_2',
    name: 'Senior Staff 2',
    description: 'Advanced operational tasks',
    usersCount: 0,
    icon: User,
    color: 'bg-green-500',
  },
  {
    id: 'senior_staff_1',
    name: 'Senior Staff 1',
    description: 'Advanced operational tasks',
    usersCount: 0,
    icon: User,
    color: 'bg-green-500',
  },
  {
    id: 'staff_2',
    name: 'Staff 2',
    description: 'Standard operations',
    usersCount: 0,
    icon: User,
    color: 'bg-emerald-500',
  },
  {
    id: 'staff_1',
    name: 'Staff 1',
    description: 'Standard operations',
    usersCount: 0,
    icon: User,
    color: 'bg-emerald-500',
  },
  {
    id: 'op_leader',
    name: 'Operator Leader',
    description: 'Line leadership',
    usersCount: 0,
    icon: Layers,
    color: 'bg-slate-500',
  },
];

// Resources or Modules to control
const PERMISSION_MODULES = [
  { id: 'users', label: 'User Management' },
  { id: 'roles', label: 'Roles & Permissions' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'rubber_types', label: 'Rubber Types' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'bookings', label: 'Booking Queue' },
];

const ICON_MAP: any = {
  Shield,
  Briefcase,
  User,
  Users,
  Layers,
  Lock,
};

export default function RolesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  /* const { toast } = useToast(); -> Removed for Sonner */
  const [isLoading, setIsLoading] = useState(true);

  // Roles State
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [viewingRole, setViewingRole] = useState<any>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false); // Renamed from isModalOpen
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // User Management State (Moved from UsersPage)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    avatar: '',
    firstName: '',
    lastName: '',
    department: '',
    position: '',
    hodId: '',
    role: 'staff_1', // Default to valid string role
    status: 'ACTIVE',
    password: '',
    confirmPassword: '',
    pinCode: '',
  });

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Avatar Cropper State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersData, rolesData] = await Promise.all([
        usersApi.getAll(),
        rolesApi.getAll().catch(() => []), // Fallback to empty if rolesApi fails initially
      ]);
      setUsers(usersData);

      // Use API roles if available, otherwise fallback to INITIAL_ROLES (for seeding check)
      // Ideally backend Seeds it, so rolesData should suffice.
      const baseRoles = rolesData.length > 0 ? rolesData : INITIAL_ROLES;

      // Update roles with real user counts
      const updatedRoles = baseRoles.map((role: any) => {
        const roleUsers = usersData.filter((u: any) => u.role === role.id);
        return {
          ...role,
          usersCount: roleUsers.length,
          avatars: roleUsers.map((u: any) => u.id),
          // Ensure permissions exist or default
          permissions: role.permissions || {},
        };
      });
      setRoles(updatedRoles);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error(t('common.error'), {
        description: 'Failed to fetch data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Create User via URL param
  useEffect(() => {
    if (router.query.create === 'true') {
      handleOpenCreateUser();
      const { create, ...query } = router.query;
      router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
    }
  }, [router.query]);

  // --- Roles Handlers ---
  const togglePermission = (moduleId: string, action: string) => {
    setEditingRole((prev: any) => {
      const currentPermissions = prev.permissions || {};
      const modulePermissions = currentPermissions[moduleId] || {};

      return {
        ...prev,
        permissions: {
          ...currentPermissions,
          [moduleId]: {
            ...modulePermissions,
            [action]: !modulePermissions[action],
          },
        },
      };
    });
  };

  const handleEditRole = (role: any) => {
    setEditingRole({ ...role });
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async () => {
    try {
      if (!editingRole) return;

      // Save to backend
      await rolesApi.update(editingRole.id, {
        name: editingRole.name,
        description: editingRole.description,
        permissions: editingRole.permissions,
        color: editingRole.color,
        icon: typeof editingRole.icon === 'string' ? editingRole.icon : undefined, // Handle if icon is component vs string
      });

      toast.success(t('common.toast.success'), {
        description: t('common.toast.createSuccess'),
      });
      setIsRoleModalOpen(false);
      fetchData(); // Changed from fetchRoles() to fetchData() to match existing function
    } catch (error) {
      console.error('Failed to save role:', error);
      toast.error(t('common.toast.error'), {
        description: t('common.toast.saveFailed'),
      });
    }
  };

  // --- Users Handlers ---
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      username: '',
      displayName: '',
      firstName: '',
      lastName: '',
      department: '',
      position: '',
      hodId: '',
      role: 'staff_1',
      status: 'ACTIVE',
      password: '',
      confirmPassword: '',
      pinCode: '',
      avatar: '',
    });
    setAvatarPreview('');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = async (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email || '',
      username: user.username || '',
      displayName: user.displayName || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      department: user.department || '',
      position: user.position || '',
      hodId: user.hodId || '',
      role: user.role || 'staff_1',
      status: user.status || 'ACTIVE',
      password: '',
      confirmPassword: '',
      pinCode: user.pinCode || '',
      avatar: user.avatar || '',
    });
    setAvatarPreview(user.avatar || '');
    setIsUserModalOpen(true);

    // Fetch full details for avatar
    try {
      const fullUser = await usersApi.getOne(user.id);
      if (fullUser.avatar) {
        setFormData((prev) => ({ ...prev, avatar: fullUser.avatar }));
        setAvatarPreview(fullUser.avatar);
      }
    } catch (error) {
      console.error('Failed to fetch full user details:', error);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteId) return;
    try {
      await usersApi.delete(deleteId);
      fetchData();
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(t('common.error'), {
        description: 'Failed to delete user',
      });
    }
  };

  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const missingFields = [];
    if (!formData.username) missingFields.push('username');
    if (!formData.role) missingFields.push('role');
    if (!formData.status) missingFields.push('status');
    if (!formData.department) missingFields.push('department');
    if (!formData.position) missingFields.push('position');

    if (missingFields.length > 0) {
      toast.error(t('common.error'), {
        description: t('admin.users.requiredFieldsError') || `Missing: ${missingFields.join(', ')}`,
      });
      return;
    }

    if (!editingUser && formData.password !== formData.confirmPassword) {
      toast.error(t('common.error'), {
        description: t('admin.users.passwordMismatch', "Passwords don't match!"),
      });
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    // toast({ title: t('common.loading'), description: 'Saving user...' }); // Removed redundant toast
    executeSaveUser();
  };

  const executeSaveUser = async () => {
    try {
      const payload = { ...formData };
      if (!payload.password) delete (payload as any).password;
      delete (payload as any).confirmPassword;
      if (!payload.hodId) delete (payload as any).hodId;
      if (!payload.pinCode) delete (payload as any).pinCode;

      if (editingUser) {
        await usersApi.update(editingUser.id, payload);
      } else {
        await usersApi.create(payload);
      }

      setIsUserModalOpen(false);
      setAvatarPreview('');
      fetchData();
      toast.success(t('common.toast.success'), {
        description: t('common.toast.updateSuccess'),
      });
    } catch (error: any) {
      console.error('Failed to save user:', error);
      toast.error(t('common.toast.error'), {
        description: t('common.toast.saveFailed'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t('common.toast.error'), {
          description: t('common.toast.imageSizeError'),
        });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description: t('admin.users.fileTypeError', 'Please select an image file'),
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingImage(reader.result as string);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setFormData({ ...formData, avatar: '' });
    setAvatarPreview('');
  };

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === 'ACTIVE').length,
      inactive: users.filter((u) => u.status === 'INACTIVE').length,
      suspended: users.filter((u) => u.status === 'SUSPENDED').length,
    };
  }, [users]);

  const columns = useUserColumns({
    onEdit: handleOpenEditUser,
    onDelete: (id) => setDeleteId(id),
  });

  const handleRemoveUserFromRole = async (userId: string) => {
    try {
      // 1. Update user role in backend to default 'staff_1' (or whatever default is safe)
      // Since we don't have "unassigned", we move them to base staff role or keep them but user requested remove.
      // I'll assume 'staff_1' is the base role.
      await usersApi.update(userId, { role: 'staff_1' });

      // 2. Refresh data
      await fetchData();
    } catch (error) {
      console.error('Failed to remove user from role:', error);
    }
  };

  const handleOpenAssignModal = (role: any) => {
    setEditingRole(role);
    setIsAssignUserModalOpen(true);
    // Optional: Close viewing modal if opening assign? Or keep both?
    // Usually better to keep one.
    setViewingRole(null);
  };

  const handleAddUserHeader = () => {
    // Top header button logic, mapped to same Create User handler
    handleOpenCreateUser();
  };

  return (
    <AdminLayout>
      <div className="p-6 w-full max-w-[1400px] mx-auto space-y-12">
        {/* SECTION 1: ROLES */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t('admin.roles.title', 'User Role and Permissions')}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span>{t('admin.sidebar.dashboard', 'Dashboard')}</span>
                <span>•</span>
                <span>{t('admin.roles.subtitle', 'Role Management & Permission')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                {t('admin.roles.addRole', 'Add New Role')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {roles.map((role) => (
              <Card
                key={role.id}
                className="p-6 flex flex-col justify-between hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${role.color?.replace('bg-', 'bg-').replace('500', '100').replace('600', '100').replace('400', '100')} ${role.color?.replace('bg-', 'text-')}`}
                    >
                      {(() => {
                        const Icon =
                          typeof role.icon === 'string' ? ICON_MAP[role.icon] || Shield : role.icon;
                        return <Icon className="w-6 h-6" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{role.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {role.description}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditRole(role)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        {t('admin.roles.editRole', 'Edit Role')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div
                    className="flex -space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setViewingRole(role)}
                  >
                    {role.avatars &&
                      role.avatars.slice(0, 4).map((userId: string) => {
                        const user = users.find((u) => u.id === userId);
                        return (
                          <div
                            key={userId}
                            className="w-8 h-8 rounded-full border-2 border-background bg-slate-200 flex items-center justify-center overflow-hidden relative z-10"
                          >
                            <img
                              src={
                                user?.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
                              }
                              alt="user"
                            />
                          </div>
                        );
                      })}
                    {(!role.avatars || role.avatars.length === 0) && (
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/20 bg-muted/10 flex items-center justify-center relative z-10">
                        <span className="text-[10px] text-muted-foreground">-</span>
                      </div>
                    )}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAssignModal(role);
                      }}
                      role="button"
                      className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/50 bg-muted/20 flex items-center justify-center hover:bg-muted transition-colors relative z-20"
                    >
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{role.usersCount} users</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* SECTION 2: USERS MANAGEMENT (Moved from users.tsx) */}
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6 flex flex-col xl:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
            {/* Left: Title & Icon */}
            <div className="flex items-center gap-4 w-full xl:w-auto">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl transition-transform hover:scale-105">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {t('admin.users.title', 'Users Management')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t('admin.users.subtitle', 'Manage user access, profiles, and permissions.')}
                </p>
              </div>
            </div>

            {/* Center: Stats Widget */}
            <div className="hidden md:flex items-center bg-background/50 rounded-xl border border-border p-1 shadow-sm">
              <div className="px-6 py-2 flex flex-col items-center min-w-[100px] border-r border-border/50 last:border-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t('admin.status.total', 'TOTAL')}
                </span>
                <span className="text-lg font-bold text-foreground">{stats.total}</span>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="px-6 py-2 flex flex-col items-center min-w-[100px]">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-green-600">
                  {t('admin.status.active', 'ACTIVE')}
                </span>
                <span className="text-lg font-bold text-green-600">{stats.active}</span>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="px-6 py-2 flex flex-col items-center min-w-[100px]">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-destructive">
                  {t('admin.status.inactive', 'INACTIVE')}
                </span>
                <span className="text-lg font-bold text-destructive">{stats.inactive}</span>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="px-6 py-2 flex flex-col items-center min-w-[100px]">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-orange-500">
                  {t('admin.status.suspended', 'SUSPENDED')}
                </span>
                <span className="text-lg font-bold text-orange-500">{stats.suspended}</span>
              </div>
            </div>

            {/* Right: Action Button */}
            <button
              onClick={handleOpenCreateUser}
              className="w-full xl:w-auto inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 h-11 px-8"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('admin.users.addUser', 'Add New User')}
            </button>
          </div>

          {/* Users Table */}
          <div className="rounded-xl border border-border bg-card text-card-foreground shadow">
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <DataTable columns={columns} data={users} />
            </div>
          </div>
        </div>

        {/* --- MODALS --- */}

        {/* View Role Users Modal */}
        <Dialog open={!!viewingRole} onOpenChange={(open) => !open && setViewingRole(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Users in {viewingRole?.name}</DialogTitle>
              <DialogDescription>Manage users assigned to this role.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="border border-border/40 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter((u) => u.role === viewingRole?.id)
                      .map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="flex items-center gap-3 py-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
                              <img
                                src={
                                  user.avatar ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                                }
                                alt="user"
                              />
                            </div>
                            <span className="font-medium">
                              {user.firstName} {user.lastName}
                            </span>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveUserFromRole(user.id)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {users.filter((u) => u.role === viewingRole?.id).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                          No users assigned to this role.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingRole(null)}>
                Close
              </Button>
              <Button onClick={() => handleOpenAssignModal(viewingRole)}>Add Users</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign User Modal */}
        <Dialog open={isAssignUserModalOpen} onOpenChange={setIsAssignUserModalOpen}>
          <DialogContent className="max-w-md p-0 overflow-hidden bg-background">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-xl font-bold tracking-tight">
                {t('admin.roles.assignUsers', 'Assign Users')}
              </DialogTitle>
              <DialogDescription>
                {t('admin.roles.assignUsersDesc', 'Select users to assign to this role.')}
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 pt-2 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('common.search', 'Search...')}
                  className="pl-9 bg-muted/30 border-muted-foreground/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="border border-border/40 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Role</TableHead>
                      <TableHead className="w-[50px] text-right">Assign</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter(
                        (user) =>
                          (user.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((user) => {
                        const userRole = INITIAL_ROLES.find((r) => r.id === user.role);
                        return (
                          <TableRow key={user.id} className="hover:bg-muted/30">
                            <TableCell className="flex items-center gap-3 py-2">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                <img
                                  src={
                                    user.avatar ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                                  }
                                  alt="user"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">{user.email || ''}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-2">
                              {userRole && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200`}
                                >
                                  {userRole.name}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right py-2">
                              <input
                                type="checkbox"
                                className="appearance-none w-5 h-5 border-2 border-muted-foreground/40 rounded bg-background checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer relative after:content-['✓'] after:absolute after:text-white after:text-xs after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:opacity-0 checked:after:opacity-100"
                                checked={user.role === editingRole?.id}
                                // In real app, toggle assignment here
                                onChange={() => {}}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {users.filter(
                      (user) =>
                        (user.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (user.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
                    ).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                          {t('common.noData', 'No data available')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter className="p-6 pt-2">
              <Button variant="outline" onClick={() => setIsAssignUserModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                className="bg-blue-600 text-white"
                onClick={() => setIsAssignUserModalOpen(false)}
              >
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Modal */}
        <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
          <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background">
            <DialogHeader className="p-8 pb-4 border-b border-border/50">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {t('admin.roles.editRole', 'Edit Role')} :{' '}
                <span className="text-primary">{editingRole?.name}</span>
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                {t('admin.roles.editDescription', 'Manage role access and permissions.')}
              </DialogDescription>
            </DialogHeader>

            <div className="p-8 space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-6">
                  {t('admin.roles.roleAccess', 'Role Access')}
                </h3>

                <div className="border border-border/40 rounded-xl overflow-hidden shadow-sm bg-card">
                  {/* Header Row */}
                  <div className="grid grid-cols-6 gap-4 p-4 bg-muted/40 border-b border-border/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <div className="col-span-1 text-left pl-2 flex items-center">Module</div>
                    <div className="text-center">Read</div>
                    <div className="text-center">Create</div>
                    <div className="text-center">Update</div>
                    <div className="text-center">Delete</div>
                    <div className="text-center">Approve</div>
                  </div>

                  {/* Permission Rows */}
                  <div className="divide-y divide-border/40 bg-card">
                    {PERMISSION_MODULES.map((module) => (
                      <div
                        key={module.id}
                        className="grid grid-cols-6 gap-4 p-4 hover:bg-muted/30 transition-colors items-center group"
                      >
                        <span className="font-medium col-span-1 text-sm text-foreground/80 group-hover:text-foreground pl-2 transition-colors">
                          {module.label}
                        </span>

                        {['read', 'create', 'update', 'delete', 'approve'].map((action) => (
                          <div key={action} className="flex justify-center">
                            <input
                              type="checkbox"
                              className="appearance-none w-5 h-5 border-2 border-muted-foreground/40 rounded bg-background checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer relative after:content-['✓'] after:absolute after:text-white after:text-xs after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:opacity-0 checked:after:opacity-100"
                              checked={editingRole?.permissions?.[module.id]?.[action] || false}
                              onChange={() => togglePermission(module.id, action)}
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-8 pt-4 bg-muted/10 border-t border-border/50">
              <Button
                variant="outline"
                onClick={() => setIsRoleModalOpen(false)}
                className="h-11 px-6 border-border/60 hover:bg-muted"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleSaveRole}
                className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
              >
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Delete Alert Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="mx-auto w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-2">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle>{t('admin.users.deleteConfirm', 'Are you sure?')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('admin.users.deleteMessage', 'This action cannot be undone.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteId(null)}>
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteUser}
                className="bg-destructive text-destructive-foreground"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* User Create/Edit Modal */}
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 w-screen h-screen grid place-items-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background rounded-xl shadow-2xl border border-border w-full max-w-4xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 relative">
              {/* Modal Header */}
              <div className="flex-none flex items-center justify-between p-6 border-b border-border bg-muted/10">
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    {editingUser
                      ? t('admin.users.editUserAccount', 'Edit Account')
                      : t('admin.users.createNewUserAccount', 'Create Account')}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {editingUser
                      ? t('admin.users.updateUserDescription', 'Update details.')
                      : t('admin.users.createUserDescription', 'Fill in the information.')}
                  </p>
                </div>
                <button
                  onClick={() => setIsUserModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitUser} className="p-8 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
                  {/* LEFT COLUMN */}
                  <div className="space-y-10">
                    {/* Account Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-border pb-2">
                        <User className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                          {t('admin.users.accountInfo')}
                        </h4>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            {t('admin.users.email')} <span className="text-destructive">*</span>
                          </label>
                          <input
                            type="email"
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            placeholder="john.doe@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">
                              {t('admin.users.username')}{' '}
                              <span className="text-destructive">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                              placeholder="johndoe"
                              value={formData.username}
                              onChange={(e) =>
                                setFormData({ ...formData, username: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">
                              {t('admin.users.displayName')}
                            </label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                              placeholder="John D."
                              value={formData.displayName}
                              onChange={(e) =>
                                setFormData({ ...formData, displayName: e.target.value })
                              }
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-sm font-medium text-foreground mb-1 block">
                              {t('admin.users.avatarImage')}
                            </label>
                            <div className="flex items-start gap-4">
                              {/* Avatar Preview */}
                              <div className="flex-shrink-0">
                                {avatarPreview ? (
                                  <div className="relative group">
                                    <img
                                      src={avatarPreview}
                                      alt="Avatar preview"
                                      className="w-20 h-20 rounded-full object-cover border-2 border-border"
                                    />
                                    <button
                                      type="button"
                                      onClick={handleRemoveAvatar}
                                      className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                                    <User className="w-8 h-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>

                              {/* Upload Button */}
                              <div className="flex-1">
                                <label
                                  htmlFor="avatar-upload"
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-md text-sm font-medium cursor-pointer transition-colors border border-border"
                                >
                                  <Upload className="w-4 h-4" />
                                  {avatarPreview
                                    ? t('admin.users.changeImage')
                                    : t('admin.users.uploadImage')}
                                </label>
                                <input
                                  id="avatar-upload"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleAvatarChange}
                                />
                                <p className="text-[10px] text-muted-foreground mt-2">
                                  {t('admin.users.maxFileSize')}
                                </p>
                                {pendingImage && (
                                  <ImageCropper
                                    open={isCropperOpen}
                                    imageSrc={pendingImage}
                                    onClose={() => setIsCropperOpen(false)}
                                    onCropComplete={(croppedImage) => {
                                      setFormData({ ...formData, avatar: croppedImage });
                                      setAvatarPreview(croppedImage);
                                      setIsCropperOpen(false);
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Personal Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-border pb-2">
                        <span className="w-4 h-4 bg-primary/20 rounded flex items-center justify-center text-[10px] font-bold text-primary">
                          ID
                        </span>
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                          {t('admin.users.personalInfo')}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            {t('admin.users.firstName')} <span className="text-destructive">*</span>
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            placeholder="John"
                            value={formData.firstName}
                            onChange={(e) =>
                              setFormData({ ...formData, firstName: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            {t('admin.users.lastName')} <span className="text-destructive">*</span>
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            placeholder="Doe"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Work Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                          {t('admin.users.workInfo')}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            {t('admin.users.department')}{' '}
                            <span className="text-destructive">*</span>
                          </label>
                          <div className="relative">
                            <Select
                              value={formData.department}
                              onValueChange={(val) => setFormData({ ...formData, department: val })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('admin.users.selectDepartment')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Quality Assurance">
                                  {t('admin.departments.qa')}
                                </SelectItem>
                                <SelectItem value="Production">
                                  {t('admin.departments.production')}
                                </SelectItem>
                                <SelectItem value="Raw Material Receiving">
                                  {t('admin.departments.rawMaterial')}
                                </SelectItem>
                                <SelectItem value="Information Technology">
                                  {t('admin.departments.it')}
                                </SelectItem>
                                <SelectItem value="Human Resource">
                                  {t('admin.departments.hr')}
                                </SelectItem>
                                <SelectItem value="Accounting">
                                  {t('admin.departments.accounting')}
                                </SelectItem>
                                <SelectItem value="Finance">
                                  {t('admin.departments.finance')}
                                </SelectItem>
                                <SelectItem value="Purchasing">
                                  {t('admin.departments.purchasing')}
                                </SelectItem>
                                <SelectItem value="Shipping">
                                  {t('admin.departments.shipping')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            {t('admin.users.position')} <span className="text-destructive">*</span>
                          </label>
                          <div className="relative">
                            <Select
                              value={formData.position}
                              onValueChange={(val) => setFormData({ ...formData, position: val })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('admin.users.selectPosition')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Managing Director">
                                  {t('admin.positions.md')}
                                </SelectItem>
                                <SelectItem value="General Manager">
                                  {t('admin.positions.gm')}
                                </SelectItem>
                                <SelectItem value="Manager">
                                  {t('admin.positions.manager')}
                                </SelectItem>
                                <SelectItem value="Assistant Manager">
                                  {t('admin.positions.asstMgr')}
                                </SelectItem>
                                <SelectItem value="Senior Supervisor">
                                  {t('admin.positions.seniorSup')}
                                </SelectItem>
                                <SelectItem value="Supervisor">
                                  {t('admin.positions.sup')}
                                </SelectItem>
                                <SelectItem value="Senior Staff 2">
                                  {t('admin.positions.seniorStaff2')}
                                </SelectItem>
                                <SelectItem value="Senior Staff 1">
                                  {t('admin.positions.seniorStaff1')}
                                </SelectItem>
                                <SelectItem value="Staff 2">
                                  {t('admin.positions.staff2')}
                                </SelectItem>
                                <SelectItem value="Staff 1">
                                  {t('admin.positions.staff1')}
                                </SelectItem>
                                <SelectItem value="Operator Leader">
                                  {t('admin.positions.opLeader')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block flex items-center gap-1">
                          {t('admin.users.hodUser')}
                          <span className="text-xs text-muted-foreground ml-1 font-normal">
                            {t('admin.users.hodUserHelp')}
                          </span>
                        </label>
                        <div className="relative">
                          <Select
                            value={formData.hodId}
                            onValueChange={(val) => setFormData({ ...formData, hodId: val })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('admin.users.selectHod')} />
                            </SelectTrigger>
                            <SelectContent>
                              {users
                                .filter((u) => u.id !== editingUser?.id)
                                .map((u) => (
                                  <SelectItem key={u.id} value={u.id}>
                                    {u.firstName} {u.lastName} ({u.position})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="space-y-10">
                    {/* Password */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Lock className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                          {t('admin.users.setPassword')}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            {t('admin.users.password')} <span className="text-destructive">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground pr-10"
                              placeholder={editingUser ? '(Unchanged)' : '••••••••'}
                              value={formData.password}
                              onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                              }
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            {t('admin.users.confirmPassword')}{' '}
                            <span className="text-destructive">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground pr-10"
                              placeholder={editingUser ? '(Unchanged)' : '••••••••'}
                              value={formData.confirmPassword}
                              onChange={(e) =>
                                setFormData({ ...formData, confirmPassword: e.target.value })
                              }
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Roles & Status (Moved for integration but might be hidden if we only want Roles Page to manage it?) 
                       User asked to remove "Security & Access" from old users.tsx. 
                       Here I'm just copying the form.
                       Wait, the implementation plan said: "Comment out or remove the 'Security & Access' section (Role & Status fields) from the Create/Edit User modal."
                       But if I'm merging, I might want to keep it? The user said "remove it from users.tsx", they didn't explicitly say "remove it from the app entirely".
                       Actually, if Roles Page is the main entry, editing roles should probably be done via assignment, or we keep it here.
                       I will include it for now to ensure we can set role/status.
                   */}

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                          {t('admin.users.securityAndAccess')}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            {t('admin.users.role')} <span className="text-destructive">*</span>
                          </label>
                          <div className="relative">
                            <Select
                              value={formData.role}
                              onValueChange={(val) => setFormData({ ...formData, role: val })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('admin.users.selectRole')} />
                              </SelectTrigger>
                              <SelectContent>
                                {INITIAL_ROLES.map((role) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            {t('admin.users.status')} <span className="text-destructive">*</span>
                          </label>
                          <div className="relative">
                            <Select
                              value={formData.status}
                              onValueChange={(val) => setFormData({ ...formData, status: val })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('admin.users.selectStatus')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ACTIVE">{t('admin.status.active')}</SelectItem>
                                <SelectItem value="INACTIVE">
                                  {t('admin.status.inactive')}
                                </SelectItem>
                                <SelectItem value="SUSPENDED">
                                  {t('admin.status.suspended')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-border">
                  <Button variant="outline" type="button" onClick={() => setIsUserModalOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isSaving ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        {t('common.save')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
