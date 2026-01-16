import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface JobOrderLogDto {
    date: string;
    shift: string;
    lotStart: string;
    lotEnd: string;
    quantity: number;
    sign?: string;
}

export interface CreateJobOrderDto {
    bookNo?: string;
    no?: number;
    jobOrderNo: string;
    contractNo: string;
    grade: string;
    otherGrade?: string;
    quantityBale: number;
    palletType: string;
    orderQuantity: number;
    palletMarking: boolean;
    note?: string;
    qaName: string;
    qaDate: string;
    isClosed: boolean;
    logs: JobOrderLogDto[];
}

export interface UpdateJobOrderDto extends Partial<CreateJobOrderDto> {
    productionName?: string;
    productionDate?: string;
}

@Injectable()
export class JobOrdersService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.jobOrder.findMany({
            include: { logs: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const jobOrder = await this.prisma.jobOrder.findUnique({
            where: { id },
            include: { logs: true },
        });
        if (!jobOrder) throw new NotFoundException('Job Order not found');
        return jobOrder;
    }

    async create(data: CreateJobOrderDto) {
        const { logs, ...jobOrderData } = data;
        return this.prisma.jobOrder.create({
            data: {
                ...jobOrderData,
                bookNo: jobOrderData.bookNo || '',
                no: jobOrderData.no || 0,
                qaDate: new Date(jobOrderData.qaDate),
                logs: {
                    create: logs.map((log) => ({
                        ...log,
                        date: new Date(log.date),
                    })),
                },
            },
            include: { logs: true },
        });
    }

    async update(id: string, data: UpdateJobOrderDto) {
        const { logs, ...jobOrderData } = data;

        // Simple update for main data
        const updateData: any = { ...jobOrderData };
        if (jobOrderData.qaDate) updateData.qaDate = new Date(jobOrderData.qaDate);
        if (jobOrderData.productionDate) updateData.productionDate = new Date(jobOrderData.productionDate);

        // If logs are provided, we'll replace them for simplicity in this version
        if (logs) {
            await this.prisma.jobOrderLog.deleteMany({ where: { jobOrderId: id } });
            updateData.logs = {
                create: logs.map((log) => ({
                    ...log,
                    date: new Date(log.date),
                })),
            };
        }

        return this.prisma.jobOrder.update({
            where: { id },
            data: updateData,
            include: { logs: true },
        });
    }

    async remove(id: string) {
        return this.prisma.jobOrder.delete({ where: { id } });
    }

    async closeJob(id: string, productionInfo: { productionName: string; productionDate: string }) {
        return this.prisma.jobOrder.update({
            where: { id },
            data: {
                isClosed: true,
                productionName: productionInfo.productionName,
                productionDate: new Date(productionInfo.productionDate),
            },
            include: { logs: true },
        });
    }
}
