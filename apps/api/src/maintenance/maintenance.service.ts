import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaintenanceService {
    constructor(private prisma: PrismaService) { }

    // Seed Data (Mock Data moved from Frontend)
    async seed() {
        const results = {
            machines: 'skipped',
            stocks: 'skipped',
            repairs: 'skipped',
        };

        // 1. Seed Machines
        const machineCount = await this.prisma.machine.count();
        if (machineCount === 0) {
            const mockMachines = [
                { name: 'Packing', model: 'Packing Station', location: 'Warehouse', status: 'Active' },
                { name: 'BC-5 Mixing', model: 'Batch Mixer', location: 'Mixing Zone', status: 'Active' },
                { name: 'BC-4 Mixing', model: 'Batch Mixer', location: 'Mixing Zone', status: 'Maintenance' },
                { name: 'BC-5 Pre Cleaning', model: 'Batch Cleaner', location: 'Cleaning Bay', status: 'Active' },
                { name: 'VS-1 Pre', model: 'Pre-Processor', location: 'Prep Area', status: 'Inactive' },
                { name: 'SC Jumbo Mixing', model: 'Jumbo Mixer', location: 'Mixing Zone', status: 'Active' },
                { name: 'SC-1 Mixing', model: 'Standard Mixer', location: 'Mixing Zone', status: 'Active' },
                { name: 'ST-1 PPC', model: 'PPC Standard', location: 'Processing', status: 'Active' },
                { name: 'Line Pre Cleaning', model: 'Cleaning Line', location: 'Cleaning Bay', status: 'Active' },
                { name: 'CP-2 Pre', model: 'Compact Pre-Unit', location: 'Prep Area', status: 'Active' },
                { name: 'MK-2 Pre Cleaning', model: 'Pre Cleaning Unit', location: 'Cleaning Bay', status: 'Active' },
                { name: 'RC-4 Mixing', model: 'Rotary Mixer', location: 'Mixing Zone', status: 'Maintenance' },
                { name: 'RC-V.5 Mixing', model: 'Vertical Mixer', location: 'Mixing Zone', status: 'Active' },
                { name: 'TP-1.2 Dryer A,B', model: 'Dryer System', location: 'Drying Zone', status: 'Active' },
                { name: 'Tubule', model: 'Tubule System', location: 'Processing', status: 'Active' },
            ];
            for (const machine of mockMachines) {
                await this.prisma.machine.create({ data: machine });
            }
            results.machines = `seeded ${mockMachines.length}`;
        }

        // 2. Seed Stocks
        const stockCount = await this.prisma.maintenanceStock.count();
        if (stockCount === 0) {
            const mockStocks = [
                { code: 'SP-WHT', name: 'Spray paint WHITE', nameEN: 'Spray paint WHITE', nameTH: 'สีสเปรย์ สีขาว', category: 'Consumables', location: 'Store A', qty: 50, price: 42.00, unit: 'can', minQty: 10 },
                { code: 'GW-60x24', name: 'Gear wheel 4 60x24T', nameEN: 'Gear wheel 4 60x24T', nameTH: 'เฟืองขับ 4 60x24T', category: 'Spare Parts', location: 'Shelf B', qty: 2, price: 350.00, unit: 'pcs', minQty: 1 },
                { code: 'BR-204', name: 'Bearing NTN UCP 204-012', nameEN: 'Bearing NTN UCP 204-012', nameTH: 'ตลับลูกปืน NTN UCP 204-012', category: 'Bearings', location: 'Shelf C', qty: 20, price: 205.00, unit: 'pcs', minQty: 5 },
                { code: 'NT-58-250', name: 'Nut 1 NC 5/8 x 2 1/2', nameEN: 'Nut 1 NC 5/8 x 2 1/2', nameTH: 'น็อต 1 NC 5/8 x 2 1/2', category: 'Fasteners', location: 'Bin 1', qty: 100, price: 15.00, unit: 'pcs', minQty: 20 },
                { code: 'NT-STL-150', name: 'Nut STL 5/8 x 1 1/2', nameEN: 'Nut STL 5/8 x 1 1/2', nameTH: 'น็อต STL 5/8 x 1 1/2', category: 'Fasteners', location: 'Bin 3', qty: 100, price: 35.33, unit: 'pcs', minQty: 20 },
                { code: 'NT-STL-250', name: 'Nut STL 5/8 x 2 1/2', nameEN: 'Nut STL 5/8 x 2 1/2', nameTH: 'น็อต STL 5/8 x 2 1/2', category: 'Fasteners', location: 'Bin 2', qty: 100, price: 26.10, unit: 'pcs', minQty: 20 },
                { code: 'BR-SKF-630', name: 'Bearing SKF 6308', nameEN: 'Bearing SKF 6308', nameTH: 'ตลับลูกปืน SKF 6308', category: 'Bearings', location: 'Shelf C', qty: 8, price: 121.00, unit: 'pcs', minQty: 4 },
                { code: 'BM-42x11', name: 'Belt Motor Gear 42x11', nameEN: 'Belt Motor Gear 42x11', nameTH: 'สายพานมอเตอร์เกียร์ 42x11', category: 'Belts', location: 'Shelf B', qty: 5, price: 6860.00, unit: 'pcs', minQty: 1 },
                { code: 'BR-2311', name: 'Bearing NTN 2311 K', nameEN: 'Bearing NTN 2311 K', nameTH: 'ตลับลูกปืน NTN 2311 K', category: 'Bearings', location: 'Shelf C', qty: 5, price: 698.00, unit: 'pcs', minQty: 1 },
                { code: 'SB-HE-2311', name: 'Sleeve Bearing HE 2311 K', nameEN: 'Sleeve Bearing HE 2311 K', nameTH: 'ปลอกตลับลูกปืน HE 2311 K', category: 'Bearings', location: 'Shelf C', qty: 5, price: 374.00, unit: 'pcs', minQty: 2 },
                { code: 'GR-PTT2', name: 'PTT EP Grease # 2', nameEN: 'PTT EP Grease # 2', nameTH: 'จารบี PTT EP เบอร์ 2', category: 'Lubricants', location: 'Chem Store', qty: 10, price: 2400.00, unit: 'pail', minQty: 3 },
                { code: 'NT-58-2', name: 'Nut NC 5/8 x 2', nameEN: 'Nut NC 5/8 x 2', nameTH: 'น็อต NC 5/8 x 2', category: 'Fasteners', location: 'Bin 1', qty: 100, price: 11.80, unit: 'pcs', minQty: 20 },
                { code: 'IC-BCD', name: 'IRON COAT P BCD FLOW CHECK', nameEN: 'IRON COAT P BCD FLOW CHECK', nameTH: 'น้ำยาเคลือบเหล็ก P BCD', category: 'Spare Parts', location: 'Shelf E', qty: 2, price: 291.53, unit: 'pcs', minQty: 1 },
                { code: 'GW-680', name: 'Gear wheel 680x150x 50mm', nameEN: 'Gear wheel 680x150x 50mm', nameTH: 'เฟืองขับ 680x150x 50มม.', category: 'Spare Parts', location: 'Shelf B', qty: 1, price: 1050.00, unit: 'pcs', minQty: 0 },
                { code: 'CH-80-1R', name: 'Chain 80-1R', nameEN: 'Chain 80-1R', nameTH: 'โซ่ 80-1R', category: 'Spare Parts', location: 'Shelf B', qty: 1, price: 1750.00, unit: 'pcs', minQty: 0 },
                { code: 'GO-AM', name: 'Gear oil Auto Mat', nameEN: 'Gear oil Auto Mat', nameTH: 'น้ำมันเกียร์ออโต้แมท', category: 'Lubricants', location: 'Chem Store', qty: 20, price: 115.74, unit: 'L', minQty: 5 },
                { code: 'GW-4MK', name: 'Grinding Wheel 4" Makita', nameEN: 'Grinding Wheel 4" Makita', nameTH: 'ใบเจียร 4 นิ้ว Makita', category: 'Consumables', location: 'Store A', qty: 50, price: 22.56, unit: 'pcs', minQty: 10 },
                { code: 'STL-34', name: 'Seal TSN 511L', nameEN: 'Seal TSN 511L', nameTH: 'ซีล TSN 511L', category: 'Seals', qty: 10, price: 240.00, unit: 'pcs', minQty: 2 },
                { code: 'PVC-JP', name: 'Three joint PVC 1x1', nameEN: 'Three joint PVC 1x1', nameTH: 'สามทาง PVC 1x1', category: 'Piping', qty: 20, price: 49.98, unit: 'pcs', minQty: 5 },
                { code: 'CON-90', name: 'Connector 90 pvc 1"xn', nameEN: 'Connector 90 pvc 1"xn', nameTH: 'ข้องอ 90 PVC 1"', category: 'Piping', qty: 20, price: 9.77, unit: 'pcs', minQty: 10 },
                { code: 'BV-1', name: 'Ball valve 1"', nameEN: 'Ball valve 1"', nameTH: 'บอลวาล์ว 1"', category: 'Valves', qty: 10, price: 171.01, unit: 'pcs', minQty: 2 },
                { code: 'PVC-JP-1x1/2', name: 'Three joint PVC 1 x 1/2"', nameEN: 'Three joint PVC 1 x 1/2"', nameTH: 'สามทาง PVC 1x1/2"', category: 'Piping', qty: 10, price: 14.00, unit: 'pcs', minQty: 5 },
                { code: 'PVC-CON-F', name: 'Pipe connector Female 1"', nameEN: 'Pipe connector Female 1"', nameTH: 'ข้อต่อเกลียวใน 1"', category: 'Piping', qty: 10, price: 13.52, unit: 'pcs', minQty: 5 },
                { code: 'PVC-CON-M', name: 'Pipe connector Male 1"', nameEN: 'Pipe connector Male 1"', nameTH: 'ข้อต่อเกลียวนอก 1"', category: 'Piping', qty: 0, price: 7.49, unit: 'pcs', minQty: 5 },
                { code: 'PVC-P-1', name: 'PVC pipe cover 1"', nameEN: 'PVC pipe cover 1"', nameTH: 'ฝาครอบท่อ PVC 1"', category: 'Piping', qty: 15, price: 6.79, unit: 'pcs', minQty: 5 },
                { code: 'CON-90-1', name: 'Connector 90 x 1"xn', nameEN: 'Connector 90 x 1"xn', nameTH: 'ข้องอ 90 x 1"', category: 'Piping', qty: 15, price: 9.77, unit: 'pcs', minQty: 5 },
            ];
            for (const stock of mockStocks) {
                await this.prisma.maintenanceStock.create({ data: stock });
            }
            results.stocks = `seeded ${mockStocks.length}`;
        }

        // 3. Seed Repairs (If missing)
        const repairCount = await this.prisma.repairLog.count();
        if (repairCount === 0) {
            const machines = await this.prisma.machine.findMany();
            if (machines.length > 0) {
                const getRandomMachine = () => machines[Math.floor(Math.random() * machines.length)];

                const mockRepairs = [
                    { machineId: getRandomMachine().id, machineName: getRandomMachine().name, date: new Date('2023-11-20'), issue: 'เปลี่ยนสายพาน (Belt replacement)', technician: 'Somchai', totalCost: 1200.00 },
                    { machineId: getRandomMachine().id, machineName: getRandomMachine().name, date: new Date('2023-12-05'), issue: 'ซ่อมจุดน้ำมันรั่ว (Oil leak)', technician: 'Wichai', totalCost: 450.00 },
                    { machineId: getRandomMachine().id, machineName: getRandomMachine().name, date: new Date('2024-01-10'), issue: 'ซ่อมบำรุงมอเตอร์ (Motor service)', technician: 'Somchai', totalCost: 2500.00 },
                    { machineId: getRandomMachine().id, machineName: getRandomMachine().name, date: new Date('2024-01-15'), issue: 'ปรับเทียบเซ็นเซอร์ (Sensor calibration)', technician: 'Anon', totalCost: 800.00 },
                    { machineId: getRandomMachine().id, machineName: getRandomMachine().name, date: new Date('2024-02-01'), issue: 'ปุ่มหยุดฉุกเฉินขัดข้อง (E-Stop Failure)', technician: 'Wichai', totalCost: 3500.00 },
                ];

                for (const repair of mockRepairs) {
                    // Ensure machineId and Name match the same random machine to avoid mismatch
                    const targetMachine = getRandomMachine();
                    const repairData = {
                        ...repair,
                        machineId: targetMachine.id,
                        machineName: targetMachine.name
                    };
                    await this.prisma.repairLog.create({ data: repairData });
                }
                results.repairs = `seeded ${mockRepairs.length}`;
            }
        }

        // 4. Seed Stock Categories
        const categoryCount = await this.prisma.stockCategory.count();
        if (categoryCount === 0) {
            const mockCategories = [
                { name: 'Mechanical', nameEN: 'Mechanical', nameTH: 'เครื่องกล', prefix: 'MECH' },
                { name: 'Electrical', nameEN: 'Electrical', nameTH: 'ไฟฟ้า', prefix: 'ELEC' },
                { name: 'Electronic', nameEN: 'Electronic', nameTH: 'อิเล็กทรอนิกส์', prefix: 'ELN' },
                { name: 'Pneumatic', nameEN: 'Pneumatic', nameTH: 'นิวเมติก', prefix: 'PNEU' },
                { name: 'Hydraulic', nameEN: 'Hydraulic', nameTH: 'ไฮดรอลิก', prefix: 'HYDR' },
                { name: 'Consumables', nameEN: 'Consumables', nameTH: 'วัสดุสิ้นเปลือง', prefix: 'CONS' },
                { name: 'Spare Parts', nameEN: 'Spare Parts', nameTH: 'อะไหล่', prefix: 'PART' },
                { name: 'Bearings', nameEN: 'Bearings', nameTH: 'ตลับลูกปืน', prefix: 'BEAR' },
                { name: 'Fasteners', nameEN: 'Fasteners', nameTH: 'ตัวยึด', prefix: 'FAST' },
                { name: 'Belts', nameEN: 'Belts', nameTH: 'สายพาน', prefix: 'BELT' },
                { name: 'Lubricants', nameEN: 'Lubricants', nameTH: 'น้ำมันหล่อลื่น', prefix: 'LUBE' },
                { name: 'Seals', nameEN: 'Seals', nameTH: 'ซีล', prefix: 'SEAL' },
                { name: 'Piping', nameEN: 'Piping', nameTH: 'ท่อ', prefix: 'PIPE' },
                { name: 'Valves', nameEN: 'Valves', nameTH: 'วาล์ว', prefix: 'VALV' },
            ];
            for (const category of mockCategories) {
                await this.prisma.stockCategory.create({ data: category });
            }
            results['categories'] = `seeded ${mockCategories.length}`;
        }

        // 5. Seed Storage Locations
        const locationCount = await this.prisma.storageLocation.count();
        if (locationCount === 0) {
            const mockLocations = [
                { name: 'Main Warehouse', nameEN: 'Main Warehouse', nameTH: 'คลังหลัก', building: 'Building A', zone: 'Zone 1' },
                { name: 'Production Floor', nameEN: 'Production Floor', nameTH: 'พื้นที่ผลิต', building: 'Building B', zone: 'Zone 2' },
                { name: 'Maintenance Room', nameEN: 'Maintenance Room', nameTH: 'ห้องซ่อมบำรุง', building: 'Building A', zone: 'Zone 3' },
                { name: 'Storage A', nameEN: 'Storage A', nameTH: 'คลัง A', building: 'Building A', zone: 'Zone 1' },
                { name: 'Storage B', nameEN: 'Storage B', nameTH: 'คลัง B', building: 'Building A', zone: 'Zone 2' },
                { name: 'Shelf A', nameEN: 'Shelf A', nameTH: 'ชั้น A', building: 'Building A', zone: 'Zone 1' },
                { name: 'Shelf B', nameEN: 'Shelf B', nameTH: 'ชั้น B', building: 'Building A', zone: 'Zone 1' },
                { name: 'Shelf C', nameEN: 'Shelf C', nameTH: 'ชั้น C', building: 'Building A', zone: 'Zone 1' },
                { name: 'Bin 1', nameEN: 'Bin 1', nameTH: 'ถัง 1', building: 'Building A', zone: 'Zone 1' },
                { name: 'Bin 2', nameEN: 'Bin 2', nameTH: 'ถัง 2', building: 'Building A', zone: 'Zone 1' },
                { name: 'Bin 3', nameEN: 'Bin 3', nameTH: 'ถัง 3', building: 'Building A', zone: 'Zone 1' },
            ];
            for (const location of mockLocations) {
                await this.prisma.storageLocation.create({ data: location });
            }
            results['locations'] = `seeded ${mockLocations.length}`;
        }

        return { message: 'Seed execution completed', results };
    }

    // Machine Methods
    async findAllMachines() {
        return this.prisma.machine.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async findMachineById(id: string) {
        const machine = await this.prisma.machine.findUnique({
            where: { id },
            include: { repairs: true },
        });
        if (!machine) throw new NotFoundException('Machine not found');
        return machine;
    }

    async createMachine(data: any) {
        return this.prisma.machine.create({
            data,
        });
    }

    async updateMachine(id: string, data: any) {
        return this.prisma.machine.update({
            where: { id },
            data,
        });
    }

    async deleteMachine(id: string) {
        return this.prisma.machine.delete({
            where: { id },
        });
    }

    // Repair Log Methods
    async findAllRepairs() {
        return this.prisma.repairLog.findMany({
            orderBy: { date: 'desc' },
        });
    }

    async findRepairById(id: string) {
        const repair = await this.prisma.repairLog.findUnique({
            where: { id },
        });
        if (!repair) throw new NotFoundException('Repair log not found');
        return repair;
    }

    async createRepair(data: any) {
        console.log('createRepair called');
        console.log('Incoming Data:', JSON.stringify(data, null, 2));

        // Sanitize payload
        const { id, timestamp, createdAt, updatedAt, ...rest } = data;
        console.log('Sanitized payload (rest):', JSON.stringify(rest, null, 2));

        // 1. Deduct Stock for used parts
        if (rest.parts && Array.isArray(rest.parts)) {
            for (const part of rest.parts) {
                if (!part.id) continue;

                const stockItem = await this.prisma.maintenanceStock.findFirst({
                    where: {
                        OR: [
                            { name: part.name },
                            { nameEN: part.name }
                        ]
                    }
                });

                if (stockItem) {
                    await this.prisma.maintenanceStock.update({
                        where: { id: stockItem.id },
                        data: { qty: { decrement: part.qty } }
                    });
                }
            }
        }

        // 2. Set default status if not present
        const status = rest.status || 'IN_PROGRESS';

        const result = await this.prisma.repairLog.create({
            data: { ...rest, status },
        });
        console.log('Create Result:', JSON.stringify(result, null, 2));
        return result;
    }

    async updateRepair(id: string, data: any) {
        console.log('updateRepair called for ID:', id);
        console.log('Incoming Data:', JSON.stringify(data, null, 2));

        // Sanitize payload
        const { id: _id, timestamp, createdAt, updatedAt, ...rest } = data;
        console.log('Sanitized Payload (rest):', JSON.stringify(rest, null, 2));

        // 1. Get old repair to compare parts
        const oldRepair = await this.prisma.repairLog.findUnique({ where: { id } });
        if (!oldRepair) throw new NotFoundException('Repair not found');

        // 2. Calculate Stock Adjustments

        // A. Return old parts to stock
        const oldParts = (oldRepair.parts as any[]) || [];
        for (const part of oldParts) {
            const stockItem = await this.prisma.maintenanceStock.findFirst({
                where: { OR: [{ name: part.name }, { nameEN: part.name }] }
            });
            if (stockItem) {
                await this.prisma.maintenanceStock.update({
                    where: { id: stockItem.id },
                    data: { qty: { increment: part.qty } }
                });
            }
        }

        // B. Deduct new parts from stock
        const newParts = (rest.parts as any[]) || [];
        for (const part of newParts) {
            const stockItem = await this.prisma.maintenanceStock.findFirst({
                where: { OR: [{ name: part.name }, { nameEN: part.name }] }
            });
            if (stockItem) {
                await this.prisma.maintenanceStock.update({
                    where: { id: stockItem.id },
                    data: { qty: { decrement: part.qty } }
                });
            }
        }

        // 3. Update Repair Log
        const result = await this.prisma.repairLog.update({
            where: { id },
            data: rest,
        });
        console.log('Update Result:', result);
        return result;
    }

    async deleteRepair(id: string) {
        // 1. Get repair to restore stock
        const repair = await this.prisma.repairLog.findUnique({ where: { id } });
        if (!repair) throw new NotFoundException('Repair not found');

        // 2. Restore parts to stock
        const parts = (repair.parts as any[]) || [];
        for (const part of parts) {
            const stockItem = await this.prisma.maintenanceStock.findFirst({
                where: { OR: [{ name: part.name }, { nameEN: part.name }] }
            });
            if (stockItem) {
                await this.prisma.maintenanceStock.update({
                    where: { id: stockItem.id },
                    data: { qty: { increment: part.qty } }
                });
            }
        }

        // 3. Delete
        return this.prisma.repairLog.delete({
            where: { id },
        });
    }

    // Maintenance Stock Methods
    async findAllStocks() {
        return this.prisma.maintenanceStock.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async findStockById(id: string) {
        return this.prisma.maintenanceStock.findUnique({ where: { id } });
    }

    async createStock(data: any) {
        return this.prisma.maintenanceStock.create({ data });
    }

    async updateStock(id: string, data: any) {
        return this.prisma.maintenanceStock.update({
            where: { id },
            data,
        });
    }

    async deleteStock(id: string) {
        return this.prisma.maintenanceStock.delete({ where: { id } });
    }
}
