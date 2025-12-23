
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_ROLES = [
    {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access and configuration',
        color: 'bg-blue-600',
        icon: 'Shield',
        permissions: {
            users: { read: true, write: true, delete: true },
            roles: { read: true, write: true, delete: true },
            settings: { read: true, write: true, delete: true },
        },
    },
    {
        id: 'md',
        name: 'Managing Director',
        description: 'Executive oversight and approval',
        color: 'bg-purple-600',
        icon: 'Briefcase',
        permissions: {
            users: { read: true, write: false, delete: false },
            reports: { read: true, write: true, delete: true },
        }
    },
    {
        id: 'staff_1',
        name: 'Staff 1',
        description: 'Standard operations',
        color: 'bg-emerald-500',
        icon: 'User',
        permissions: {
            bookings: { read: true, write: true, delete: false },
        }
    },
    // Add other default roles as needed matching INITIAL_ROLES from frontend
    { id: 'gm', name: 'General Manager', description: 'General management', color: 'bg-purple-500', icon: 'Briefcase', permissions: {} },
    { id: 'manager', name: 'Manager', description: 'Departmental management', color: 'bg-orange-500', icon: 'Briefcase', permissions: {} },
    { id: 'asst_mgr', name: 'Assistant Manager', description: 'Support management', color: 'bg-orange-400', icon: 'Briefcase', permissions: {} },
    { id: 'senior_sup', name: 'Senior Supervisor', description: 'Senior supervision', color: 'bg-indigo-500', icon: 'Users', permissions: {} },
    { id: 'supervisor', name: 'Supervisor', description: 'Team supervision', color: 'bg-indigo-400', icon: 'Users', permissions: {} },
    { id: 'senior_staff_1', name: 'Senior Staff 1', description: 'Advanced operations', color: 'bg-green-500', icon: 'User', permissions: {} },
    { id: 'staff_2', name: 'Staff 2', description: 'Standard operations', color: 'bg-emerald-500', icon: 'User', permissions: {} },
    { id: 'senior_staff_2', name: 'Senior Staff 2', description: 'Advanced operations', color: 'bg-green-500', icon: 'User', permissions: {} },
    { id: 'op_leader', name: 'Operator Leader', description: 'Line leadership', color: 'bg-slate-500', icon: 'Layers', permissions: {} },
];

@Injectable()
export class RolesService implements OnModuleInit {
    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        await this.seedDefaults();
    }

    async seedDefaults() {
        console.log('Seeding default roles...');
        for (const role of DEFAULT_ROLES) {
            await this.prisma.role.upsert({
                where: { name: role.name },
                update: {}, // Don't overwrite existing changes
                create: {
                    id: role.id,
                    name: role.name,
                    description: role.description,
                    color: role.color,
                    icon: role.icon,
                    permissions: role.permissions,
                }
            });
        }
        console.log('Roles seeded.');
    }

    async findAll() {
        return this.prisma.role.findMany({
            orderBy: { name: 'asc' } // Or specific order
        });
    }

    async findOne(id: string) {
        return this.prisma.role.findUnique({ where: { id } });
    }

    async update(id: string, data: any) {
        return this.prisma.role.update({
            where: { id },
            data
        });
    }

    async create(data: any) {
        // Check if role with same name already exists
        const existing = await this.prisma.role.findUnique({
            where: { name: data.name }
        });

        if (existing) {
            throw new Error('Role with this name already exists');
        }

        return this.prisma.role.create({
            data: {
                name: data.name,
                description: data.description || '',
                color: data.color || 'bg-slate-500',
                icon: data.icon || 'User',
                permissions: data.permissions || {},
            }
        });
    }

    async remove(id: string) {
        // Check if any users have this role
        const usersWithRole = await this.prisma.user.count({
            where: { role: id }
        });

        if (usersWithRole > 0) {
            throw new Error(`Cannot delete role: ${usersWithRole} user(s) are assigned to this role`);
        }

        return this.prisma.role.delete({ where: { id } });
    }
}
