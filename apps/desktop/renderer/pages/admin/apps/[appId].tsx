import { ArrowLeft, BellRing, Loader2, Plus, Save, Search, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import AdminLayout from '../../../components/AdminLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Switch } from '../../../components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { accessControlApi, api, rolesApi, usersApi } from '../../../lib/api';

// Defined System Events Mapped to App IDs
const SYSTEM_EVENTS = [
  // Bookings App
  { source: 'Booking', appId: 'bookings', action: 'CREATE', label: 'New Booking' },
  { source: 'Booking', appId: 'bookings', action: 'UPDATE', label: 'Booking Updated' },
  { source: 'Booking', appId: 'bookings', action: 'DELETE', label: 'Booking Cancelled/Deleted' },

  // User Management App
  { source: 'User', appId: 'users', action: 'CREATE', label: 'New User Registration' },
  { source: 'User', appId: 'users', action: 'UPDATE', label: 'User Profile Updated' },

  // System / General
  { source: 'System', appId: 'system', action: 'ERROR', label: 'System Errors' },
];

interface NotificationSetting {
  id?: string;
  sourceApp: string;
  actionType: string;
  isActive: boolean;
  recipientRoles: string[];
  recipientGroups: string[];
  recipientUsers: string[];
}

export default function AppNotificationPage() {
  const router = useRouter();
  const { appId } = router.query;
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [app, setApp] = useState<any>(null);
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Dialog State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [addUserTarget, setAddUserTarget] = useState<{ source: string; action: string } | null>(
    null
  );
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedDialogUsers, setSelectedDialogUsers] = useState<string[]>([]);

  // Role Dialog State
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [addRoleTarget, setAddRoleTarget] = useState<{ source: string; action: string } | null>(
    null
  );
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [selectedDialogRoles, setSelectedDialogRoles] = useState<string[]>([]);

  // Group Dialog State
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [addGroupTarget, setAddGroupTarget] = useState<{ source: string; action: string } | null>(
    null
  );
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [selectedDialogGroups, setSelectedDialogGroups] = useState<string[]>([]);

  // Alert Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const fetchData = async () => {
    if (!appId) return;
    try {
      setIsLoading(true);
      // 1. Get App Info
      const apps = await accessControlApi.getApps();
      const currentApp = apps.find((a: any) => a.id === appId);
      setApp(currentApp);

      // 2. Fetches Settings, Roles, and Users
      const [settingsRes, rolesRes, groupsRes, usersRes] = await Promise.all([
        api.get('/notifications/settings'),
        rolesApi.getAll(),
        notificationGroupsApi.getAll(),
        usersApi.getAll(),
      ]);

      setSettings(settingsRes.data);
      setRoles(rolesRes);
      setGroups(groupsRes);
      setAllUsers(usersRes);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error(t('common.error'), { description: t('common.errorLoading') });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (appId) fetchData();
  }, [appId]);

  const getFilteredEvents = () => {
    if (!appId) return [];
    return SYSTEM_EVENTS.filter((event) => event.appId === appId);
  };

  const getSetting = (source: string, action: string) => {
    return (
      settings.find((s) => s.sourceApp === source && s.actionType === action) || {
        sourceApp: source,
        actionType: action,
        isActive: true,
        recipientRoles: [],
        recipientGroups: [],
        recipientUsers: [],
      }
    );
  };

  const handleUpdate = (source: string, action: string, updates: Partial<NotificationSetting>) => {
    setSettings((prev) => {
      const existingIndex = prev.findIndex(
        (s) => s.sourceApp === source && s.actionType === action
      );
      if (existingIndex >= 0) {
        const newSettings = [...prev];
        newSettings[existingIndex] = { ...newSettings[existingIndex], ...updates };
        return newSettings;
      } else {
        return [
          ...prev,
          {
            sourceApp: source,
            actionType: action,
            isActive: true, // Default
            recipientRoles: [],
            recipientGroups: [],
            recipientUsers: [],
            ...updates,
          } as NotificationSetting,
        ];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const appEvents = getFilteredEvents();

      const promises = appEvents.map((event) => {
        const setting = getSetting(event.source, event.action);
        return api.put('/notifications/settings', {
          sourceApp: event.source,
          actionType: event.action,
          isActive: setting.isActive,
          recipientRoles: setting.recipientRoles,
          recipientGroups: setting.recipientGroups,
          recipientUsers: setting.recipientUsers,
        });
      });

      await Promise.all(promises);
      toast.success(t('common.success'), { description: t('common.saved') });
    } catch (error) {
      console.error('Failed to save', error);
      toast.error(t('common.error'), { description: t('common.errorSave', 'Failed to save') });
    } finally {
      setSaving(false);
    }
  };

  const openAddUserDialog = (source: string, action: string) => {
    setAddUserTarget({ source, action });
    setUserSearchTerm('');
    setSelectedDialogUsers([]);
    setIsAddUserOpen(true);
  };

  const handleConfirmAddUsers = () => {
    if (!addUserTarget) return;
    const { source, action } = addUserTarget;
    const setting = getSetting(source, action);
    const usersToAdd = selectedDialogUsers;

    if (usersToAdd.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: t('admin.notificationSettings.confirmAddUsers'),
        description: t('admin.notificationSettings.confirmAddUsersDesc', {
          count: usersToAdd.length,
        }),
        onConfirm: () => {
          const currentUsers = setting.recipientUsers || [];
          const nextUsers = Array.from(new Set([...currentUsers, ...usersToAdd]));
          handleUpdate(source, action, { recipientUsers: nextUsers });
          setIsAddUserOpen(false);
        },
      });
    } else {
      setIsAddUserOpen(false);
    }
  };

  const toggleDialogUser = (userId: string) => {
    setSelectedDialogUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleRemoveUser = (source: string, action: string, userId: string) => {
    const setting = getSetting(source, action);
    const currentUsers = setting.recipientUsers || [];
    handleUpdate(source, action, {
      recipientUsers: currentUsers.filter((id) => id !== userId),
    });
  };

  // Role Logic
  const openAddRoleDialog = (source: string, action: string) => {
    setAddRoleTarget({ source, action });
    setRoleSearchTerm('');
    setSelectedDialogRoles([]);
    setIsAddRoleOpen(true);
  };

  const handleConfirmAddRoles = () => {
    if (!addRoleTarget) return;
    const { source, action } = addRoleTarget;
    const setting = getSetting(source, action);
    const rolesToAdd = selectedDialogRoles;

    if (rolesToAdd.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: t('admin.notificationSettings.confirmAddGroups'),
        description: t('admin.notificationSettings.confirmAddGroupsDesc', {
          count: rolesToAdd.length,
        }),
        onConfirm: () => {
          const currentRoles = setting.recipientRoles || [];
          const nextRoles = Array.from(new Set([...currentRoles, ...rolesToAdd]));
          handleUpdate(source, action, { recipientRoles: nextRoles });
          setIsAddRoleOpen(false);
        },
      });
    } else {
      setIsAddRoleOpen(false);
    }
  };

  const toggleDialogRole = (roleId: string) => {
    setSelectedDialogRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleRemoveRole = (source: string, action: string, roleId: string) => {
    const setting = getSetting(source, action);
    const currentRoles = setting.recipientRoles || [];
    handleUpdate(source, action, {
      recipientRoles: currentRoles.filter((id) => id !== roleId),
    });
  };

  // Group Logic
  const openAddGroupDialog = (source: string, action: string) => {
    setAddGroupTarget({ source, action });
    setGroupSearchTerm('');
    setSelectedDialogGroups([]);
    setIsAddGroupOpen(true);
  };

  const handleConfirmAddGroups = () => {
    if (!addGroupTarget) return;
    const { source, action } = addGroupTarget;
    const setting = getSetting(source, action);
    const groupsToAdd = selectedDialogGroups;

    if (groupsToAdd.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: t('admin.notificationSettings.confirmAddGroups'),
        description: t('admin.notificationSettings.confirmAddGroupsDesc', {
          count: groupsToAdd.length,
        }),
        onConfirm: () => {
          const currentGroups = setting.recipientGroups || [];
          const nextGroups = Array.from(new Set([...currentGroups, ...groupsToAdd]));
          handleUpdate(source, action, { recipientGroups: nextGroups });
          setIsAddGroupOpen(false);
        },
      });
    } else {
      setIsAddGroupOpen(false);
    }
  };

  const toggleDialogGroup = (groupId: string) => {
    setSelectedDialogGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleRemoveGroup = (source: string, action: string, groupId: string) => {
    const setting = getSetting(source, action);
    const currentGroups = setting.recipientGroups || [];
    handleUpdate(source, action, {
      recipientGroups: currentGroups.filter((id) => id !== groupId),
    });
  };

  if (!app && !isLoading)
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-12">
          <div className="text-center">
            <h2 className="text-lg font-semibold">{t('admin.notificationSettings.appNotFound')}</h2>
            <Button variant="link" onClick={() => router.push('/admin/apps')}>
              {t('admin.notificationSettings.goBack')}
            </Button>
          </div>
        </div>
      </AdminLayout>
    );

  const appEvents = getFilteredEvents();

  // Filter users who are NOT yet in the recipient list for this specific rule
  const availableUsers = allUsers.filter((u) => {
    if (!addUserTarget) return true;
    const setting = getSetting(addUserTarget.source, addUserTarget.action);
    return !setting.recipientUsers?.includes(u.id);
  });

  const filteredUsersForDialog = availableUsers.filter((u) => {
    if (!userSearchTerm) return true;
    const searchLow = userSearchTerm.toLowerCase();
    return (
      (u.name?.toLowerCase() || '').includes(searchLow) ||
      (u.firstName?.toLowerCase() || '').includes(searchLow) ||
      (u.email?.toLowerCase() || '').includes(searchLow) ||
      (u.username?.toLowerCase() || '').includes(searchLow)
    );
  });

  return (
    <AdminLayout>
      <div className="p-6 w-full max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <BellRing className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {app?.name || 'Loading...'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('admin.notificationSettings.subtitle', 'Configure notifications for this app')}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || appEvents.length === 0}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('common.saveChanges')}
          </Button>
        </div>

        {/* Rules Grid */}
        <div className="grid gap-6">
          {appEvents.length > 0 ? (
            appEvents.map((event) => {
              const setting = getSetting(event.source, event.action);
              return (
                <Card
                  key={`${event.source}-${event.action}`}
                  className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-all"
                >
                  <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {event.label}
                          <Badge variant="outline" className="text-xs font-normal bg-background/50">
                            {event.action}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {t('admin.notificationSettings.triggeredWhen', {
                            action: event.action.toLowerCase(),
                          })}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {setting.isActive
                            ? t('admin.notificationSettings.active')
                            : t('admin.notificationSettings.inactive')}
                        </span>
                        <Switch
                          checked={setting.isActive}
                          onCheckedChange={(checked) =>
                            handleUpdate(event.source, event.action, { isActive: checked })
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>

                  {setting.isActive && (
                    <CardContent className="pt-6 space-y-6">
                      {/* Roles Section */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                          {t('admin.notificationSettings.recipientsByGroup')}
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {t('admin.notificationSettings.whoGetsNotified')}
                          </Badge>
                        </label>

                        <div className="flex flex-wrap gap-2 items-center">
                          {(setting.recipientRoles || []).map((roleId) => {
                            const role = roles.find((r) => r.id === roleId);
                            if (!role) return null;
                            return (
                              <Badge
                                key={roleId}
                                variant="secondary"
                                className="pl-3 pr-1 py-1 flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                              >
                                {role.name}
                                <button
                                  onClick={() =>
                                    handleRemoveRole(event.source, event.action, roleId)
                                  }
                                  className="p-0.5 hover:bg-purple-200 rounded-full transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            );
                          })}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 rounded-full p-0 border-dashed"
                            onClick={() => openAddRoleDialog(event.source, event.action)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Users Section */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                          {t('admin.notificationSettings.recipientsByUser')}
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {t('admin.notificationSettings.specificUsers')}
                          </Badge>
                        </label>

                        <div className="flex flex-wrap gap-2 items-center">
                          {(setting.recipientUsers || []).map((userId) => {
                            const user = allUsers.find((u) => u.id === userId);
                            if (!user) return null;
                            return (
                              <Badge
                                key={userId}
                                variant="secondary"
                                className="pl-3 pr-1 py-1 flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                              >
                                {user.firstName || user.name || user.email}
                                <button
                                  onClick={() =>
                                    handleRemoveUser(event.source, event.action, userId)
                                  }
                                  className="p-0.5 hover:bg-blue-200 rounded-full transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            );
                          })}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 rounded-full p-0 border-dashed"
                            onClick={() => openAddUserDialog(event.source, event.action)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-2">
              <BellRing className="w-10 h-10 opacity-20" />
              <p>{t('admin.notificationSettings.noRulesFound')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[1000px]">
          <DialogHeader>
            <DialogTitle>Add Recipient</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t('admin.notificationSettings.searchUsers')}
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
            </div>

            <div className="h-[500px] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsersForDialog.length === 0 ? (
                    <TableRow>
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          {t('admin.notificationSettings.noUsersFound')}
                        </TableCell>
                      </TableRow>
                    </TableRow>
                  ) : (
                    filteredUsersForDialog.map((user) => {
                      const isChecked = selectedDialogUsers.includes(user.id);
                      return (
                        <TableRow
                          key={user.id}
                          className={isChecked ? 'bg-muted/50' : ''}
                          onClick={() => toggleDialogUser(user.id)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggleDialogUser(user.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {(
                                  user.firstName?.[0] ||
                                  user.name?.[0] ||
                                  user.email?.[0] ||
                                  'U'
                                ).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {user.firstName} {user.lastName}{' '}
                                  {user.name ? `(${user.name})` : ''}
                                </div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{user.department || '-'}</TableCell>
                          <TableCell className="text-sm">{user.position || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal capitalize">
                              {(user.role || 'User').replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}
                              className={
                                user.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                  : ''
                              }
                            >
                              {user.status || 'Unknown'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <div className="flex w-full justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {t('admin.notificationSettings.usersSelected', {
                    count: selectedDialogUsers.length,
                  })}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                    {t('admin.notificationSettings.cancel')}
                  </Button>
                  <Button
                    onClick={handleConfirmAddUsers}
                    disabled={selectedDialogUsers.length === 0}
                  >
                    {t('admin.notificationSettings.addSelected')}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Add User Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t('admin.notificationSettings.searchGroups')}
                value={roleSearchTerm}
                onChange={(e) => setRoleSearchTerm(e.target.value)}
              />
            </div>

            <div className="h-[400px] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Group Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles
                    .filter((r) => {
                      if (!addRoleTarget) return true;
                      const setting = getSetting(addRoleTarget.source, addRoleTarget.action);
                      return !setting.recipientRoles?.includes(r.id);
                    })
                    .filter(
                      (r) =>
                        !roleSearchTerm ||
                        r.name.toLowerCase().includes(roleSearchTerm.toLowerCase())
                    ).length === 0 ? (
                    <TableRow>
                      <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center">
                          {t('admin.notificationSettings.noGroupsFound')}
                        </TableCell>
                      </TableRow>
                    </TableRow>
                  ) : (
                    roles
                      .filter((r) => {
                        if (!addRoleTarget) return true;
                        const setting = getSetting(addRoleTarget.source, addRoleTarget.action);
                        return !setting.recipientRoles?.includes(r.id);
                      })
                      .filter(
                        (r) =>
                          !roleSearchTerm ||
                          r.name.toLowerCase().includes(roleSearchTerm.toLowerCase())
                      )
                      .map((role) => {
                        const isChecked = selectedDialogRoles.includes(role.id);
                        return (
                          <TableRow
                            key={role.id}
                            className={isChecked ? 'bg-muted/50' : ''}
                            onClick={() => toggleDialogRole(role.id)}
                          >
                            <TableCell>
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleDialogRole(role.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{role.name}</TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <div className="flex w-full justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {t('admin.notificationSettings.groupsSelected', {
                    count: selectedDialogRoles.length,
                  })}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>
                    {t('admin.notificationSettings.cancel')}
                  </Button>
                  <Button
                    onClick={handleConfirmAddRoles}
                    disabled={selectedDialogRoles.length === 0}
                  >
                    {t('admin.notificationSettings.addSelected')}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Group Dialog */}
      <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Recipient Groups</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t('admin.notificationSettings.searchGroups')}
                value={groupSearchTerm}
                onChange={(e) => setGroupSearchTerm(e.target.value)}
              />
            </div>

            <div className="h-[400px] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Group Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups
                    .filter((g) => {
                      if (!addGroupTarget) return true;
                      const setting = getSetting(addGroupTarget.source, addGroupTarget.action);
                      return !setting.recipientGroups?.includes(g.id);
                    })
                    .filter(
                      (g) =>
                        !groupSearchTerm ||
                        g.name.toLowerCase().includes(groupSearchTerm.toLowerCase())
                    ).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        {t('admin.notificationSettings.noGroupsFound')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    groups
                      .filter((g) => {
                        if (!addGroupTarget) return true;
                        const setting = getSetting(addGroupTarget.source, addGroupTarget.action);
                        return !setting.recipientGroups?.includes(g.id);
                      })
                      .filter(
                        (g) =>
                          !groupSearchTerm ||
                          g.name.toLowerCase().includes(groupSearchTerm.toLowerCase())
                      )
                      .map((group) => {
                        const isChecked = selectedDialogGroups.includes(group.id);
                        return (
                          <TableRow
                            key={group.id}
                            className={isChecked ? 'bg-muted/50' : ''}
                            onClick={() => toggleDialogGroup(group.id)}
                          >
                            <TableCell>
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleDialogGroup(group.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{group.name}</TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <div className="flex w-full justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {t('admin.notificationSettings.groupsSelected', {
                    count: selectedDialogGroups.length,
                  })}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsAddGroupOpen(false)}>
                    {t('admin.notificationSettings.cancel')}
                  </Button>
                  <Button
                    onClick={handleConfirmAddGroups}
                    disabled={selectedDialogGroups.length === 0}
                  >
                    {t('admin.notificationSettings.addSelected')}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={confirmConfig.isOpen}
        onOpenChange={(open) => {
          if (!open) setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmConfig.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmConfig.onConfirm();
                setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
