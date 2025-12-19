import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getStats() {
        try {
            // Parallelize database queries for performance
            const [
                totalUsers,
                activeUsers,
                totalSuppliers,
                totalRubberTypes,
                totalPosts,
            ] = await Promise.all([
                this.prisma.user.count(),
                this.prisma.user.count({ where: { status: 'ACTIVE' } }),
                this.prisma.supplier.count(),
                this.prisma.rubberType.count(),
                this.prisma.post.count(),
            ]);

            // Calculate approximate data size (heuristic based on counts)
            // This is a rough estimation for display purposes
            const estimatedDataPoints = totalUsers + totalSuppliers + totalRubberTypes + totalPosts;

            return {
                system: {
                    status: 'online',
                    uptime: process.uptime(),
                    timestamp: new Date().toISOString(),
                    version: '1.0.0', // Could be pulled from package.json
                },
                data: {
                    totalUsers,
                    totalSuppliers,
                    totalRubberTypes,
                    totalPosts,
                    estimatedDataPoints,
                },
                users: {
                    active: activeUsers,
                    total: totalUsers,
                },
            };
        } catch (error) {
            console.error('Error fetching analytics:', error);
            throw error;
        }
    }
}
