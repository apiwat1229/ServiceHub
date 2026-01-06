import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateITTicketDto, CreateTicketCommentDto, UpdateITTicketDto } from './dto/it-ticket.dto';


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

        // Notify IT Team (using settings)
        await this.triggerNotification('IT_HELP_DESK', 'TICKET_CREATED', {
            title: `New IT Ticket: ${ticket.ticketNo}`,
            message: `${ticket.title} - ${ticket.requester?.displayName}`,
            actionUrl: `/admin/helpdesk?ticketId=${ticket.id}`
        });

        return ticket;
    }

    private async triggerNotification(sourceApp: string, actionType: string, payload: { title: string; message: string; actionUrl?: string }, explicitUserIds: string[] = []) {
        try {
            // 1. Get Settings for this event
            const settings = await this.prisma.notificationSetting.findUnique({
                where: {
                    sourceApp_actionType: { sourceApp, actionType }
                }
            });

            // Even if settings don't exist, we might still want to send to explicit users if they were hardcoded? 
            // In this architecture, it's better if everything is configurable. 
            // But for Requester/Assignee, they expect it.

            let targetUserIds: string[] = [...explicitUserIds];

            if (settings && settings.isActive) {
                const recipientRoles = (settings.recipientRoles as unknown as string[]) || [];
                const recipientGroups = (settings.recipientGroups as unknown as string[]) || [];

                // 2. Find Users with these Roles
                if (recipientRoles.length > 0) {
                    const users = await this.prisma.user.findMany({
                        where: {
                            OR: [
                                { role: { in: recipientRoles } },
                                { roleRecord: { name: { in: recipientRoles } } },
                                { roleRecord: { id: { in: recipientRoles } } }
                            ]
                        },
                        select: { id: true }
                    });
                    targetUserIds.push(...users.map(u => u.id));
                }

                // 3. Find Users in these Groups
                if (recipientGroups.length > 0) {
                    const groups = await this.prisma.notificationGroup.findMany({
                        where: { id: { in: recipientGroups } },
                        include: { members: { select: { id: true } } }
                    });
                    const groupUserIds = groups.flatMap(g => g.members.map(m => m.id));
                    targetUserIds.push(...groupUserIds);
                }
            }

            // Deduplicate
            targetUserIds = [...new Set(targetUserIds)];

            // 4. Send Notification to each user
            for (const userId of targetUserIds) {
                await this.notificationsService.create({
                    userId: userId,
                    title: payload.title,
                    message: payload.message,
                    type: 'INFO',
                    sourceApp,
                    actionType,
                    actionUrl: payload.actionUrl
                });
            }

            if (targetUserIds.length > 0) {
                console.log(`Notification sent for ${sourceApp}:${actionType} to ${targetUserIds.length} users.`);
            }

        } catch (error) {
            console.error('Error triggering notification:', error);
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
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                displayName: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }

    async update(id: string, updateDto: UpdateITTicketDto) {
        // 1. Get current ticket to check status change and asset info
        const currentTicket = await this.prisma.iTTicket.findUnique({
            where: { id },
            select: { status: true, isAssetRequest: true, assetId: true, quantity: true }
        });

        const ticket = await this.prisma.iTTicket.update({
            where: { id },
            data: updateDto,
            include: { requester: true }
        });

        // 2. Stock Deduction Logic
        // If status changed to 'Resolved' and it IS an asset request with a valid asset and quantity
        if (
            updateDto.status === 'Resolved' &&
            currentTicket?.status !== 'Resolved' &&
            ticket.isAssetRequest &&
            ticket.assetId &&
            ticket.quantity > 0
        ) {
            try {
                await this.prisma.iTAsset.update({
                    where: { id: ticket.assetId },
                    data: {
                        stock: {
                            decrement: ticket.quantity
                        }
                    }
                });
                console.log(`Auto-deducted ${ticket.quantity} from stock for asset ${ticket.assetId} (Ticket: ${ticket.ticketNo})`);
            } catch (error) {
                console.error(`Failed to deduct stock for asset ${ticket.assetId}:`, error);
                // We might want to throw or just log? Usually logging is safer to not block ticket resolution 
                // unless it's a critical requirement.
            }
        }

        // Notify Requester on status change
        if (updateDto.status) {
            await this.triggerNotification('IT_HELP_DESK', 'TICKET_UPDATED', {
                title: `Ticket Updated: ${ticket.ticketNo}`,
                message: `Status changed to ${ticket.status}`,
                actionUrl: `/admin/helpdesk?ticketId=${ticket.id}`
            }, [ticket.requesterId]);
        }

        // Notify Assignee if assigned
        if (updateDto.assigneeId) {
            await this.triggerNotification('IT_HELP_DESK', 'TICKET_ASSIGNED', {
                title: `Ticket Assigned: ${ticket.ticketNo}`,
                message: `You have been assigned to ticket ${ticket.ticketNo}`,
                actionUrl: `/admin/helpdesk?ticketId=${ticket.id}`
            }, [updateDto.assigneeId]);
        }

        return ticket;
    }

    async remove(id: string) {
        return this.prisma.iTTicket.delete({
            where: { id },
        });
    }

    async addComment(ticketId: string, userId: string, createDto: CreateTicketCommentDto) {
        const comment = await this.prisma.ticketComment.create({
            data: {
                content: createDto.content,
                ticketId,
                userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
        });

        // Notify relevant parties (Requester or Assignee)
        const ticket = await this.prisma.iTTicket.findUnique({
            where: { id: ticketId },
        });

        if (ticket) {
            const targets: string[] = [];
            // If commenter is not requester, notify requester
            if (userId !== ticket.requesterId) {
                targets.push(ticket.requesterId);
            }
            // If commenter is not assignee, and there is an assignee, notify assignee
            if (ticket.assigneeId && userId !== ticket.assigneeId) {
                targets.push(ticket.assigneeId);
            }

            if (targets.length > 0) {
                await this.triggerNotification('IT_HELP_DESK', 'NEW_COMMENT', {
                    title: `New Comment on T-${ticket.ticketNo}`,
                    message: `${comment.user.displayName} commented on the ticket`,
                    actionUrl: `/admin/helpdesk?ticketId=${ticket.id}`
                }, targets);
            }
        }

        return comment;
    }
}
