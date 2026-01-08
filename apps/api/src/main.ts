import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
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
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    // Enable validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        })
    );

    // Global prefix
    app.setGlobalPrefix('api');

    const port = process.env.API_PORT || 2530;
    await app.listen(port, '0.0.0.0');

    console.log(`🚀 API Server is running on: http://localhost:${port}/api`);
    console.log(`📡 Registered Modules: Base logic, PrinterUsageModule, etc.`);
}

// Port changed to 2530
bootstrap();
