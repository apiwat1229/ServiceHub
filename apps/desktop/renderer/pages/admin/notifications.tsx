import {
  Bell,
  Layers,
  Megaphone,
  MoreHorizontal,
  Settings,
  Trash,
  Trash2,
  Truck,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
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
import { Checkbox } from '../../components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { MultiSelect } from '../../components/ui/multi-select';
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
// Removed broken lines
import { Spinner } from '../../components/ui/spinner';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { useNotifications } from '../../contexts/NotificationContext';
import { api } from '../../lib/api';
import { useNotificationStore } from '../../stores/notificationStore';
import { useNotificationColumns } from './notifications/columns';

// --- Type Definitions ---
type NotificationSetting = {
  id: string;
  sourceApp: string;
  actionType: string;
  isActive: boolean;
  recipientRoles: string[];
  recipientUsers: string[];
  recipientGroups?: string[];
  channels: string[];
};

type Role = {
  id: string;
  name: string;
  description?: string;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { addNotification } = useNotificationStore();
  const { refresh: refreshNotifications } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Group Management State
  const [groups, setGroups] = useState<any[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    memberIds: [] as string[],
  });

  const fetchGroups = async () => {
    try {
      const res = await api.get('/notifications/groups');
      setGroups(res.data);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [settingsRes, rolesRes, usersRes, groupsRes] = await Promise.all([
        api.get('/notifications/settings'),
        api.get('/roles'),
        api.get('/users'),
        api.get('/notifications/groups'),
      ]);
      setSettings(settingsRes.data);
      setRoles(rolesRes.data);
      setUsers(usersRes.data);
      setGroups(groupsRes.data);
      await fetchBroadcastHistory();
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchBroadcastHistory = async () => {
    try {
      setHistoryLoading(true);
      // Fetch all notifications with sourceApp = 'ADMIN_BROADCAST'
      const res = await api.get('/notifications/history');
      setBroadcastHistory(res.data || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await api.put(`/notifications/groups/${editingGroup.id}`, groupForm);
        toast.success('Group updated');
      } else {
        await api.post('/notifications/groups', groupForm);
        toast.success('Group created successfully');
      }
      setIsGroupModalOpen(false);
      setEditingGroup(null);
      setGroupForm({ name: '', description: '', memberIds: [] });
      fetchGroups();
    } catch (err) {
      toast.error('Failed to save group');
    }
  };

  const confirmDeleteGroup = async () => {
    if (!deleteGroupId) return;
    try {
      await api.delete(`/notifications/groups/${deleteGroupId}`);
      toast.success('Group deleted successfully');
      fetchGroups();
    } catch (err) {
      toast.error('Failed to delete group');
    } finally {
      setDeleteGroupId(null);
    }
  };

  const openGroupModal = (group?: any) => {
    if (group) {
      setEditingGroup(group);
      setGroupForm({
        name: group.name,
        description: group.description,
        memberIds: group.members.map((m: any) => m.id),
      });
    } else {
      setEditingGroup(null);
      setGroupForm({ name: '', description: '', memberIds: [] });
    }
    setIsGroupModalOpen(true);
  };

  // Broadcast Form State
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'INFO' as 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR',
    recipientRoles: [] as string[],
    recipientUsers: [] as string[],
    recipientGroups: [] as string[],
  });

  // History State
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedBroadcasts, setSelectedBroadcasts] = useState<string[]>([]);

  // Deletion State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteClick = (broadcast: any) => {
    setDeleteId(broadcast.id);
  };

  const handleBulkDelete = () => {
    setDeleteId('BULK');
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      if (deleteId === 'BULK') {
        const payload = { ids: selectedBroadcasts };
        await api.delete('/notifications/broadcast', { data: payload });
        toast.success(`Deleted ${selectedBroadcasts.length} broadcasts`);
        setSelectedBroadcasts([]);
      } else {
        await api.delete(`/notifications/broadcast/${deleteId}`);
        toast.success(t('admin.notifications.notificationDeleted'));
      }

      fetchBroadcastHistory();
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete broadcast:', error);
      toast.error('Failed to delete broadcast');
    }
  };

  const columns = useNotificationColumns({
    onDelete: (id) => handleDeleteClick({ id } as any),
    onView: (broadcast) => {
      setSelectedBroadcast(broadcast);
      setViewDetailsOpen(true);
    },
  });
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<any>(null);

  const handleUpdateSetting = async (
    setting: NotificationSetting,
    updates: Partial<NotificationSetting>
  ) => {
    try {
      const payload = {
        sourceApp: setting.sourceApp,
        actionType: setting.actionType,
        isActive: updates.isActive !== undefined ? updates.isActive : setting.isActive,
        recipientRoles: updates.recipientRoles || setting.recipientRoles,
        recipientUsers: updates.recipientUsers || setting.recipientUsers,
        recipientGroups: updates.recipientGroups || setting.recipientGroups,
        channels: updates.channels || setting.channels,
      };

      await api.put('/notifications/settings', payload);

      // Optimistic update
      setSettings((prev) => prev.map((s) => (s.id === setting.id ? { ...s, ...updates } : s)));
      toast.success('Settings updated');
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) {
      toast.error('Please fill in title and message');
      return;
    }

    try {
      // Send to backend
      await api.post('/notifications/broadcast', broadcastForm);

      // Removed local feedback as per user request (Admin should not receive the notification unless targeted)

      // Refresh notifications for all users (triggers polling immediately)
      await refreshNotifications();

      toast.success('Broadcast sent successfully');
      setBroadcastForm({
        title: '',
        message: '',
        type: 'INFO',
        recipientRoles: [],
        recipientUsers: [],
        recipientGroups: [],
      });
    } catch (error) {
      console.error('Broadcast failed:', error);
      toast.error('Failed to send broadcast');
    }
  };

  const handleDeleteBroadcast = async (broadcast: any) => {
    try {
      await api.delete(`/notifications/broadcast/${broadcast.id}`);
      toast.success('Broadcast deleted successfully');
      fetchBroadcastHistory();
    } catch (err) {
      console.error('Failed to delete broadcast', err);
      toast.error('Failed to delete broadcast');
    }
  };

  // Configuration View State
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  // Helper to get unique apps from settings
  const apps = React.useMemo(() => {
    const uniqueApps = Array.from(new Set(settings.map((s) => s.sourceApp)));
    return uniqueApps.map((app) => {
      switch (app) {
        case 'BOOKING':
          return {
            id: app,
            title: 'Booking Queue',
            description: 'Manage supplier bookings',
            icon: 'Layers',
          };
        case 'USER':
          return {
            id: app,
            title: 'User Management',
            description: 'Manage user accounts and access',
            icon: 'Users',
          };
        case 'SUPPLIER':
          return {
            id: app,
            title: 'Supplier System',
            description: 'Manage suppliers and rubber types',
            icon: 'Truck',
          };
        default:
          return { id: app, title: app, description: 'Manage app notifications', icon: 'Settings' };
      }
    });
  }, [settings]);

  // Helper to render icon dynamically
  const renderAppIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers':
        return <Layers className="w-8 h-8 text-slate-600" />;
      case 'Users':
        return <Users className="w-8 h-8 text-blue-600" />;
      case 'Truck':
        return <Truck className="w-8 h-8 text-orange-600" />;
      case 'Settings':
        return <Settings className="w-8 h-8 text-gray-600" />;
      default:
        return <Bell className="w-8 h-8 text-gray-600" />;
    }
  };

  // Helper to get Role labels
  const roleOptions = roles.map((r) => ({ label: r.name, value: r.name }));

  // Helper to get User labels
  const userOptions = users.map((u) => ({
    label: `${u.firstName} ${u.lastName} (${u.role})`,
    value: u.id,
  }));

  // Dynamic Group Options from API
  const groupOptions = groups.map((g) => ({ label: g.name, value: g.name }));

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <Spinner size="xl" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 w-full mx-auto space-y-8">
        {/* Header */}
        <Card className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-border/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-1/2 right-12 -translate-y-1/2 pointer-events-none opacity-5">
            <Bell className="w-64 h-64" />
          </div>
          <div className="flex items-center gap-6 z-10 w-full md:w-auto">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-600 dark:text-orange-400">
              <Bell className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {t('admin.notifications.title', 'Notification Management')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t('admin.notifications.subtitle', 'Configure alerts and broadcast messages.')}
              </p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="broadcast" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-[800px]">
            <TabsTrigger value="broadcast" className="gap-2">
              <Megaphone className="w-4 h-4" />
              {t('admin.notifications.broadcast')}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Bell className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="w-4 h-4" />
              {t('admin.notifications.configuration')}
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-2">
              <Users className="w-4 h-4" />
              {t('admin.notifications.groups')}
            </TabsTrigger>
          </TabsList>

          {/* Groups Tab */}
          <TabsContent value="groups">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => openGroupModal()}>
                  {t('admin.notifications.newGroup')}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <Card
                    key={group.id}
                    className="p-6 relative group hover:shadow-md transition-all"
                  >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openGroupModal(group)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => setDeleteGroupId(group.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                    <h3 className="font-bold text-lg">{group.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {group.description || t('admin.notifications.noDescription')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.members?.length > 0 ? (
                        group.members.slice(0, 5).map((m: any) => (
                          <span key={m.id} className="text-xs bg-muted px-2 py-1 rounded-full">
                            {m.firstName} {m.lastName}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          {t('admin.notifications.noMembers')}
                        </span>
                      )}
                      {group.members?.length > 5 && (
                        <span className="text-xs text-muted-foreground">
                          +{group.members.length - 5} more
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Group Modal - Simple implementation for now */}
            {isGroupModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <Card className="w-full max-w-lg p-6 space-y-6 m-4 max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold">
                    {editingGroup
                      ? t('admin.notifications.editGroup')
                      : t('admin.notifications.newGroup')}
                  </h2>
                  <form onSubmit={handleSaveGroup} className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('admin.notifications.groupName')}</Label>
                      <Input
                        value={groupForm.name}
                        onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('admin.notifications.description')}</Label>
                      <Input
                        value={groupForm.description}
                        onChange={(e) =>
                          setGroupForm({ ...groupForm, description: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('admin.notifications.members')}</Label>
                      <MultiSelect
                        options={userOptions}
                        selected={groupForm.memberIds}
                        onChange={(ids) => setGroupForm({ ...groupForm, memberIds: ids })}
                        placeholder={t('admin.notifications.selectMembers')}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsGroupModalOpen(false)}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button type="submit">{t('admin.notifications.saveGroup')}</Button>
                    </div>
                  </form>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Broadcast History</h3>
                  <p className="text-sm text-muted-foreground">View and manage sent broadcasts</p>
                </div>
                <Button onClick={fetchBroadcastHistory} variant="outline" size="sm">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </Button>
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner />
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedBroadcasts.length > 0 && (
                    <div className="bg-muted/50 p-2 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                      <span className="text-sm text-muted-foreground ml-2">
                        {selectedBroadcasts.length} selected
                      </span>
                      <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Selected
                      </Button>
                    </div>
                  )}

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={
                                selectedBroadcasts.length === broadcastHistory.length &&
                                broadcastHistory.length > 0
                              }
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedBroadcasts(broadcastHistory.map((b) => b.id));
                                } else {
                                  setSelectedBroadcasts([]);
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>{t('admin.notifications.titleLabel')}</TableHead>
                          <TableHead>{t('admin.notifications.message')}</TableHead>
                          <TableHead>{t('admin.notifications.type')}</TableHead>
                          <TableHead>{t('admin.notifications.recipients')}</TableHead>
                          <TableHead>{t('admin.notifications.date')}</TableHead>
                          <TableHead>{t('common.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {broadcastHistory.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center h-24 text-muted-foreground"
                            >
                              No results.
                            </TableCell>
                          </TableRow>
                        ) : (
                          broadcastHistory.map((broadcast) => (
                            <TableRow key={broadcast.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedBroadcasts.includes(broadcast.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedBroadcasts([...selectedBroadcasts, broadcast.id]);
                                    } else {
                                      setSelectedBroadcasts(
                                        selectedBroadcasts.filter((id) => id !== broadcast.id)
                                      );
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{broadcast.title}</TableCell>
                              <TableCell>
                                <div
                                  className="text-muted-foreground truncate max-w-[300px]"
                                  title={broadcast.message}
                                >
                                  {broadcast.message}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    broadcast.type === 'SUCCESS'
                                      ? 'bg-green-100 text-green-800'
                                      : broadcast.type === 'ERROR'
                                        ? 'bg-red-100 text-red-800'
                                        : broadcast.type === 'WARNING'
                                          ? 'bg-orange-100 text-orange-800'
                                          : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {broadcast.type}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {broadcast.recipientCount} users
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(broadcast.createdAt).toLocaleDateString('en-GB')}{' '}
                                {new Date(broadcast.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedBroadcast(broadcast);
                                        setViewDetailsOpen(true);
                                      }}
                                    >
                                      {t('common.view')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setDeleteId(broadcast.id);
                                      }}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      {t('common.delete')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4">
            {!selectedApp ? (
              // Master View: App Grid
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {apps.map((app) => (
                  <Card
                    key={app.id}
                    onClick={() => setSelectedApp(app.id)}
                    className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-border/60 overflow-hidden"
                  >
                    <div className="p-6 space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        {renderAppIcon(app.icon)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {app.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{app.description}</p>
                      </div>
                    </div>
                    <div className="px-6 py-4 bg-muted/30 border-t border-border/50 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      Click to manage
                    </div>
                  </Card>
                ))}
                {apps.length === 0 && (
                  <div className="col-span-full text-center p-8 text-muted-foreground">
                    No settings found.
                  </div>
                )}
              </div>
            ) : (
              // Detail View: Settings List
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedApp(null)}
                    className="gap-2"
                  >
                    ← Back
                  </Button>
                  <h2 className="text-lg font-semibold">
                    {apps.find((a) => a.id === selectedApp)?.title} Settings
                  </h2>
                </div>

                <div className="grid gap-4">
                  {settings
                    .filter((s) => s.sourceApp === selectedApp)
                    .map((setting) => (
                      <Card key={setting.id} className="p-6 transition-all hover:shadow-md">
                        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 justify-between items-start">
                          <div className="space-y-1 w-full lg:w-1/4 min-w-[250px]">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg uppercase tracking-tight">
                                {setting.sourceApp} - {setting.actionType}
                              </h3>
                              <Switch
                                checked={setting.isActive}
                                onCheckedChange={(checked) =>
                                  handleUpdateSetting(setting, { isActive: checked })
                                }
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Configure who receives this notification.
                            </p>
                          </div>

                          <div className="flex-1 w-full space-y-4">
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                              <div>
                                <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
                                  Recipient Roles
                                </Label>
                                <MultiSelect
                                  options={roleOptions}
                                  selected={setting.recipientRoles}
                                  onChange={(selected) =>
                                    handleUpdateSetting(setting, { recipientRoles: selected })
                                  }
                                  placeholder="Select roles..."
                                />
                              </div>
                              <div>
                                <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
                                  Recipient Groups
                                </Label>
                                <MultiSelect
                                  options={groupOptions}
                                  selected={setting.recipientGroups || []}
                                  onChange={(selected) =>
                                    handleUpdateSetting(setting, { recipientGroups: selected })
                                  }
                                  placeholder="Select groups..."
                                />
                              </div>
                              <div>
                                <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
                                  Specific Users (Overrides)
                                </Label>
                                <MultiSelect
                                  options={userOptions}
                                  selected={setting.recipientUsers}
                                  onChange={(selected) =>
                                    handleUpdateSetting(setting, { recipientUsers: selected })
                                  }
                                  placeholder="Select users..."
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </TabsContent>
          {/* Broadcast Tab */}
          <TabsContent value="broadcast">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form */}
              <Card className="p-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">
                    {t('admin.notifications.sendManualBroadcast')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.notifications.sendBroadcastDescription')}
                  </p>
                </div>

                <form onSubmit={handleSendBroadcast} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('admin.notifications.titleLabel')}</Label>
                    <Input
                      placeholder={t('admin.notifications.notificationTitle')}
                      value={broadcastForm.title}
                      onChange={(e) =>
                        setBroadcastForm({ ...broadcastForm, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('admin.notifications.message')}</Label>
                    <Textarea
                      placeholder={t('admin.notifications.messageContent')}
                      value={broadcastForm.message}
                      onChange={(e) =>
                        setBroadcastForm({ ...broadcastForm, message: e.target.value })
                      }
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('admin.notifications.type')}</Label>
                      <Select
                        value={broadcastForm.type}
                        onValueChange={(val: any) =>
                          setBroadcastForm({ ...broadcastForm, type: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INFO">Info</SelectItem>
                          <SelectItem value="SUCCESS">Success</SelectItem>
                          <SelectItem value="WARNING">Warning</SelectItem>
                          <SelectItem value="ERROR">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('admin.notifications.targetRoles')}</Label>
                    <MultiSelect
                      options={roleOptions}
                      selected={broadcastForm.recipientRoles}
                      onChange={(selected) =>
                        setBroadcastForm({ ...broadcastForm, recipientRoles: selected })
                      }
                      placeholder={t('admin.notifications.selectRoles')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('admin.notifications.targetGroups')}</Label>
                    <MultiSelect
                      options={groupOptions}
                      selected={broadcastForm.recipientGroups}
                      onChange={(selected) =>
                        setBroadcastForm({ ...broadcastForm, recipientGroups: selected })
                      }
                      placeholder={t('admin.notifications.selectGroups')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('admin.notifications.targetUsers')}</Label>
                    <MultiSelect
                      options={userOptions}
                      selected={broadcastForm.recipientUsers}
                      onChange={(selected) =>
                        setBroadcastForm({ ...broadcastForm, recipientUsers: selected })
                      }
                      placeholder={t('admin.notifications.selectUsers')}
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    <Megaphone className="w-4 h-4 mr-2" />
                    {t('admin.notifications.sendBroadcast')}
                  </Button>
                </form>
              </Card>

              {/* Preview */}
              <div className="space-y-6">
                <Card className="p-6">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    {t('admin.notifications.preview')}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('admin.notifications.previewDescription')}
                  </p>

                  {/* Live Preview Card */}
                  <div className="border rounded-lg overflow-hidden bg-card">
                    <div className="bg-muted/30 p-3 border-b">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Bell Menu Preview
                      </p>
                    </div>
                    <div className="p-4">
                      <div
                        className={`flex gap-3 p-4 rounded-lg border-l-4 transition-all ${
                          broadcastForm.type === 'SUCCESS'
                            ? 'bg-green-50 border-green-500 dark:bg-green-950/20'
                            : broadcastForm.type === 'ERROR'
                              ? 'bg-red-50 border-red-500 dark:bg-red-950/20'
                              : broadcastForm.type === 'WARNING'
                                ? 'bg-orange-50 border-orange-500 dark:bg-orange-950/20'
                                : 'bg-blue-50 border-blue-500 dark:bg-blue-950/20'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            broadcastForm.type === 'SUCCESS'
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : broadcastForm.type === 'ERROR'
                                ? 'bg-red-100 dark:bg-red-900/30'
                                : broadcastForm.type === 'WARNING'
                                  ? 'bg-orange-100 dark:bg-orange-900/30'
                                  : 'bg-blue-100 dark:bg-blue-900/30'
                          }`}
                        >
                          {broadcastForm.type === 'SUCCESS' ? (
                            <svg
                              className="w-5 h-5 text-green-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : broadcastForm.type === 'ERROR' ? (
                            <svg
                              className="w-5 h-5 text-red-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          ) : broadcastForm.type === 'WARNING' ? (
                            <svg
                              className="w-5 h-5 text-orange-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                          ) : (
                            <Bell className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-sm mb-1 text-foreground">
                            {broadcastForm.title || t('admin.notifications.notificationTitle')}
                          </h5>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {broadcastForm.message || t('admin.notifications.messageContent')}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">Just now</span>
                            {(broadcastForm.recipientRoles.length > 0 ||
                              broadcastForm.recipientUsers.length > 0 ||
                              broadcastForm.recipientGroups.length > 0) && (
                              <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">
                                  {broadcastForm.recipientRoles.length +
                                    broadcastForm.recipientUsers.length +
                                    broadcastForm.recipientGroups.length}{' '}
                                  recipients
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Details Dialog */}
      <AlertDialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Broadcast Details
            </AlertDialogTitle>
            <AlertDialogDescription>
              View detailed information about this broadcast notification
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedBroadcast && (
            <div className="space-y-4 py-4">
              {/* Title */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <p className="text-base font-semibold mt-1">{selectedBroadcast.title}</p>
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Message</label>
                <p className="text-base mt-1 whitespace-pre-wrap">{selectedBroadcast.message}</p>
              </div>

              {/* Type Badge */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedBroadcast.type === 'SUCCESS'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : selectedBroadcast.type === 'ERROR'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : selectedBroadcast.type === 'WARNING'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {selectedBroadcast.type}
                  </span>
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Recipients</label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      {selectedBroadcast.recipientCount || 0} users
                    </span>
                  </div>
                  {selectedBroadcast.recipientDetails &&
                    selectedBroadcast.recipientDetails.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg p-2 bg-muted/30">
                        <div className="space-y-1">
                          {selectedBroadcast.recipientDetails.map((recipient: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-sm py-1">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                {recipient.firstName?.[0] || recipient.username?.[0] || '?'}
                              </div>
                              <span>
                                {recipient.firstName && recipient.lastName
                                  ? `${recipient.firstName} ${recipient.lastName}`
                                  : recipient.username || 'Unknown User'}
                              </span>
                              {recipient.role && (
                                <span className="text-xs text-muted-foreground">
                                  ({recipient.role})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Sent At */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sent At</label>
                <p className="text-base mt-1">
                  {new Date(selectedBroadcast.createdAt).toLocaleString('en-US', {
                    dateStyle: 'full',
                    timeStyle: 'medium',
                  })}
                </p>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setViewDetailsOpen(false)}>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Group Dialog */}
      <AlertDialog open={!!deleteGroupId} onOpenChange={(open) => !open && setDeleteGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-2">
              <Trash className="w-6 h-6 text-red-600" />
            </div>
            <AlertDialogTitle>{t('admin.notifications.deleteGroup')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.notifications.deleteGroupMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteGroupId(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Broadcast Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteId === 'BULK' ? 'Delete Selected Broadcasts' : t('common.confirmDelete')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteId === 'BULK'
                ? `Are you sure you want to delete ${selectedBroadcasts.length} selected broadcasts?`
                : 'Are you sure you want to delete this broadcast? This will remove it from the history.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
