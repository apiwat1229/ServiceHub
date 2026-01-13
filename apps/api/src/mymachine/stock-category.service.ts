import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockCategoryDto, UpdateStockCategoryDto } from './dto/stock-category.dto';

@Injectable()
export class StockCategoryService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.stockCategory.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.stockCategory.findUnique({
            where: { id },
        });
    }

    async create(dto: CreateStockCategoryDto) {
        return this.prisma.stockCategory.create({
            data: dto,
        });
    }

    async update(id: string, dto: UpdateStockCategoryDto) {
        return this.prisma.stockCategory.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        return this.prisma.stockCategory.delete({
            where: { id },
        });
    }
}
