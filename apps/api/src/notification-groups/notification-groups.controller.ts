import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { NotificationGroupsService } from './notification-groups.service';

@Controller('notification-groups')
export class NotificationGroupsController {
    constructor(private readonly groupsService: NotificationGroupsService) { }

    @Post()
    create(@Body() body: { name: string; description?: string }) {
        return this.groupsService.create(body);
    }

    @Get()
    findAll() {
        return this.groupsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.groupsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() body: { name?: string; description?: string; isActive?: boolean },
    ) {
        return this.groupsService.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.groupsService.remove(id);
    }

    @Post(':id/members')
    addMembers(@Param('id') id: string, @Body() body: { userIds: string[] }) {
        return this.groupsService.addMembers(id, body.userIds);
    }

    @Delete(':id/members/:userId')
    removeMember(@Param('id') id: string, @Param('userId') userId: string) {
        return this.groupsService.removeMember(id, userId);
    }
}
