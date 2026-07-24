import { of } from 'rxjs';
import { EmailSendProcessor } from './email-send.processor';

describe('EmailSendProcessor', () => {
  let processor: EmailSendProcessor;
  let httpService: { post: jest.Mock };

  beforeEach(() => {
    httpService = {
      post: jest.fn().mockReturnValue(of({ data: {} })),
    };
    processor = new EmailSendProcessor(httpService as unknown as never);
  });

  it('processes email send job without throwing when credentials not set', async () => {
    delete process.env.MAILJET_API_KEY;
    delete process.env.MAILJET_API_SECRET;

    const job = {
      id: 'email-1',
      data: {
        to: 'customer@example.com',
        subject: 'Order Confirmation',
        html: '<p>Hello</p>',
      },
    } as never;

    await expect(processor.handleSendEmail(job)).resolves.not.toThrow();
  });

  it('calls Mailjet API when credentials are set', async () => {
    process.env.MAILJET_API_KEY = 'test-key';
    process.env.MAILJET_API_SECRET = 'test-secret';

    httpService.post = jest.fn().mockReturnValue(of({ data: { Messages: [] } }));

    const job = {
      id: 'email-2',
      data: {
        to: 'customer@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      },
    } as never;

    await processor.handleSendEmail(job);

    expect(httpService.post).toHaveBeenCalledWith(
      'https://api.mailjet.com/v3.1/send',
      expect.objectContaining({
        Messages: expect.arrayContaining([
          expect.objectContaining({
            To: [{ Email: 'customer@example.com' }],
            Subject: 'Test',
          }),
        ]),
      }),
      expect.objectContaining({ auth: { username: 'test-key', password: 'test-secret' } }),
    );

    delete process.env.MAILJET_API_KEY;
    delete process.env.MAILJET_API_SECRET;
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
