import {
  Briefcase,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Shield,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { DataTable } from '../../components/ui/data-table';
import { usersApi } from '../../lib/api';
import { useUserColumns } from './users/columns';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Detailed Form Data
  const [formData, setFormData] = useState({
    // Account Info
    email: '',
    username: '',
    displayName: '',
    avatar: '',

    // Personal Info
    firstName: '',
    lastName: '',

    // Work Info
    department: '',
    position: '',
    hodId: '',

    // Security & Access
    role: 'USER',
    status: 'ACTIVE',
    password: '',
    confirmPassword: '',
    pinCode: '', // 6 digits
  });

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
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
      role: 'USER',
      status: 'ACTIVE',
      password: '',
      confirmPassword: '',
      pinCode: '',
      avatar: '',
    });
    setAvatarPreview('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: any) => {
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
      role: user.role || 'USER',
      status: user.status || 'ACTIVE',
      password: '',
      confirmPassword: '',
      pinCode: user.pinCode || '',
      avatar: user.avatar || '',
    });
    setAvatarPreview(user.avatar || '');
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await usersApi.delete(deleteId);
      fetchUsers();
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser && formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    try {
      const payload = { ...formData };

      // Cleanup empty fields
      if (!payload.password) delete (payload as any).password;
      delete (payload as any).confirmPassword;
      if (!payload.hodId) delete (payload as any).hodId;
      if (!payload.pinCode) delete (payload as any).pinCode;

      if (editingUser) {
        await usersApi.update(editingUser.id, payload);
      } else {
        await usersApi.create(payload);
      }
      setIsModalOpen(false);
      setAvatarPreview('');
      fetchUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save user');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, avatar: base64String });
        setAvatarPreview(base64String);
      };
      reader.readAsDataURL(file);
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

  // Define columns
  const columns = useUserColumns({
    onEdit: handleOpenEdit,
    onDelete: (id) => setDeleteId(id),
  });

  return (
    <AdminLayout>
      <div className="p-6 w-full max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        {/* Header Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6 flex flex-col xl:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
          {/* Left: Title & Icon */}
          <div className="flex items-center gap-4 w-full xl:w-auto">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl transition-transform hover:scale-105">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Users Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage user access, profiles, and permissions.
              </p>
            </div>
          </div>

          {/* Center: Stats Widget */}
          <div className="hidden md:flex items-center bg-background/50 rounded-xl border border-border p-1 shadow-sm">
            <div className="px-6 py-2 flex flex-col items-center min-w-[100px] border-r border-border/50 last:border-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Total
              </span>
              <span className="text-lg font-bold text-foreground">{stats.total}</span>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="px-6 py-2 flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-green-600">
                Active
              </span>
              <span className="text-lg font-bold text-green-600">{stats.active}</span>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="px-6 py-2 flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-destructive">
                Inactive
              </span>
              <span className="text-lg font-bold text-destructive">{stats.inactive}</span>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="px-6 py-2 flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-orange-500">
                Suspended
              </span>
              <span className="text-lg font-bold text-orange-500">{stats.suspended}</span>
            </div>
          </div>

          {/* Right: Action Button */}
          <button
            onClick={handleOpenCreate}
            className="w-full xl:w-auto inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 h-11 px-8"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New User
          </button>
        </div>

        {/* Users Table */}
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow">
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <DataTable columns={columns} data={users} />
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-2">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this user account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Advanced Create/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-background rounded-xl shadow-2xl border border-border w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/10">
              <div>
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  {editingUser ? 'Edit User Account' : 'Create New User Account'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Fill in the information below to {editingUser ? 'update the' : 'create a new'}{' '}
                  user.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
                {/* LEFT COLUMN */}
                <div className="space-y-10">
                  {/* Account Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <User className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                        Account Information
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">
                          Email <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                          placeholder="john.doe@company.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            Username
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            placeholder="johndoe"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            Display Name
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
                            Avatar Image
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
                                {avatarPreview ? 'Change Image' : 'Upload Image'}
                              </label>
                              <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                              />
                              <p className="text-[10px] text-muted-foreground mt-2">
                                Max 2MB. Supports JPG, PNG, GIF.
                              </p>
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
                        Personal Information
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">
                          First Name <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">
                          Last Name <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          required
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
                        Work Information
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">
                          Department <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <select
                            required
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground appearance-none"
                            value={formData.department}
                            onChange={(e) =>
                              setFormData({ ...formData, department: e.target.value })
                            }
                          >
                            <option value="">Select Department</option>
                            <option value="Quality Assurance">Quality Assurance</option>
                            <option value="Production">Production</option>
                            <option value="Raw Material Receiving">Raw Material Receiving</option>
                            <option value="Information Technology">Information Technology</option>
                            <option value="Human Resource">Human Resource</option>
                            <option value="Accounting">Accounting</option>
                            <option value="Finance">Finance</option>
                            <option value="Purchasing">Purchasing</option>
                            <option value="Shipping">Shipping</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">
                          Position <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <select
                            required
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground appearance-none"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          >
                            <option value="">Select Position</option>
                            <option value="Managing Director">Managing Director</option>
                            <option value="General Manager">General Manager</option>
                            <option value="Manager">Manager</option>
                            <option value="Assistant Manager">Assistant Manager</option>
                            <option value="Senior Supervisor">Senior Supervisor</option>
                            <option value="Supervisor">Supervisor</option>
                            <option value="Senior Staff 2">Senior Staff 2</option>
                            <option value="Senior Staff 1">Senior Staff 1</option>
                            <option value="Staff 2">Staff 2</option>
                            <option value="Staff 1">Staff 1</option>
                            <option value="Operator Leader">Operator Leader</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block flex items-center gap-1">
                        HOD User (Optional)
                        <span className="text-xs text-muted-foreground ml-1 font-normal">
                          (Leader/Manager)
                        </span>
                      </label>
                      <div className="relative">
                        <select
                          className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground appearance-none"
                          value={formData.hodId}
                          onChange={(e) => setFormData({ ...formData, hodId: e.target.value })}
                        >
                          <option value="">Select HOD (Ass.Manager+)</option>
                          {users
                            .filter((u) => u.id !== editingUser?.id)
                            .map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.firstName} {u.lastName} ({u.position})
                              </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-10">
                  {/* Security & Access */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                        Security & Access
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">
                          Role <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <select
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground appearance-none"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          >
                            <option value="USER">Standard User</option>
                            <option value="ADMIN">Administrator</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">
                          Status <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <select
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground appearance-none"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="SUSPENDED">Suspended</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <Lock className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                        Set Password
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">
                          Password <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required={!editingUser}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground pr-10"
                            placeholder={editingUser ? '(Unchanged)' : '••••••••'}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                          Confirm <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required={!editingUser && formData.password.length > 0}
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

                  {/* Pin Code */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                        Set Pincode (6 Digits)
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      For verification on critical actions.
                    </p>

                    <div className="space-y-3 max-w-[200px]">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">
                          Pincode
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          pattern="[0-9]*"
                          className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-center tracking-widest font-mono"
                          placeholder="_ _ _ _ _ _"
                          value={formData.pinCode}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                            setFormData({ ...formData, pinCode: v });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-12 pt-6 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-background/95 backdrop-blur py-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors border border-transparent hover:border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {editingUser ? 'Save Changes' : 'Confirm & Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
