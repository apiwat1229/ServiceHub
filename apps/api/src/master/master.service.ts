import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterService {
    constructor(private prisma: PrismaService) { }

    async getProvinces() {
        return this.prisma.province.findMany({
            orderBy: { name_th: 'asc' },
        });
    }

    async getDistricts(provinceId: number) {
        return this.prisma.district.findMany({
            where: { provinceId },
            orderBy: { name_th: 'asc' },
        });
    }

    async getSubdistricts(districtId: number) {
        return this.prisma.subdistrict.findMany({
            where: { districtId },
            orderBy: { name_th: 'asc' },
        });
    }

    async getRubberTypes() {
        return this.prisma.rubberType.findMany({
            where: { is_active: true },
            orderBy: { code: 'asc' },
        });
    }
}
