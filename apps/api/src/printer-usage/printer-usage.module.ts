import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrinterUsageController } from './printer-usage.controller';
import { PrinterUsageService } from './printer-usage.service';

@Module({
    imports: [PrismaModule],
    controllers: [PrinterUsageController],
    providers: [PrinterUsageService],
    exports: [PrinterUsageService],
})
export class PrinterUsageModule { }
