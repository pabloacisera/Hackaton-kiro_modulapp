import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import {
  QUEUE_SCHEDULED_JOBS,
  JOB_QUOTE_EXPIRATION_CHECK,
  JOB_QUOTE_PAYMENT_EXPIRATION_CHECK,
  JOB_PAYMENT_RECONCILIATION,
  JOB_LOW_STOCK_CHECK,
} from '../queue.constants';
import { QuoteExpirationJob } from '../../../modules/quotes/jobs/quote-expiration.job';
import { PaymentReconciliationJob } from '../../../modules/orders/jobs/payment-reconciliation.job';
import { LowStockCheckJob } from '../../../modules/supplies/jobs/low-stock-check.job';

/**
 * TASK-queue-2: Processor for scheduled/repeatable jobs.
 * Dispatches to the appropriate job handler based on job name.
 */
@Processor(QUEUE_SCHEDULED_JOBS)
export class ScheduledJobsProcessor {
  private readonly logger = new Logger(ScheduledJobsProcessor.name);

  constructor(
    private readonly quoteExpirationJob: QuoteExpirationJob,
    private readonly paymentReconciliationJob: PaymentReconciliationJob,
    private readonly lowStockCheckJob: LowStockCheckJob,
  ) {}

  @Process(JOB_QUOTE_EXPIRATION_CHECK)
  async handleQuoteExpiration(job: Job): Promise<void> {
    this.logger.log(`Processing ${job.name} [${job.id}]`);
    const count = await this.quoteExpirationJob.checkResponseExpiration();
    this.logger.log(`Completed ${job.name} — expired ${count} quote(s)`);
  }

  @Process(JOB_QUOTE_PAYMENT_EXPIRATION_CHECK)
  async handleQuotePaymentExpiration(job: Job): Promise<void> {
    this.logger.log(`Processing ${job.name} [${job.id}]`);
    const count = await this.quoteExpirationJob.checkPaymentExpiration();
    this.logger.log(`Completed ${job.name} — expired ${count} payment(s)`);
  }

  @Process(JOB_PAYMENT_RECONCILIATION)
  async handlePaymentReconciliation(job: Job): Promise<void> {
    this.logger.log(`Processing ${job.name} [${job.id}]`);
    await this.paymentReconciliationJob.runReconciliation();
    this.logger.log(`Completed ${job.name}`);
  }

  @Process(JOB_LOW_STOCK_CHECK)
  async handleLowStockCheck(job: Job): Promise<void> {
    this.logger.log(`Processing ${job.name} [${job.id}]`);
    const count = await this.lowStockCheckJob.execute();
    this.logger.log(`Completed ${job.name} — notified ${count} alert(s)`);
  }
}
