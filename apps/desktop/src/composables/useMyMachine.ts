import { ref } from 'vue';
import { toast } from 'vue-sonner';

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
    timestamp: number;
}

export interface StockItem {
    id: string;
    code?: string;
    name: string;
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

// Mock Data
const mockMachines: Machine[] = [
    { id: 'm1', name: 'MC-001', model: 'CNC Lathe X1', location: 'Zone A', status: 'Active', createdAt: Date.now() },
    { id: 'm2', name: 'MC-002', model: 'Milling M200', location: 'Zone A', status: 'Maintenance', createdAt: Date.now() },
    { id: 'm3', name: 'MC-003', model: 'Drill Press D5', location: 'Zone B', status: 'Active', createdAt: Date.now() },
    { id: 'm4', name: 'MC-004', model: 'CNC Lathe X2', location: 'Zone A', status: 'Active', createdAt: Date.now() },
    { id: 'm5', name: 'MC-005', model: 'Grinder G100', location: 'Zone C', status: 'Inactive', createdAt: Date.now() },
    { id: 'm6', name: 'MC-006', model: 'Welding Robot W1', location: 'Zone D', status: 'Active', createdAt: Date.now() },
    { id: 'm7', name: 'MC-007', model: 'Packaging Unit P1', location: 'Zone E', status: 'Active', createdAt: Date.now() },
    { id: 'm8', name: 'MC-008', model: 'Conveyor Belt C1', location: 'Zone E', status: 'Maintenance', createdAt: Date.now() },
    { id: 'm9', name: 'MC-009', model: 'Forklift F1', location: 'Warehouse', status: 'Active', createdAt: Date.now() },
    { id: 'm10', name: 'MC-010', model: 'Milling M200', location: 'Zone B', status: 'Active', createdAt: Date.now() },
    { id: 'm11', name: 'MC-011', model: '3D Printer P500', location: 'Design Lab', status: 'Active', createdAt: Date.now() },
    { id: 'm12', name: 'MC-012', model: 'Laser Cutter L20', location: 'Zone C', status: 'Inactive', createdAt: Date.now() },
    { id: 'm13', name: 'MC-013', model: 'Hydraulic Press H50', location: 'Zone D', status: 'Active', createdAt: Date.now() },
    { id: 'm14', name: 'MC-014', model: 'Air Compressor A1', location: 'Utility', status: 'Active', createdAt: Date.now() },
    { id: 'm15', name: 'MC-015', model: 'Generator G500', location: 'Utility', status: 'Active', createdAt: Date.now() },
];

const mockStocks: StockItem[] = [
    { id: 's1', code: 'IT-LPT-001', name: 'MacBook Pro 14"', category: 'Laptop', location: 'Office 1', qty: 5, price: 59900, unit: 'pcs', minQty: 2, dateReceived: '2024-01-15', receiver: 'apiwat.s' },
    { id: 's2', code: 'IT-MON-002', name: 'Dell UltraSharp 27"', category: 'Monitor', location: 'Stock Room A', qty: 12, price: 18500, unit: 'pcs', minQty: 5 },
    { id: 's3', code: 'IT-PER-003', name: 'Keychron K2', category: 'Peripherals', location: 'Stock Room A', qty: 20, price: 3290, unit: 'pcs', minQty: 5 },
    { id: 's4', code: 'IT-PER-004', name: 'Logitech MX Master 3', category: 'Peripherals', location: 'Stock Room A', qty: 15, price: 3990, unit: 'pcs', minQty: 5 },
    { id: 's5', code: 'IT-CAB-005', name: 'HDMI Cable 3m', category: 'Accessories', location: 'Bin 5', qty: 50, price: 450, unit: 'pcs', minQty: 10 },
    { id: 's6', code: 'MT-BRG-001', name: 'Bearing 6204', category: 'Spare Parts', location: 'Cabinet C', qty: 30, price: 120, unit: 'pcs', minQty: 10 },
    { id: 's7', code: 'MT-VBT-002', name: 'V-Belt A45', category: 'Spare Parts', location: 'Cabinet C', qty: 10, price: 250, unit: 'pcs', minQty: 3 },
    { id: 's8', code: 'IT-NET-006', name: 'Ubiquiti Switch Pro', category: 'Networking', location: 'Server Room', qty: 2, price: 24500, unit: 'pcs', minQty: 1 },
    { id: 's9', code: 'IT-COM-007', name: 'Raspberry Pi 5', category: 'Components', location: 'Lab 2', qty: 25, price: 2800, unit: 'pcs', minQty: 5 },
    { id: 's10', code: 'MT-HYD-003', name: 'Hydraulic Oil 5L', category: 'Consumables', location: 'Zone D', qty: 8, price: 1500, unit: 'can', minQty: 2 },
    { id: 's11', code: 'IT-LPT-008', name: 'ThinkPad X1 Carbon', category: 'Laptop', location: 'Office 2', qty: 3, price: 65000, unit: 'pcs', minQty: 1 },
    { id: 's12', code: 'IT-PRT-009', name: 'Epson L3210', category: 'Printer', location: 'Stock Room B', qty: 4, price: 4500, unit: 'pcs', minQty: 2 },
    { id: 's13', code: 'MT-SEN-004', name: 'Proximity Sensor', category: 'Electrical', location: 'Cabinet E', qty: 15, price: 850, unit: 'pcs', minQty: 5 },
    { id: 's14', code: 'IT-SRV-010', name: 'Synology DS923+', category: 'Storage', location: 'Server Room', qty: 1, price: 21900, unit: 'pcs', minQty: 0 },
    { id: 's15', code: 'MT-TOL-005', name: 'Drill Bit Set', category: 'Tooling', location: 'Shelf F', qty: 10, price: 1200, unit: 'set', minQty: 2 },
];

const mockRepairs: Repair[] = [
    // MC-001 Recurring History (5 entries)
    { id: 'r1', machineId: 'm1', machineName: 'MC-001', date: '2025-05-10', issue: 'Unusual vibration in spindle', technician: 'Somchai', parts: [{ id: 1, name: 'Bearing 6204', qty: 2, price: 120 }], totalCost: 240, timestamp: Date.now() - 200 * 24 * 60 * 60 * 1000 },
    { id: 'r1a', machineId: 'm1', machineName: 'MC-001', date: '2025-07-15', issue: 'Spindle motor calibration', technician: 'Suchart', parts: [], totalCost: 0, timestamp: Date.now() - 140 * 24 * 60 * 60 * 1000 },
    { id: 'r1b', machineId: 'm1', machineName: 'MC-001', date: '2025-09-20', issue: 'Coolant pump failure', technician: 'Wichai', parts: [{ id: 2, name: 'Submersible Pump', qty: 1, price: 2800 }], totalCost: 2800, timestamp: Date.now() - 80 * 24 * 60 * 60 * 1000 },
    { id: 'r1c', machineId: 'm1', machineName: 'MC-001', date: '2025-11-05', issue: 'Axis limit switch error', technician: 'Somchai', parts: [{ id: 3, name: 'Limit Switch', qty: 1, price: 450 }], totalCost: 450, timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000 },
    { id: 'r1d', machineId: 'm1', machineName: 'MC-001', date: '2025-12-20', issue: 'Annual major service', technician: 'External Svc', parts: [{ id: 4, name: 'Full Gasket Set', qty: 1, price: 1200 }, { id: 5, name: 'Hydraulic Oil 5L', qty: 2, price: 1500 }], totalCost: 4200, timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 },

    // MC-002 Recurring History (4 entries)
    { id: 'r2', machineId: 'm2', machineName: 'MC-002', date: '2025-06-12', issue: 'Drill head overheating', technician: 'Suchart', parts: [{ id: 6, name: 'Fan 120mm', qty: 1, price: 350 }], totalCost: 350, timestamp: Date.now() - 180 * 24 * 60 * 60 * 1000 },
    { id: 'r2a', machineId: 'm2', machineName: 'MC-002', date: '2025-08-22', issue: 'Automatic tool changer jam', technician: 'Somchai', parts: [], totalCost: 0, timestamp: Date.now() - 110 * 24 * 60 * 60 * 1000 },
    { id: 'r2b', machineId: 'm2', machineName: 'MC-002', date: '2025-10-18', issue: 'Z-axis belt wear', technician: 'Wichai', parts: [{ id: 7, name: 'Timing Belt B12', qty: 1, price: 650 }], totalCost: 650, timestamp: Date.now() - 50 * 24 * 60 * 60 * 1000 },
    { id: 'r2c', machineId: 'm2', machineName: 'MC-002', date: '2025-12-05', issue: 'Coolant leak check', technician: 'Suchart', parts: [{ id: 8, name: 'Seal Tape', qty: 1, price: 45 }], totalCost: 45, timestamp: Date.now() - 20 * 24 * 60 * 60 * 1000 },

    // Others
    { id: 'r3', machineId: 'm4', machineName: 'MC-004', date: '2025-10-20', issue: 'Main drive belt slippage', technician: 'Somchai', parts: [{ id: 9, name: 'V-Belt A45', qty: 1, price: 250 }], totalCost: 250, timestamp: Date.now() - 45 * 24 * 60 * 60 * 1000 },
    { id: 'r5', machineId: 'm3', machineName: 'MC-003', date: '2025-11-05', issue: 'Pneumatic line leak', technician: 'Wichai', parts: [{ id: 10, name: 'Air Hose 8mm', qty: 5, price: 80 }], totalCost: 400, timestamp: Date.now() - 35 * 24 * 60 * 60 * 1000 },
    { id: 'r8', machineId: 'm8', machineName: 'MC-008', date: '2025-11-15', issue: 'Conveyor motor capacitor', technician: 'Somchai', parts: [{ id: 11, name: 'Capacitor 45uF', qty: 1, price: 180 }], totalCost: 180, timestamp: Date.now() - 25 * 24 * 60 * 60 * 1000 },
    { id: 'r9', machineId: 'm10', machineName: 'MC-010', date: '2025-11-20', issue: 'Emergency stop failure', technician: 'Suchart', parts: [{ id: 12, name: 'E-Stop Unit', qty: 1, price: 950 }], totalCost: 950, timestamp: Date.now() - 20 * 24 * 60 * 60 * 1000 },
    { id: 'r13', machineId: 'm7', machineName: 'MC-007', date: '2025-12-12', issue: 'Control panel fuse', technician: 'Suchart', parts: [{ id: 13, name: 'Fuse 5A', qty: 3, price: 15 }], totalCost: 45, timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000 },
    { id: 'r14', machineId: 'm13', machineName: 'MC-013', date: '2025-12-15', issue: 'Hydraulic pressure drop', technician: 'Somchai', parts: [{ id: 14, name: 'Pressure Gauge', qty: 1, price: 1150 }], totalCost: 1150, timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000 },
];

const machines = ref<Machine[]>([]);
const repairs = ref<Repair[]>([]);
const stocks = ref<StockItem[]>([]);

export function useMyMachine() {
    const saveData = () => {
        localStorage.setItem('mymachine_machines', JSON.stringify(machines.value));
        localStorage.setItem('mymachine_repairs', JSON.stringify(repairs.value));
        localStorage.setItem('mymachine_stocks', JSON.stringify(stocks.value));
    };

    const loadData = () => {
        try {
            const storedMachines = localStorage.getItem('mymachine_machines');
            const storedRepairs = localStorage.getItem('mymachine_repairs');
            const storedStocks = localStorage.getItem('mymachine_stocks');
            const simVersion = localStorage.getItem('mymachine_sim_version');

            // Force update for new simulation data (v2)
            if (simVersion !== 'v2') {
                machines.value = mockMachines;
                repairs.value = mockRepairs;
                stocks.value = mockStocks;
                saveData();
                localStorage.setItem('mymachine_sim_version', 'v2');
                return;
            }

            if (storedMachines) machines.value = JSON.parse(storedMachines);
            else machines.value = mockMachines;

            if (storedRepairs) repairs.value = JSON.parse(storedRepairs);
            else repairs.value = mockRepairs;

            if (storedStocks) stocks.value = JSON.parse(storedStocks);
            else stocks.value = mockStocks;

        } catch (e) {
            console.error('Failed to load My Machine data', e);
        }
    };

    const addMachine = (machine: Omit<Machine, 'id' | 'createdAt'>) => {
        const newMachine: Machine = {
            ...machine,
            id: Date.now().toString(),
            createdAt: Date.now(),
        };
        machines.value.push(newMachine);
        saveData();
        toast.success('Machine added successfully');
    };

    const deleteMachine = (id: string) => {
        machines.value = machines.value.filter(m => m.id !== id);
        saveData();
        toast.success('Machine removed');
    };

    const updateMachine = (id: string, updates: Partial<Machine>) => {
        const index = machines.value.findIndex(m => m.id === id);
        if (index !== -1) {
            machines.value[index] = { ...machines.value[index], ...updates };
            saveData();
            toast.success('Machine updated');
        }
    };

    const addRepair = (repair: Omit<Repair, 'id' | 'timestamp'>) => {
        const newRepair: Repair = {
            ...repair,
            id: Date.now().toString(),
            timestamp: Date.now(),
        };
        repairs.value.unshift(newRepair);

        // Deduct stock if used
        repair.parts.forEach(part => {
            const stockItem = stocks.value.find(s => s.name === part.name);
            if (stockItem) {
                stockItem.qty = Math.max(0, stockItem.qty - part.qty);
            }
        });

        saveData();
        toast.success('Maintenance log recorded');
    };

    const deleteRepair = (id: string) => {
        repairs.value = repairs.value.filter(r => r.id !== id);
        saveData();
        toast.success('Maintenance record deleted');
    };

    const getMachineStats = (machineId: string) => {
        const machineRepairs = repairs.value.filter(r => r.machineId === machineId);
        const count = machineRepairs.length;
        const cost = machineRepairs.reduce((acc, r) => acc + (r.totalCost || 0), 0);
        return { count, cost };
    };

    // Stock Management
    const addStock = (stock: Omit<StockItem, 'id'>) => {
        const newStock: StockItem = {
            ...stock,
            id: Date.now().toString()
        };
        stocks.value.push(newStock);
        saveData();
        toast.success('Stock item added');
    };

    const updateStock = (id: string, updates: Partial<StockItem>) => {
        const index = stocks.value.findIndex(s => s.id === id);
        if (index !== -1) {
            stocks.value[index] = { ...stocks.value[index], ...updates };
            saveData();
        }
    };

    const deleteStock = (id: string) => {
        stocks.value = stocks.value.filter(s => s.id !== id);
        saveData();
        toast.success('Stock item removed');
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
        deleteRepair,
        getMachineStats,
        addStock,
        updateStock,
        deleteStock
    };
}
