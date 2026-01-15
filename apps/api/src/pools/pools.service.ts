import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PoolsService {
    constructor(private prisma: PrismaService) { }

    async listPools() {
        return this.prisma.pool.findMany({
            include: {
                _count: {
                    select: { items: true }
                }
            },
            orderBy: { name: 'asc' }
        });
    }

    async getPool(id: string) {
        const pool = await this.prisma.pool.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!pool) throw new NotFoundException('Pool not found');
        return pool;
    }

    async createPool(data: any) {
        return this.prisma.pool.create({ data });
    }

    async updatePool(id: string, data: any) {
        return this.prisma.pool.update({
            where: { id },
            data
        });
    }

    async addItems(poolId: string, items: any[]) {
        const pool = await this.prisma.pool.findUnique({ where: { id: poolId } });
        if (!pool) throw new NotFoundException('Pool not found');
        if (pool.status === 'closed') throw new BadRequestException('Cannot add items to a closed pool');

        // Start a transaction
        return this.prisma.$transaction(async (tx) => {
            // 1. Create Pool Items
            await tx.poolItem.createMany({
                data: items.map(item => ({
                    poolId,
                    bookingId: item.booking_id || item.id,
                    lotNumber: item.lot_number || item.lotNo || '-',
                    supplierName: item.supplier_name || item.supplierName || '-',
                    supplierCode: item.supplier_code || item.supplierCode || '-',
                    date: new Date(item.date),
                    netWeight: Number(item.net_weight || item.displayWeight || 0),
                    grossWeight: Number(item.gross_weight || item.weightIn || 0),
                    grade: item.grade || '-',
                    rubberType: item.rubber_type || item.displayRubberType || '-'
                }))
            });

            // 2. Update Pool Stats
            const totalNet = items.reduce((sum, i) => sum + Number(i.net_weight || i.displayWeight || 0), 0);
            const totalGross = items.reduce((sum, i) => sum + Number(i.gross_weight || i.weightIn || 0), 0);

            const updateData: any = {
                totalWeight: { increment: totalNet },
                totalGrossWeight: { increment: totalGross },
            };

            if (pool.status === 'empty' && items.length > 0) {
                updateData.status = 'open';
                updateData.fillingDate = new Date();
                updateData.grade = items[0].grade || '-';
                updateData.rubberType = items[0].rubber_type || items[0].displayRubberType || '-';
            }

            return tx.pool.update({
                where: { id: poolId },
                data: updateData,
                include: { items: true }
            });
        });
    }

    async removeItem(poolId: string, bookingId: string) {
        // Find the item by bookingId in this pool
        const item = await this.prisma.poolItem.findFirst({
            where: { poolId, bookingId }
        });
        if (!item) throw new NotFoundException('Item not found in this pool');

        return this.prisma.$transaction(async (tx) => {
            await tx.poolItem.delete({ where: { id: item.id } });

            const pool = await tx.pool.findUnique({
                where: { id: poolId },
                include: { _count: { select: { items: true } } }
            });

            if (!pool) throw new NotFoundException('Pool not found');

            const updateData: any = {
                totalWeight: { decrement: item.netWeight },
                totalGrossWeight: { decrement: item.grossWeight }
            };

            if (pool._count.items === 0) {
                updateData.status = 'empty';
                updateData.grade = '-';
                updateData.rubberType = '-';
                updateData.fillingDate = null;
                updateData.totalWeight = 0;
                updateData.totalGrossWeight = 0;
            }

            return tx.pool.update({
                where: { id: poolId },
                data: updateData
            });
        });
    }

    async closePool(poolId: string, closeDate?: Date) {
        return this.prisma.pool.update({
            where: { id: poolId },
            data: {
                status: 'closed',
                closeDate: closeDate || new Date()
            }
        });
    }

    async reopenPool(poolId: string) {
        return this.prisma.pool.update({
            where: { id: poolId },
            data: {
                status: 'open',
                closeDate: null
            }
        });
    }

    async seedPools() {
        const count = await this.prisma.pool.count();
        if (count > 0) return { message: 'Already seeded', count };

        // Create 24 pools
        const pools = Array.from({ length: 24 }, (_, i) => ({
            name: `Pool ${i + 1}`,
            status: 'empty',
            capacity: 3000
        }));

        await this.prisma.pool.createMany({ data: pools });
        return { message: 'Seeded 24 pools', count: 24 };
    }
}
