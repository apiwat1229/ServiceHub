import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
    // Ensure upload directories exist safely
    try {
        const uploadDirs = [
            'uploads',
            'uploads/avatars',
            'uploads/it-asset',
            'uploads/knowledge-books',
        ];
        uploadDirs.forEach(dir => {
            const fullPath = join(process.cwd(), dir);
            if (!existsSync(fullPath)) {
                mkdirSync(fullPath, { recursive: true });
            }
        });
    } catch (e: any) {
        console.warn('Could not create upload directories:', e.message);
    }

    const app = await NestFactory.create(AppModule);

    // Enable CORS
    let origins: boolean | string[] = true;
    if (process.env.CORS_ORIGINS) {
        origins = process.env.CORS_ORIGINS.split(',');
        // Always allow localhost specific ports for development comfort
        if (Array.isArray(origins)) {
            origins.push('http://localhost:5173');
            origins.push('http://localhost:2530');
            origins.push('http://localhost:3000');
        }
    }
    app.enableCors({
        origin: true,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With',
    });

    // Enable validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: false,
        })
    );

    // Global prefix
    app.setGlobalPrefix('api');

    const port = process.env.API_PORT || 2530;
    await app.listen(port, '0.0.0.0');

    console.log(`🚀 API Server is running on: http://localhost:${port}/api`);
    console.log(`🌍 Production URL: https://app.ytrc.co.th/api`);
    console.log(`🔑 CORS: Enabled (Mirroring Origin)`);
}

// Port changed to 2530
bootstrap();
