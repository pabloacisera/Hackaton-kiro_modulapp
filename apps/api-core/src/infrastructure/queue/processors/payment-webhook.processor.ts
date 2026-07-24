import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import {
  QUEUE_PAYMENT_WEBHOOK,
  JOB_PROCESS_PAYMENT_RESULT,
  DEFAULT_RETRY_OPTIONS,
} from '../queue.constants';
import { HandlePaymentWebhookUseCase } from '../../../modules/orders/use-cases/handle-payment-webhook.use-case';

export interface PaymentWebhookPayload {
  referenceId: string;
  paymentServiceRef: string;
  status: 'confirmed' | 'failed';
}

/**
 * TASK-queue-3: Processor for payment webhook events.
 * Processes incoming PayPal webhook notifications asynchronously.
 * Retry: 3 attempts with exponential backoff.
 */
@Processor(QUEUE_PAYMENT_WEBHOOK)
export class PaymentWebhookProcessor {
  private readonly logger = new Logger(PaymentWebhookProcessor.name);

  constructor(private readonly webhookHandler: HandlePaymentWebhookUseCase) {}

  @Process({ name: JOB_PROCESS_PAYMENT_RESULT, concurrency: 3 })
  async handlePaymentResult(job: Job<PaymentWebhookPayload>): Promise<void> {
    const { referenceId, paymentServiceRef, status } = job.data;
    this.logger.log(`Processing payment webhook [${job.id}]: ref=${referenceId}, status=${status}`);

    await this.webhookHandler.execute({ referenceId, paymentServiceRef, status });

    this.logger.log(`Completed payment webhook [${job.id}]: ref=${referenceId} → ${status}`);
  }

  /** Default job options for this queue */
  static readonly jobOptions = {
    ...DEFAULT_RETRY_OPTIONS,
    removeOnComplete: { age: 24 * 3600 },
    removeOnFail: false,
  };
}
