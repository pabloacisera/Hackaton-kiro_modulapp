import { Module, OnModuleInit, Logger, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { createBullConfig } from './queue-config.factory';
import {
  QUEUE_SCHEDULED_JOBS,
  QUEUE_PAYMENT_WEBHOOK,
  QUEUE_EMAIL_SEND,
  JOB_QUOTE_EXPIRATION_CHECK,
  JOB_QUOTE_PAYMENT_EXPIRATION_CHECK,
  JOB_PAYMENT_RECONCILIATION,
  JOB_LOW_STOCK_CHECK,
} from './queue.constants';
import { ScheduledJobsProcessor } from './processors/scheduled-jobs.processor';
import { PaymentWebhookProcessor } from './processors/payment-webhook.processor';
import { EmailSendProcessor } from './processors/email-send.processor';
import { QuotesModule } from '../../modules/quotes/quotes.module';
import { OrdersModule } from '../../modules/orders/orders.module';
import { SuppliesModule } from '../../modules/supplies/supplies.module';

/**
 * TASK-queue-1: BullMQ module — registers queues and processors.
 *
 * On module init, registers repeatable jobs for scheduled tasks.
 */
@Module({
  imports: [
    HttpModule.register({ timeout: 10_000 }),
    BullModule.forRoot(createBullConfig()),
    BullModule.registerQueue(
      { name: QUEUE_SCHEDULED_JOBS },
      { name: QUEUE_PAYMENT_WEBHOOK },
      { name: QUEUE_EMAIL_SEND },
    ),
    forwardRef(() => QuotesModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => SuppliesModule),
  ],
  providers: [ScheduledJobsProcessor, PaymentWebhookProcessor, EmailSendProcessor],
  exports: [BullModule],
})
export class QueueModule implements OnModuleInit {
  private readonly logger = new Logger(QueueModule.name);

  constructor(@InjectQueue(QUEUE_SCHEDULED_JOBS) private readonly scheduledQueue: Queue) {}

  async onModuleInit(): Promise<void> {
    await this.registerRepeatableJobs();
    this.logger.log('Queue module initialized — repeatable jobs registered');
  }

  private async registerRepeatableJobs(): Promise<void> {
    // Remove existing repeatable jobs to avoid duplicates on restart
    const existing = await this.scheduledQueue.getRepeatableJobs();
    for (const job of existing) {
      await this.scheduledQueue.removeRepeatableByKey(job.key);
    }

    // Quote expiration check — every 15 minutes
    await this.scheduledQueue.add(
      JOB_QUOTE_EXPIRATION_CHECK,
      {},
      { repeat: { every: 15 * 60 * 1000 }, removeOnComplete: true },
    );

    // Quote payment expiration check — every 15 minutes
    await this.scheduledQueue.add(
      JOB_QUOTE_PAYMENT_EXPIRATION_CHECK,
      {},
      { repeat: { every: 15 * 60 * 1000 }, removeOnComplete: true },
    );

    // Payment reconciliation — every 5 minutes
    await this.scheduledQueue.add(
      JOB_PAYMENT_RECONCILIATION,
      {},
      { repeat: { every: 5 * 60 * 1000 }, removeOnComplete: true },
    );

    // Low stock check — every 1 hour
    await this.scheduledQueue.add(
      JOB_LOW_STOCK_CHECK,
      {},
      { repeat: { every: 60 * 60 * 1000 }, removeOnComplete: true },
    );

    this.logger.log(
      'Registered repeatable jobs: quote-expiration(15m), quote-payment-expiration(15m), ' +
        'payment-reconciliation(5m), low-stock-check(1h)',
    );
  }
}
