import { Injectable, Inject, Logger } from '@nestjs/common';
import { Quote } from '../domain/quote.entity';
import { IQuoteRepository, QUOTE_REPOSITORY } from '../repositories/quote.repository.port';
import { QuoteTokenService } from '../services/quote-token.service';
import { QuoteEmailService } from '../services/quote-email.service';
import { QuotePdfGenerator } from '../services/quote-pdf-generator';

export interface PresentQuoteInput {
  quoteId: string;
  priceUsd: number;
  leadTimeDays: number;
  estimatedDeliveryDate: string; // ISO date
}

/**
 * TASK-quoteB-6: PATCH /quotes/:id/present — admin presents a quote.
 * TASK-quoteB-7: Generates signed token.
 * TASK-quoteB-8: Sends email with accept/reject buttons.
 *
 * Flow:
 *   1. Validate quote exists and is in 'pending' state
 *   2. Generate action token (48h validity)
 *   3. Transition state: pending → quoted
 *   4. Generate PDF presupuesto → upload to Supabase Storage
 *   5. Save quote with PDF URL
 *   6. Send email to customer (with PDF link + accept/reject buttons)
 */
@Injectable()
export class PresentQuoteUseCase {
  private readonly logger = new Logger(PresentQuoteUseCase.name);

  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepo: IQuoteRepository,
    private readonly tokenService: QuoteTokenService,
    private readonly emailService: QuoteEmailService,
    private readonly pdfGenerator: QuotePdfGenerator,
  ) {}

  async execute(input: PresentQuoteInput): Promise<Quote> {
    const { quoteId, priceUsd, leadTimeDays, estimatedDeliveryDate } = input;

    const quote = await this.quoteRepo.findById(quoteId);
    if (!quote) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    // Calculate the 48h deadline for the token
    const responseDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const { token, tokenHash } = this.tokenService.generateToken(quoteId, responseDeadline);

    // Transition state: pending → quoted
    const quoted = quote.presentQuote(
      priceUsd,
      leadTimeDays,
      new Date(estimatedDeliveryDate),
      tokenHash,
    );

    // Generate PDF presupuesto and upload to Storage
    let quotePdfUrl: string | null = null;
    try {
      const pdfResult = await this.pdfGenerator.generate({
        quoteId,
        customerName: quoted.customerName,
        customerEmail: quoted.customerEmail,
        customerPhone: quoted.customerPhone,
        description: quoted.description,
        priceUsd,
        leadTimeDays,
        estimatedDeliveryDate: new Date(estimatedDeliveryDate),
        validityHours: 48,
        createdAt: new Date(),
      });
      quotePdfUrl = pdfResult.publicUrl;
    } catch (err) {
      // PDF generation failure should not block the quote flow
      this.logger.error(`PDF generation failed for quote ${quoteId}: ${err}`);
    }

    // Persist quote with PDF URL
    await this.quoteRepo.update(quoted);

    // If we have a PDF URL, update it separately (quotePdfUrl is not part of domain entity)
    if (quotePdfUrl) {
      await this.saveQuotePdfUrl(quoteId, quotePdfUrl);
    }

    // Build accept/reject URLs
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:8080';
    const acceptUrl = `${baseUrl}/api/quotes/${quoteId}/accept?token=${token}`;
    const rejectUrl = `${baseUrl}/api/quotes/${quoteId}/reject?token=${token}`;

    // Send email with PDF link and accept/reject buttons
    await this.emailService.sendQuotePresented(
      quoted.customerEmail,
      quoted.customerName,
      quoteId,
      priceUsd,
      leadTimeDays,
      acceptUrl,
      rejectUrl,
      quotePdfUrl,
    );

    this.logger.log(
      `Quote ${quoteId} presented: USD ${priceUsd}, ${leadTimeDays} days, PDF: ${quotePdfUrl ? 'yes' : 'no'}`,
    );
    return quoted;
  }

  /**
   * Saves the PDF URL directly to the quote record.
   */
  private async saveQuotePdfUrl(quoteId: string, pdfUrl: string): Promise<void> {
    // Update via the quote repository — we add the pdfUrl field to the DB row
    // without going through the domain entity (it's an infrastructure concern).
    const updated = await this.quoteRepo.findById(quoteId);
    if (updated) {
      await this.quoteRepo.updatePdfUrl(quoteId, pdfUrl);
    }
  }
}
