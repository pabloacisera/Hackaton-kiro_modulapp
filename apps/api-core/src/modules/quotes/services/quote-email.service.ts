import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * TASK-quoteB-5, TASK-quoteB-8: Sends transactional emails for quote events.
 * Issue #15: Wired to Mailjet (same pattern as OrderEmailService).
 */
@Injectable()
export class QuoteEmailService {
  private readonly logger = new Logger(QuoteEmailService.name);

  constructor(private readonly http: HttpService) {}

  /**
   * FR3: Confirmation email sent to customer when request is received.
   */
  async sendRequestReceived(
    customerEmail: string,
    customerName: string,
    quoteId: string,
  ): Promise<void> {
    const subject = 'ModulApp — Your custom quote request was received';
    const html = `
      <p>Hi ${customerName},</p>
      <p>We received your custom quote request.</p>
      <p><strong>Reference:</strong> ${quoteId}</p>
      <p>Our team will review your request and send you a detailed quote soon.</p>
      <p>— The ModulApp Team</p>
    `;
    await this.send(customerEmail, subject, html);
  }

  /**
   * TASK-quoteB-8: Quote email with accept/reject buttons (deep link with token).
   */
  async sendQuotePresented(
    customerEmail: string,
    customerName: string,
    quoteId: string,
    priceUsd: number,
    leadTimeDays: number,
    acceptUrl: string,
    rejectUrl: string,
    quotePdfUrl?: string | null,
  ): Promise<void> {
    const subject = `ModulApp — Your quote is ready: USD ${priceUsd.toFixed(2)}`;
    const html = `
      <p>Hi ${customerName},</p>
      <p>Your custom quote is ready:</p>
      <ul>
        <li><strong>Quote ID:</strong> ${quoteId}</li>
        <li><strong>Price:</strong> USD ${priceUsd.toFixed(2)}</li>
        <li><strong>Estimated lead time:</strong> ${leadTimeDays} days</li>
      </ul>
      ${quotePdfUrl ? `<p><a href="${quotePdfUrl}">📄 Download Quote PDF</a></p>` : ''}
      <p>You have <strong>48 hours</strong> to respond:</p>
      <p>
        <a href="${acceptUrl}" style="background:#22c55e;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-right:12px;">✓ Accept Quote</a>
        <a href="${rejectUrl}" style="background:#ef4444;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">✗ Reject Quote</a>
      </p>
      <p style="color:#6b7280;font-size:12px;">If you do not respond within 48 hours, the quote will expire automatically.</p>
      <p>— The ModulApp Team</p>
    `;
    await this.send(customerEmail, subject, html);
  }

  /**
   * Admin rejected the quote request — notify customer.
   */
  async sendRequestRejected(
    customerEmail: string,
    customerName: string,
    quoteId: string,
    reason: string,
  ): Promise<void> {
    const subject = 'ModulApp — Your quote request was not approved';
    const html = `
      <p>Hi ${customerName},</p>
      <p>Unfortunately, we are unable to fulfill your quote request at this time.</p>
      <p><strong>Reference:</strong> ${quoteId}</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>If you have questions, feel free to reach out through our complaints form.</p>
      <p>— The ModulApp Team</p>
    `;
    await this.send(customerEmail, subject, html);
  }

  /**
   * FR9: Payment confirmation email to customer.
   */
  async sendPaymentConfirmation(
    customerEmail: string,
    quoteId: string,
    amountUsd: number,
  ): Promise<void> {
    const subject = 'ModulApp — Payment confirmed for your custom order';
    const html = `
      <p>Your payment has been confirmed!</p>
      <p><strong>Quote ID:</strong> ${quoteId}</p>
      <p><strong>Amount paid:</strong> USD ${amountUsd.toFixed(2)}</p>
      <p>We will begin production and keep you updated on delivery.</p>
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
