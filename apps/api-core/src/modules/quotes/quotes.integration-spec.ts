import { Test, TestingModule } from '@nestjs/testing';
import { CreateQuoteUseCase } from './use-cases/create-quote.use-case';
import { PresentQuoteUseCase } from './use-cases/present-quote.use-case';
import { AcceptQuoteUseCase } from './use-cases/accept-quote.use-case';
import { RejectQuoteUseCase } from './use-cases/reject-quote.use-case';
import { ListQuotesUseCase } from './use-cases/list-quotes.use-case';
import { ArchiveQuoteUseCase } from './use-cases/archive-quote.use-case';
import { QuotePaymentWebhookUseCase } from './use-cases/quote-payment-webhook.use-case';
import { QuoteExpirationJob } from './jobs/quote-expiration.job';
import { QuoteTokenService } from './services/quote-token.service';
import { QuoteEmailService } from './services/quote-email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QUOTE_REPOSITORY } from './repositories/quote.repository.port';
import { InMemoryQuoteRepository } from './repositories/in-memory-quote.repository';
import { Quote } from './domain/quote.entity';

describe('Quotes Module — Integration Tests', () => {
  let createQuote: CreateQuoteUseCase;
  let presentQuote: PresentQuoteUseCase;
  let acceptQuote: AcceptQuoteUseCase;
  let rejectQuote: RejectQuoteUseCase;
  let listQuotes: ListQuotesUseCase;
  let archiveQuote: ArchiveQuoteUseCase;
  let paymentWebhook: QuotePaymentWebhookUseCase;
  let expirationJob: QuoteExpirationJob;
  let tokenService: QuoteTokenService;
  let quoteRepo: InMemoryQuoteRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: QUOTE_REPOSITORY, useClass: InMemoryQuoteRepository },
        CreateQuoteUseCase,
        PresentQuoteUseCase,
        AcceptQuoteUseCase,
        RejectQuoteUseCase,
        ListQuotesUseCase,
        ArchiveQuoteUseCase,
        QuotePaymentWebhookUseCase,
        QuoteExpirationJob,
        QuoteTokenService,
        QuoteEmailService,
        NotificationsService,
      ],
    }).compile();

    createQuote = module.get(CreateQuoteUseCase);
    presentQuote = module.get(PresentQuoteUseCase);
    acceptQuote = module.get(AcceptQuoteUseCase);
    rejectQuote = module.get(RejectQuoteUseCase);
    listQuotes = module.get(ListQuotesUseCase);
    archiveQuote = module.get(ArchiveQuoteUseCase);
    paymentWebhook = module.get(QuotePaymentWebhookUseCase);
    expirationJob = module.get(QuoteExpirationJob);
    tokenService = module.get(QuoteTokenService);
    quoteRepo = module.get(QUOTE_REPOSITORY);
  });

  const validInput = {
    customerName: 'Carlos López',
    customerEmail: 'carlos@test.com',
    customerPhone: '+54 11 4444-5555',
    description: 'Custom arch for birthday party, 2m, balloon theme',
    neededByDate: '2026-09-15',
  };

  // ── Create Quote ─────────────────────────────────────────────────────────────

  describe('Create quote', () => {
    it('creates a pending quote with valid data', async () => {
      const { quote, discarded } = await createQuote.execute(validInput);
      expect(discarded).toBe(false);
      expect(quote.status).toBe('pending');
      expect(quote.customerEmail).toBe('carlos@test.com');
    });

    it('creates a discarded quote when name is missing', async () => {
      const { quote, discarded } = await createQuote.execute({
        ...validInput,
        customerName: '',
      });
      expect(discarded).toBe(true);
      expect(quote.status).toBe('discarded_incomplete_data');
    });

    it('creates a discarded quote when email is missing', async () => {
      const { quote, discarded } = await createQuote.execute({
        ...validInput,
        customerEmail: 'not-an-email',
      });
      expect(discarded).toBe(true);
      expect(quote.status).toBe('discarded_incomplete_data');
    });

    it('creates a discarded quote when phone is missing', async () => {
      const { quote, discarded } = await createQuote.execute({
        ...validInput,
        customerPhone: '',
      });
      expect(discarded).toBe(true);
      expect(quote.status).toBe('discarded_incomplete_data');
    });
  });

  // ── Present Quote ────────────────────────────────────────────────────────────

  describe('Present quote', () => {
    it('transitions pending → quoted and generates token', async () => {
      const { quote } = await createQuote.execute(validInput);
      const quoted = await presentQuote.execute({
        quoteId: quote.id,
        priceUsd: 250,
        leadTimeDays: 14,
        estimatedDeliveryDate: '2026-09-30',
      });
      expect(quoted.status).toBe('quoted');
      expect(quoted.quotedPriceUsd).toBe(250);
      expect(quoted.quotedLeadTimeDays).toBe(14);
      expect(quoted.quoteResponseDeadline).toBeInstanceOf(Date);
      expect(quoted.actionTokenHash).toBeDefined();
    });

    it('throws if quote not found', async () => {
      await expect(
        presentQuote.execute({
          quoteId: 'non-existent',
          priceUsd: 100,
          leadTimeDays: 5,
          estimatedDeliveryDate: '2026-09-30',
        }),
      ).rejects.toThrow('Quote not found');
    });
  });

  // ── Accept Quote ─────────────────────────────────────────────────────────────

  describe('Accept quote', () => {
    let quoteId: string;
    let validToken: string;

    beforeEach(async () => {
      const { quote } = await createQuote.execute(validInput);
      quoteId = quote.id;

      // Present the quote — this generates the token internally
      await presentQuote.execute({
        quoteId,
        priceUsd: 200,
        leadTimeDays: 10,
        estimatedDeliveryDate: '2026-10-01',
      });

      // Generate a fresh token matching what was stored
      const stored = await quoteRepo.findById(quoteId);
      const deadline = stored!.quoteResponseDeadline!;
      const { token } = tokenService.generateToken(quoteId, deadline);
      // Update the stored hash to match this token
      const tokenHash = tokenService.hashToken(token);
      const updated = new Quote({ ...stored!.toProps(), actionTokenHash: tokenHash });
      await quoteRepo.update(updated);
      validToken = token;
    });

    it('accepts with valid token → payment_initiated', async () => {
      const result = await acceptQuote.execute(quoteId, validToken);
      expect(result.alreadyProcessed).toBe(false);
      expect(result.expired).toBe(false);
      expect(result.quote.status).toBe('payment_initiated');
      expect(result.paymentUrl).toBeDefined();
    });

    it('second accept is a no-op (alreadyProcessed)', async () => {
      await acceptQuote.execute(quoteId, validToken);
      const result = await acceptQuote.execute(quoteId, validToken);
      expect(result.alreadyProcessed).toBe(true);
    });

    it('rejects expired token', async () => {
      // Manually set deadline in the past
      const stored = await quoteRepo.findById(quoteId);
      const pastDeadline = new Quote({
        ...stored!.toProps(),
        quoteResponseDeadline: new Date(Date.now() - 1000),
      });
      await quoteRepo.update(pastDeadline);

      const result = await acceptQuote.execute(quoteId, validToken);
      expect(result.expired).toBe(true);
    });
  });

  // ── Reject Quote ─────────────────────────────────────────────────────────────

  describe('Reject quote', () => {
    let quoteId: string;
    let validToken: string;

    beforeEach(async () => {
      const { quote } = await createQuote.execute(validInput);
      quoteId = quote.id;

      await presentQuote.execute({
        quoteId,
        priceUsd: 200,
        leadTimeDays: 10,
        estimatedDeliveryDate: '2026-10-01',
      });

      const stored = await quoteRepo.findById(quoteId);
      const deadline = stored!.quoteResponseDeadline!;
      const { token } = tokenService.generateToken(quoteId, deadline);
      const tokenHash = tokenService.hashToken(token);
      const updated = new Quote({ ...stored!.toProps(), actionTokenHash: tokenHash });
      await quoteRepo.update(updated);
      validToken = token;
    });

    it('rejects with valid token', async () => {
      const result = await rejectQuote.execute(quoteId, validToken);
      expect(result.alreadyProcessed).toBe(false);
      expect(result.expired).toBe(false);
      expect(result.quote.status).toBe('rejected');
    });

    it('second reject is a no-op', async () => {
      await rejectQuote.execute(quoteId, validToken);
      const result = await rejectQuote.execute(quoteId, validToken);
      expect(result.alreadyProcessed).toBe(true);
    });
  });

  // ── Payment Webhook ──────────────────────────────────────────────────────────

  describe('Payment webhook', () => {
    let quoteId: string;

    beforeEach(async () => {
      const { quote } = await createQuote.execute(validInput);
      quoteId = quote.id;

      await presentQuote.execute({
        quoteId,
        priceUsd: 300,
        leadTimeDays: 7,
        estimatedDeliveryDate: '2026-10-01',
      });

      // Manually transition to accepted → payment_initiated
      const stored = await quoteRepo.findById(quoteId);
      const accepted = new Quote({
        ...stored!.toProps(),
        status: 'accepted',
        acceptedAt: new Date(),
        actionTokenUsed: true,
        paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      const initiated = accepted.initiatePayment('PAY-REF-TEST');
      await quoteRepo.update(initiated);
    });

    it('confirms payment → paid', async () => {
      const result = await paymentWebhook.execute('PAY-REF-TEST', true);
      expect(result.status).toBe('paid');
      expect(result.paidAt).toBeInstanceOf(Date);
    });

    it('duplicate webhook is idempotent', async () => {
      await paymentWebhook.execute('PAY-REF-TEST', true);
      const result = await paymentWebhook.execute('PAY-REF-TEST', true);
      expect(result.status).toBe('paid');
    });

    it('failed payment → payment_expired', async () => {
      const result = await paymentWebhook.execute('PAY-REF-TEST', false);
      expect(result.status).toBe('payment_expired');
    });
  });

  // ── Expiration Jobs ──────────────────────────────────────────────────────────

  describe('Expiration jobs', () => {
    it('expires quoted quotes past 48h deadline', async () => {
      const { quote } = await createQuote.execute(validInput);
      await presentQuote.execute({
        quoteId: quote.id,
        priceUsd: 100,
        leadTimeDays: 5,
        estimatedDeliveryDate: '2026-10-01',
      });

      // Set deadline in the past
      const stored = await quoteRepo.findById(quote.id);
      const pastDeadline = new Quote({
        ...stored!.toProps(),
        quoteResponseDeadline: new Date(Date.now() - 1000),
      });
      await quoteRepo.update(pastDeadline);

      const count = await expirationJob.checkResponseExpiration();
      expect(count).toBe(1);

      const updated = await quoteRepo.findById(quote.id);
      expect(updated!.status).toBe('expired');
    });

    it('expires accepted quotes past 24h payment deadline', async () => {
      const { quote } = await createQuote.execute(validInput);

      // Manually set to accepted + payment_initiated with expired deadline
      const initiated = new Quote({
        ...quote.toProps(),
        status: 'payment_initiated',
        acceptedAt: new Date(),
        actionTokenUsed: true,
        paymentDeadline: new Date(Date.now() - 1000),
        paymentServiceRef: 'PAY-EXPIRED',
      });
      await quoteRepo.update(initiated);

      const count = await expirationJob.checkPaymentExpiration();
      expect(count).toBe(1);

      const updated = await quoteRepo.findById(quote.id);
      expect(updated!.status).toBe('payment_expired');
    });
  });

  // ── Archive ──────────────────────────────────────────────────────────────────

  describe('Archive', () => {
    it('archives a rejected quote', async () => {
      const { quote } = await createQuote.execute(validInput);
      // Manually set to rejected
      const rejected = new Quote({
        ...quote.toProps(),
        status: 'rejected',
        rejectedAt: new Date(),
        actionTokenUsed: true,
      });
      await quoteRepo.update(rejected);

      const archived = await archiveQuote.execute(quote.id);
      expect(archived.status).toBe('archived');
    });

    it('throws when archiving a pending quote', async () => {
      const { quote } = await createQuote.execute(validInput);
      await expect(archiveQuote.execute(quote.id)).rejects.toThrow('Invalid transition');
    });
  });

  // ── Listing ──────────────────────────────────────────────────────────────────

  describe('List quotes', () => {
    it('returns paginated results excluding discarded by default', async () => {
      await createQuote.execute(validInput);
      await createQuote.execute({ ...validInput, customerName: '' }); // discarded

      const result = await listQuotes.execute({});
      expect(result.total).toBe(1); // only the pending one
      expect(result.items[0].status).toBe('pending');
    });

    it('filters by status', async () => {
      await createQuote.execute(validInput);
      await createQuote.execute({ ...validInput, customerEmail: 'other@test.com' });

      const result = await listQuotes.execute({ status: 'pending' });
      expect(result.total).toBe(2);
    });

    it('searches by name/email/description', async () => {
      await createQuote.execute(validInput);
      await createQuote.execute({
        ...validInput,
        customerName: 'Ana Martínez',
        customerEmail: 'ana@test.com',
      });

      const result = await listQuotes.execute({ q: 'ana' });
      expect(result.total).toBe(1);
      expect(result.items[0].customerName).toBe('Ana Martínez');
    });
  });
});
