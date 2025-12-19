import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RubberTypesService } from './rubber-types.service';

@Controller('rubber-types')
export class RubberTypesController {
    constructor(private readonly rubberTypesService: RubberTypesService) { }

    @Post()
    create(@Body() createRubberTypeDto: any) {
        return this.rubberTypesService.create(createRubberTypeDto);
    }

    @Get()
    findAll() {
        return this.rubberTypesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.rubberTypesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateRubberTypeDto: any) {
        return this.rubberTypesService.update(id, updateRubberTypeDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.rubberTypesService.remove(id);
    }
}
