import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MyMachineController } from './mymachine.controller';
import { MyMachineService } from './mymachine.service';

@Module({
    imports: [PrismaModule],
    controllers: [MyMachineController],
    providers: [MyMachineService],
    exports: [MyMachineService],
})
export class MyMachineModule { }
