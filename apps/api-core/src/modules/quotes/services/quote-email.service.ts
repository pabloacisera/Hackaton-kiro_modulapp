import { Injectable, Logger } from '@nestjs/common';

/**
 * TASK-quoteB-5, TASK-quoteB-8: Sends transactional emails for quote events.
 *
 * Uses the same Mailjet pattern as OrderEmailService.
 * In-memory stub for now (no HttpService injected yet to keep tests simple).
 */
@Injectable()
export class QuoteEmailService {
  private readonly logger = new Logger(QuoteEmailService.name);

  /**
   * FR3: Confirmation email sent to customer when request is received.
   */
  async sendRequestReceived(
    customerEmail: string,
    customerName: string,
    quoteId: string,
  ): Promise<void> {
    this.logger.log(`Email [request_received] → ${customerEmail}: Quote ${quoteId} received`);
    // TODO: Wire Mailjet HTTP call (same as OrderEmailService.send)
  }

  /**
   * TASK-quoteB-8: Quote email with accept/reject buttons (deep link with token).
   * Includes link to the PDF presupuesto if available.
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
    this.logger.log(
      `Email [quote_presented] → ${customerEmail}: Quote ${quoteId} = USD ${priceUsd}, ` +
        `accept: ${acceptUrl}, reject: ${rejectUrl}` +
        (quotePdfUrl ? `, pdf: ${quotePdfUrl}` : ''),
    );
    // TODO: Wire Mailjet HTTP call with HTML template containing accept/reject buttons + PDF link
  }

  /**
   * FR9: Payment confirmation email to customer.
   */
  async sendPaymentConfirmation(
    customerEmail: string,
    quoteId: string,
    amountUsd: number,
  ): Promise<void> {
    this.logger.log(
      `Email [payment_confirmed] → ${customerEmail}: Quote ${quoteId} paid USD ${amountUsd}`,
    );
    // TODO: Wire Mailjet HTTP call
  }
}
