import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GLCodeController } from './gl-code.controller';
import { GLCodeService } from './gl-code.service';
import { MyMachineController } from './mymachine.controller';
import { MyMachineService } from './mymachine.service';
import { StockCategoryController } from './stock-category.controller';
import { StockCategoryService } from './stock-category.service';
import { StorageLocationController } from './storage-location.controller';
import { StorageLocationService } from './storage-location.service';

@Module({
    imports: [PrismaModule],
    controllers: [
        MyMachineController,
        GLCodeController,
        StockCategoryController,
        StorageLocationController,
    ],
    providers: [
        MyMachineService,
        GLCodeService,
        StockCategoryService,
        StorageLocationService,
    ],
    exports: [
        MyMachineService,
        GLCodeService,
        StockCategoryService,
        StorageLocationService,
    ],
})
export class MyMachineModule { }
