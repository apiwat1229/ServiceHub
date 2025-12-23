import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationGroupsService {
    constructor(private prisma: PrismaService) { }

    async create(data: { name: string; description?: string; icon?: string; color?: string; memberIds?: string[] }) {
        const { memberIds, ...rest } = data;
        return this.prisma.notificationGroup.create({
            data: {
                ...rest,
                members: memberIds ? { connect: memberIds.map((id) => ({ id })) } : undefined,
            },
            include: { members: true },
        });
    }

    async findAll() {
        return this.prisma.notificationGroup.findMany({
            include: {
                members: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        role: true,
                    },
                },
                _count: {
                    select: { members: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const group = await this.prisma.notificationGroup.findUnique({
            where: { id },
            include: {
                members: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        role: true,
                    },
                },
            },
        });
        if (!group) throw new NotFoundException('Group not found');
        return group;
    }

    async update(
        id: string,
        data: {
            name?: string;
            description?: string;
            isActive?: boolean;
            icon?: string;
            color?: string;
            memberIds?: string[];
        },
    ) {
        const { memberIds, ...rest } = data;
        const updateData: any = { ...rest };

        if (memberIds) {
            updateData.members = {
                set: memberIds.map((uid) => ({ id: uid })),
            };
        }

        return this.prisma.notificationGroup.update({
            where: { id },
            data: updateData,
            include: { members: true },
        });
    }

    async remove(id: string) {
        return this.prisma.notificationGroup.delete({
            where: { id },
        });
    }

    async addMembers(groupId: string, userIds: string[]) {
        // Avoid duplicates handled by relation logic usually, but connect handles it nicely
        return this.prisma.notificationGroup.update({
            where: { id: groupId },
            data: {
                members: {
                    connect: userIds.map((id) => ({ id })),
                },
            },
            include: { members: true },
        });
    }

    async removeMember(groupId: string, userId: string) {
        return this.prisma.notificationGroup.update({
            where: { id: groupId },
            data: {
                members: {
                    disconnect: { id: userId },
                },
            },
        });
    }
}
