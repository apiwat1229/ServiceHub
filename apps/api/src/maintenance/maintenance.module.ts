import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GLCodeController } from './gl-code.controller';
import { GLCodeService } from './gl-code.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { StockCategoryController } from './stock-category.controller';
import { StockCategoryService } from './stock-category.service';
import { StorageLocationController } from './storage-location.controller';
import { StorageLocationService } from './storage-location.service';

@Module({
    imports: [PrismaModule],
    controllers: [
        MaintenanceController,
        GLCodeController,
        StockCategoryController,
        StorageLocationController,
    ],
    providers: [
        MaintenanceService,
        GLCodeService,
        StockCategoryService,
        StorageLocationService,
    ],
    exports: [
        MaintenanceService,
        GLCodeService,
        StockCategoryService,
        StorageLocationService,
    ],
})
export class MaintenanceModule { }
