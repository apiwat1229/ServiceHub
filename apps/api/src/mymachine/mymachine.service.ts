import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MyMachineService {
    constructor(private prisma: PrismaService) { }

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
        return this.prisma.repairLog.create({
            data,
        });
    }

    async deleteRepair(id: string) {
        return this.prisma.repairLog.delete({
            where: { id },
        });
    }
}
