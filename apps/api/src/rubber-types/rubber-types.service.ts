import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RubberTypesService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.rubberType.create({
            data: {
                code: data.code,
                name: data.name,
                description: data.description,
                is_active: data.status === 'ACTIVE' || data.is_active === true, // handle both
            },
        });
    }

    async findAll() {
        return this.prisma.rubberType.findMany({
            orderBy: { code: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.rubberType.findUnique({
            where: { id },
        });
    }

    async update(id: string, data: any) {
        return this.prisma.rubberType.update({
            where: { id },
            data: {
                code: data.code,
                name: data.name,
                description: data.description,
                is_active: data.status ? data.status === 'ACTIVE' : data.is_active,
            },
        });
    }

    async remove(id: string) {
        return this.prisma.rubberType.delete({
            where: { id },
        });
    }
}
