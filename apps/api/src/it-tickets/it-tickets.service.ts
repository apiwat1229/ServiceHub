import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateITTicketDto, UpdateITTicketDto } from './dto/it-ticket.dto';

@Injectable()
export class ITTicketsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService
    ) { }

    async create(userId: string, createDto: CreateITTicketDto) {
        // Generate ticket number T-1000, T-1001, etc.
        const lastTicket = await this.prisma.iTTicket.findFirst({
            orderBy: { createdAt: 'desc' },
        });

        let nextNo = 1000;
        if (lastTicket && lastTicket.ticketNo.startsWith('T-')) {
            const lastNo = parseInt(lastTicket.ticketNo.replace('T-', ''));
            if (!isNaN(lastNo)) {
                nextNo = lastNo + 1;
            }
        }

        const ticketNo = `T-${nextNo}`;

        const ticket = await this.prisma.iTTicket.create({
            data: {
                ...createDto,
                ticketNo,
                requesterId: userId,
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                    },
                },
                assignee: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                    },
                },
            },
        });

        // Notify IT Team
        this.notifyITTeam(ticket);

        return ticket;
    }

    private async notifyITTeam(ticket: any) {
        try {
            const itMembers = await this.notificationsService.getGroupMembers('IT');
            if (!itMembers.length) return;

            for (const member of itMembers) {
                // Don't notify the creator if they are IT (optional preference, but good for confirmation)
                await this.notificationsService.create({
                    userId: member.id,
                    title: `New IT Ticket: ${ticket.ticketNo}`,
                    message: `${ticket.title} - ${ticket.requester?.displayName}`,
                    type: 'INFO',
                    sourceApp: 'IT_HELP_DESK',
                    actionType: 'VIEW_TICKET',
                    entityId: ticket.id,
                    actionUrl: `/admin/helpdesk?ticketId=${ticket.id}`
                });
            }
        } catch (error) {
            console.error('Failed to notify IT team', error);
        }
    }

    async findAll(userId?: string, isAdmin = false) {
        const where = !isAdmin && userId ? { requesterId: userId } : {};

        return this.prisma.iTTicket.findMany({
            where,
            include: {
                requester: {
                    select: {
                        id: true,
                        displayName: true,
                    },
                },
                assignee: {
                    select: {
                        id: true,
                        displayName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.iTTicket.findUnique({
            where: { id },
            include: {
                requester: {
                    select: {
                        id: true,
                        displayName: true,
                    },
                },
                assignee: {
                    select: {
                        id: true,
                        displayName: true,
                    },
                },
            },
        });
    }

    async update(id: string, updateDto: UpdateITTicketDto) {
        const ticket = await this.prisma.iTTicket.update({
            where: { id },
            data: updateDto,
            include: { requester: true }
        });

        // Notify Requester on status change
        if (updateDto.status) {
            this.notificationsService.create({
                userId: ticket.requesterId,
                title: `Ticket Updated: ${ticket.ticketNo}`,
                message: `Status changed to ${ticket.status}`,
                type: 'INFO',
                sourceApp: 'IT_HELP_DESK',
                actionType: 'VIEW_TICKET',
                entityId: ticket.id,
                actionUrl: `/admin/helpdesk?ticketId=${ticket.id}`
            });
        }

        // Notify Assignee if assigned
        if (updateDto.assigneeId) {
            this.notificationsService.create({
                userId: updateDto.assigneeId,
                title: `Ticket Assigned: ${ticket.ticketNo}`,
                message: `You have been assigned to ticket ${ticket.ticketNo}`,
                type: 'INFO',
                sourceApp: 'IT_HELP_DESK',
                actionType: 'VIEW_TICKET',
                entityId: ticket.id,
                actionUrl: `/admin/helpdesk?ticketId=${ticket.id}`
            });
        }

        return ticket;
    }

    async remove(id: string) {
        return this.prisma.iTTicket.delete({
            where: { id },
        });
    }
}
