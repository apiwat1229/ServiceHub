import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGLCodeDto, UpdateGLCodeDto } from './dto/gl-code.dto';

@Injectable()
export class GLCodeService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.gLCode.findMany({
            orderBy: { transactionId: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.gLCode.findUnique({
            where: { id },
        });
    }

    async create(createDto: CreateGLCodeDto) {
        return this.prisma.gLCode.create({
            data: {
                transactionId: createDto.transactionId,
                description: createDto.description,
                code: createDto.code,
                purpose: createDto.purpose,
            },
        });
    }

    async update(id: string, updateDto: UpdateGLCodeDto) {
        return this.prisma.gLCode.update({
            where: { id },
            data: updateDto,
        });
    }

    async remove(id: string) {
        return this.prisma.gLCode.delete({
            where: { id },
        });
    }
}
