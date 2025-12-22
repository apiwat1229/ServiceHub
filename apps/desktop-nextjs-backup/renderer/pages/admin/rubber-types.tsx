import { Layers, Plus, Trash2 } from 'lucide-react';
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
import { DataTable } from '../../components/ui/data-table';
import { Spinner } from '../../components/ui/spinner';
import { rubberTypesApi } from '../../lib/api';
import { RubberType, useRubberTypeColumns } from './rubber-types/columns';

export default function RubberTypesPage() {
  const [data, setData] = useState<RubberType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RubberType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { t } = useTranslation();

  /* const { toast } = useToast(); -> Removed for Sonner */

  // Form Data
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    is_active: true,
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await rubberTypesApi.getAll();
      setData(res);
    } catch (error) {
      console.error('Failed to fetch rubber types:', error);
      toast.error('Error', {
        description: 'Failed to fetch rubber types.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ code: '', name: '', description: '', is_active: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RubberType) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await rubberTypesApi.delete(deleteId);
      toast.success(t('common.toast.success'), {
        description: t('common.toast.deleteSuccess'),
      });
      fetchData();
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete rubber type:', error);
      toast.error(t('common.toast.error'), {
        description: t('common.toast.deleteFailed'),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await rubberTypesApi.update(editingItem.id, formData);
        toast.success(t('common.toast.success'), {
          description: t('common.toast.updateSuccess'),
        });
      } else {
        await rubberTypesApi.create(formData);
        toast.success(t('common.toast.success'), {
          description: t('common.toast.createSuccess'),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Failed to save:', error);
      toast.error(t('common.toast.error'), {
        description: t('common.toast.saveFailed'),
      });
    }
  };

  const columns = useRubberTypeColumns({
    onEdit: handleOpenEdit,
    onDelete: handleDelete,
  });

  const stats = React.useMemo(() => {
    return {
      total: data.length,
      active: data.filter((item) => item.is_active).length,
      inactive: data.filter((item) => !item.is_active).length,
    };
  }, [data]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="h-[calc(100vh-100px)] w-full flex items-center justify-center">
          <Spinner size="xl" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 w-full max-w-[1400px] mx-auto space-y-8">
        {/* Header Card */}
        <Card className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-border/60 shadow-sm relative overflow-hidden">
          {/* Decorative Background Icon */}
          <div className="absolute top-1/2 right-12 -translate-y-1/2 pointer-events-none opacity-5">
            <Layers className="w-64 h-64" />
          </div>

          {/* Left: Title & Icon */}
          <div className="flex items-center gap-6 z-10 w-full md:w-auto">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
              <Layers className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {t('admin.rubberTypes.title', 'Rubber Types Management')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t('admin.rubberTypes.subtitle', 'Manage rubber types and their configurations.')}
              </p>
            </div>
          </div>

          {/* Center: Stats Widget */}
          <div className="flex items-center gap-8 md:gap-12 z-10 w-full md:w-auto justify-center md:justify-end text-center">
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
              <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">
                Inactive
              </p>
              <p className="text-2xl font-bold text-orange-500">{stats.inactive}</p>
            </div>
          </div>

          {/* Right: Action Button */}
          <Button
            onClick={handleOpenCreate}
            className="w-full xl:w-auto z-10 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('admin.rubberTypes.add', 'Add New Rubber Type')}
          </Button>
        </Card>

        {/* Data Table */}
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow">
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <DataTable columns={columns} data={data} searchKey="name" />
          </div>
        </div>

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 w-screen h-screen grid place-items-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background rounded-xl shadow-2xl border border-border w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 relative">
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/10">
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    {editingItem ? (
                      <Layers className="w-5 h-5 text-primary" />
                    ) : (
                      <Plus className="w-5 h-5 text-primary" />
                    )}
                    {editingItem ? 'Edit Rubber Type' : 'Add New Rubber Type'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {editingItem
                      ? 'Update rubber type details.'
                      : 'Add a new rubber type to the system.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Code <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                    placeholder="E.g. RT-001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                    placeholder="E.g. Latex 100%"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 p-3 border border-border rounded-lg bg-card/50">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-primary shadow-sm focus:ring-primary w-4 h-4"
                  />
                  <label
                    htmlFor="is_active"
                    className="text-sm font-medium text-foreground cursor-pointer select-none"
                  >
                    Active (Enabled)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-lg shadow-primary/20"
                  >
                    {editingItem ? 'Save Changes' : 'Create Rubber Type'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="mx-auto w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-2">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle>Delete Rubber Type?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this rubber type.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
