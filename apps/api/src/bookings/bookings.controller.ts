import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Post()
    create(@Body() createDto: any) {
        return this.bookingsService.create(createDto);
    }

    @Get()
    findAll(@Query('date') date?: string, @Query('slot') slot?: string, @Query('code') code?: string) {
        return this.bookingsService.findAll(date, slot, code);
    }

    @Get('stats/:date')
    getStats(@Param('date') date: string) {
        return this.bookingsService.getStats(date);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.bookingsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: any, @Request() req: any) {
        return this.bookingsService.update(id, updateDto, req.user);
    }

    @Patch(':id/check-in')
    checkIn(@Param('id') id: string, @Body() body: any) {
        return this.bookingsService.checkIn(id, body);
    }

    @Patch(':id/start-drain')
    startDrain(@Param('id') id: string) {
        return this.bookingsService.startDrain(id);
    }

    @Patch(':id/stop-drain')
    stopDrain(@Param('id') id: string, @Body() body: any) {
        return this.bookingsService.stopDrain(id, body);
    }

    @Patch(':id/weight-in')
    saveWeightIn(@Param('id') id: string, @Body() body: any) {
        return this.bookingsService.saveWeightIn(id, body);
    }

    @Patch(':id/weight-out')
    saveWeightOut(@Param('id') id: string, @Body() body: any) {
        return this.bookingsService.saveWeightOut(id, body);
    }

    @Get(':id/samples')
    getSamples(@Param('id') id: string) {
        return this.bookingsService.getSamples(id);
    }

    @Post(':id/samples')
    saveSample(@Param('id') id: string, @Body() body: any) {
        return this.bookingsService.saveSample(id, body);
    }

    @Delete(':id/samples/:sampleId')
    deleteSample(@Param('id') id: string, @Param('sampleId') sampleId: string) {
        return this.bookingsService.deleteSample(id, sampleId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.bookingsService.remove(id, req.user);
    }
}
