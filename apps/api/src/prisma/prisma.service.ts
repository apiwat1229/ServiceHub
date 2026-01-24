import { PrismaClient } from '@my-app/database';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super({
            datasourceUrl: process.env.DATABASE_URL,
        });
    }
    [x: string]: any;
    async onModuleInit() {
        const dbUrl = process.env.DATABASE_URL;
        const sanitizedUrl = dbUrl ? dbUrl.replace(/:[^:@]+@/, ':****@') : 'UNDEFINED';
        console.log(`🔌 Attempting to connect to database: ${sanitizedUrl}`);

        try {
            await this.$connect();
            console.log('✅ Database connected successfully');
        } catch (error: any) {
            console.error('❌ Database connection failed!');
            console.error(`- Host/Port checking: ${sanitizedUrl}`);
            console.error(`- Error Code: ${error.code || 'N/A'}`);
            console.error(`- Error Message: ${error.message}`);

            if (sanitizedUrl.includes(':5432') && !process.env.DOCKER_CONTAINER) {
                console.warn('💡 TIP: You are trying to connect to port 5432. If use Docker on this machine, you might need port 5433.');
            }
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        console.log('👋 Database disconnected');
    }
}
