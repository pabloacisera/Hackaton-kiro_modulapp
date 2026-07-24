import { PaymentWebhookProcessor } from './payment-webhook.processor';

describe('PaymentWebhookProcessor', () => {
  let processor: PaymentWebhookProcessor;
  let webhookHandler: any;

  beforeEach(() => {
    webhookHandler = {
      execute: jest.fn().mockResolvedValue(undefined),
    };

    processor = new PaymentWebhookProcessor(webhookHandler);
  });

  it('calls HandlePaymentWebhookUseCase with correct payload', async () => {
    const job = {
      id: 'job-1',
      data: {
        referenceId: 'order-123',
        paymentServiceRef: 'paypal-ref-456',
        status: 'confirmed',
      },
    } as any;

    await processor.handlePaymentResult(job);

    expect(webhookHandler.execute).toHaveBeenCalledWith({
      referenceId: 'order-123',
      paymentServiceRef: 'paypal-ref-456',
      status: 'confirmed',
    });
  });

  it('handles failed payment status', async () => {
    const job = {
      id: 'job-2',
      data: {
        referenceId: 'order-789',
        paymentServiceRef: 'paypal-ref-000',
        status: 'failed',
      },
    } as any;

    await processor.handlePaymentResult(job);

    expect(webhookHandler.execute).toHaveBeenCalledWith({
      referenceId: 'order-789',
      paymentServiceRef: 'paypal-ref-000',
      status: 'failed',
    });
  });

  it('propagates errors from webhook handler (for retry)', async () => {
    webhookHandler.execute.mockRejectedValue(new Error('DB connection lost'));

    const job = {
      id: 'job-3',
      data: {
        referenceId: 'order-err',
        paymentServiceRef: 'ref-err',
        status: 'confirmed',
      },
    } as any;

    await expect(processor.handlePaymentResult(job)).rejects.toThrow('DB connection lost');
  });

  it('has correct job options with retry config', () => {
    expect(PaymentWebhookProcessor.jobOptions).toMatchObject({
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnFail: false,
    });
  });
});
