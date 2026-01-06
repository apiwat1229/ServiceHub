import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ITTicketsController } from './it-tickets.controller';
import { ITTicketsService } from './it-tickets.service';

@Module({
    imports: [PrismaModule, AuthModule, NotificationsModule],
    controllers: [ITTicketsController],
    providers: [ITTicketsService],
})
export class ITTicketsModule { }
