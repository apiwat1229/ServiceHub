import { CreateITAssetDto, UpdateITAssetDto } from '@my-app/types';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ITAssetsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDto: CreateITAssetDto) {
        return this.prisma.iTAsset.create({
            data: createDto,
        });
    }

    async findAll() {
        return this.prisma.iTAsset.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.iTAsset.findUnique({
            where: { id },
        });
    }

    async update(id: string, updateDto: UpdateITAssetDto) {
        return this.prisma.iTAsset.update({
            where: { id },
            data: updateDto,
        });
    }

    async remove(id: string) {
        return this.prisma.iTAsset.delete({
            where: { id },
        });
    }

    async updateImage(id: string, imagePath: string) {
        return this.prisma.iTAsset.update({
            where: { id },
            data: { image: imagePath },
        });
    }
}
