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

// Mock Data - Real World Data Imported (High Fidelity v5)
const mockMachines: Machine[] = [
    { id: 'm1', name: 'Packing', model: 'Packing Station', location: 'Warehouse', status: 'Active', createdAt: Date.now() },
    { id: 'm2', name: 'BC-5 Mixing', model: 'Batch Mixer', location: 'Mixing Zone', status: 'Active', createdAt: Date.now() },
    { id: 'm3', name: 'BC-4 Mixing', model: 'Batch Mixer', location: 'Mixing Zone', status: 'Maintenance', createdAt: Date.now() },
    { id: 'm4', name: 'BC-5 Pre Cleaning', model: 'Batch Cleaner', location: 'Cleaning Bay', status: 'Active', createdAt: Date.now() },
    { id: 'm5', name: 'VS-1 Pre', model: 'Pre-Processor', location: 'Prep Area', status: 'Inactive', createdAt: Date.now() },
    { id: 'm6', name: 'SC Jumbo Mixing', model: 'Jumbo Mixer', location: 'Mixing Zone', status: 'Active', createdAt: Date.now() },
    { id: 'm7', name: 'SC-1 Mixing', model: 'Standard Mixer', location: 'Mixing Zone', status: 'Active', createdAt: Date.now() },
    { id: 'm8', name: 'ST-1 PPC', model: 'PPC Standard', location: 'Processing', status: 'Active', createdAt: Date.now() },
    { id: 'm9', name: 'Line Pre Cleaning', model: 'Cleaning Line', location: 'Cleaning Bay', status: 'Active', createdAt: Date.now() },
    { id: 'm10', name: 'CP-2 Pre', model: 'Compact Pre-Unit', location: 'Prep Area', status: 'Active', createdAt: Date.now() },
    { id: 'm11', name: 'MK-2 Pre Cleaning', model: 'Pre Cleaning Unit', location: 'Cleaning Bay', status: 'Active', createdAt: Date.now() },
    { id: 'm12', name: 'RC-4 Mixing', model: 'Rotary Mixer', location: 'Mixing Zone', status: 'Maintenance', createdAt: Date.now() },
    { id: 'm13', name: 'RC-V.5 Mixing', model: 'Vertical Mixer', location: 'Mixing Zone', status: 'Active', createdAt: Date.now() },
    { id: 'm14', name: 'TP-1.2 Dryer A,B', model: 'Dryer System', location: 'Drying Zone', status: 'Active', createdAt: Date.now() },
    { id: 'm15', name: 'Tubule', model: 'Tubule System', location: 'Processing', status: 'Active', createdAt: Date.now() },
];

const mockStocks: StockItem[] = [
    { id: 's1', code: 'SP-WHT', name: 'Spray paint WHITE', nameEN: 'Spray paint WHITE', nameTH: 'สีสเปรย์ สีขาว', category: 'Consumables', location: 'Store A', qty: 50, price: 42.00, unit: 'can', minQty: 10 },
    { id: 's2', code: 'GW-60x24', name: 'Gear wheel 4 60x24T', nameEN: 'Gear wheel 4 60x24T', nameTH: 'เฟืองขับ 4 60x24T', category: 'Spare Parts', location: 'Shelf B', qty: 2, price: 350.00, unit: 'pcs', minQty: 1 },
    { id: 's3', code: 'BR-204', name: 'Bearing NTN UCP 204-012', nameEN: 'Bearing NTN UCP 204-012', nameTH: 'ตลับลูกปืน NTN UCP 204-012', category: 'Bearings', location: 'Shelf C', qty: 20, price: 205.00, unit: 'pcs', minQty: 5 },
    { id: 's4', code: 'NT-58-250', name: 'Nut 1 NC 5/8 x 2 1/2', nameEN: 'Nut 1 NC 5/8 x 2 1/2', nameTH: 'น็อต 1 NC 5/8 x 2 1/2', category: 'Fasteners', location: 'Bin 1', qty: 100, price: 15.00, unit: 'pcs', minQty: 20 },
    { id: 's5', code: 'NT-STL-150', name: 'Nut STL 5/8 x 1 1/2', nameEN: 'Nut STL 5/8 x 1 1/2', nameTH: 'น็อต STL 5/8 x 1 1/2', category: 'Fasteners', location: 'Bin 3', qty: 100, price: 35.33, unit: 'pcs', minQty: 20 },
    { id: 's6', code: 'NT-STL-250', name: 'Nut STL 5/8 x 2 1/2', nameEN: 'Nut STL 5/8 x 2 1/2', nameTH: 'น็อต STL 5/8 x 2 1/2', category: 'Fasteners', location: 'Bin 2', qty: 100, price: 26.10, unit: 'pcs', minQty: 20 },
    { id: 's7', code: 'BR-SKF-630', name: 'Bearing SKF 6308', nameEN: 'Bearing SKF 6308', nameTH: 'ตลับลูกปืน SKF 6308', category: 'Bearings', location: 'Shelf C', qty: 8, price: 121.00, unit: 'pcs', minQty: 4 },
    { id: 's8', code: 'BM-42x11', name: 'Belt Motor Gear 42x11', nameEN: 'Belt Motor Gear 42x11', nameTH: 'สายพานมอเตอร์เกียร์ 42x11', category: 'Belts', location: 'Shelf B', qty: 5, price: 6860.00, unit: 'pcs', minQty: 1 },
    { id: 's9', code: 'BR-2311', name: 'Bearing NTN 2311 K', nameEN: 'Bearing NTN 2311 K', nameTH: 'ตลับลูกปืน NTN 2311 K', category: 'Bearings', location: 'Shelf C', qty: 5, price: 698.00, unit: 'pcs', minQty: 1 },
    { id: 's10', code: 'SB-HE-2311', name: 'Sleeve Bearing HE 2311 K', nameEN: 'Sleeve Bearing HE 2311 K', nameTH: 'ปลอกตลับลูกปืน HE 2311 K', category: 'Bearings', location: 'Shelf C', qty: 5, price: 374.00, unit: 'pcs', minQty: 2 },
    { id: 's11', code: 'GR-PTT2', name: 'PTT EP Grease # 2', nameEN: 'PTT EP Grease # 2', nameTH: 'จารบี PTT EP เบอร์ 2', category: 'Lubricants', location: 'Chem Store', qty: 10, price: 2400.00, unit: 'pail', minQty: 3 },
    { id: 's12', code: 'NT-58-2', name: 'Nut NC 5/8 x 2', nameEN: 'Nut NC 5/8 x 2', nameTH: 'น็อต NC 5/8 x 2', category: 'Fasteners', location: 'Bin 1', qty: 100, price: 11.80, unit: 'pcs', minQty: 20 },
    { id: 's13', code: 'IC-BCD', name: 'IRON COAT P BCD FLOW CHECK', nameEN: 'IRON COAT P BCD FLOW CHECK', nameTH: 'น้ำยาเคลือบเหล็ก P BCD', category: 'Spare Parts', location: 'Shelf E', qty: 2, price: 291.53, unit: 'pcs', minQty: 1 },
    { id: 's14', code: 'GW-680', name: 'Gear wheel 680x150x 50mm', nameEN: 'Gear wheel 680x150x 50mm', nameTH: 'เฟืองขับ 680x150x 50มม.', category: 'Spare Parts', location: 'Shelf B', qty: 1, price: 1050.00, unit: 'pcs', minQty: 0 },
    { id: 's15', code: 'CH-80-1R', name: 'Chain 80-1R', nameEN: 'Chain 80-1R', nameTH: 'โซ่ 80-1R', category: 'Spare Parts', location: 'Shelf B', qty: 1, price: 1750.00, unit: 'pcs', minQty: 0 },
    { id: 's16', code: 'GO-AM', name: 'Gear oil Auto Mat', nameEN: 'Gear oil Auto Mat', nameTH: 'น้ำมันเกียร์ออโต้แมท', category: 'Lubricants', location: 'Chem Store', qty: 20, price: 115.74, unit: 'L', minQty: 5 },
    { id: 's17', code: 'GW-4MK', name: 'Grinding Wheel 4" Makita', nameEN: 'Grinding Wheel 4" Makita', nameTH: 'ใบเจียร 4 นิ้ว Makita', category: 'Consumables', location: 'Store A', qty: 50, price: 22.56, unit: 'pcs', minQty: 10 },
    { id: 's18', code: 'STL-34', name: 'Seal TSN 511L', nameEN: 'Seal TSN 511L', nameTH: 'ซีล TSN 511L', category: 'Seals', qty: 10, price: 240.00, unit: 'pcs', minQty: 2 },
    { id: 's19', code: 'PVC-JP', name: 'Three joint PVC 1x1', nameEN: 'Three joint PVC 1x1', nameTH: 'สามทาง PVC 1x1', category: 'Piping', qty: 20, price: 49.98, unit: 'pcs', minQty: 5 },
    { id: 's20', code: 'CON-90', name: 'Connector 90 pvc 1"xn', nameEN: 'Connector 90 pvc 1"xn', nameTH: 'ข้องอ 90 PVC 1"', category: 'Piping', qty: 20, price: 9.77, unit: 'pcs', minQty: 10 },
    { id: 's21', code: 'BV-1', name: 'Ball valve 1"', nameEN: 'Ball valve 1"', nameTH: 'บอลวาล์ว 1"', category: 'Valves', qty: 10, price: 171.01, unit: 'pcs', minQty: 2 },
    { id: 's22', code: 'PVC-JP-1x1/2', name: 'Three joint PVC 1 x 1/2"', nameEN: 'Three joint PVC 1 x 1/2"', nameTH: 'สามทาง PVC 1x1/2"', category: 'Piping', qty: 10, price: 14.00, unit: 'pcs', minQty: 5 },
    { id: 's23', code: 'PVC-CON-F', name: 'Pipe connector Female 1"', nameEN: 'Pipe connector Female 1"', nameTH: 'ข้อต่อเกลียวใน 1"', category: 'Piping', qty: 10, price: 13.52, unit: 'pcs', minQty: 5 },
    { id: 's24', code: 'PVC-CON-M', name: 'Pipe connector Male 1"', nameEN: 'Pipe connector Male 1"', nameTH: 'ข้อต่อเกลียวนอก 1"', category: 'Piping', qty: 0, price: 7.49, unit: 'pcs', minQty: 5 },
    { id: 's25', code: 'PVC-P-1', name: 'PVC pipe cover 1"', nameEN: 'PVC pipe cover 1"', nameTH: 'ฝาครอบท่อ PVC 1"', category: 'Piping', qty: 15, price: 6.79, unit: 'pcs', minQty: 5 },
    { id: 's26', code: 'CON-90-1', name: 'Connector 90 x 1"xn', nameEN: 'Connector 90 x 1"xn', nameTH: 'ข้องอ 90 x 1"', category: 'Piping', qty: 15, price: 9.77, unit: 'pcs', minQty: 5 },
];

const mockRepairs: Repair[] = [
    // 13/05/2023
    { id: 'r1', machineId: 'm1', machineName: 'Packing', date: '2023-05-13', issue: 'Maintenance', technician: 'Somchai', parts: [{ id: 1, name: 'Spray paint WHITE', qty: 1, price: 42.00 }], totalCost: 42.00, timestamp: new Date('2023-05-13').getTime() },
    { id: 'r2', machineId: 'm2', machineName: 'BC-5 Mixing', date: '2023-05-13', issue: 'Gear check', technician: 'Wichai', parts: [{ id: 2, name: 'Gear wheel 4 60x24T', qty: 1, price: 350.00 }], totalCost: 350.00, timestamp: new Date('2023-05-13').getTime() },

    // 15/05/2023
    { id: 'r3', machineId: 'm3', machineName: 'BC-4 Mixing', date: '2023-05-15', issue: 'Bearing replacement', technician: 'Suchart', parts: [{ id: 3, name: 'Bearing NTN UCP 204-012', qty: 2, price: 205.00 }], totalCost: 410.00, timestamp: new Date('2023-05-15').getTime() },
    { id: 'r4', machineId: 'm4', machineName: 'BC-5 Pre Cleaning', date: '2023-05-15', issue: 'Bearing replacement', technician: 'Somchai', parts: [{ id: 3, name: 'Bearing NTN UCP 204-012', qty: 2, price: 205.00 }], totalCost: 410.00, timestamp: new Date('2023-05-15').getTime() },
    { id: 'r5', machineId: 'm5', machineName: 'VS-1 Pre', date: '2023-05-15', issue: 'Fasteners', technician: 'Wichai', parts: [{ id: 4, name: 'Nut 1 NC 5/8 x 2 1/2', qty: 2, price: 15.00 }], totalCost: 30.00, timestamp: new Date('2023-05-15').getTime() },

    // 02/06/2023
    { id: 'r6', machineId: 'm6', machineName: 'SC Jumbo Mixing', date: '2023-06-02', issue: 'Structure repair', technician: 'External', parts: [{ id: 4, name: 'Nut 1 NC 5/8 x 2 1/2', qty: 7, price: 36.35 }], totalCost: 254.43, timestamp: new Date('2023-06-02').getTime() },
    { id: 'r7', machineId: 'm6', machineName: 'SC Jumbo Mixing', date: '2023-06-02', issue: 'Structure repair', technician: 'External', parts: [{ id: 5, name: 'Nut STL 5/8 x 1 1/2', qty: 3, price: 35.33 }], totalCost: 105.99, timestamp: new Date('2023-06-02').getTime() },
    { id: 'r8', machineId: 'm6', machineName: 'SC Jumbo Mixing', date: '2023-06-02', issue: 'Structure repair', technician: 'External', parts: [{ id: 6, name: 'Nut STL 5/8 x 2 1/2', qty: 5, price: 26.10 }], totalCost: 130.51, timestamp: new Date('2023-06-02').getTime() },

    // 15/06/2023
    { id: 'r9', machineId: 'm7', machineName: 'SC-1 Mixing', date: '2023-06-15', issue: 'Bearing check', technician: 'Suchart', parts: [{ id: 7, name: 'Bearing SKF 6308', qty: 1, price: 121.00 }], totalCost: 121.00, timestamp: new Date('2023-06-15').getTime() },

    // 01/07/2023
    { id: 'r10', machineId: 'm3', machineName: 'BC-4 Mixing', date: '2023-07-01', issue: 'Drive repair', technician: 'Somchai', parts: [{ id: 8, name: 'Belt Motor Gear 42x11', qty: 1, price: 6860.00 }], totalCost: 6860.00, timestamp: new Date('2023-07-01').getTime() },
    { id: 'r11', machineId: 'm6', machineName: 'SC Jumbo Mixing', date: '2023-07-01', issue: 'Bearing', technician: 'Suchart', parts: [{ id: 9, name: 'Bearing NTN 2311 K', qty: 1, price: 698.00 }], totalCost: 698.00, timestamp: new Date('2023-07-01').getTime() },
    { id: 'r12', machineId: 'm6', machineName: 'SC Jumbo Mixing', date: '2023-07-01', issue: 'Sleeve', technician: 'Wichai', parts: [{ id: 10, name: 'Sleeve Bearing HE 2311 K', qty: 1, price: 374.00 }], totalCost: 374.00, timestamp: new Date('2023-07-01').getTime() },

    // 07/07/2023
    { id: 'r13', machineId: 'm8', machineName: 'ST-1 PPC', date: '2023-07-07', issue: 'Chain link', technician: 'Somchai', parts: [], totalCost: 55.74, timestamp: new Date('2023-07-07').getTime() }, // Chain connector

    // 15/07/2023
    { id: 'r14', machineId: 'm9', machineName: 'Line Pre Cleaning', date: '2023-07-15', issue: 'Greasing', technician: 'Somchai', parts: [{ id: 11, name: 'PTT EP Grease # 2', qty: 1, price: 2400.00 }], totalCost: 2400.00, timestamp: new Date('2023-07-15').getTime() },
    { id: 'r15', machineId: 'm5', machineName: 'VS-1 Pre', date: '2023-07-15', issue: 'Fasteners', technician: 'Wichai', parts: [{ id: 12, name: 'Nut NC 5/8 x 2', qty: 4, price: 11.80 }], totalCost: 47.20, timestamp: new Date('2023-07-15').getTime() },
    { id: 'r16', machineId: 'm10', machineName: 'CP-2 Pre', date: '2023-07-15', issue: 'Fasteners', technician: 'Suchart', parts: [{ id: 4, name: 'Nut 1 NC 5/8 x 2 1/2', qty: 6, price: 16.47 }], totalCost: 98.84, timestamp: new Date('2023-07-15').getTime() },

    // 30/07/2023
    { id: 'r17', machineId: 'm11', machineName: 'MK-2 Pre Cleaning', date: '2023-07-30', issue: 'Valve Check', technician: 'External', parts: [{ id: 13, name: 'IRON COAT P BCD FLOW CHECK', qty: 1, price: 291.53 }], totalCost: 291.53, timestamp: new Date('2023-07-30').getTime() },
    { id: 'r18', machineId: 'm11', machineName: 'MK-2 Pre Cleaning', date: '2023-07-30', issue: 'Gear wheel', technician: 'External', parts: [{ id: 14, name: 'Gear wheel 680x150x 50mm', qty: 1, price: 1050.00 }], totalCost: 1050.00, timestamp: new Date('2023-07-30').getTime() },
    { id: 'r19', machineId: 'm11', machineName: 'MK-2 Pre Cleaning', date: '2023-07-30', issue: 'Chain', technician: 'External', parts: [{ id: 15, name: 'Chain 80-1R', qty: 1, price: 1750.00 }], totalCost: 1750.00, timestamp: new Date('2023-07-30').getTime() },
    { id: 'r20', machineId: 'm11', machineName: 'MK-2 Pre Cleaning', date: '2023-07-30', issue: 'Oil', technician: 'External', parts: [{ id: 16, name: 'Gear oil Auto Mat', qty: 1, price: 115.74 }], totalCost: 115.74, timestamp: new Date('2023-07-30').getTime() },

    // 13/08/2023
    { id: 'r21', machineId: 'm12', machineName: 'RC-4 Mixing', date: '2023-08-13', issue: 'Grinding', technician: 'Wichai', parts: [{ id: 17, name: 'Grinding Wheel 4" Makita', qty: 2, price: 22.56 }], totalCost: 45.12, timestamp: new Date('2023-08-13').getTime() },
    { id: 'r22', machineId: 'm12', machineName: 'RC-4 Mixing', date: '2023-08-13', issue: 'Bearing', technician: 'Wichai', parts: [{ id: 3, name: 'Bearing NTN UCP 204-012', qty: 2, price: 205.00 }], totalCost: 410.00, timestamp: new Date('2023-08-13').getTime() },
    { id: 'r23', machineId: 'm7', machineName: 'SC-1 Mixing', date: '2023-08-13', issue: 'Fasteners', technician: 'Wichai', parts: [{ id: 4, name: 'Nut 1 NC 5/8 x 2 1/2', qty: 6, price: 16.47 }], totalCost: 98.84, timestamp: new Date('2023-08-13').getTime() },
    { id: 'r24', machineId: 'm10', machineName: 'CP-2 Pre', date: '2023-08-13', issue: 'Fasteners', technician: 'Wichai', parts: [{ id: 4, name: 'Nut 1 NC 5/8 x 2 1/2', qty: 2, price: 13.20 }], totalCost: 26.39, timestamp: new Date('2023-08-13').getTime() },

    // 14/08/2023
    { id: 'r25', machineId: 'm13', machineName: 'RC-V.5 Mixing', date: '2023-08-14', issue: 'Seal replacement', technician: 'Somchai', parts: [{ id: 18, name: 'Seal TSN 511L', qty: 1, price: 240.00 }], totalCost: 240.00, timestamp: new Date('2023-08-14').getTime() },

    // 15/08/2023
    { id: 'r26', machineId: 'm5', machineName: 'VS-1 Pre', date: '2023-08-15', issue: 'Bearing', technician: 'Wichai', parts: [{ id: 3, name: 'Bearing NTN UCP 204-012', qty: 1, price: 240.00 }], totalCost: 240.00, timestamp: new Date('2023-08-15').getTime() }, // Price var? Use image value
    { id: 'r27', machineId: 'm12', machineName: 'RC-4 Mixing', date: '2023-08-15', issue: 'Bearing', technician: 'Somchai', parts: [{ id: 3, name: 'Bearing NTN UCP 204-012', qty: 1, price: 205.00 }], totalCost: 205.00, timestamp: new Date('2023-08-15').getTime() },

    // 11/11/2023
    { id: 'r28', machineId: 'm6', machineName: 'SC Jumbo Mixing', date: '2023-11-11', issue: 'Pipe work', technician: 'External', parts: [{ id: 19, name: 'Three joint PVC 1x1', qty: 1, price: 49.98 }], totalCost: 49.98, timestamp: new Date('2023-11-11').getTime() },
    { id: 'r29', machineId: 'm6', machineName: 'SC Jumbo Mixing', date: '2023-11-11', issue: 'Pipe work', technician: 'External', parts: [{ id: 20, name: 'Connector 90 pvc 1"xn', qty: 4, price: 9.77 }], totalCost: 39.10, timestamp: new Date('2023-11-11').getTime() },
    { id: 'r30', machineId: 'm6', machineName: 'SC Jumbo Mixing', date: '2023-11-11', issue: 'Pipe work', technician: 'External', parts: [{ id: 21, name: 'Ball valve 1"', qty: 1, price: 171.01 }], totalCost: 171.01, timestamp: new Date('2023-11-11').getTime() },
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

            // Force update for new simulation data (v6) - Bilingual Stock Support
            if (simVersion !== 'v6') {
                machines.value = mockMachines;
                repairs.value = mockRepairs;
                stocks.value = mockStocks;
                saveData();
                localStorage.setItem('mymachine_sim_version', 'v6');
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
    };

    const deleteMachine = (id: string) => {
        machines.value = machines.value.filter(m => m.id !== id);
        saveData();
    };

    const updateMachine = (id: string, updates: Partial<Machine>) => {
        const index = machines.value.findIndex(m => m.id === id);
        if (index !== -1) {
            machines.value[index] = { ...machines.value[index], ...updates };
            saveData();
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
    };

    const deleteRepair = (id: string) => {
        repairs.value = repairs.value.filter(r => r.id !== id);
        saveData();
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
