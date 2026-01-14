import api from '@/services/api';
import { ref } from 'vue';

export interface Machine {
    id: string;
    name: string;
    model: string;
    location: string;
    status: 'Active' | 'Inactive' | 'Maintenance';
    createdAt: number;
}

export interface RepairPart {
    id: number;
    name: string;
    qty: number;
    price: number;
}

export interface Repair {
    id: string;
    machineId: string;
    machineName: string;
    date: string;
    issue: string;
    technician: string;
    parts: RepairPart[];
    totalCost: number;
    images?: string[];
    status?: string;
    timestamp: number;
}

export interface StockItem {
    id: string;
    code?: string;
    name: string;
    nameTH?: string;
    nameEN?: string;
    category?: string;
    location?: string;
    glCode?: string;
    qty: number;
    price: number;
    unit: string;
    minQty: number;
    dateReceived?: string;
    receiver?: string;
    description?: string;
    image?: string;
}

export interface GLCode {
    id: string;
    transactionId: string;
    description: string;
    code: string;
    purpose?: string;
}

export interface StockCategory {
    id: string;
    name: string;
    nameEN?: string;
    nameTH?: string;
    prefix?: string;
}

export interface StorageLocation {
    id: string;
    name: string;
    nameEN?: string;
    nameTH?: string;
    building?: string;
    zone?: string;
}

const machines = ref<Machine[]>([]);
const repairs = ref<Repair[]>([]);
const stocks = ref<StockItem[]>([]);
const glCodes = ref<GLCode[]>([]);
const categories = ref<StockCategory[]>([]);
const locations = ref<StorageLocation[]>([]);

export function useMaintenance() {

    const loadData = async () => {
        try {
            // Fetch all data in parallel
            const [machinesRes, repairsRes, stocksRes, glCodesRes, categoriesRes, locationsRes] = await Promise.all([
                api.get('/maintenance/machines'),
                api.get('/maintenance/repairs'),
                api.get('/maintenance/stocks'),
                api.get('/maintenance/gl-codes'),
                api.get('/maintenance/categories'),
                api.get('/maintenance/locations'),
            ]);

            machines.value = machinesRes.data;
            repairs.value = repairsRes.data;
            stocks.value = stocksRes.data;
            glCodes.value = glCodesRes.data;
            categories.value = categoriesRes.data;
            locations.value = locationsRes.data;

            // If empty, trigger seed (One-time auto setup)
            // Check if any main data is empty. Backend handles partial seeding safely.
            if (machines.value.length === 0 || repairs.value.length === 0 || stocks.value.length === 0) {
                console.log('Detected missing data (machines, repairs, or stocks), triggering seed check...');
                await api.post('/maintenance/seed');

                // Reload after seed
                const [mRes, rRes, sRes, gRes, cRes, lRes] = await Promise.all([
                    api.get('/maintenance/machines'),
                    api.get('/maintenance/repairs'),
                    api.get('/maintenance/stocks'),
                    api.get('/maintenance/gl-codes'),
                    api.get('/maintenance/categories'),
                    api.get('/maintenance/locations'),
                ]);
                machines.value = mRes.data;
                repairs.value = rRes.data;
                stocks.value = sRes.data;
                glCodes.value = gRes.data;
                categories.value = cRes.data;
                locations.value = lRes.data;
            }

        } catch (e) {
            console.error('Failed to load Maintenance data', e);
        }
    };

    const addMachine = async (machine: Omit<Machine, 'id' | 'createdAt'>) => {
        try {
            const res = await api.post('/maintenance/machines', machine);
            // Use array spread to ensure reactivity
            machines.value = [...machines.value, res.data];
        } catch (e) {
            console.error('Failed to add machine', e);
            throw e;
        }
    };

    const deleteMachine = async (id: string) => {
        try {
            await api.delete(`/maintenance/machines/${id}`);
            machines.value = machines.value.filter(m => m.id !== id);
        } catch (e) {
            console.error('Failed to delete machine', e);
            throw e;
        }
    };

    const updateMachine = async (id: string, updates: Partial<Machine>) => {
        try {
            // Correct endpoint matching the controller
            await api.post(`/maintenance/machines/${id}/update`, updates);

            // Replace the entire array to ensure reactivity
            const index = machines.value.findIndex(m => m.id === id);
            if (index !== -1) {
                const updated = [...machines.value];
                updated[index] = { ...updated[index], ...updates };
                machines.value = updated;
            }

        } catch (e) {
            console.error('Failed to update machine', e);
            throw e;
        }
    };

    const addRepair = async (repair: Omit<Repair, 'id' | 'timestamp'>) => {
        try {
            console.log('[addRepair] Sending repair data:', repair);
            const res = await api.post('/maintenance/repairs', repair);
            console.log('[addRepair] Received response:', res.data);

            // Refetch all repairs to ensure UI is in sync
            const repairsRes = await api.get('/maintenance/repairs');
            repairs.value = repairsRes.data;
            console.log('[addRepair] Refetched repairs, total:', repairs.value.length);

            // Best to re-fetch stocks to get updated quantities
            const sRes = await api.get('/maintenance/stocks');
            stocks.value = sRes.data;

        } catch (e) {
            console.error('Failed to add repair', e);
            throw e;
        }
    };

    const updateRepair = async (id: string, updates: Partial<Repair>) => {
        try {
            // Use same endpoint convention usually, but check controller. 
            // Usually POST /maintenance/repairs/:id/update based on patterns seen.
            const res = await api.post(`/maintenance/repairs/${id}/update`, updates);

            // Update local state with the actual response from backend
            const index = repairs.value.findIndex(r => r.id === id);
            if (index !== -1) {
                repairs.value[index] = res.data;
            }
            // Refetch stocks as parts might have changed
            const sRes = await api.get('/maintenance/stocks');
            stocks.value = sRes.data;

        } catch (e) {
            console.error('Failed to update repair', e);
            throw e;
        }
    };

    const deleteRepair = async (id: string) => {
        try {
            await api.delete(`/maintenance/repairs/${id}`);
            repairs.value = repairs.value.filter(r => r.id !== id);
        } catch (e) {
            console.error('Failed to delete repair', e);
            throw e;
        }
    };

    const getMachineStats = (machineId: string) => {
        const machineRepairs = repairs.value.filter(r => r.machineId === machineId);
        const count = machineRepairs.length;
        const cost = machineRepairs.reduce((acc, r) => acc + (r.totalCost || 0), 0);
        return { count, cost };
    };

    // Stock Management
    const addStock = async (stock: Omit<StockItem, 'id'>) => {
        try {
            const res = await api.post('/maintenance/stocks', stock);
            stocks.value.push(res.data);
        } catch (e) {
            console.error('Failed to add stock', e);
            throw e;
        }
    };

    const updateStock = async (id: string, updates: Partial<StockItem>) => {
        try {
            await api.post(`/maintenance/stocks/${id}/update`, updates);
            const index = stocks.value.findIndex(s => s.id === id);
            if (index !== -1) {
                stocks.value[index] = { ...stocks.value[index], ...updates };
            }
        } catch (e) {
            console.error('Failed to update stock', e);
            throw e;
        }
    };

    const deleteStock = async (id: string) => {
        try {
            await api.delete(`/maintenance/stocks/${id}`);
            stocks.value = stocks.value.filter(s => s.id !== id);
        } catch (e) {
            console.error('Failed to delete stock', e);
            throw e;
        }
    };

    // GL-Code Management
    const addGLCode = async (glCode: Omit<GLCode, 'id'>) => {
        try {
            const res = await api.post('/maintenance/gl-codes', glCode);
            glCodes.value.push(res.data);
            return res.data;
        } catch (e) {
            console.error('Failed to add GL-Code', e);
            throw e;
        }
    };

    const updateGLCode = async (id: string, updates: Partial<GLCode>) => {
        try {
            const res = await api.put(`/maintenance/gl-codes/${id}`, updates);
            const index = glCodes.value.findIndex(g => g.id === id);
            if (index !== -1) {
                glCodes.value[index] = res.data;
            }
            return res.data;
        } catch (e) {
            console.error('Failed to update GL-Code', e);
            throw e;
        }
    };

    const deleteGLCode = async (id: string) => {
        try {
            await api.delete(`/maintenance/gl-codes/${id}`);
            glCodes.value = glCodes.value.filter(g => g.id !== id);
        } catch (e) {
            console.error('Failed to delete GL-Code', e);
            throw e;
        }
    };

    // Stock Category Management
    const addCategory = async (category: Omit<StockCategory, 'id'>) => {
        try {
            const res = await api.post('/maintenance/categories', category);
            categories.value = [...categories.value, res.data];
            return res.data;
        } catch (e: unknown) {
            const err = e as any;
            console.error('Failed to add category:', err.response?.data || err.message);
            throw e;
        }
    };

    const updateCategory = async (id: string, updates: Partial<StockCategory>) => {
        try {
            const res = await api.put(`/maintenance/categories/${id}`, updates);
            categories.value = categories.value.map((c) => (c.id === id ? res.data : c));
            return res.data;
        } catch (e) {
            console.error('Failed to update category', e);
            throw e;
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            await api.delete(`/maintenance/categories/${id}`);
            categories.value = categories.value.filter(c => c.id !== id);
        } catch (e) {
            console.error('Failed to delete category', e);
            throw e;
        }
    };

    // Storage Location Management
    const addLocation = async (location: Omit<StorageLocation, 'id'>) => {
        try {
            const res = await api.post('/maintenance/locations', location);
            locations.value = [...locations.value, res.data];
            return res.data;
        } catch (e: unknown) {
            const err = e as any;
            console.error('Failed to add location:', err.response?.data || err.message);
            throw e;
        }
    };

    const updateLocation = async (id: string, updates: Partial<StorageLocation>) => {
        try {
            const res = await api.put(`/maintenance/locations/${id}`, updates);
            locations.value = locations.value.map((l) => (l.id === id ? res.data : l));
            return res.data;
        } catch (e) {
            console.error('Failed to update location', e);
            throw e;
        }
    };

    const deleteLocation = async (id: string) => {
        try {
            await api.delete(`/maintenance/locations/${id}`);
            locations.value = locations.value.filter(l => l.id !== id);
        } catch (e) {
            console.error('Failed to delete location', e);
            throw e;
        }
    };

    return {
        machines,
        repairs,
        stocks,
        glCodes,
        categories,
        locations,
        loadData,
        addMachine,
        updateMachine,
        deleteMachine,
        addRepair,
        updateRepair,
        deleteRepair,
        getMachineStats,
        addStock,
        updateStock,
        deleteStock,
        addGLCode,
        updateGLCode,
        deleteGLCode,
        addCategory,
        updateCategory,
        deleteCategory,
        addLocation,
        updateLocation,
        deleteLocation,
    };
}
