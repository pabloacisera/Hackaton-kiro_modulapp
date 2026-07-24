import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * TASK-complaint-3: Complaint receipt email to customer.
 * Issue #15: Wired to Mailjet (same pattern as OrderEmailService).
 */
@Injectable()
export class ComplaintEmailService {
  private readonly logger = new Logger(ComplaintEmailService.name);

  constructor(private readonly http: HttpService) {}

  async sendReceipt(
    customerEmail: string,
    customerName: string,
    complaintId: string,
    reason: string,
  ): Promise<void> {
    const subject = 'ModulApp — Your complaint has been received';
    const html = `
      <p>Hi ${customerName},</p>
      <p>We received your complaint and will review it promptly.</p>
      <p><strong>Complaint ID:</strong> ${complaintId}</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>We will notify you once a resolution has been determined.</p>
      <p>— The ModulApp Team</p>
    `;
    await this.send(customerEmail, subject, html);
  }

  async sendResolutionNotice(
    customerEmail: string,
    complaintId: string,
    resolution: string,
  ): Promise<void> {
    const subject = 'ModulApp — Your complaint has been resolved';
    const html = `
      <p>Your complaint has been reviewed and resolved.</p>
      <p><strong>Complaint ID:</strong> ${complaintId}</p>
      <p><strong>Resolution:</strong> ${resolution}</p>
      <p>If a refund was approved, it will appear on your original payment method within 3–5 business days.</p>
      <p>— The ModulApp Team</p>
    `;
    await this.send(customerEmail, subject, html);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const apiKey = process.env.MAILJET_API_KEY ?? '';
    const apiSecret = process.env.MAILJET_API_SECRET ?? '';
    const fromEmail = process.env.MAILJET_FROM_EMAIL ?? 'noreply@modulapp.app';
    const fromName = process.env.MAILJET_FROM_NAME ?? 'ModulApp';

    if (!apiKey || !apiSecret) {
      this.logger.warn('Mailjet credentials not set — skipping email');
      return;
    }

    try {
      await firstValueFrom(
        this.http.post(
          'https://api.mailjet.com/v3.1/send',
          {
            Messages: [
              {
                From: { Email: fromEmail, Name: fromName },
                To: [{ Email: to }],
                Subject: subject,
                HTMLPart: html,
              },
            ],
          },
          { auth: { username: apiKey, password: apiSecret } },
        ),
      );
    } catch (err) {
      this.logger.error(`Email send failed to ${to}: ${(err as Error).message}`);
    }
  }
}
