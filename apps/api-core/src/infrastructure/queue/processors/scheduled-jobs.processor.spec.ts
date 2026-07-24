import { ScheduledJobsProcessor } from './scheduled-jobs.processor';

describe('ScheduledJobsProcessor', () => {
  let processor: ScheduledJobsProcessor;
  let quoteExpirationJob: any;
  let paymentReconciliationJob: any;
  let lowStockCheckJob: any;

  beforeEach(() => {
    quoteExpirationJob = {
      checkResponseExpiration: jest.fn().mockResolvedValue(2),
      checkPaymentExpiration: jest.fn().mockResolvedValue(1),
    };
    paymentReconciliationJob = {
      runReconciliation: jest.fn().mockResolvedValue(undefined),
    };
    lowStockCheckJob = {
      execute: jest.fn().mockResolvedValue(3),
    };

    processor = new ScheduledJobsProcessor(
      quoteExpirationJob,
      paymentReconciliationJob,
      lowStockCheckJob,
    );
  });

  it('dispatches quote-expiration-check to QuoteExpirationJob.checkResponseExpiration', async () => {
    const job = { id: '1', name: 'quote-expiration-check', data: {} } as any;

    await processor.handleQuoteExpiration(job);

    expect(quoteExpirationJob.checkResponseExpiration).toHaveBeenCalled();
  });

  it('dispatches quote-payment-expiration-check to QuoteExpirationJob.checkPaymentExpiration', async () => {
    const job = { id: '2', name: 'quote-payment-expiration-check', data: {} } as any;

    await processor.handleQuotePaymentExpiration(job);

    expect(quoteExpirationJob.checkPaymentExpiration).toHaveBeenCalled();
  });

  it('dispatches payment-reconciliation to PaymentReconciliationJob.runReconciliation', async () => {
    const job = { id: '3', name: 'payment-reconciliation', data: {} } as any;

    await processor.handlePaymentReconciliation(job);

    expect(paymentReconciliationJob.runReconciliation).toHaveBeenCalled();
  });

  it('dispatches low-stock-check to LowStockCheckJob.execute', async () => {
    const job = { id: '4', name: 'low-stock-check', data: {} } as any;

    await processor.handleLowStockCheck(job);

    expect(lowStockCheckJob.execute).toHaveBeenCalled();
  });
});
