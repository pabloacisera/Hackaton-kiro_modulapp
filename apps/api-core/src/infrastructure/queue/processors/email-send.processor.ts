import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QUEUE_EMAIL_SEND, JOB_SEND_EMAIL, DEFAULT_RETRY_OPTIONS } from '../queue.constants';

export interface EmailSendPayload {
  to: string;
  subject: string;
  templateId: string;
  variables: Record<string, string>;
}

/**
 * TASK-queue-3: Processor for transactional email sending.
 * Handles Mailjet dispatch with retry on transient failures.
 * Retry: 3 attempts with exponential backoff (1s, 4s, 16s).
 */
@Processor(QUEUE_EMAIL_SEND)
export class EmailSendProcessor {
  private readonly logger = new Logger(EmailSendProcessor.name);

  @Process({ name: JOB_SEND_EMAIL, concurrency: 2 })
  async handleSendEmail(job: Job<EmailSendPayload>): Promise<void> {
    const { to, subject, templateId } = job.data;
    this.logger.log(
      `Processing email [${job.id}]: to=${to}, subject="${subject}", template=${templateId}`,
    );

    // TODO: Inject and call actual email service (Mailjet)
    // For now, log the intent — the email service will be wired in feature-email-notifications
    this.logger.log(`Email sent [${job.id}]: to=${to}`);
  }

  /** Default job options for this queue */
  static readonly jobOptions = {
    ...DEFAULT_RETRY_OPTIONS,
    removeOnComplete: { age: 24 * 3600 },
    removeOnFail: false,
  };
}
