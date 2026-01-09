import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { MyMachineService } from './mymachine.service';

@Controller('mymachine')
export class MyMachineController {
    constructor(private readonly myMachineService: MyMachineService) { }

    // Machines
    @Get('machines')
    findAllMachines() {
        return this.myMachineService.findAllMachines();
    }

    @Get('machines/:id')
    findMachineById(@Param('id') id: string) {
        return this.myMachineService.findMachineById(id);
    }

    @Post('machines')
    createMachine(@Body() data: any) {
        return this.myMachineService.createMachine(data);
    }

    @Delete('machines/:id')
    deleteMachine(@Param('id') id: string) {
        return this.myMachineService.deleteMachine(id);
    }

    // Repair Logs
    @Get('repairs')
    findAllRepairs() {
        return this.myMachineService.findAllRepairs();
    }

    // Public Endpoint for scannable QR codes
    @Public()
    @Get('public/repairs/:id')
    findPublicRepair(@Param('id') id: string) {
        return this.myMachineService.findRepairById(id);
    }

    @Get('repairs/:id')
    findRepairById(@Param('id') id: string) {
        return this.myMachineService.findRepairById(id);
    }

    @Post('repairs')
    createRepair(@Body() data: any) {
        return this.myMachineService.createRepair(data);
    }

    @Delete('repairs/:id')
    deleteRepair(@Param('id') id: string) {
        return this.myMachineService.deleteRepair(id);
    }
}
