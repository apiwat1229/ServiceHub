import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api, bookingsApi } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { SearchableSelect } from '../ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface BookingSheetProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedSlot: string;
  nextQueueNo: number | null;
  onSuccess: () => void;
  editingBooking?: any;
}

const TRUCK_TYPES = [
  { value: 'กระบะ', label: 'กระบะ' },
  { value: '6 ล้อ', label: '6 ล้อ' },
  { value: '10 ล้อ', label: '10 ล้อ' },
  { value: '10 ล้อ พ่วง', label: '10 ล้อ (พ่วง)' },
  { value: 'เทรลเลอร์', label: 'เทรลเลอร์' },
];

function genBookingCode(date: Date, queueNo: number): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const q = String(queueNo).padStart(2, '0');
  return `${yy}${mm}${dd}${q}`;
}

export default function BookingSheet({
  open,
  onClose,
  selectedDate,
  selectedSlot,
  nextQueueNo,
  onSuccess,
  editingBooking,
}: BookingSheetProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [rubberTypes, setRubberTypes] = useState<any[]>([]);

  const [supplierId, setSupplierId] = useState('');
  const [truckType, setTruckType] = useState('');
  const [truckRegister, setTruckRegister] = useState('');
  const [rubberType, setRubberType] = useState('');

  // Alert Dialog states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success'>('error');

  const [startTime, endTime] = selectedSlot.split('-');
  const isEditMode = !!editingBooking;

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      // If we already have data, don't refetch (optional optimization)
      if (suppliers.length > 0 && rubberTypes.length > 0) return;

      try {
        const [suppliersResp, rubberTypesResp] = await Promise.all([
          api.get('/suppliers'),
          api.get('/rubber-types'),
        ]);

        setSuppliers(suppliersResp.data || []);
        setRubberTypes(rubberTypesResp.data || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        // Only toast if open to avoid random toasts on page load if something fails silently?
        // Better to fail silently on background fetch or toast only if user interacts.
        // For now, let's keep it simple.
        if (open) toast.error(t('common.toast.fetchFailed'));
      }
    };

    fetchData();
  }, []); // Run once on mount

  // Sync form with editingBooking
  useEffect(() => {
    if (open && isEditMode && editingBooking) {
      setSupplierId(editingBooking.supplierId || '');
      setTruckType(editingBooking.truckType || '');
      setTruckRegister(editingBooking.truckRegister || '');
      // Ensure rubberType is set even if data isn't loaded yet,
      // but value binding should work once options render.
      setRubberType(editingBooking.rubberType || '');
    } else if (open && !isEditMode) {
      // Reset form
      setSupplierId('');
      setTruckType('');
      setTruckRegister('');
      setRubberType('');
    }
  }, [open, isEditMode, editingBooking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId || !rubberType) {
      toast.error(t('common.toast.error'), {
        description: t('booking.validationError', 'Please fill in all required fields'),
      });
      return;
    }

    try {
      setLoading(true);

      // Validate Supplier Data
      const selectedSupplier = suppliers.find((s) => s.id === supplierId);
      if (!selectedSupplier) {
        toast.error(t('common.toast.error'), {
          description: t('booking.supplierNotFound', 'Supplier not found'),
        });
        setLoading(false);
        return;
      }

      const supplierCode = selectedSupplier.code || '';
      const supplierName = selectedSupplier.name || selectedSupplier.displayName || '';

      // Get current user from Auth Store
      const user = useAuthStore.getState().user;
      const recorderName = user?.name || user?.username || user?.email || 'System';

      const payload: any = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        supplierId,
        supplierCode,
        supplierName,
        truckType,
        truckRegister,
        rubberType,
        recorder: recorderName,
      };

      if (isEditMode && editingBooking?.id) {
        await bookingsApi.update(editingBooking.id, payload);
        toast.success(t('common.toast.success'), {
          description: t('common.toast.updateSuccess'),
        });
      } else {
        await bookingsApi.create(payload);
        toast.success(t('common.toast.success'), {
          description: t('common.toast.createSuccess'),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Save booking error:', err);
      toast.error(t('common.toast.error'), {
        description: err?.response?.data?.message || t('common.toast.saveFailed'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t('booking.editBooking') : t('booking.addBooking')}
          </DialogTitle>
          <DialogDescription>
            {format(selectedDate, 'dd MMM yyyy')} • {selectedSlot}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('booking.startTime')}</Label>
              <Input value={startTime} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label>{t('booking.endTime')}</Label>
              <Input value={endTime} readOnly disabled />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('booking.queueNumber')}</Label>
              <Input value={nextQueueNo !== null ? nextQueueNo : '-'} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label>{t('booking.bookingCode')}</Label>
              <Input
                value={nextQueueNo !== null ? genBookingCode(selectedDate, nextQueueNo) : '-'}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('booking.supplier')}</Label>
            <SearchableSelect
              options={suppliers.map((supplier) => ({
                value: supplier.id,
                label: `${supplier.code} - ${supplier.name || supplier.displayName}`,
              }))}
              value={supplierId}
              onChange={setSupplierId}
              placeholder={t('booking.selectSupplier')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('booking.truckType')}</Label>
              <Select value={truckType} onValueChange={setTruckType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('booking.selectTruckType')} />
                </SelectTrigger>
                <SelectContent>
                  {TRUCK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('booking.truckRegister')}</Label>
              <Input
                value={truckRegister}
                onChange={(e) => setTruckRegister(e.target.value)}
                placeholder={t('booking.truckRegisterPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rubberType">
              {t('booking.rubberType')} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Select value={rubberType} onValueChange={setRubberType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('booking.selectRubberType')} />
                </SelectTrigger>
                <SelectContent>
                  {rubberTypes
                    .filter((rt) => rt.code === 'CL' || rt.name?.includes('CL'))
                    .map((type) => (
                      <SelectItem key={type.id} value={type.code}>
                        {type.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? `${t('common.loading')}`
                : isEditMode
                  ? t('common.update')
                  : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Alert Dialog for validation and errors */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>ตกลง</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
