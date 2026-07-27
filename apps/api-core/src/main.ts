import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Buffer logs until Pino logger is ready
    bufferLogs: true,
  });

  // Use Pino as the application logger (replaces default NestJS logger)
  app.useLogger(app.get(Logger));

  // Parse cookies — required for refresh token cookie handling
  app.use(cookieParser());

  // Enable graceful shutdown — drains BullMQ queues on SIGTERM/SIGINT
  app.enableShutdownHooks();

  // Global prefix — frontends use /api/* since VITE_API_URL=/api
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Global validation pipe — rejects malformed DTOs with 400 Bad Request
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS — allow landing (3000), admin-dashboard (3001), nginx proxy (8082), and localhost in development
  const corsOrigins = process.env.CORS_ORIGINS
    ? [...process.env.CORS_ORIGINS.split(','), 'http://localhost']
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8082',
        'http://localhost',
      ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  await app.listen(8080);
}

bootstrap();
