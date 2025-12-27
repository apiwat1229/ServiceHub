import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

import { ApprovalsModule } from '../approvals/approvals.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [NotificationsModule, ApprovalsModule],
    controllers: [BookingsController],
    providers: [BookingsService, PrismaService],
})
export class BookingsModule { }
