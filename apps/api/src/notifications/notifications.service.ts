import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        userId: string;
        title: string;
        message: string;
        type?: NotificationType;
        sourceApp: string;
        actionType: string;
        entityId?: string;
        actionUrl?: string;
        metadata?: any;
    }) {
        return this.prisma.notification.create({
            data: {
                ...data,
                metadata: data.metadata || {},
            },
        });
    }

    async findAll(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findUnread(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId, status: 'UNREAD' },
            orderBy: { createdAt: 'desc' },
        });
    }

    async markAsRead(id: string, userId: string) {
        return this.prisma.notification.update({
            where: { id, userId },
            data: { status: 'READ' },
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, status: 'UNREAD' },
            data: { status: 'READ' },
        });
    }

    async getSettings() {
        return this.prisma.notificationSetting.findMany({
            orderBy: { sourceApp: 'asc' },
        });
    }

    async updateSetting(sourceApp: string, actionType: string, data: {
        isActive?: boolean;
        recipientRoles?: string[];
        recipientUsers?: string[];
        channels?: string[];
    }) {
        return this.prisma.notificationSetting.upsert({
            where: {
                sourceApp_actionType: {
                    sourceApp,
                    actionType,
                },
            },
            update: {
                isActive: data.isActive,
                recipientRoles: data.recipientRoles ? (data.recipientRoles as any) : undefined,
                recipientUsers: data.recipientUsers ? (data.recipientUsers as any) : undefined,
                channels: data.channels ? (data.channels as any) : undefined,
            },
            create: {
                sourceApp,
                actionType,
                isActive: data.isActive ?? true,
                recipientRoles: (data.recipientRoles || []) as any,
                recipientUsers: (data.recipientUsers || []) as any,
                channels: (data.channels || ['IN_APP']) as any,
            },
        });
    }
    async broadcast(data: {
        title: string;
        message: string;
        type?: NotificationType;
        recipientRoles?: string[];
        recipientUsers?: string[];
        recipientGroups?: string[];
        senderId?: string;
    }) {
        console.log('>>>>>>>> BROADCAST CALLED <<<<<<<<');
        console.log('Data:', JSON.stringify(data, null, 2));

        // 1. Find target users
        const whereConditions: any[] = [];

        if (data.recipientUsers && data.recipientUsers.length > 0) {
            console.log(`Explicit Users Targeted: ${data.recipientUsers.length}`);
            whereConditions.push({ id: { in: data.recipientUsers } });
        }

        if (data.recipientRoles && data.recipientRoles.length > 0) {
            console.log(`Roles Targeted: ${data.recipientRoles.join(', ')}`);
            whereConditions.push({ role: { in: data.recipientRoles } });
        }

        if (data.recipientGroups && data.recipientGroups.length > 0) {
            console.log(`Groups Targeted: ${data.recipientGroups.join(', ')}`);
            const groups = await this.prisma.notificationGroup.findMany({
                where: { name: { in: data.recipientGroups } },
                include: { members: { select: { id: true } } }
            });

            const groupUserIds = groups.flatMap(g => g.members.map(m => m.id));
            if (groupUserIds.length > 0) {
                console.log(`Found ${groupUserIds.length} users in groups`);
                whereConditions.push({ id: { in: groupUserIds } });
            }
        }

        if (whereConditions.length === 0) {
            console.log('No targets found');
            return { count: 0, message: 'No recipients specified.' };
        }

        const users = await this.prisma.user.findMany({
            where: { OR: whereConditions },
            select: { id: true, username: true, email: true } // Log username/email
        });

        console.log(`Final Target List (${users.length}):`);
        users.forEach(u => console.log(` - [${u.id}] ${u.username} (${u.email})`));

        // Deduplicate user IDs
        const uniqueUserIds = [...new Set(users.map(u => u.id))];

        if (uniqueUserIds.length === 0) {
            return { count: 0, message: 'No matching users found.' };
        }

        // 2. Create notifications in batch
        // Prisma createMany is supported for Postgres
        const notifications = uniqueUserIds.map(userId => ({
            title: data.title,
            message: data.message,
            type: data.type || NotificationType.INFO,
            userId: userId,
            sourceApp: 'ADMIN_BROADCAST',
            actionType: 'MANUAL_BROADCAST',
            metadata: { senderId: data.senderId }
        }));

        await this.prisma.notification.createMany({
            data: notifications as any // Type assertion if needed for strict checking
        });

        return { count: uniqueUserIds.length, message: `Broadcasted to ${uniqueUserIds.length} users.` };
    }

    async getBroadcastHistory() {
        // Get unique broadcasts (group by title, message, type, createdAt)
        const broadcasts = await this.prisma.notification.findMany({
            where: {
                sourceApp: 'ADMIN_BROADCAST',
                actionType: 'MANUAL_BROADCAST'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100, // Limit to last 100 broadcasts
        });

        // Group by metadata.senderId + createdAt to find unique broadcasts
        const grouped = broadcasts.reduce((acc: any, notif: any) => {
            const key = `${notif.title}-${notif.message}-${notif.type}-${new Date(notif.createdAt).toISOString().slice(0, 16)}`;
            if (!acc[key]) {
                acc[key] = {
                    id: notif.id,
                    title: notif.title,
                    message: notif.message,
                    type: notif.type,
                    createdAt: notif.createdAt,
                    recipientCount: 1,
                    recipientDetails: [notif.user],
                };
            } else {
                acc[key].recipientCount += 1;
                // Add user if not already in the list (deduplicate)
                const userExists = acc[key].recipientDetails.some((u: any) => u.id === notif.user.id);
                if (!userExists) {
                    acc[key].recipientDetails.push(notif.user);
                }
            }
            return acc;
        }, {});

        return Object.values(grouped);
    }

    async deleteBroadcast(id: string) {
        // 1. Find the target notification to get metadata
        const target = await this.prisma.notification.findUnique({
            where: { id },
            select: { title: true, message: true, type: true, createdAt: true, sourceApp: true, actionType: true }
        });

        if (!target) {
            throw new Error('Notification not found');
        }

        // 2. Define a small time window (e.g., 5 seconds) to catch the batch
        const timeWindow = 5000; // 5 seconds
        const createdTime = new Date(target.createdAt).getTime();
        const minTime = new Date(createdTime - timeWindow);
        const maxTime = new Date(createdTime + timeWindow);

        // 3. Delete all matching notifications in the batch
        const result = await this.prisma.notification.deleteMany({
            where: {
                title: target.title,
                message: target.message,
                type: target.type,
                sourceApp: target.sourceApp,
                actionType: target.actionType,
                createdAt: {
                    gte: minTime,
                    lte: maxTime,
                }
            }
        });

        return { count: result.count, message: `Deleted ${result.count} notifications from history.` };
    }

    async deleteBroadcasts(ids: string[]) {
        let totalCount = 0;
        for (const id of ids) {
            try {
                // Reuse the clean-up logic per broadcast ID
                // Note: Ideally we refactor deleteBroadcast to take metadata directly to avoid multiple DB calls, 
                // but this is safer to ensure consistent logic.
                const result = await this.deleteBroadcast(id);
                totalCount += (result.count || 0);
            } catch (error) {
                console.warn(`Failed to delete broadcast ${id}:`, error);
                // Continue with others
            }
        }
        return { count: totalCount, message: `Deleted ${totalCount} notifications from history.` };
    }

    // --- Usage: Group Management ---
    async findAllGroups() {
        return this.prisma.notificationGroup.findMany({
            include: {
                members: {
                    select: { id: true, firstName: true, lastName: true, role: true }
                }
            },
            orderBy: { name: 'asc' }
        });
    }

    async createGroup(data: { name: string; description?: string; memberIds?: string[] }) {
        return this.prisma.notificationGroup.create({
            data: {
                name: data.name,
                description: data.description,
                members: {
                    connect: data.memberIds?.map(id => ({ id })) || []
                }
            },
            include: { members: true }
        });
    }

    async updateGroup(id: string, data: { name?: string; description?: string; memberIds?: string[] }) {
        return this.prisma.notificationGroup.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                members: data.memberIds ? {
                    set: data.memberIds.map(userId => ({ id: userId }))
                } : undefined
            },
            include: { members: true }
        });
    }

    async deleteGroup(id: string) {
        return this.prisma.notificationGroup.delete({
            where: { id }
        });
    }
}
