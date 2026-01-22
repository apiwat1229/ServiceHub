import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductionReportDto } from './dto/create-production-report.dto';

@Injectable()
export class ProductionReportsService {
    constructor(private prisma: PrismaService) { }

    async create(createDto: CreateProductionReportDto) {
        const { rows, ...mainData } = createDto;

        try {
            return await this.prisma.productionReport.create({
                data: {
                    ...mainData,
                    productionDate: new Date(mainData.productionDate),
                    issuedAt: mainData.issuedAt ? new Date(mainData.issuedAt) : new Date(),
                    rows: {
                        create: rows,
                    },
                },
                include: {
                    rows: true,
                },
            });
        } catch (error: any) {
            console.error('[ProductionReportsService] Error creating report:', error);
            throw new InternalServerErrorException(`Failed to create report: ${error.message || 'Unknown error'}`);
        }
    }

    async findAll() {
        return this.prisma.productionReport.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                rows: true,
            },
        });
    }

    async findOne(id: string) {
        return this.prisma.productionReport.findUnique({
            where: { id },
            include: {
                rows: true,
            },
        });
    }

    async update(id: string, updateDto: CreateProductionReportDto) {
        const { rows, ...mainData } = updateDto;

        try {
            return await this.prisma.$transaction(async (tx) => {
                // 1. Delete existing rows
                await tx.productionReportRow.deleteMany({ where: { reportId: id } });

                // 2. Update report and create new rows
                return await tx.productionReport.update({
                    where: { id },
                    data: {
                        ...mainData,
                        productionDate: new Date(mainData.productionDate),
                        issuedAt: mainData.issuedAt ? new Date(mainData.issuedAt) : undefined,
                        rows: {
                            create: rows,
                        },
                    },
                    include: {
                        rows: true,
                    },
                });
            });
        } catch (error: any) {
            console.error('[ProductionReportsService] Error updating report:', error);
            throw new InternalServerErrorException(`Failed to update report: ${error.message || 'Unknown error'}`);
        }
    }

    async remove(id: string) {
        try {
            return await this.prisma.productionReport.delete({
                where: { id },
            });
        } catch (error: any) {
            console.error('[ProductionReportsService] Error deleting report:', error);
            throw new InternalServerErrorException(`Failed to delete report: ${error.message || 'Unknown error'}`);
        }
    }
}
