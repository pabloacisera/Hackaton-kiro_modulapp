import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Job } from 'bull';
import { QUEUE_EMAIL_SEND, JOB_SEND_EMAIL, DEFAULT_RETRY_OPTIONS } from '../queue.constants';

export interface EmailSendPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * TASK-queue-3 + Issue #15: Processor for transactional email sending.
 * Dispatches via Mailjet API with retry on transient failures.
 * Retry: 3 attempts with exponential backoff (1s, 4s, 16s).
 */
@Processor(QUEUE_EMAIL_SEND)
export class EmailSendProcessor {
  private readonly logger = new Logger(EmailSendProcessor.name);

  constructor(private readonly http: HttpService) {}

  @Process({ name: JOB_SEND_EMAIL, concurrency: 2 })
  async handleSendEmail(job: Job<EmailSendPayload>): Promise<void> {
    const { to, subject } = job.data;
    this.logger.log(`Processing email [${job.id}]: to=${to}, subject="${subject}"`);

    const apiKey = process.env.MAILJET_API_KEY ?? '';
    const apiSecret = process.env.MAILJET_API_SECRET ?? '';
    const fromEmail = process.env.MAILJET_FROM_EMAIL ?? 'noreply@modula.app';
    const fromName = process.env.MAILJET_FROM_NAME ?? 'Modula';

    if (!apiKey || !apiSecret) {
      this.logger.warn(`Mailjet credentials not set — skipping email [${job.id}]`);
      return;
    }

    await firstValueFrom(
      this.http.post(
        'https://api.mailjet.com/v3.1/send',
        {
          Messages: [
            {
              From: { Email: fromEmail, Name: fromName },
              To: [{ Email: to }],
              Subject: subject,
              HTMLPart: job.data.html,
            },
          ],
        },
        { auth: { username: apiKey, password: apiSecret } },
      ),
    );

    this.logger.log(`Email sent [${job.id}]: to=${to}`);
  }

  /** Default job options for this queue */
  static readonly jobOptions = {
    ...DEFAULT_RETRY_OPTIONS,
    removeOnComplete: { age: 24 * 3600 },
    removeOnFail: false,
  };
}
