import { CreateJobOrderDto, UpdateJobOrderDto } from '@my-app/types';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobOrdersService {
    private readonly logger = new Logger(JobOrdersService.name);
    constructor(private readonly prisma: PrismaService) { }

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
        if (!jobOrder) {
            throw new NotFoundException(`JobOrder with ID ${id} not found`);
        }
        return jobOrder;
    }

    async create(data: CreateJobOrderDto) {
        try {
            const { logs, ...jobOrderData } = data;
            return await this.prisma.jobOrder.create({
                data: {
                    ...jobOrderData,
                    bookNo: jobOrderData.bookNo || '',
                    no: jobOrderData.no || 0,
                    qaDate: new Date(jobOrderData.qaDate),
                    logs: {
                        create: logs?.map((log) => ({
                            ...log,
                            date: new Date(log.date),
                        })) || [],
                    },
                },
                include: { logs: true },
            });
        } catch (error: any) {
            this.logger.error(`Failed to create job order: ${error.message}`, error.stack);
            if (error.code === 'P2002') {
                throw new BadRequestException(`Job Order number already exists: ${data.jobOrderNo}`);
            }
            throw new InternalServerErrorException(error.message || 'Failed to create job order');
        }
    }

    async update(id: string, data: UpdateJobOrderDto) {
        try {
            const { logs, ...jobOrderData } = data;

            // Check if job order exists
            await this.findOne(id);

            const updateData: any = { ...jobOrderData };
            delete updateData.id;
            if (jobOrderData.qaDate) updateData.qaDate = new Date(jobOrderData.qaDate);
            if (jobOrderData.productionDate) updateData.productionDate = new Date(jobOrderData.productionDate);

            if (logs) {
                // Transaction to ensure logs are replaced correctly
                return await this.prisma.$transaction(async (tx) => {
                    await tx.jobOrderLog.deleteMany({ where: { jobOrderId: id } });

                    return tx.jobOrder.update({
                        where: { id },
                        data: {
                            ...updateData,
                            logs: {
                                create: logs.map((log) => ({
                                    ...log,
                                    date: new Date(log.date),
                                })),
                            },
                        },
                        include: { logs: true },
                    });
                });
            }

            return await this.prisma.jobOrder.update({
                where: { id },
                data: updateData,
                include: { logs: true },
            });
        } catch (error: any) {
            this.logger.error(`Failed to update job order ${id}: ${error.message}`, error.stack);
            if (error.code === 'P2002') {
                throw new BadRequestException(`Job Order number already exists`);
            }
            throw new InternalServerErrorException(error.message || 'Failed to update job order');
        }
    }

    async remove(id: string) {
        // Check if job order exists
        await this.findOne(id);

        return this.prisma.$transaction(async (tx) => {
            await tx.jobOrderLog.deleteMany({ where: { jobOrderId: id } });
            return tx.jobOrder.delete({ where: { id } });
        });
    }

    async closeJob(id: string, productionInfo: { productionName: string; productionDate: string }) {
        // Check if job order exists
        await this.findOne(id);

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
