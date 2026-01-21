import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateRawMaterialPlanDto } from './dto/create-raw-material-plan.dto';
import { RawMaterialPlansService } from './raw-material-plans.service';

@Controller('raw-material-plans')
export class RawMaterialPlansController {
    constructor(private readonly rawMaterialPlansService: RawMaterialPlansService) { }

    @Post()
    create(@Body() createDto: CreateRawMaterialPlanDto) {
        return this.rawMaterialPlansService.create(createDto);
    }

    @Get()
    findAll() {
        return this.rawMaterialPlansService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.rawMaterialPlansService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: CreateRawMaterialPlanDto) {
        return this.rawMaterialPlansService.update(id, updateDto);
    }
}
