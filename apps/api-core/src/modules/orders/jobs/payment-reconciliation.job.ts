import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { IOrderRepository, ORDER_REPOSITORY } from '../repositories/order.repository.port';
import { HandlePaymentWebhookUseCase } from '../use-cases/handle-payment-webhook.use-case';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * TASK-directpurchase-10: Reconciliation job for hung payments.
 *
 * Finds orders stuck in `payment_initiated` for > 10 minutes and re-checks
 * their status against payment-service. Runs every 5 minutes.
 *
 * This covers the edge case: PayPal confirmed but webhook never arrived.
 */
@Injectable()
export class PaymentReconciliationJob implements OnModuleInit {
  private readonly logger = new Logger(PaymentReconciliationJob.name);
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  private readonly HUNG_THRESHOLD_MINUTES = 10;
  private readonly RUN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly paymentServiceUrl =
    process.env.PAYMENT_SERVICE_URL ?? 'http://payment-service:8081';

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
    private readonly webhookHandler: HandlePaymentWebhookUseCase,
    private readonly http: HttpService,
  ) {}

  onModuleInit(): void {
    // Schedule reconciliation (use setInterval — BullMQ would require Redis config)
    this.intervalHandle = setInterval(
      () => this.runReconciliation(),
      this.RUN_INTERVAL_MS,
    );
    this.logger.log('Payment reconciliation job scheduled (every 5 min)');
  }

  async runReconciliation(): Promise<void> {
    const hung = await this.orderRepo.findHungPayments(this.HUNG_THRESHOLD_MINUTES);
    if (hung.length === 0) return;

    this.logger.log(`Reconciling ${hung.length} hung payment(s)...`);

    for (const order of hung) {
      try {
        // Ask payment-service for actual status
        const res = await firstValueFrom(
          this.http.get<{ status: string }>(
            `${this.paymentServiceUrl}/payments/${order.id}/status`,
          ),
        ).catch(() => null);

        if (!res) {
          this.logger.warn(`Could not reach payment-service for order ${order.id}`);
          continue;
        }

        const status = res.data.status === 'confirmed' ? 'confirmed' : 'failed';
        await this.webhookHandler.execute({
          referenceId:       order.id,
          paymentServiceRef: order.paymentServiceRef ?? '',
          status,
        });

        this.logger.log(`Reconciled order ${order.id} → ${status}`);
      } catch (err) {
        this.logger.error(`Reconciliation failed for order ${order.id}: ${err}`);
      }
    }
  }
}
