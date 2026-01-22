import { Module } from '@nestjs/common';
import { ProductionReportsController } from './production-reports.controller';
import { ProductionReportsService } from './production-reports.service';

@Module({
    controllers: [ProductionReportsController],
    providers: [ProductionReportsService],
    exports: [ProductionReportsService],
})
export class ProductionReportsModule { }
