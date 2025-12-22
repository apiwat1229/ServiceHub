import { Plus, User, Users } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import AdminLayout from '../../../components/AdminLayout';
import ImageCropper from '../../../components/ImageCropper';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { DataTable } from '../../../components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { usersApi } from '../../../lib/api';
import { useUserColumns } from '../users/columns'; // Verify path: ../users/columns relative to pages/admin/users/index.tsx is ../../admin/users/columns? No, columns is in pages/admin/users/columns.tsx based on imports in roles.tsx
// roles.tsx imports from './users/columns'. Since roles.tsx is in pages/admin, columns.tsx is in pages/admin/users/columns.tsx.
// So for pages/admin/users/index.tsx to import columns, it should be './columns'.

// Wait, I saw "import { useUserColumns } from './users/columns';" in roles.tsx (line 69).
// roles.tsx is in pages/admin. So columns is in pages/admin/users/columns.tsx.
// Ideally.
// Let's check listing of pages/admin again.
// pages/admin has "users" directory.
// "users" directory has "columns.tsx".
// So inside pages/admin/users/index.tsx, import should be from './columns'.

export default function UsersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  // Users State
  const [users, setUsers] = useState<any[]>([]);

  // User Management State
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
    role: 'staff_1',
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

  // Avatar Cropper State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const usersData = await usersApi.getAll();
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error(t('common.error'), {
        description: 'Failed to fetch users',
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
      toast.success(t('common.toast.success'), {
        description: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(t('common.error'), {
        description: 'Failed to delete user',
      });
    }
  };

  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();

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
        toast.error(t('common.error'), {
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

  return (
    <AdminLayout>
      <div className="p-6 w-full max-w-[1400px] mx-auto space-y-8">
        {/* USERS MANAGEMENT SUMMARY */}
        <Card className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-border/60 shadow-sm relative overflow-hidden">
          {/* Decorative Background Icon */}
          <div className="absolute top-1/2 right-12 -translate-y-1/2 pointer-events-none opacity-5">
            <Users className="w-64 h-64" />
          </div>

          <div className="flex items-center gap-6 z-10 w-full md:w-auto">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t('admin.users.title', 'Users Management')}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t('admin.users.subtitle', 'Manage user access, profiles, and permissions.')}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 md:gap-12 z-10 w-full md:w-auto justify-center md:justify-end">
            {/* Stats */}
            <div className="flex items-center gap-8 text-center">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Total
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  Active
                </p>
                <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Inactive
                </p>
                <p className="text-2xl font-bold text-muted-foreground">{stats.inactive}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">
                  Suspended
                </p>
                <p className="text-2xl font-bold text-orange-500">{stats.suspended}</p>
              </div>
            </div>

            <Button
              onClick={handleOpenCreateUser}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('admin.users.addUser', 'Add New User')}
            </Button>
          </div>
        </Card>

        {/* Users Table */}
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow">
          <div className="p-6">
            <DataTable columns={columns} data={users} />
          </div>
        </div>

        {/* --- MODALS --- */}
        {/* User Create/Edit Dialog */}
        <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
          <DialogContent className="sm:max-w-[700px] bg-background">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? t('admin.users.editUser') : t('admin.users.addUser')}
              </DialogTitle>
              <DialogDescription>
                {t('admin.users.fillDetails', 'Fill in the details for the user.')}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitUser} className="space-y-6 py-4">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full border-4 border-dashed border-muted flex items-center justify-center bg-muted/30 overflow-hidden">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <User className="w-10 h-10 mx-auto text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <label
                          htmlFor="avatar-upload"
                          className="cursor-pointer text-white text-xs hover:underline"
                        >
                          Change
                        </label>
                        {avatarPreview && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="text-red-400 text-xs hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center max-w-[120px]">
                    Allowed *.jpeg, *.jpg, *.png, *.webp max 2MB
                  </p>
                </div>

                {/* Form Fields */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('admin.users.firstName')}</label>
                      <Input
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('admin.users.lastName')}</label>
                      <Input
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('common.email')}</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john.doe@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('common.username')}</label>
                    <Input
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="johndoe"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('admin.users.role')}</label>
                      <Select
                        value={formData.role}
                        onValueChange={(val) => setFormData({ ...formData, role: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="md">Managing Director</SelectItem>
                          <SelectItem value="gm">General Manager</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="asst_mgr">Assistant Manager</SelectItem>
                          <SelectItem value="senior_sup">Senior Supervisor</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="senior_staff_2">Senior Staff 2</SelectItem>
                          <SelectItem value="senior_staff_1">Senior Staff 1</SelectItem>
                          <SelectItem value="staff_2">Staff 2</SelectItem>
                          <SelectItem value="staff_1">Staff 1</SelectItem>
                          <SelectItem value="op_leader">Operator Leader</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('common.status')}</label>
                      <Select
                        value={formData.status}
                        onValueChange={(val) => setFormData({ ...formData, status: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">{t('admin.status.active')}</SelectItem>
                          <SelectItem value="INACTIVE">{t('admin.status.inactive')}</SelectItem>
                          <SelectItem value="SUSPENDED">{t('admin.status.suspended')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('admin.users.department')}</label>
                      <Input
                        required
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="e.g. Production"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('admin.users.position')}</label>
                      <Input
                        required
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        placeholder="e.g. Senior Staff"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pin Code (Optional)</label>
                    <Input
                      type="number"
                      maxLength={6}
                      value={formData.pinCode}
                      onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                      placeholder="123456"
                    />
                  </div>

                  <div className="border-t border-border pt-4 mt-4">
                    <h4 className="text-sm font-medium mb-3">{t('common.password')}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={editingUser ? 'Leave blank to keep current' : 'Password'}
                          className="pr-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData({ ...formData, confirmPassword: e.target.value })
                          }
                          placeholder={
                            editingUser ? 'Leave blank to keep current' : 'Confirm Password'
                          }
                          className="pr-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsUserModalOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? t('common.saving') : t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert */}
        <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('common.deleteConfirm')}</DialogTitle>
              <DialogDescription>{t('common.deleteConfirmMessage')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={confirmDeleteUser}>
                {t('common.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Cropper */}
        {pendingImage && (
          <ImageCropper
            open={isCropperOpen}
            onClose={() => setIsCropperOpen(false)}
            imageSrc={pendingImage}
            onCropComplete={(croppedImg) => {
              setFormData({ ...formData, avatar: croppedImg });
              setAvatarPreview(croppedImg);
              setPendingImage(null);
              setIsCropperOpen(false);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
