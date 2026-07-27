import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

/**
 * TASK-directpurchase-4: Thin HTTP adapter to payment-service (Java).
 * All retry/idempotency is handled by payment-service — this client is stateless.
 *
 * Contract (from design.md):
 *   POST /payments/orders         → initiate payment
 *   POST /payments/orders/:ref/refund → execute refund
 */
@Injectable()
export class PaymentServiceClient {
  private readonly logger = new Logger(PaymentServiceClient.name);
  private readonly baseUrl: string;

  constructor(private readonly http: HttpService) {
    this.baseUrl = process.env.PAYMENT_SERVICE_URL ?? 'http://payment-service:8081';
  }

  /**
   * Initiates a payment for an order. Idempotent — same idempotency_key returns existing payment.
   */
  async initiatePayment(payload: {
    referenceId: string;
    origin: 'order' | 'quote';
    amountUsd: number;
    customerEmail: string;
    idempotencyKey: string;
  }): Promise<{ paymentLink: string; paymentServiceRef: string }> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ payment_link: string; payment_service_ref: string }>(
          `${this.baseUrl}/payments/orders`,
          {
            referenceId: payload.referenceId,
            origin: payload.origin,
            amountUsd: payload.amountUsd,
            customerEmail: payload.customerEmail,
            idempotencyKey: payload.idempotencyKey,
          },
        ),
      );
      return {
        paymentLink: res.data.payment_link,
        paymentServiceRef: res.data.payment_service_ref,
      };
    } catch (err) {
      const msg = (err as AxiosError).message ?? String(err);
      this.logger.error(`payment-service initiatePayment failed: ${msg}`);
      throw new Error(`Payment initiation failed: ${msg}`);
    }
  }

  /**
   * Requests a refund for a previously confirmed payment. Idempotent by refundRequestId.
   */
  async refund(payload: {
    referenceId: string;
    reason: string;
    refundRequestId: string;
  }): Promise<{ refundId: string; status: string }> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ refund_id: string; status: string }>(
          `${this.baseUrl}/payments/orders/${payload.referenceId}/refund`,
          {
            reason: payload.reason,
            refundRequestId: payload.refundRequestId,
          },
        ),
      );
      return { refundId: res.data.refund_id, status: res.data.status };
    } catch (err) {
      const msg = (err as AxiosError).message ?? String(err);
      this.logger.error(`payment-service refund failed: ${msg}`);
      throw new Error(`Refund failed: ${msg}`);
    }
  }
}
