import { EmailSendProcessor } from './email-send.processor';

describe('EmailSendProcessor', () => {
  let processor: EmailSendProcessor;

  beforeEach(() => {
    processor = new EmailSendProcessor();
  });

  it('processes email send job without throwing', async () => {
    const job = {
      id: 'email-1',
      data: {
        to: 'customer@example.com',
        subject: 'Order Confirmation',
        templateId: 'order-confirmed',
        variables: { orderId: 'ord-123', amount: '149.99' },
      },
    } as any;

    await expect(processor.handleSendEmail(job)).resolves.not.toThrow();
  });

  it('has correct job options with retry config', () => {
    expect(EmailSendProcessor.jobOptions).toMatchObject({
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnFail: false,
    });
  });
});
