import { Plus, Truck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { DataTable } from '../../components/ui/data-table';
import { useToast } from '../../components/ui/use-toast';
import { api } from '../../lib/api';
import { Supplier, useSupplierColumns } from './suppliers/columns';

// Create a dedicated wrapper relative to Axios instance if needed or reuse existing connection logic
// Assuming `api` is the axios instance from lib/api.ts

const suppliersApi = {
  getAll: async () => {
    const res = await api.get('/suppliers');
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/suppliers', data);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await api.patch(`/suppliers/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    return api.delete(`/suppliers/${id}`);
  },
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    taxId: '',
    phone: '',
    email: '',
    address: '',
    status: 'ACTIVE',
  });

  const { toast } = useToast();

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const data = await suppliersApi.getAll();
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch suppliers.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({
      code: '',
      name: '',
      taxId: '',
      phone: '',
      email: '',
      address: '',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      code: supplier.code,
      name: supplier.name,
      taxId: supplier.taxId || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      status: supplier.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await suppliersApi.delete(id);
      toast({
        title: 'Success',
        description: 'Supplier deleted successfully.',
      });
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete supplier.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData };

      if (editingSupplier) {
        await suppliersApi.update(editingSupplier.id, payload);
        toast({
          title: 'Success',
          description: 'Supplier updated successfully.',
        });
      } else {
        await suppliersApi.create(payload);
        toast({
          title: 'Success',
          description: 'Supplier created successfully.',
        });
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to save supplier:', error);
      toast({
        title: 'Error',
        description: 'Failed to save supplier.',
        variant: 'destructive',
      });
    }
  };

  const columns = useSupplierColumns({
    onEdit: handleOpenEdit,
    onDelete: handleDelete,
  });

  return (
    <AdminLayout>
      <div className="p-6 w-full max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Truck className="h-8 w-8 text-primary" />
              Suppliers Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage external suppliers, vendors, and partners.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Supplier
          </button>
        </div>

        {/* Suppliers Table */}
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow">
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <DataTable columns={columns} data={suppliers} searchKey="name" />
          </div>
        </div>

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl overflow-hidden border border-border">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-semibold text-foreground">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {/* Code */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      Code <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                      placeholder="SUP-001"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                      placeholder="Acme Corp"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {/* Tax ID */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Tax ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                      placeholder="Tax ID"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Phone</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                      placeholder="02-123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                      placeholder="contact@acme.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Status</label>
                    <select
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Address</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                    placeholder="123 Main St..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-sm"
                  >
                    {editingSupplier ? 'Save Changes' : 'Create Supplier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
