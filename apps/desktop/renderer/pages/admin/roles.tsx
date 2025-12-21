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
  User,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import AdminLayout from '../../components/AdminLayout';

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

import { rolesApi, usersApi } from '../../lib/api';

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

  // Users State (For Stats only)
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const confirmDeleteRole = async () => {
    if (!deleteId) return;
    try {
      await rolesApi.delete(deleteId);
      toast.success(t('common.toast.success'), {
        description: t('common.toast.deleteSuccess'),
      });
      fetchData();
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete role:', error);
      toast.error(t('common.toast.error'), {
        description: t('common.toast.deleteFailed'),
      });
    }
  };

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

  return (
    <AdminLayout>
      <div className="p-6 w-full max-w-[1400px] mx-auto space-y-8">
        {/* SECTION 1: ROLES HEADER & GRID */}
        <div className="space-y-6">
          <Card className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-border/60 shadow-sm relative overflow-hidden">
            {/* Decorative Background Icon */}
            <div className="absolute top-1/2 right-12 -translate-y-1/2 pointer-events-none opacity-5">
              <Shield className="w-64 h-64" />
            </div>

            {/* Left: Icon & Title */}
            <div className="flex items-center gap-6 z-10 w-full md:w-auto">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {t('admin.roles.title', 'Roles & Permissions')}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('admin.roles.subtitle', 'Manage user access, profiles, and permissions.')}
                </p>
              </div>
            </div>

            {/* Center: Stats Widget */}
            <div className="flex items-center gap-8 md:gap-12 z-10 w-full md:w-auto justify-center md:justify-end text-center">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  {t('admin.roles.totalRoles', 'TOTAL')}
                </p>
                <p className="text-2xl font-bold">{roles.length}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  {t('admin.roles.assignedUsers', 'ACTIVE')}
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {users.filter((u) => u.role).length}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">
                  {t('admin.roles.unassigned', 'SUSPENDED')}
                </p>
                <p className="text-2xl font-bold text-orange-500">
                  {users.filter((u) => !u.role).length}
                </p>
              </div>
            </div>

            {/* Right: Action Button */}
            <div className="flex items-center gap-2 w-full xl:w-auto justify-end z-10">
              <Button
                onClick={() => setIsRoleModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('admin.roles.addRole', 'Add New Role')}
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {roles.map((role) => (
              <Card
                key={role.id}
                className="p-6 flex flex-col justify-between hover:shadow-md transition-shadow bg-background border border-border/60"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`p-3 rounded-xl ${role.color?.replace('bg-', 'bg-').replace('500', '100').replace('600', '100').replace('400', '100')} ${role.color?.replace('bg-', 'text-')}`}
                    >
                      {(() => {
                        const Icon =
                          typeof role.icon === 'string' ? ICON_MAP[role.icon] || Shield : role.icon;
                        return <Icon className="w-6 h-6" />;
                      })()}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditRole(role)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenAssignModal(role)}>
                          <Users className="w-4 h-4 mr-2" />
                          {t('admin.roles.assignUsers')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(role.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-bold text-lg mb-1">{role.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-6">
                    {role.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-dashed border-border">
                  <div className="flex -space-x-2">
                    {/* Mock Avatar Stack for visual if no avatars */}
                    {/* Using simple circles for now as placeholders or real avatars if available */}
                    {/* We can use a few specific colored circles to fake it if no real avatars */}
                    {[...Array(Math.min(3, role.usersCount || 0))].map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-background bg-slate-200 flex items-center justify-center text-[10px] font-medium text-slate-600"
                      >
                        U{i + 1}
                      </div>
                    ))}
                    {(role.usersCount || 0) === 0 && (
                      <div className="w-8 h-8 rounded-full border-2 border-background border-dashed border-slate-300 flex items-center justify-center">
                        <Plus className="w-3 h-3 text-slate-300" />
                      </div>
                    )}
                    {(role.usersCount || 0) > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-background bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-medium">
                        +{role.usersCount - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    {role.usersCount} {t('common.users', 'users')}
                  </span>
                </div>
              </Card>
            ))}
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
              <AlertDialogTitle>{t('admin.roles.deleteConfirm', 'Delete Role?')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  'admin.roles.deleteMessage',
                  'Are you sure you want to delete this role? This action cannot be undone.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteId(null)}>
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteRole}
                className="bg-destructive text-destructive-foreground"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
