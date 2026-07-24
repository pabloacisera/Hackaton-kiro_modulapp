import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * TASK-directpurchase-6: Sends transactional emails for order events via Mailjet.
 */
@Injectable()
export class OrderEmailService {
  private readonly logger = new Logger(OrderEmailService.name);

  constructor(private readonly http: HttpService) {}

  async sendPaymentConfirmation(
    customerEmail: string,
    orderId: string,
    amountUsd: number,
    estimatedDeliveryDays: number | null,
  ): Promise<void> {
    const subject = 'Your Modula order was received — payment confirmed';
    const body = `
      <p>Thank you for your order!</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Amount paid:</strong> USD ${amountUsd.toFixed(2)}</p>
      ${estimatedDeliveryDays ? `<p><strong>Estimated delivery:</strong> ~${estimatedDeliveryDays} days after admin approval</p>` : ''}
      <p>Your order is now pending admin acceptance. We will notify you once it is processed.</p>
    `;
    await this.send(customerEmail, subject, body);
  }

  async sendOrderRejection(customerEmail: string, orderId: string, reason: string): Promise<void> {
    const subject = 'Your Modula order was rejected — full refund initiated';
    const body = `
      <p>We are sorry, your order could not be fulfilled.</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>A full refund has been automatically issued to your original payment method. 
         Please allow 3–5 business days for it to appear.</p>
    `;
    await this.send(customerEmail, subject, body);
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
          {
            auth: { username: apiKey, password: apiSecret },
          },
        ),
      );
    } catch (err) {
      // Email failure must never block the main flow
      this.logger.error(`Email send failed to ${to}: ${(err as Error).message}`);
    }
  }
}
