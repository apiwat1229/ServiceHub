import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RubberTypesController } from './rubber-types.controller';
import { RubberTypesService } from './rubber-types.service';

@Module({
    controllers: [RubberTypesController],
    providers: [RubberTypesService, PrismaService],
})
export class RubberTypesModule { }
