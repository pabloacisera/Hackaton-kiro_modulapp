import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Buffer logs until Pino logger is ready
    bufferLogs: true,
  });

  // Use Pino as the application logger (replaces default NestJS logger)
  app.useLogger(app.get(Logger));

  // Enable graceful shutdown — drains BullMQ queues on SIGTERM/SIGINT
  app.enableShutdownHooks();

  // Global validation pipe — rejects malformed DTOs with 400 Bad Request
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS — allow landing (3000), admin-dashboard (3001), and localhost (Nginx reverse proxy) in development
  const corsOrigins = process.env.CORS_ORIGINS
    ? [...process.env.CORS_ORIGINS.split(','), 'http://localhost']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  await app.listen(8080);
}

bootstrap();
