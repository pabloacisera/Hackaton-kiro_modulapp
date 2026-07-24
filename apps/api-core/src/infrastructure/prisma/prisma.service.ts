import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Feature: Structured Logging — Prisma query logging.
 *
 * - Logs slow queries (> 200ms) as warnings
 * - Logs all queries at debug level in development
 * - Logs errors always
 */
@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error' | 'warn'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const logLevels: Prisma.LogLevel[] =
      process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'];

    super({
      log: logLevels.map((level) => ({ level, emit: 'event' })) as Prisma.LogDefinition[],
    });
  }

  async onModuleInit() {
    // Log slow queries as warnings (> 200ms)
    this.$on('query', (e: Prisma.QueryEvent) => {
      if (e.duration > 200) {
        this.logger.warn(
          `Slow query (${e.duration}ms): ${e.query.slice(0, 200)}${e.query.length > 200 ? '...' : ''}`,
        );
      } else if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`Query (${e.duration}ms): ${e.query.slice(0, 120)}`);
      }
    });

    this.$on('error', (e: { message: string }) => {
      this.logger.error(`Prisma error: ${e.message}`);
    });

    this.$on('warn', (e: { message: string }) => {
      this.logger.warn(`Prisma warning: ${e.message}`);
    });

    await this.$connect();
    this.logger.log('Connected to PostgreSQL via Prisma');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
