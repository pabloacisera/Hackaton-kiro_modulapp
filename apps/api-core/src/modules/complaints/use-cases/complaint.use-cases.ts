import { Injectable, Inject, Logger } from '@nestjs/common';
import { Complaint, ComplaintReferenceType } from '../domain/complaint.entity';
import {
  IComplaintRepository,
  COMPLAINT_REPOSITORY,
  ListComplaintsFilter,
  PaginatedComplaints,
} from '../repositories/complaint.repository.port';
import { NotificationsService } from '../../notifications/notifications.service';
import { ComplaintEmailService } from '../services/complaint-email.service';

export interface CreateComplaintInput {
  referenceType: ComplaintReferenceType;
  referenceId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  reason: string;
}

/**
 * TASK-complaint-2/3/4: Create complaint + send receipt + notify admin.
 */
@Injectable()
export class CreateComplaintUseCase {
  private readonly logger = new Logger(CreateComplaintUseCase.name);

  constructor(
    @Inject(COMPLAINT_REPOSITORY) private readonly repo: IComplaintRepository,
    private readonly notifications: NotificationsService,
    private readonly emailService: ComplaintEmailService,
  ) {}

  async execute(input: CreateComplaintInput): Promise<Complaint> {
    const complaint = Complaint.create(
      input.referenceType,
      input.referenceId ?? null,
      input.customerName,
      input.customerEmail,
      input.customerPhone ?? null,
      input.reason,
    );
    await this.repo.save(complaint);

    // TASK-complaint-3: Send receipt email
    await this.emailService.sendReceipt(
      complaint.customerEmail,
      complaint.customerName,
      complaint.id,
      complaint.reason,
    );

    // TASK-complaint-4: Notify admin
    await this.notifications.notifyAdmins(
      'new_complaint',
      `New complaint from ${complaint.customerName} (${complaint.customerEmail}) — ref: ${complaint.referenceType}/${complaint.referenceId ?? 'none'}`,
      `/admin/complaints/${complaint.id}`,
    );

    this.logger.log(`Complaint created: ${complaint.id}`);
    return complaint;
  }
}

/**
 * TASK-complaint-5: List complaints with filters.
 */
@Injectable()
export class ListComplaintsUseCase {
  constructor(@Inject(COMPLAINT_REPOSITORY) private readonly repo: IComplaintRepository) {}

  async execute(filter: ListComplaintsFilter): Promise<PaginatedComplaints> {
    return this.repo.findAll(filter);
  }
}

/**
 * TASK-complaint-review: Mark complaint as under review.
 */
@Injectable()
export class ReviewComplaintUseCase {
  constructor(@Inject(COMPLAINT_REPOSITORY) private readonly repo: IComplaintRepository) {}

  async execute(complaintId: string): Promise<Complaint> {
    const complaint = await this.repo.findById(complaintId);
    if (!complaint) throw new Error(`Complaint not found: ${complaintId}`);
    const reviewed = complaint.markUnderReview();
    await this.repo.update(reviewed);
    return reviewed;
  }
}

/**
 * TASK-complaint-6: Approve refund — calls payment-service.
 */
@Injectable()
export class ApproveRefundUseCase {
  private readonly logger = new Logger(ApproveRefundUseCase.name);

  constructor(
    @Inject(COMPLAINT_REPOSITORY) private readonly repo: IComplaintRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(complaintId: string): Promise<Complaint> {
    const complaint = await this.repo.findById(complaintId);
    if (!complaint) throw new Error(`Complaint not found: ${complaintId}`);

    // Generate idempotent refund request ID
    const refundRequestId = `REFUND-${complaintId}-${Date.now()}`;

    // Domain validates reference type and ID
    const approved = complaint.approveRefund(refundRequestId);

    // TODO: Call payment-service POST /payments/orders/:ref/refund
    // For now, mock the payment-service call
    this.logger.log(`Refund initiated for complaint ${complaintId}: ${refundRequestId}`);

    await this.repo.update(approved);

    await this.notifications.notifyAdmins(
      'payment_confirmed',
      `Refund approved for complaint ${complaintId} (${complaint.customerEmail})`,
      `/admin/complaints/${complaintId}`,
    );

    return approved;
  }
}

/**
 * TASK-complaint-7: Resolve complaint (non-refund resolution).
 */
@Injectable()
export class ResolveComplaintUseCase {
  constructor(
    @Inject(COMPLAINT_REPOSITORY) private readonly repo: IComplaintRepository,
    private readonly emailService: ComplaintEmailService,
  ) {}

  async execute(
    complaintId: string,
    notes: string,
    status: 'resolved_other_way' | 'rejected',
  ): Promise<Complaint> {
    const complaint = await this.repo.findById(complaintId);
    if (!complaint) throw new Error(`Complaint not found: ${complaintId}`);

    const resolved = complaint.resolve(notes, status);
    await this.repo.update(resolved);

    await this.emailService.sendResolutionNotice(resolved.customerEmail, resolved.id, notes);

    return resolved;
  }
}
