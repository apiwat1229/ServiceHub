import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { JobOrdersService } from './job-orders.service';

@Controller('job-orders')
export class JobOrdersController {
    constructor(private readonly jobOrdersService: JobOrdersService) { }

    @Get()
    findAll() {
        return this.jobOrdersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.jobOrdersService.findOne(id);
    }

    @Post()
    create(@Body() createJobOrderDto: any) {
        return this.jobOrdersService.create(createJobOrderDto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateJobOrderDto: any) {
        return this.jobOrdersService.update(id, updateJobOrderDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.jobOrdersService.remove(id);
    }

    @Post(':id/close')
    closeJob(@Param('id') id: string, @Body() productionInfo: any) {
        return this.jobOrdersService.closeJob(id, productionInfo);
    }
}
