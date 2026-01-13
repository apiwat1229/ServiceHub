import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GLCodeController } from './gl-code.controller';
import { GLCodeService } from './gl-code.service';
import { MyMachineController } from './mymachine.controller';
import { MyMachineService } from './mymachine.service';

@Module({
    imports: [PrismaModule],
    controllers: [MyMachineController, GLCodeController],
    providers: [MyMachineService, GLCodeService],
    exports: [MyMachineService, GLCodeService],
})
export class MyMachineModule { }
