import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RawMaterialPlansController } from './raw-material-plans.controller';
import { RawMaterialPlansService } from './raw-material-plans.service';

@Module({
    imports: [PrismaModule],
    controllers: [RawMaterialPlansController],
    providers: [RawMaterialPlansService],
})
export class RawMaterialPlansModule { }
