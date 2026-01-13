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

const machines = ref<Machine[]>([]);
const repairs = ref<Repair[]>([]);
const stocks = ref<StockItem[]>([]);
const glCodes = ref<GLCode[]>([]);

export function useMyMachine() {

    const loadData = async () => {
        try {
            // Fetch all data in parallel
            const [machinesRes, repairsRes, stocksRes, glCodesRes] = await Promise.all([
                api.get('/mymachine/machines'),
                api.get('/mymachine/repairs'),
                api.get('/mymachine/stocks'),
                api.get('/mymachine/gl-codes')
            ]);

            machines.value = machinesRes.data;
            repairs.value = repairsRes.data;
            stocks.value = stocksRes.data;
            glCodes.value = glCodesRes.data;

            // If empty, trigger seed (One-time auto setup)
            // Check if machines are empty as the primary indicator
            // If empty, trigger seed (One-time auto setup)
            // Check if any main data is empty. Backend handles partial seeding safely.
            if (machines.value.length === 0 || repairs.value.length === 0 || stocks.value.length === 0) {
                console.log('Detected missing data (machines, repairs, or stocks), triggering seed check...');
                await api.post('/mymachine/seed');

                // Reload after seed
                const [mRes, rRes, sRes, gRes] = await Promise.all([
                    api.get('/mymachine/machines'),
                    api.get('/mymachine/repairs'),
                    api.get('/mymachine/stocks'),
                    api.get('/mymachine/gl-codes')
                ]);
                machines.value = mRes.data;
                repairs.value = rRes.data;
                stocks.value = sRes.data;
                glCodes.value = gRes.data;
            }

        } catch (e) {
            console.error('Failed to load My Machine data', e);
        }
    };

    const addMachine = async (machine: Omit<Machine, 'id' | 'createdAt'>) => {
        try {
            const res = await api.post('/mymachine/machines', machine);
            machines.value.push(res.data);
        } catch (e) {
            console.error('Failed to add machine', e);
            throw e;
        }
    };

    const deleteMachine = async (id: string) => {
        try {
            await api.delete(`/mymachine/machines/${id}`);
            machines.value = machines.value.filter(m => m.id !== id);
        } catch (e) {
            console.error('Failed to delete machine', e);
            throw e;
        }
    };

    const updateMachine = async (id: string, updates: Partial<Machine>) => {
        try {
            // Correct endpoint matching the controller
            await api.post(`/mymachine/machines/${id}/update`, updates);

            // Refetch or update local
            const index = machines.value.findIndex(m => m.id === id);
            if (index !== -1) {
                machines.value[index] = { ...machines.value[index], ...updates };
            }

        } catch (e) {
            console.error('Failed to update machine', e);
        }
    };

    const addRepair = async (repair: Omit<Repair, 'id' | 'timestamp'>) => {
        try {
            console.log('[addRepair] Sending repair data:', repair);
            const res = await api.post('/mymachine/repairs', repair);
            console.log('[addRepair] Received response:', res.data);

            // Refetch all repairs to ensure UI is in sync
            const repairsRes = await api.get('/mymachine/repairs');
            repairs.value = repairsRes.data;
            console.log('[addRepair] Refetched repairs, total:', repairs.value.length);

            // Best to re-fetch stocks to get updated quantities
            const sRes = await api.get('/mymachine/stocks');
            stocks.value = sRes.data;

        } catch (e) {
            console.error('Failed to add repair', e);
            throw e;
        }
    };

    const updateRepair = async (id: string, updates: Partial<Repair>) => {
        try {
            // Use same endpoint convention usually, but check controller. 
            // Usually POST /mymachine/repairs/:id/update based on patterns seen.
            const res = await api.post(`/mymachine/repairs/${id}/update`, updates);

            // Update local state with the actual response from backend
            const index = repairs.value.findIndex(r => r.id === id);
            if (index !== -1) {
                repairs.value[index] = res.data;
            }
            // Refetch stocks as parts might have changed
            const sRes = await api.get('/mymachine/stocks');
            stocks.value = sRes.data;

        } catch (e) {
            console.error('Failed to update repair', e);
            throw e;
        }
    };

    const deleteRepair = async (id: string) => {
        try {
            await api.delete(`/mymachine/repairs/${id}`);
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
            const res = await api.post('/mymachine/stocks', stock);
            stocks.value.push(res.data);
        } catch (e) {
            console.error('Failed to add stock', e);
            throw e;
        }
    };

    const updateStock = async (id: string, updates: Partial<StockItem>) => {
        try {
            await api.post(`/mymachine/stocks/${id}/update`, updates);
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
            await api.delete(`/mymachine/stocks/${id}`);
            stocks.value = stocks.value.filter(s => s.id !== id);
        } catch (e) {
            console.error('Failed to delete stock', e);
            throw e;
        }
    };

    // GL-Code Management
    const addGLCode = async (glCode: Omit<GLCode, 'id'>) => {
        try {
            const res = await api.post('/mymachine/gl-codes', glCode);
            glCodes.value.push(res.data);
            return res.data;
        } catch (e) {
            console.error('Failed to add GL-Code', e);
            throw e;
        }
    };

    const updateGLCode = async (id: string, updates: Partial<GLCode>) => {
        try {
            const res = await api.put(`/mymachine/gl-codes/${id}`, updates);
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
            await api.delete(`/mymachine/gl-codes/${id}`);
            glCodes.value = glCodes.value.filter(g => g.id !== id);
        } catch (e) {
            console.error('Failed to delete GL-Code', e);
            throw e;
        }
    };

    return {
        machines,
        repairs,
        stocks,
        glCodes,
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
        deleteGLCode
    };
}

