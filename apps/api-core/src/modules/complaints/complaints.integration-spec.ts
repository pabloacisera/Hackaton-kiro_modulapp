import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateComplaintUseCase,
  ListComplaintsUseCase,
  ReviewComplaintUseCase,
  ApproveRefundUseCase,
  ResolveComplaintUseCase,
} from './use-cases/complaint.use-cases';
import { COMPLAINT_REPOSITORY } from './repositories/complaint.repository.port';
import { InMemoryComplaintRepository } from './repositories/in-memory-complaint.repository';
import { ComplaintEmailService } from './services/complaint-email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentServiceClient } from '../orders/services/payment-service.client';
import { HttpService } from '@nestjs/axios';

describe('Complaints Module — Integration Tests', () => {
  let createComplaint: CreateComplaintUseCase;
  let listComplaints: ListComplaintsUseCase;
  let reviewComplaint: ReviewComplaintUseCase;
  let approveRefund: ApproveRefundUseCase;
  let resolveComplaint: ResolveComplaintUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: COMPLAINT_REPOSITORY, useClass: InMemoryComplaintRepository },
        CreateComplaintUseCase,
        ListComplaintsUseCase,
        ReviewComplaintUseCase,
        ApproveRefundUseCase,
        ResolveComplaintUseCase,
        ComplaintEmailService,
        NotificationsService,
        {
          provide: PaymentServiceClient,
          useValue: {
            refund: jest.fn().mockResolvedValue({ refundId: 'ref-1', status: 'completed' }),
          },
        },
        { provide: HttpService, useValue: {} },
      ],
    }).compile();

    createComplaint = module.get(CreateComplaintUseCase);
    listComplaints = module.get(ListComplaintsUseCase);
    reviewComplaint = module.get(ReviewComplaintUseCase);
    approveRefund = module.get(ApproveRefundUseCase);
    resolveComplaint = module.get(ResolveComplaintUseCase);
  });

  describe('Create complaint', () => {
    it('creates complaint and sends receipt + notification', async () => {
      const complaint = await createComplaint.execute({
        referenceType: 'order',
        referenceId: 'ord-123',
        customerName: 'Ana',
        customerEmail: 'ana@test.com',
        customerPhone: '+54 11 555',
        reason: 'Product arrived damaged',
      });
      expect(complaint.status).toBe('received');
      expect(complaint.id).toBeDefined();
    });

    it('registers complaint with unknown reference (no order ID)', async () => {
      const complaint = await createComplaint.execute({
        referenceType: 'unknown',
        referenceId: null,
        customerName: 'Bob',
        customerEmail: 'bob@test.com',
        reason: 'Lost my order number',
      });
      expect(complaint.referenceType).toBe('unknown');
      expect(complaint.referenceId).toBeNull();
      expect(complaint.status).toBe('received');
    });
  });

  describe('Review + Approve refund', () => {
    it('full flow: create → review → approve refund', async () => {
      const complaint = await createComplaint.execute({
        referenceType: 'order',
        referenceId: 'ord-456',
        customerName: 'Carlos',
        customerEmail: 'carlos@test.com',
        reason: 'Wrong item shipped',
      });

      const reviewed = await reviewComplaint.execute(complaint.id);
      expect(reviewed.status).toBe('under_review');

      const approved = await approveRefund.execute(complaint.id);
      expect(approved.status).toBe('refund_approved');
      expect(approved.refundRequestId).toContain('REFUND-');
    });

    it('approve refund on unknown reference type returns error', async () => {
      const complaint = await createComplaint.execute({
        referenceType: 'unknown',
        referenceId: null,
        customerName: 'Diana',
        customerEmail: 'diana@test.com',
        reason: 'Want refund',
      });
      await reviewComplaint.execute(complaint.id);

      await expect(approveRefund.execute(complaint.id)).rejects.toThrow(
        'Cannot approve refund: no valid payment reference',
      );
    });
  });

  describe('Resolve', () => {
    it('resolves complaint with notes', async () => {
      const complaint = await createComplaint.execute({
        referenceType: 'quote',
        referenceId: 'q-789',
        customerName: 'Eva',
        customerEmail: 'eva@test.com',
        reason: 'Late delivery',
      });
      await reviewComplaint.execute(complaint.id);

      const resolved = await resolveComplaint.execute(
        complaint.id,
        'Contacted customer, offered 10% discount on next order',
        'resolved_other_way',
      );
      expect(resolved.status).toBe('resolved_other_way');
      expect(resolved.resolutionNotes).toContain('10% discount');
    });
  });

  describe('Listing', () => {
    it('lists complaints with status filter', async () => {
      await createComplaint.execute({
        referenceType: 'order',
        referenceId: 'o-1',
        customerName: 'A',
        customerEmail: 'a@t.com',
        reason: 'r1',
      });
      const c2 = await createComplaint.execute({
        referenceType: 'order',
        referenceId: 'o-2',
        customerName: 'B',
        customerEmail: 'b@t.com',
        reason: 'r2',
      });
      await reviewComplaint.execute(c2.id);

      const received = await listComplaints.execute({ status: 'received' });
      expect(received.total).toBe(1);

      const underReview = await listComplaints.execute({ status: 'under_review' });
      expect(underReview.total).toBe(1);
    });

    it('searches by customer name', async () => {
      await createComplaint.execute({
        referenceType: 'order',
        referenceId: 'o-1',
        customerName: 'Fernando López',
        customerEmail: 'f@t.com',
        reason: 'issue',
      });
      await createComplaint.execute({
        referenceType: 'order',
        referenceId: 'o-2',
        customerName: 'María García',
        customerEmail: 'm@t.com',
        reason: 'problem',
      });

      const result = await listComplaints.execute({ q: 'fernando' });
      expect(result.total).toBe(1);
      expect(result.items[0].customerName).toBe('Fernando López');
    });
  });
});
