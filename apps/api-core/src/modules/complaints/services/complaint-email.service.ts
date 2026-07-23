import { Injectable, Logger } from '@nestjs/common';

/**
 * TASK-complaint-3: Complaint receipt email to customer.
 * Sends proof-of-receipt with reference number (complaint ID).
 */
@Injectable()
export class ComplaintEmailService {
  private readonly logger = new Logger(ComplaintEmailService.name);

  async sendReceipt(
    customerEmail: string,
    customerName: string,
    complaintId: string,
    reason: string,
  ): Promise<void> {
    this.logger.log(
      `Email [complaint_receipt] → ${customerEmail}: Complaint ${complaintId} received`,
    );
    // TODO: Wire Mailjet HTTP call
  }

  async sendResolutionNotice(
    customerEmail: string,
    complaintId: string,
    resolution: string,
  ): Promise<void> {
    this.logger.log(
      `Email [complaint_resolved] → ${customerEmail}: Complaint ${complaintId} resolved: ${resolution}`,
    );
  }
}
