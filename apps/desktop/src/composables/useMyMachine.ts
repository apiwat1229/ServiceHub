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

const machines = ref<Machine[]>([]);
const repairs = ref<Repair[]>([]);
const stocks = ref<StockItem[]>([]);

export function useMyMachine() {

    const loadData = async () => {
        try {
            // Fetch all data in parallel
            const [machinesRes, repairsRes, stocksRes] = await Promise.all([
                api.get('/mymachine/machines'),
                api.get('/mymachine/repairs'),
                api.get('/mymachine/stocks')
            ]);

            machines.value = machinesRes.data;
            repairs.value = repairsRes.data;
            stocks.value = stocksRes.data;

            // If empty, trigger seed (One-time auto setup)
            // Check if machines are empty as the primary indicator
            // If empty, trigger seed (One-time auto setup)
            // Check if any main data is empty. Backend handles partial seeding safely.
            if (machines.value.length === 0 || repairs.value.length === 0 || stocks.value.length === 0) {
                console.log('Detected missing data (machines, repairs, or stocks), triggering seed check...');
                await api.post('/mymachine/seed');

                // Reload after seed
                const [mRes, rRes, sRes] = await Promise.all([
                    api.get('/mymachine/machines'),
                    api.get('/mymachine/repairs'),
                    api.get('/mymachine/stocks')
                ]);
                machines.value = mRes.data;
                repairs.value = rRes.data;
                stocks.value = sRes.data;
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
            const res = await api.post('/mymachine/repairs', repair);
            repairs.value.unshift(res.data);

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
            await api.post(`/mymachine/repairs/${id}/update`, updates);

            // Update local state
            const index = repairs.value.findIndex(r => r.id === id);
            if (index !== -1) {
                repairs.value[index] = { ...repairs.value[index], ...updates };
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

    return {
        machines,
        repairs,
        stocks,
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
        deleteStock
    };
}

