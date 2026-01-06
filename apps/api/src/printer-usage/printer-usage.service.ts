import {
    CreatePrinterDepartmentDto,
    SavePrinterUsageRecordDto,
    UpdatePrinterDepartmentDto,
    UpsertPrinterUserMappingDto
} from '@my-app/types';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrinterUsageService {
    constructor(private prisma: PrismaService) {
        // Service initialized
    }

    // Departments
    async getDepartments() {
        return this.prisma.printerDepartment.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async createDepartment(data: CreatePrinterDepartmentDto) {
        return this.prisma.printerDepartment.create({ data });
    }

    async updateDepartment(id: string, data: UpdatePrinterDepartmentDto) {
        return this.prisma.printerDepartment.update({
            where: { id },
            data,
        });
    }

    async deleteDepartment(id: string) {
        return this.prisma.printerDepartment.delete({
            where: { id },
        });
    }

    // Mappings
    async getMappings() {
        return this.prisma.printerUserMapping.findMany({
            include: { department: true },
            orderBy: { userName: 'asc' },
        });
    }

    async upsertMapping(data: UpsertPrinterUserMappingDto) {
        return this.prisma.printerUserMapping.upsert({
            where: { userName: data.userName },
            update: { departmentId: data.departmentId },
            create: {
                userName: data.userName,
                departmentId: data.departmentId
            },
        });
    }

    // Records
    async saveUsageRecords(records: SavePrinterUsageRecordDto[]) {
        const results = [];
        for (const record of records) {
            const { period, userName, ...data } = record;

            // Get department from mapping
            const mapping = await this.prisma.printerUserMapping.findUnique({
                where: { userName },
            });

            const upserted = await this.prisma.printerUsageRecord.upsert({
                where: {
                    period_userName_serialNo: {
                        period: new Date(period),
                        userName,
                        serialNo: data.serialNo || 'unknown',
                    },
                },
                update: {
                    ...data,
                    departmentId: mapping?.departmentId || null,
                },
                create: {
                    period: new Date(period),
                    userName,
                    ...data,
                    serialNo: data.serialNo || 'unknown',
                    departmentId: mapping?.departmentId || null,
                },
            });
            results.push(upserted);
        }
        return results;
    }

    async getHistory() {
        return this.prisma.printerUsageRecord.findMany({
            include: { department: true },
            orderBy: [
                { period: 'desc' },
                { total: 'desc' }
            ],
        });
    }

    async deletePeriod(period: string) {
        const periodDate = new Date(decodeURIComponent(period));
        return this.prisma.printerUsageRecord.deleteMany({
            where: { period: periodDate },
        });
    }
}
