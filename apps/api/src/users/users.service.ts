import { CreateUserDto, UpdateUserDto } from '@my-app/types';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: createUserDto.email },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        if (createUserDto.username) {
            const existingUsername = await this.prisma.user.findUnique({

                where: { username: createUserDto.username },
            });
            if (existingUsername) {
                throw new ConflictException('Username is already taken');
            }
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        return this.prisma.user.create({

            data: {
                ...createUserDto,
                password: hashedPassword,
                forceChangePassword: true,
                // Sync roleId if role is provided
                ...(createUserDto.role ? { roleId: createUserDto.role } : {}),
            },
        });
    }

    async createPendingUser(data: {
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        password: string;
    }) {
        return this.prisma.user.create({
            data: {
                email: data.email,
                username: data.username,
                firstName: data.firstName,
                lastName: data.lastName,
                password: data.password,
                status: 'PENDING',
                // role field will use default value, roleId will be null by default
                forceChangePassword: false,
            },
        });
    }

    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                displayName: true,
                department: true,
                position: true,
                role: true,
                status: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
                notificationGroups: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                        icon: true,
                    },
                },
                preferences: true,
            } as any,
        });
    }

    async findOne(id: string): Promise<any> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                displayName: true,
                department: true,
                position: true,
                role: true,
                status: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
                permissions: true,
                preferences: true,
                notificationGroups: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                        icon: true,
                    },
                },
                roleRecord: {
                    select: {
                        id: true,
                        name: true,
                        permissions: true,
                    }
                },
                hod: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                },
            } as any,
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async findByEmail(email: string): Promise<any> {
        return this.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                role: true,
                username: true,
                firstName: true,
                lastName: true,
                displayName: true,
                department: true,
                position: true,
                status: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
                failedLoginAttempts: true,
                forceChangePassword: true,
                permissions: true,
                preferences: true,
                roleRecord: {
                    select: {
                        id: true,
                        name: true,
                        permissions: true,
                    }
                },
                hod: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                },
            } as any,
        });
    }

    async findByIdWithPassword(id: string): Promise<any> {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                password: true, // Explicitly select password
                role: true,
                username: true,
                firstName: true,
                lastName: true,
                displayName: true,
                status: true,
                forceChangePassword: true,
            } as any,
        });
    }

    async findByEmailOrUsername(identifier: string): Promise<any> {
        return this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            },
            select: {
                id: true,
                email: true,
                password: true,
                role: true,
                username: true,
                firstName: true,
                lastName: true,
                displayName: true,
                department: true,
                position: true,
                status: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
                failedLoginAttempts: true,
                forceChangePassword: true,
                permissions: true,
                preferences: true,
                roleRecord: {
                    select: {
                        id: true,
                        name: true,
                        permissions: true,
                    }
                },
                hod: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                },
            } as any,
        });
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        await this.findOne(id); // Check if exists

        const {
            username,
            email,
            password,
            firstName,
            lastName,
            displayName,
            department,
            position,
            role,
            status,
            avatar,
            pinCode,
            preferences,
            forceChangePassword,
        } = updateUserDto as any; // Cast as any to access preferences if not in DTO

        const dataToUpdate: any = {
            username,
            email,
            firstName,
            lastName,
            displayName,
            department,
            position,
            role,
            status,
            avatar,
            forceChangePassword, // Update forceChangePassword status
        };

        // Sync roleId with role
        // If role is being updated
        if (role !== undefined) {
            // If role has value, set roleId to it. If role is empty string, set roleId to null
            dataToUpdate.roleId = role ? role : null;
        }

        // Add back preferences if it was lost in my manual object construction above (it was in original)
        if (preferences) {
            dataToUpdate.preferences = preferences;
        }

        if (password) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }

        if (pinCode) {
            dataToUpdate.pinCode = await bcrypt.hash(pinCode, 10);
        }

        return this.prisma.user.update({
            where: { id },

            data: dataToUpdate,
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                displayName: true,
                department: true,
                position: true,
                role: true,
                status: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
                preferences: true,
            } as any,
        });
    }

    async updateLastLogin(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { lastLoginAt: new Date() },
        });
    }

    async remove(id: string) {
        await this.findOne(id); // Check if exists

        return this.prisma.user.delete({
            where: { id },
        });
    }

    async updateLoginAttempts(id: string, attempts: number, lock: boolean = false) {
        const data: any = { failedLoginAttempts: attempts };
        if (lock) {
            data.status = 'SUSPENDED'; // Lock user
        }
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    /**
     * Unlock a locked user account
     */
    async unlockUser(id: string) {
        await this.findOne(id); // Check if exists

        return this.prisma.user.update({
            where: { id },
            data: {
                status: 'ACTIVE',
                failedLoginAttempts: 0,
            },
            select: {
                id: true,
                email: true,
                displayName: true,
                status: true,
                failedLoginAttempts: true,
            } as any,
        });
    }
    async updateAvatar(id: string, avatarUrl: string) {
        await this.findOne(id); // Check if exists
        return this.prisma.user.update({
            where: { id },
            data: { avatar: avatarUrl },
            select: {
                id: true,
                avatar: true,
            },
        });
    }
}
