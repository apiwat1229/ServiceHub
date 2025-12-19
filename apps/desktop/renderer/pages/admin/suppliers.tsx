import { Plus, Truck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { DataTable } from '../../components/ui/data-table';
import { DatePicker } from '../../components/ui/date-picker';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
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

const masterApi = {
  getProvinces: async () => {
    const res = await api.get('/master/provinces');
    return res.data;
  },
  getDistricts: async (provinceId: number) => {
    const res = await api.get(`/master/provinces/${provinceId}/districts`);
    return res.data;
  },
  getSubdistricts: async (districtId: number) => {
    const res = await api.get(`/master/districts/${districtId}/subdistricts`);
    return res.data;
  },
  getRubberTypes: async () => {
    const res = await api.get('/master/rubber-types');
    return res.data;
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
    firstName: '',
    lastName: '',
    title: '',
    taxId: '',
    phone: '',
    email: '',
    address: '',
    provinceId: undefined as number | undefined,
    districtId: undefined as number | undefined,
    subdistrictId: undefined as number | undefined,
    zipCode: '',
    status: 'ACTIVE',
    avatar: '',
    certificateNumber: '',
    certificateExpire: '',
    score: 0,
    eudrQuotaUsed: 0,
    eudrQuotaCurrent: 0,
    rubberTypeCodes: [] as string[],
    notes: '',
  });

  const { toast } = useToast();

  // Master Data State
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [subdistricts, setSubdistricts] = useState<any[]>([]);
  const [rubberTypes, setRubberTypes] = useState<any[]>([]);

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

  const fetchMasterData = async () => {
    try {
      const [pData, rtData] = await Promise.all([
        masterApi.getProvinces(),
        masterApi.getRubberTypes(),
      ]);
      setProvinces(pData);
      setRubberTypes(rtData);
    } catch (error) {
      console.error('Failed to fetch master data:', error);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchMasterData();
  }, []);

  // Cascading Effects
  useEffect(() => {
    if (formData.provinceId) {
      masterApi.getDistricts(formData.provinceId).then(setDistricts);
    } else {
      setDistricts([]);
    }
  }, [formData.provinceId]);

  useEffect(() => {
    if (formData.districtId) {
      masterApi.getSubdistricts(formData.districtId).then(setSubdistricts);
    } else {
      setSubdistricts([]);
    }
  }, [formData.districtId]);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({
      code: '',
      name: '',
      firstName: '',
      lastName: '',
      title: '',
      taxId: '',
      phone: '',
      email: '',
      address: '',
      provinceId: undefined,
      districtId: undefined,
      subdistrictId: undefined,
      zipCode: '',
      status: 'ACTIVE',
      avatar: '',
      certificateNumber: '',
      certificateExpire: '',
      score: 0,
      eudrQuotaUsed: 0,
      eudrQuotaCurrent: 0,
      rubberTypeCodes: [],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      code: supplier.code,
      name: supplier.name,
      firstName: supplier.firstName || '',
      lastName: supplier.lastName || '',
      title: supplier.title || '',
      taxId: supplier.taxId || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      provinceId: supplier.province?.id, // Assuming province relation exists and has id
      districtId: supplier.districtId || undefined,
      subdistrictId: supplier.subdistrictId || undefined,
      zipCode: supplier.zipCode || '',
      status: supplier.status,
      avatar: supplier.avatar || '',
      certificateNumber: supplier.certificateNumber || '',
      // Handle date formatting if needed
      certificateExpire: supplier.certificateExpire
        ? new Date(supplier.certificateExpire).toISOString().split('T')[0]
        : '',
      score: supplier.score || 0,
      eudrQuotaUsed: supplier.eudrQuotaUsed || 0,
      eudrQuotaCurrent: supplier.eudrQuotaCurrent || 0,
      rubberTypeCodes: supplier.rubberTypeCodes || [],
      notes: supplier.notes || '',
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

              <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col h-[calc(80vh-60px)]">
                <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
                  <div className="border-b border-border">
                    <TabsList className="bg-transparent h-auto p-0 gap-6">
                      <TabsTrigger
                        value="basic"
                        className="rounded-none border-b-2 border-transparent px-0 py-2 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-sm"
                      >
                        Basic Information
                      </TabsTrigger>
                      <TabsTrigger
                        value="contact"
                        className="rounded-none border-b-2 border-transparent px-0 py-2 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-sm"
                      >
                        Contact Information
                      </TabsTrigger>
                      <TabsTrigger
                        value="address"
                        className="rounded-none border-b-2 border-transparent px-0 py-2 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-sm"
                      >
                        Address
                      </TabsTrigger>
                      <TabsTrigger
                        value="business"
                        className="rounded-none border-b-2 border-transparent px-0 py-2 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-sm"
                      >
                        Business Details
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 overflow-y-auto pt-4 pb-2">
                    {/* Basic Information */}
                    <TabsContent value="basic" className="space-y-4 m-0">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            Code <span className="text-destructive">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            placeholder="SUP-0001"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            Title
                          </label>
                          <select
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          >
                            <option value="">Select Title</option>
                            <option value="Mr">Mr.</option>
                            <option value="Mrs">Mrs.</option>
                            <option value="Ms">Ms.</option>
                            <option value="Company">Company</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            First Name <span className="text-destructive">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            value={formData.firstName}
                            onChange={(e) =>
                              setFormData({ ...formData, firstName: e.target.value })
                            }
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
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            Display Name
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            placeholder="Auto-generated if empty"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            Avatar URL
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                              value={formData.avatar}
                              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                            />
                            {/* Placeholder for Upload Button */}
                            {/* <Button variant="outline" size="sm" type="button">Upload</Button> */}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Contact Information */}
                    <TabsContent value="contact" className="space-y-4 m-0">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            Phone
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            placeholder="081-234-5678"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            Email
                          </label>
                          <input
                            type="email"
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Address */}
                    <TabsContent value="address" className="space-y-4 m-0">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-1 block">Province</Label>
                          <Select
                            value={formData.provinceId?.toString()}
                            onValueChange={(val) => {
                              const provinceId = parseInt(val);
                              setFormData({
                                ...formData,
                                provinceId,
                                districtId: undefined,
                                subdistrictId: undefined,
                                zipCode: '',
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Province" />
                            </SelectTrigger>
                            <SelectContent>
                              {provinces.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.name_th}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="mb-1 block">District</Label>
                          <Select
                            value={formData.districtId?.toString()}
                            disabled={!formData.provinceId}
                            onValueChange={(val) => {
                              const districtId = parseInt(val);
                              setFormData({
                                ...formData,
                                districtId,
                                subdistrictId: undefined,
                                zipCode: '',
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select District" />
                            </SelectTrigger>
                            <SelectContent>
                              {districts.map((d) => (
                                <SelectItem key={d.id} value={d.id.toString()}>
                                  {d.name_th}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="mb-1 block">Sub-District</Label>
                          <Select
                            value={formData.subdistrictId?.toString()}
                            disabled={!formData.districtId}
                            onValueChange={(val) => {
                              const subdistrictId = parseInt(val);
                              const subdistrict = subdistricts.find((s) => s.id === subdistrictId);
                              setFormData({
                                ...formData,
                                subdistrictId,
                                zipCode: subdistrict?.zip_code || '',
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Sub-District" />
                            </SelectTrigger>
                            <SelectContent>
                              {subdistricts.map((s) => (
                                <SelectItem key={s.id} value={s.id.toString()}>
                                  {s.name_th}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="mb-1 block">Zipcode</Label>
                          <Input value={formData.zipCode} readOnly placeholder="Auto-filled" />
                        </div>
                        <div className="col-span-2">
                          <Label className="mb-1 block">Address Line</Label>
                          <textarea
                            rows={2}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Business Details */}
                    <TabsContent value="business" className="space-y-4 m-0">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            Rubber Types
                          </label>
                          <MultiSelect
                            options={rubberTypes.map((rt) => ({
                              label: rt.name,
                              value: rt.code,
                              category: rt.category,
                            }))}
                            selected={formData.rubberTypeCodes}
                            onChange={(selected) =>
                              setFormData({ ...formData, rubberTypeCodes: selected })
                            }
                            placeholder="Select Rubber Types..."
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            Certificate Number
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            value={formData.certificateNumber}
                            onChange={(e) =>
                              setFormData({ ...formData, certificateNumber: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block">Certificate Expiration</Label>
                          <DatePicker
                            date={
                              formData.certificateExpire
                                ? new Date(formData.certificateExpire)
                                : undefined
                            }
                            setDate={(date) => {
                              // Keep the date as YYYY-MM-DD string in state
                              const dateStr = date ? date.toISOString().split('T')[0] : '';
                              setFormData({ ...formData, certificateExpire: dateStr });
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            Status
                          </label>
                          <div className="flex gap-4 pt-1">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="status"
                                value="ACTIVE"
                                checked={formData.status === 'ACTIVE'}
                                onChange={(e) =>
                                  setFormData({ ...formData, status: e.target.value })
                                }
                              />{' '}
                              Active
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="status"
                                value="INACTIVE"
                                checked={formData.status === 'INACTIVE'}
                                onChange={(e) =>
                                  setFormData({ ...formData, status: e.target.value })
                                }
                              />{' '}
                              Inactive
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="status"
                                value="SUSPENDED"
                                checked={formData.status === 'SUSPENDED'}
                                onChange={(e) =>
                                  setFormData({ ...formData, status: e.target.value })
                                }
                              />{' '}
                              Suspended
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            Score
                          </label>
                          {/* Star rating placeholder or number input */}
                          <input
                            type="number"
                            min="0"
                            max="5"
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            value={formData.score}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                score: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            EU DR Quota Used
                          </label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            value={formData.eudrQuotaUsed}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                eudrQuotaUsed: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            EU DR Quota Current
                          </label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            value={formData.eudrQuotaCurrent}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                eudrQuotaCurrent: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            Note
                          </label>
                          <textarea
                            rows={3}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>

                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-auto">
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
