import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStorageLocationDto, UpdateStorageLocationDto } from './dto/storage-location.dto';

@Injectable()
export class StorageLocationService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.storageLocation.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.storageLocation.findUnique({
            where: { id },
        });
    }

    async create(dto: CreateStorageLocationDto) {
        return this.prisma.storageLocation.create({
            data: dto,
        });
    }

    async update(id: string, dto: UpdateStorageLocationDto) {
        return this.prisma.storageLocation.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        return this.prisma.storageLocation.delete({
            where: { id },
        });
    }
}
